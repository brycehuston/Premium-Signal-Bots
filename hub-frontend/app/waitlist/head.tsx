const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

export default function Head() {
  return (
    <>
      <title>Alpha-X Waitlist | {BRAND}</title>
      <meta
        name="description"
        content={`Join the ${BRAND} Alpha-X waitlist for auto-trader updates.`}
      />
    </>
  );
}
