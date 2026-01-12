const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "AlphaAlerts";

export default function Head() {
  return (
    <>
      <title>Dashboard | {BRAND}</title>
      <meta
        name="description"
        content={`${BRAND} dashboard for alerts, logs, and account status.`}
      />
    </>
  );
}
