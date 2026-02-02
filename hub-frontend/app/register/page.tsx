// app/register/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    track("signup_click");
    router.replace("/login");
  }, [router]);

  return null;
}
