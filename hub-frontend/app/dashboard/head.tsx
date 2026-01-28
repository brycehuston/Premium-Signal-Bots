const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `Dashboard | ${BRAND}`;
const DESCRIPTION = `${BRAND} dashboard for alerts, logs, and account status.`;

export default function Head() {
  return (
    <>
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <link rel="canonical" href={`${SITE_URL}/dashboard`} />
      <meta name="robots" content="noindex, nofollow, noarchive" />
    </>
  );
}
