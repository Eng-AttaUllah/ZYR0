-- Auto-flip stale offer letters to 'Expired'.
-- Fires on every app read (RPC) so dashboards, /verify, and accept-flow always
-- see the truth. Only Pending/Sent flip: Accepted stays verifiable (accepted
-- before the deadline), Rejected/Revoked keep their status.
-- Status change triggers 018_sync_offer_letter_status → application becomes Rejected.

create or replace function public.expire_stale_offers()
returns void
language sql
security definer
set search_path = public
as $$
  update public.offer_letters
  set status = 'Expired'
  where expires_at < now()
    and status in ('Pending', 'Sent');
$$;

-- No arguments, fixed statement, time-derived only — safe for anon to invoke
-- from the public /verify page.
revoke all on function public.expire_stale_offers() from public;
grant execute on function public.expire_stale_offers() to anon, authenticated, service_role;
