import { Card } from "@/components/ui";

export default function MetricCard({ k, v }: { k: string; v: string }) {
  return (
    <Card>
      <div className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted/80">{k}</div>
        <div className="text-xl font-semibold mt-1">{v}</div>
      </div>
    </Card>
  );
}
