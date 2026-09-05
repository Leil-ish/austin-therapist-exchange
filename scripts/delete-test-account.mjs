#!/usr/bin/env node

/**
 * Delete test accounts cleanly: auth user, profile, therapist profile, and every
 * FK-referencing row, in an order that never violates a RESTRICT/NO ACTION constraint.
 *
 * Usage:
 *   node scripts/delete-test-account.mjs --list [substring]
 *   node scripts/delete-test-account.mjs you+test1@gmail.com [more@emails ...] [--dry-run]
 *   node scripts/delete-test-account.mjs legacy@gmail.com --force
 *   node scripts/delete-test-account.mjs a@x.com --yes            (skip confirmation prompt)
 *   node scripts/delete-test-account.mjs --file emails.txt
 *
 * Safety: refuses any email without "+test" unless --force is passed.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

for (const fileName of [".env.local", ".env"]) {
  const filePath = path.join(process.cwd(), fileName);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
}

const TEST_MARKER = "+test";
const CONFIRM_TOKEN = "DELETE";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// ── arg parsing ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const emails = [];
  const flags = { force: false, dryRun: false, yes: false, list: null, file: null };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") flags.force = true;
    else if (arg === "--dry-run" || arg === "--plan") flags.dryRun = true;
    else if (arg === "--yes" || arg === "-y") flags.yes = true;
    else if (arg === "--list") {
      flags.list = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "";
    } else if (arg === "--file") {
      flags.file = argv[++i];
    } else if (arg === "--emails") {
      emails.push(...String(argv[++i] ?? "").split(","));
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    } else {
      emails.push(arg);
    }
  }

  if (flags.file) {
    const contents = fs.readFileSync(flags.file, "utf8");
    emails.push(...contents.split(/\r?\n/));
  }

  const cleaned = [
    ...new Set(
      emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email && !email.startsWith("#"))
    )
  ];

  return { emails: cleaned, flags };
}

// ── PostgREST error tolerance (idempotency / partial schemas) ─────────────────

function isMissingRelation(error) {
  if (!error) return false;
  const code = String(error.code ?? "");
  const message = String(error.message ?? "");
  return (
    code === "PGRST205" ||
    code === "PGRST204" ||
    code === "42P01" ||
    code === "42703" ||
    /Could not find the (table|column)/i.test(message) ||
    /(relation|column) .* does not exist/i.test(message)
  );
}

const missingRelations = new Set();

function noteMissing(table, column) {
  missingRelations.add(column ? `${table}.${column}` : table);
}

/** Count rows matching column = value. Returns null when the table/column is absent. */
async function countRows(admin, table, column, value) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    if (isMissingRelation(error)) {
      noteMissing(table, column);
      return null;
    }
    throw new Error(`count ${table}.${column}: ${error.message}`);
  }
  return count ?? 0;
}

async function selectRows(admin, table, columns, column, value) {
  const { data, error } = await admin.from(table).select(columns).eq(column, value);
  if (error) {
    if (isMissingRelation(error)) {
      noteMissing(table, column);
      return null;
    }
    throw new Error(`select ${table}.${column}: ${error.message}`);
  }
  return data ?? [];
}

// ── relation map ─────────────────────────────────────────────────────────────
// Rows the database removes on its own once the profile row is deleted.
// Listed for the preview; no explicit action is taken.

const CASCADE_RELATIONS = [
  ["therapist_profiles", "profile_id", "therapist profile"],
  ["group_memberships", "profile_id", "group memberships"],
  ["posts", "author_profile_id", "posts (+ referral_requests/consultation_requests/jobs)"],
  ["endorsements", "endorser_profile_id", "endorsements written"],
  ["endorsements", "endorsed_profile_id", "endorsements received"],
  ["follows", "follower_profile_id", "follows (outgoing)"],
  ["follows", "followed_profile_id", "follows (incoming)"],
  ["curated_lists", "owner_profile_id", "curated lists (+ items)"],
  ["referral_messages", "sender_profile_id", "referral messages sent"],
  ["referral_messages", "receiver_profile_id", "referral messages received"],
  ["direct_referrals", "sender_profile_id", "direct referrals sent"],
  ["direct_referrals", "receiver_profile_id", "direct referrals received"],
  ["client_cases", "owner_profile_id", "client cases (+ case_referrals)"],
  ["case_referrals", "owner_profile_id", "case referrals owned"]
];

// Nullable FKs with NO ACTION: other people's rows that point at this profile.
// Cleared first so the profile delete cannot be blocked, and so nothing orphans.
const NULLABLE_REFERENCES = [
  ["profiles", "approved_by", "profiles this account approved"],
  ["join_requests", "reviewed_by", "join requests this account reviewed"],
  ["join_requests", "sponsor_profile_id", "join requests this account sponsored"],
  ["join_requests", "endorsement_from_profile_id", "join requests this account endorsed"],
  ["moderation_reports", "reporter_profile_id", "moderation reports filed"],
  ["moderation_reports", "reviewed_by", "moderation reports reviewed"],
  ["invitations", "accepted_by", "invitations this account accepted"],
  ["case_referrals", "referred_profile_id", "case referrals pointing at this account"]
];

// ── discovery ────────────────────────────────────────────────────────────────

async function listAllUsers(admin) {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 200) break;
    page += 1;
  }
  return users;
}

async function buildPlan(admin, email, allUsers) {
  const user = allUsers.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;

  const plan = {
    email,
    user,
    profile: null,
    therapistProfile: null,
    cascades: [],
    nullouts: [],
    ownJoinRequests: 0,
    invitationsIssued: [],
    invitationsToEmail: 0,
    groupsCreated: [],
    notificationsReceived: null,
    notificationsAbout: null,
    avatarObjects: [],
    sponsorImpact: []
  };

  // An auth user may be gone while a profile row lingers (or vice versa) — look up both.
  let profileId = user?.id ?? null;

  if (profileId) {
    // select("*") on purpose: a named column that is absent in this database would
    // surface as a missing-column error and silently blank out the whole identity.
    const { data, error } = await admin.from("profiles").select("*").eq("id", profileId).maybeSingle();
    if (error) throw error;
    plan.profile = data ?? null;
  }

  if (!profileId) {
    return plan; // No auth user: nothing addressable by id. Email-keyed leftovers handled below.
  }

  const { data: therapistProfile, error: therapistError } = await admin
    .from("therapist_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (therapistError && !isMissingRelation(therapistError)) throw therapistError;
  plan.therapistProfile = therapistProfile ?? null;

  for (const [table, column, label] of CASCADE_RELATIONS) {
    const count = await countRows(admin, table, column, profileId);
    if (count) plan.cascades.push({ table, column, label, count });
  }

  for (const [table, column, label] of NULLABLE_REFERENCES) {
    const count = await countRows(admin, table, column, profileId);
    if (count) plan.nullouts.push({ table, column, label, count });
  }

  const ownJoinRequests = await countRows(admin, "join_requests", "email", email);
  plan.ownJoinRequests = ownJoinRequests ?? 0;

  const invitationsIssued = await selectRows(admin, "invitations", "*", "invited_by", profileId);
  plan.invitationsIssued = invitationsIssued ?? [];

  const invitationsToEmail = await countRows(admin, "invitations", "invited_email", email);
  plan.invitationsToEmail = invitationsToEmail ?? 0;

  const groupsCreated = await selectRows(admin, "groups", "*", "created_by", profileId);
  plan.groupsCreated = groupsCreated ?? [];

  plan.notificationsReceived = await countRows(
    admin,
    "notifications",
    "recipient_profile_id",
    profileId
  );

  // Notification titles are denormalized text ("X accepted your invitation"), so a
  // nulled reference would leave a permanent dead entry in a retained member's feed.
  plan.notificationsAbout = await countRows(admin, "notifications", "related_profile_id", profileId);

  const { data: avatarObjects } = await admin.storage.from("avatars").list(profileId, { limit: 100 });
  plan.avatarObjects = (avatarObjects ?? []).map((object) => `${profileId}/${object.name}`);

  return plan;
}

/** Flag ties to accounts that are NOT being deleted — sponsorships, approvals, invites. */
async function findSponsorImpact(admin, plan, deletedProfileIds, deletedEmails) {
  const profileId = plan.profile?.id ?? plan.user?.id;
  if (!profileId) return [];

  const impact = [];
  const isKept = (id) => id && !deletedProfileIds.has(id);

  const describeProfiles = async (ids) => {
    if (!ids.length) return [];
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, slug, membership_state")
      .in("id", ids);
    if (error && !isMissingRelation(error)) throw error;
    return data ?? [];
  };

  const acceptedByKept = plan.invitationsIssued
    .map((invitation) => invitation.accepted_by)
    .filter(isKept);
  for (const kept of await describeProfiles([...new Set(acceptedByKept)])) {
    impact.push({
      severity: "high",
      detail: `Is the INVITER for retained account "${kept.full_name}" (${kept.membership_state}) — that invitation row will be deleted, erasing their sponsorship chain.`
    });
  }

  const sponsoredRows =
    (await selectRows(admin, "join_requests", "id, email, full_name, status", "sponsor_profile_id", profileId)) ?? [];
  const endorsedRows =
    (await selectRows(admin, "join_requests", "id, email, full_name, status", "endorsement_from_profile_id", profileId)) ?? [];
  for (const row of [...sponsoredRows, ...endorsedRows]) {
    const email = String(row.email ?? "").toLowerCase();
    if (deletedEmails.has(email)) continue;
    impact.push({
      severity: "medium",
      detail: `Sponsor/endorser on join request for ${row.full_name} <${row.email}> (${row.status}) — that link will be set to NULL.`
    });
  }

  const followerRows =
    (await selectRows(admin, "follows", "follower_profile_id", "followed_profile_id", profileId)) ?? [];
  const keptFollowers = followerRows.map((row) => row.follower_profile_id).filter(isKept);
  for (const kept of await describeProfiles([...new Set(keptFollowers)])) {
    impact.push({
      severity: "low",
      detail: `Followed by retained account "${kept.full_name}" — that follow will be removed from their network.`
    });
  }

  const approvedRows = (await selectRows(admin, "profiles", "id, full_name, membership_state", "approved_by", profileId)) ?? [];
  for (const row of approvedRows.filter((candidate) => isKept(candidate.id))) {
    impact.push({
      severity: "medium",
      detail: `Approved retained account "${row.full_name}" (${row.membership_state}) — approved_by will be set to NULL.`
    });
  }

  return impact;
}

// ── rendering ────────────────────────────────────────────────────────────────

function formatPlan(plan, index, total) {
  const lines = [];
  const heading = `[${index + 1}/${total}] ${plan.email}`;
  lines.push("");
  lines.push("─".repeat(74));
  lines.push(heading);
  lines.push("─".repeat(74));

  if (!plan.user && !plan.profile) {
    lines.push("  No auth user and no profile found — nothing to delete (already clean).");
    if (plan.ownJoinRequests) {
      lines.push(`  Leftover join_requests rows keyed by email: ${plan.ownJoinRequests}`);
    }
    return lines.join("\n");
  }

  lines.push("  IDENTITY");
  lines.push(`    auth.users        ${plan.user ? plan.user.id : "(missing — already deleted)"}`);
  if (plan.user) {
    lines.push(`    created           ${plan.user.created_at}`);
    lines.push(`    last sign-in      ${plan.user.last_sign_in_at ?? "never"}`);
  }
  if (plan.profile) {
    lines.push(
      `    profiles          ${plan.profile.full_name} | role=${plan.profile.role} | state=${plan.profile.membership_state} | slug=${plan.profile.slug ?? "(null)"}`
    );
  } else {
    lines.push("    profiles          (missing — already deleted)");
  }
  lines.push(
    `    therapist_profiles ${plan.therapistProfile ? `${plan.therapistProfile.id} (public=${plan.therapistProfile.is_public})` : "(none)"}`
  );

  const hasRestrictWork =
    plan.nullouts.length ||
    plan.ownJoinRequests ||
    plan.invitationsIssued.length ||
    plan.invitationsToEmail ||
    plan.groupsCreated.length ||
    plan.notificationsReceived ||
    plan.notificationsAbout;

  if (hasRestrictWork) {
    lines.push("");
    lines.push("  STEP 1 — clear RESTRICT/NO ACTION references (before the profile delete)");
    for (const item of plan.nullouts) {
      lines.push(`    NULL   ${item.table}.${item.column} × ${item.count}  — ${item.label}`);
    }
    if (plan.notificationsReceived) {
      lines.push(`    DELETE notifications × ${plan.notificationsReceived}  — notifications received`);
    }
    if (plan.notificationsAbout) {
      lines.push(
        `    DELETE notifications × ${plan.notificationsAbout}  — notifications ABOUT this account, in other members' feeds`
      );
    }
    if (plan.ownJoinRequests) {
      lines.push(`    DELETE join_requests × ${plan.ownJoinRequests}  — this account's own application(s)`);
    }
    if (plan.invitationsIssued.length) {
      lines.push(`    NULL   join_requests.invitation_id → invitations issued by this account`);
      lines.push(`    DELETE invitations × ${plan.invitationsIssued.length}  — issued by this account`);
      for (const invitation of plan.invitationsIssued) {
        lines.push(
          `             ${invitation.code} → ${invitation.invited_email ?? "(open invite)"} | uses ${invitation.use_count}/${invitation.max_uses}${invitation.accepted_by ? " | ACCEPTED" : ""}`
        );
      }
    }
    if (plan.invitationsToEmail) {
      lines.push(`    DELETE invitations × ${plan.invitationsToEmail}  — addressed to this email`);
    }
    if (plan.groupsCreated.length) {
      lines.push(`    DELETE groups × ${plan.groupsCreated.length}  — created by this account (cascades memberships)`);
      for (const group of plan.groupsCreated) {
        lines.push(`             ${group.name} (${group.slug})`);
      }
    }
  }

  lines.push("");
  lines.push("  STEP 2 — delete profile (database cascades the rows below)");
  if (plan.cascades.length) {
    for (const item of plan.cascades) {
      lines.push(`    CASCADE ${item.table}.${item.column} × ${item.count}  — ${item.label}`);
    }
  } else {
    lines.push("    (no dependent rows)");
  }

  lines.push("");
  lines.push("  STEP 3 — delete auth.users row" + (plan.avatarObjects.length ? " + storage objects" : ""));
  if (plan.avatarObjects.length) {
    lines.push(`    DELETE storage avatars/ × ${plan.avatarObjects.length}`);
  }

  if (plan.sponsorImpact.length) {
    lines.push("");
    lines.push("  ⚠  IMPACT ON RETAINED ACCOUNTS");
    for (const item of plan.sponsorImpact) {
      lines.push(`    [${item.severity.toUpperCase()}] ${item.detail}`);
    }
  }

  return lines.join("\n");
}

// ── execution ────────────────────────────────────────────────────────────────

async function runStep(label, fn, results) {
  try {
    const affected = await fn();
    if (affected !== 0) results.push(`    ✓ ${label}${affected == null ? "" : ` (${affected})`}`);
  } catch (error) {
    if (isMissingRelation(error)) {
      results.push(`    – ${label} skipped (table/column absent)`);
      return;
    }
    throw error;
  }
}

async function nullOut(admin, table, column, value) {
  const { data, error } = await admin
    .from(table)
    .update({ [column]: null })
    .eq(column, value)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

async function deleteWhere(admin, table, column, value) {
  const { data, error } = await admin.from(table).delete().eq(column, value).select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

async function executePlan(admin, plan) {
  const results = [];
  const profileId = plan.profile?.id ?? plan.user?.id ?? null;

  if (!profileId) {
    // Email-keyed leftovers can still exist with no auth user / profile.
    await runStep("join_requests (by email)", () => deleteWhere(admin, "join_requests", "email", plan.email), results);
    await runStep(
      "invitations (addressed to email)",
      () => deleteWhere(admin, "invitations", "invited_email", plan.email),
      results
    );
    if (!results.length) results.push("    – nothing to do (already clean)");
    return results;
  }

  // STEP 1 — clear references that would otherwise block the profile delete.
  for (const [table, column] of NULLABLE_REFERENCES) {
    await runStep(`NULL ${table}.${column}`, () => nullOut(admin, table, column, profileId), results);
  }

  await runStep(
    "DELETE notifications (received)",
    () => deleteWhere(admin, "notifications", "recipient_profile_id", profileId),
    results
  );

  await runStep(
    "DELETE notifications (about this account)",
    () => deleteWhere(admin, "notifications", "related_profile_id", profileId),
    results
  );

  await runStep(
    "DELETE join_requests (own application)",
    () => deleteWhere(admin, "join_requests", "email", plan.email),
    results
  );

  // join_requests.invitation_id is NO ACTION — detach before deleting the invitations.
  for (const invitation of plan.invitationsIssued) {
    await runStep(
      `NULL join_requests.invitation_id → ${invitation.code}`,
      () => nullOut(admin, "join_requests", "invitation_id", invitation.id),
      results
    );
  }

  await runStep(
    "DELETE invitations (issued by account)",
    () => deleteWhere(admin, "invitations", "invited_by", profileId),
    results
  );

  await runStep(
    "DELETE invitations (addressed to email)",
    () => deleteWhere(admin, "invitations", "invited_email", plan.email),
    results
  );

  for (const group of plan.groupsCreated) {
    await runStep(`DELETE group ${group.slug}`, () => deleteWhere(admin, "groups", "id", group.id), results);
  }

  // STEP 2 — the profile row; the database cascades the dependent rows.
  await runStep(
    "DELETE therapist_profiles",
    () => deleteWhere(admin, "therapist_profiles", "profile_id", profileId),
    results
  );
  await runStep("DELETE profiles", () => deleteWhere(admin, "profiles", "id", profileId), results);

  // STEP 3 — storage objects, then the auth user.
  if (plan.avatarObjects.length) {
    await runStep(
      "DELETE storage avatars/",
      async () => {
        const { error } = await admin.storage.from("avatars").remove(plan.avatarObjects);
        if (error) throw error;
        return plan.avatarObjects.length;
      },
      results
    );
  }

  if (plan.user) {
    await runStep(
      "DELETE auth.users",
      async () => {
        const { error } = await admin.auth.admin.deleteUser(plan.user.id);
        // Already gone is success, not failure — keeps re-runs clean.
        if (error && !/not found/i.test(error.message)) throw error;
        return 1;
      },
      results
    );
  }

  if (!results.length) results.push("    – nothing to do (already clean)");
  return results;
}

// ── list mode ────────────────────────────────────────────────────────────────

async function listAccounts(admin, filter) {
  const users = await listAllUsers(admin);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, membership_state, slug, created_at");
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const matching = users
    .filter((user) => !filter || user.email?.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

  console.log(`${matching.length} account(s)${filter ? ` matching "${filter}"` : ""}:\n`);
  for (const user of matching) {
    const profile = profilesById.get(user.id);
    const marker = user.email?.includes(TEST_MARKER) ? "[+test]" : "       ";
    console.log(
      `  ${marker} ${user.email?.padEnd(42)} ${profile ? `${profile.role}/${profile.membership_state}` : "no-profile"}  ${profile?.full_name ?? ""}`
    );
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { emails, flags } = parseArgs(process.argv.slice(2));

  const admin = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  if (flags.list !== null) {
    await listAccounts(admin, flags.list);
    return;
  }

  if (!emails.length) {
    console.log("Usage:");
    console.log("  node scripts/delete-test-account.mjs <email> [more emails ...] [--dry-run]");
    console.log("  node scripts/delete-test-account.mjs --list [substring]");
    console.log("");
    console.log("Flags:");
    console.log("  --force     allow emails without a \"+test\" marker");
    console.log("  --dry-run   print the plan and exit without deleting");
    console.log("  --yes       skip the confirmation prompt");
    console.log("  --file F    read emails from file F (one per line)");
    console.log("  --emails    comma-separated list");
    process.exit(1);
  }

  const unmarked = emails.filter((email) => !email.includes(TEST_MARKER));
  if (unmarked.length && !flags.force) {
    console.error("REFUSING: these emails have no \"+test\" marker:\n");
    for (const email of unmarked) console.error(`  ${email}`);
    console.error("\nUse --force only if you are certain these are not real members.");
    process.exit(1);
  }
  if (unmarked.length && flags.force) {
    console.log(`⚠  --force: ${unmarked.length} email(s) without a "+test" marker will be deleted.\n`);
  }

  const allUsers = await listAllUsers(admin);

  const plans = [];
  for (const email of emails) {
    plans.push(await buildPlan(admin, email, allUsers));
  }

  const deletedProfileIds = new Set(
    plans.map((plan) => plan.profile?.id ?? plan.user?.id).filter(Boolean)
  );
  const deletedEmails = new Set(plans.map((plan) => plan.email));
  for (const plan of plans) {
    plan.sponsorImpact = await findSponsorImpact(admin, plan, deletedProfileIds, deletedEmails);
  }

  console.log("DELETION PLAN");
  for (const [index, plan] of plans.entries()) {
    console.log(formatPlan(plan, index, plans.length));
  }

  if (missingRelations.size) {
    console.log("");
    console.log(`Note: not present in this database (skipped): ${[...missingRelations].join(", ")}`);
  }

  const actionable = plans.filter((plan) => plan.user || plan.profile || plan.ownJoinRequests);
  console.log("");
  console.log("─".repeat(74));
  console.log(`${actionable.length} of ${plans.length} account(s) have rows to remove.`);

  if (flags.dryRun) {
    console.log("--dry-run: nothing was deleted.");
    return;
  }

  if (!actionable.length) {
    console.log("Nothing to do.");
    return;
  }

  const flagged = plans.filter((plan) => plan.sponsorImpact.length);
  if (flagged.length) {
    console.log(`⚠  ${flagged.length} account(s) have ties to retained accounts — review the IMPACT sections above.`);
  }

  if (!flags.yes) {
    if (!process.stdin.isTTY) {
      console.error("Refusing to delete without confirmation in a non-interactive shell. Pass --yes.");
      process.exit(1);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\nType ${CONFIRM_TOKEN} to permanently delete the accounts above: `);
    rl.close();
    if (answer.trim() !== CONFIRM_TOKEN) {
      console.log("Aborted. Nothing was deleted.");
      process.exit(1);
    }
  }

  console.log("");
  for (const plan of plans) {
    console.log(`Deleting ${plan.email} ...`);
    const results = await executePlan(admin, plan);
    console.log(results.join("\n"));
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message || error}`);
  process.exit(1);
});
