"use client";

import { useEffect } from "react";

export function AuthHashHandler() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");
    const accessToken = params.get("access_token");

    if (type === "recovery" && accessToken && window.location.pathname !== "/reset-password") {
      window.location.replace(`/reset-password${hash}`);
    }
  }, []);

  return null;
}
