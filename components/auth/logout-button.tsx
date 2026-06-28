"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logSupabaseError } from "@/lib/auth/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/auth/login");
      router.refresh();
    } catch (error) {
      logSupabaseError("Logout failed", error);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button className="nav-link nav-button" type="button" disabled={isSigningOut} onClick={signOut}>
      {isSigningOut ? "جاري الخروج..." : "خروج"}
    </button>
  );
}
