"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Bell, Network, GitMerge, TrendingDown } from "lucide-react";

import { markNotificationsRead } from "@/app-actions/member-actions";
import type { Notification, NotificationType } from "@/types";

function notificationHref(notification: Notification): Route {
  switch (notification.type) {
    case "referral_received":
      return "/member/referrals?tab=incoming" as Route;
    case "referral_accepted":
    case "referral_declined":
      return "/member/referrals?tab=sent" as Route;
    case "network_added":
    case "connection_facilitated":
      return "/member/network" as Route;
    default:
      return "/member/notifications" as Route;
  }
}

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "referral_received":
    case "referral_accepted":
    case "referral_declined":
      return <GitMerge className="h-4 w-4 shrink-0 text-primary" />;
    case "network_added":
    case "connection_facilitated":
      return <Network className="h-4 w-4 shrink-0 text-primary" />;
    case "availability_changed":
      return <TrendingDown className="h-4 w-4 shrink-0 text-primary" />;
    default:
      return <Bell className="h-4 w-4 shrink-0 text-primary" />;
  }
}

function groupByDate(notifications: Notification[]): Array<{ label: string; items: Notification[] }> {
  const groups = new Map<string, Notification[]>();
  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const label = isNaN(d.getTime())
      ? "Earlier"
      : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const group = groups.get(label) ?? [];
    group.push(n);
    groups.set(label, group);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  useEffect(() => {
    if (notifications.some((n) => !n.readAt)) {
      markNotificationsRead().catch(() => undefined);
    }
  }, [notifications]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Bell className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      </div>
    );
  }

  const groups = groupByDate(notifications);

  return (
    <div className="space-y-6">
      {groups.map(({ label, items }) => (
        <section key={label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</h2>
          <ul className="space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border transition-colors hover:bg-muted/50 ${n.readAt ? "bg-background" : "border-primary/20 bg-primary/5"}`}
              >
                <Link href={notificationHref(n)} className="flex cursor-pointer items-start gap-3 px-4 py-3">
                  <span className="mt-0.5">{notificationIcon(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{n.createdAtLabel}</p>
                  </div>
                  {!n.readAt && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
