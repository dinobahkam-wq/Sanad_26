"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type HeaderAuthState = "loading" | "signed-in" | "signed-out";

export function AppHeader() {
  const [authState, setAuthState] = useState<HeaderAuthState>("loading");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Header session check failed", error);
          setAuthState("signed-out");
          return;
        }
        setAuthState(data.session ? "signed-in" : "signed-out");
      })
      .catch((error) => {
        console.error("Header session check failed", error);
        if (isMounted) setAuthState("signed-out");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "signed-in" : "signed-out");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="سند">
        <span className="brand-mark" aria-hidden="true">
          س
        </span>
        <span>سند</span>
      </Link>
      <nav className="actions" aria-label="روابط التطبيق">
        <Link className="nav-link" href="/share">
          مشاركة إشعار
        </Link>
        <Link className="nav-link" href="/workspace">
          مساحة العمل
        </Link>
        {authState === "signed-in" ? (
          <LogoutButton />
        ) : (
          <>
            <Link className="nav-link" href="/auth/login">
              تسجيل الدخول
            </Link>
            <Link className="nav-link" href="/auth/register">
              إنشاء حساب
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
