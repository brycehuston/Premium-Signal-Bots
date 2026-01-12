const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

export default function Head() {
  return (
    <>
      <title>Pricing | {BRAND}</title>
      <meta
        name="description"
        content={`${BRAND} pricing and plan options for premium alert tiers.`}
      />
    </>
  );
}
