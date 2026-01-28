import { Button, Card, CardBody, SectionHeading } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <Card>
        <CardBody className="space-y-6 text-center">
          <SectionHeading
            align="center"
            title="Page Not Found"
            subtitle="The page you’re looking for doesn’t exist or has moved."
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button href="/" size="md">
              Back to Home
            </Button>
            <Button href="/pricing" size="md" variant="outline">
              View Pricing
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
