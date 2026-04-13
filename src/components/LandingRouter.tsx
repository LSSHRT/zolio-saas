"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LandingPage from "@/components/LandingPage";

export default function LandingRouter({ serverHasSession }: { serverHasSession?: boolean }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [user, isLoaded, router]);

  if (!isLoaded || user || serverHasSession) {
    return (
      <div className="min-h-screen bg-[#faf5ff] dark:bg-[#0c0a1d] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-violet"></div>
      </div>
    );
  }

  return <LandingPage />;
}
