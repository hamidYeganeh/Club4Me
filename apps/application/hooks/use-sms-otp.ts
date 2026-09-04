"use client";

import { useEffect, useRef } from "react";

const OTP_CODE_PATTERN = /\d+/g;

type UseSmsOtpOptions = {
  enabled?: boolean;
  length: number;
  sessionKey?: number | string;
  onCode: (code: string) => void;
};

type WebOtpRequestOptions = CredentialRequestOptions & {
  otp?: { transport: Array<"sms"> };
};

type WebOtpCredential = Credential & {
  code?: string;
};

function extractOtpCode(value: string, length: number) {
  const digits = value.match(OTP_CODE_PATTERN)?.join("") ?? "";
  if (digits.length < length) {
    return null;
  }

  return digits.slice(0, length);
}

export function useSmsOtp({
  enabled = true,
  length,
  sessionKey = 0,
  onCode,
}: UseSmsOtpOptions) {
  const onCodeRef = useRef(onCode);

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!enabled || length <= 0 || typeof navigator === "undefined") {
      return;
    }

    const credentials = navigator.credentials;
    if (!credentials?.get || !("OTPCredential" in window)) {
      return;
    }

    const abort = new AbortController();
    const options: WebOtpRequestOptions = {
      otp: { transport: ["sms"] },
      signal: abort.signal,
    };

    void credentials
      .get(options)
      .then((credential) => {
        const code = extractOtpCode(
          (credential as WebOtpCredential | null)?.code ?? "",
          length,
        );
        if (code) {
          onCodeRef.current(code);
        }
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      });

    return () => {
      abort.abort();
    };
  }, [enabled, length, sessionKey]);
}
