const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

export default function Head() {
  return (
    <>
      <title>Create Account | {BRAND}</title>
      <meta
        name="description"
        content={`Create your ${BRAND} account to unlock premium alerts.`}
      />
    </>
  );
}
