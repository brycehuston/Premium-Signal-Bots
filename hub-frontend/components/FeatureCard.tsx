import { Card } from "@/components/ui";
import type { ReactNode } from "react";

export default function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="h-full">
      <div className="p-6">
        <div className="mb-3 flex items-center gap-2">{icon}<h3 className="text-lg font-semibold">{title}</h3></div>
        <p className="text-white/70">{desc}</p>
      </div>
    </Card>
  );
}
