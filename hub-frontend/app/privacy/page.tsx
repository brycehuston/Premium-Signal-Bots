import { Card, CardBody, SectionHeading } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <Card>
        <CardBody className="space-y-6">
          <SectionHeading
            title="Privacy Policy"
            subtitle="How we handle data across the AlphaAlerts platform."
          />
          <div className="space-y-4 text-body text-muted">
            <p>
              We collect only the minimum information needed to deliver alerts, manage access, and support billing.
            </p>
            <p>
              Data collected may include your email, Telegram username (if provided), plan tier, and payment status. We do not sell personal data.
            </p>
            <p>
              Payment confirmations are verified manually. We do not store full wallet history, and we never request private keys.
            </p>
            <p>
              You can request deletion of your account data by contacting support.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
