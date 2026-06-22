create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id and new.role <> old.role then
    raise exception 'role cannot be changed by this user';
  end if;

  if auth.uid() = old.id and new.membership_state <> old.membership_state then
    raise exception 'membership_state cannot be changed by this user';
  end if;

  if auth.uid() = old.id and new.approved_by is distinct from old.approved_by then
    raise exception 'approval fields cannot be changed by this user';
  end if;

  if auth.uid() = old.id and new.can_issue_referrals <> old.can_issue_referrals then
    raise exception 'referral permissions cannot be changed by this user';
  end if;

  if auth.uid() = old.id and new.trusted_referrer_at is distinct from old.trusted_referrer_at then
    raise exception 'trusted referrer fields cannot be changed by this user';
  end if;

  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_active_member()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('therapist', 'admin')
      and membership_state = 'active'
  );
$$;

create or replace function public.can_issue_referral_links()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'therapist'
      and membership_state = 'active'
      and can_issue_referrals = true
  );
$$;

create or replace function public.increment_invitation_use_count()
returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  update public.invitations
  set use_count = use_count + 1
  where id = new.invitation_id;
  return new;
end;
$$;

create or replace function public.validate_join_request_from_invitation()
returns trigger
language plpgsql
security definer set search_path = public, extensions
as $$
begin
  -- Ensure the invitation exists and is active
  if not exists (
    select 1 from public.invitations
    where id = new.invitation_id and is_active = true and (expires_at is null or expires_at > now())
  ) then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Ensure the invitation has not exceeded its max_uses
  if exists (
    select 1 from public.invitations
    where id = new.invitation_id and use_count >= max_uses
  ) then
    raise exception 'Invitation has no uses remaining';
  end if;

  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_therapist_profiles_updated_at
before update on public.therapist_profiles
for each row
execute function public.set_updated_at();

create trigger set_join_requests_updated_at
before update on public.join_requests
for each row
execute function public.set_updated_at();

create trigger set_groups_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

create trigger set_posts_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

create trigger set_curated_lists_updated_at
before update on public.curated_lists
for each row
execute function public.set_updated_at();

create trigger protect_profile_system_fields_before_update
before update on public.profiles
for each row
execute function public.protect_profile_system_fields();

create trigger validate_join_request_before_insert
before insert on public.join_requests
for each row
execute function public.validate_join_request_from_invitation();

create trigger increment_invitation_use_count_after_insert
after insert on public.join_requests
for each row
execute function public.increment_invitation_use_count();

create trigger set_referral_messages_updated_at
before update on public.referral_messages
for each row
execute function public.set_updated_at();

create trigger set_direct_referrals_updated_at
before update on public.direct_referrals
for each row
execute function public.set_updated_at();