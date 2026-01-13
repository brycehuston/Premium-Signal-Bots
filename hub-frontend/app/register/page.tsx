// app/register/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <SignUp routing="hash" signInUrl="/login" />
    </div>
  );
}
