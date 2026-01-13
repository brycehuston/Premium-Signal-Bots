// app/login/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <SignIn routing="hash" signUpUrl="/register" />
    </div>
  );
}
