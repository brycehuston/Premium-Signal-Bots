# ALPHA COMMAND — candidate implementation
Account shell is available to any signed-in Supabase user even during /me outage.
Owner/subscriber intelligence routes require server authorization and still
use the existing private API gateway/Edge v4. Preview is separately scoped
and fails closed if not configured. Existing owner component/CSS unchanged.
