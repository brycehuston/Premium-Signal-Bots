# ALPHA COMMAND — candidate implementation
Account shell is available to any signed-in Supabase user even during /me outage.
Owner/subscriber intelligence routes require server authorization and still
use the existing private API gateway/Edge v4. Preview is separately scoped
and fails closed if not configured. Existing owner component/CSS unchanged.

## Account acceptance contract (browser synthetic, not real production accounts)
- Anonymous users see sign-in gating; signed-in users always reach Alpha
  Command even if paid membership or intelligence services are offline.
- Free accounts see accurate membership state and may activate a one-use
  10-minute preview; aggregate-only history is available while active.
  Reloading must not trigger a second activation; access outside the
  preview must remain restricted.
- Paid subscribers display only verified lane entitlements and may open the
  separately authorized intelligence route. A paid label alone is not an
  authorization grant.
- Inactive subscriptions never claim a paid entitlement.
- Backend outages fail closed and disclose unavailable status rather
  than guessing payment or private access.
- Expired previews have no reactivation button and no aggregate read.
- CI covers these states at phone and desktop widths using synthetic
  Supabase and /me fixtures. This does not replace real account QA,
  staged database migration, or production acceptance.
