// app/register/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <SignUp
        routing="hash"
        signInUrl="/login"
        appearance={{
          variables: {
            colorBackground: "rgb(235 235 235)",
            colorInputBackground: "rgb(248 248 248)",
            colorText: "rgb(18 18 18)",
            colorTextSecondary: "rgb(70 70 70)",
            colorPrimary: "rgb(var(--gold))",
            colorDanger: "rgb(235 88 88)",
            borderRadius: "12px",
          },
          elements: {
            card:
              "bg-[linear-gradient(120deg,#d2d2d2_0%,#f5f5f5_28%,#c7c7c7_55%,#f0f0f0_82%,#d7d7d7_100%)] border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_20px_60px_-40px_rgba(0,0,0,0.45)] rounded-card",
            headerTitle: "font-display text-black",
            headerSubtitle: "text-black/70",
            socialButtonsBlockButton:
              "border border-black/15 bg-white/60 text-black hover:border-black/35",
            formButtonPrimary:
              "bg-black text-white hover:bg-black/90 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.65)]",
            formFieldInput:
              "bg-white/70 border border-black/15 text-black placeholder:text-black/50 focus:border-black/35 focus:ring-0",
            footerActionLink: "text-black/80 hover:text-black",
          },
        }}
      />
    </div>
  );
}
