"use client";

import { Button } from "@/components/ui";
import { track, type AnalyticsEventProps } from "@/lib/analytics";
import type { ComponentProps } from "react";

type TrackedButtonProps = ComponentProps<typeof Button> & {
  event: string;
  eventProps?: AnalyticsEventProps;
};

export default function TrackedButton({
  event,
  eventProps,
  onClick,
  ...rest
}: TrackedButtonProps) {
  return (
    <Button
      {...rest}
      onClick={() => {
        track(event, eventProps ?? {});
        onClick?.();
      }}
    />
  );
}

