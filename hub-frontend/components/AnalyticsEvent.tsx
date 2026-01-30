"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEventProps } from "@/lib/analytics";

export default function AnalyticsEvent({
  name,
  props,
}: {
  name: string;
  props?: AnalyticsEventProps;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    track(name, props ?? {});
  }, [name, props]);

  return null;
}

