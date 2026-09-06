"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
import { configureTokenPersistence, tokenStore } from "@api/http";
import { biometricAuth } from "@/lib/biometric-auth";
import { secureTokenStorage } from "@/lib/secure-token-storage";

export function BiometricLoginButton() {
  const pathname = usePathname().replace(/\/+$/, "");
  const router = useRouter();
  const [available, setAvailable] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supported =
        (await secureTokenStorage.hasSession()) &&
        (await biometricAuth.isAvailable());
      if (active) setAvailable(supported);
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!available || pathname !== "/auth") return null;

  return (
    <Button
      fullWidth
      size="lg"
      variant="secondary"
      isPending={pending}
      onPress={async () => {
        if (busy.current || pathname !== "/auth") return;
        busy.current = true;
        setPending(true);
        try {
          await biometricAuth.authenticate();
          // Ignore completion if the user left the login page while the native dialog was open.
          if (window.location.pathname.replace(/\/+$/, "") !== "/auth") return;
          await configureTokenPersistence(secureTokenStorage);
          if (tokenStore.get()) router.replace("/auth/roles");
        } catch {
          toast.warning(
            "ورود بیومتریک انجام نشد؛ دوباره تلاش کنید یا روش دیگری را انتخاب کنید.",
          );
        } finally {
          busy.current = false;
          setPending(false);
        }
      }}
    >
      ورود با اثر انگشت یا تشخیص چهره
    </Button>
  );
}
