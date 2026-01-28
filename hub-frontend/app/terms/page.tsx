import { Card, CardBody, SectionHeading } from "@/components/ui";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <Card>
        <CardBody className="space-y-6">
          <SectionHeading
            title="Terms of Service"
            subtitle="Rules and expectations for using AlphaAlerts."
          />
          <div className="space-y-4 text-body text-muted">
            <p>
              AlphaAlerts provides informational trading alerts. You are responsible for your own decisions and risk management.
            </p>
            <p>
              Access is provided to private channels based on your subscription tier. Sharing access links or redistributing alerts is not permitted.
            </p>
            <p>
              Manual payments are verified by the team before access is granted. Renewals require a new payment when due.
            </p>
            <p>
              We may update features, pricing, or availability at any time to improve service quality.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
