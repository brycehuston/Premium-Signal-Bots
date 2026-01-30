"use client";

import { useEffect } from "react";
import { Button, Card, CardBody, SectionHeading } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-12">
      <Card>
        <CardBody className="space-y-5 text-center">
          <SectionHeading
            align="center"
            eyebrow="Something broke"
            title="We hit an unexpected error"
            subtitle="Try again or head back home."
          />
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={reset} variant="outline" size="md">
              Try again
            </Button>
            <Button href="/" size="md">
              Back home
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

