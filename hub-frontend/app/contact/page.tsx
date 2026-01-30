import { Button, Card, CardBody, SectionHeading } from "@/components/ui";
import TrackedButton from "@/components/TrackedButton";

const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/alphaalerts";
const X_URL = process.env.NEXT_PUBLIC_X_URL || "https://x.com/alphaalerts";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="sr-only">Contact</h1>
      <Card>
        <CardBody className="space-y-6">
          <SectionHeading
            title="Contact"
            subtitle="Reach the team for onboarding help, billing questions, or support."
          />
          <div className="space-y-3 text-body text-muted">
            <p>
              For the fastest response, message us on Telegram. For announcements and updates, follow us on X.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <TrackedButton
              href={TELEGRAM_URL}
              size="md"
              target="_blank"
              rel="noopener noreferrer"
              event="telegram_access_click"
              eventProps={{ location: "contact" }}
            >
              Message on Telegram
            </TrackedButton>
            <Button href={X_URL} size="md" variant="outline" target="_blank" rel="noopener noreferrer">
              Follow on X
            </Button>
          </div>
          <div className="rounded-control border border-stroke/60 bg-surface/70 px-4 py-3 text-small text-muted">
            Typical response time: within 24 hours.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
