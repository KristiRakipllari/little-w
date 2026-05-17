"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";

export default function AdminHome() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/stories");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#6E7191" }}>Loading...</p>
    </div>
  );
}
