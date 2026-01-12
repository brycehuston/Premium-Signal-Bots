const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

export default function Head() {
  return (
    <>
      <title>Login | {BRAND}</title>
      <meta
        name="description"
        content={`Log in to ${BRAND} to access your dashboard and alerts.`}
      />
    </>
  );
}
