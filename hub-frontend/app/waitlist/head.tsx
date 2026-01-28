const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = `Alpha-X Waitlist | ${BRAND}`;
const DESCRIPTION =
  "Join the Alpha-X waitlist for hands-free auto-trader updates, early access, and premium Solana alert automation.";

export default function Head() {
  return (
    <>
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <link rel="canonical" href={`${SITE_URL}/waitlist`} />

      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:url" content={`${SITE_URL}/waitlist`} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:image" content={`${SITE_URL}/favicon.ico`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={TITLE} />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta name="twitter:image" content={`${SITE_URL}/favicon.ico`} />
    </>
  );
}
