const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

export default function Head() {
  return (
    <>
      <title>Billing | {BRAND}</title>
      <meta
        name="description"
        content={`${BRAND} billing and subscription management.`}
      />
    </>
  );
}
