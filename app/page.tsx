"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("onepin_ui_settings");
      const settings = raw ? JSON.parse(raw) : {};
      router.replace(settings.defaultLanding || "/home");
    } catch {
      router.replace("/home");
    }
  }, [router]);

  return null;
}
