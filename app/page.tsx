"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Dashboard'a doğrudan yönlendir
    router.push('/dashboard');
  }, [router]);

  // Yönlendirme sırasında loading göster
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Dashboard&apos;a yönlendiriliyor...</p>
      </div>
    </div>
  );
}
