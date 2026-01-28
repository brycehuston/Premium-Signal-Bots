const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `Billing | ${BRAND}`;
const DESCRIPTION = `${BRAND} billing and subscription management.`;

export default function Head() {
  return (
    <>
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <link rel="canonical" href={`${SITE_URL}/billing`} />
      <meta name="robots" content="noindex, nofollow, noarchive" />
    </>
  );
}
