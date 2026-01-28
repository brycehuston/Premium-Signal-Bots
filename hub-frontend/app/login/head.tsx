const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `Login | ${BRAND}`;
const DESCRIPTION = `Log in to ${BRAND} to access your dashboard and alerts.`;

export default function Head() {
  return (
    <>
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <link rel="canonical" href={`${SITE_URL}/login`} />
      <meta name="robots" content="noindex, nofollow, noarchive" />
    </>
  );
}
