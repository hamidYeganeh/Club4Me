"use client";
import { useOverlayFocus } from "../../lib/use-overlay-focus";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { Check } from "@modules/marketing/icons/icons/Check";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CloseIconButton, LandingPillButton } from "../../lib/landing-controls";
import { ClipReveal } from "../../lib/landing-reveal";
import { useLandingScroll } from "../../lib/landing-scroll";
import { LandingEyebrow } from "../../lib/landing-ui";
import { cn } from "../../lib/marketing-cn";
import { landingContactModalStyles } from "./LandingContactModal.styles";
import type { LandingContactModalProps } from "./LandingContactModal.types";
import { http } from "@api";

export function LandingContactModal({ className }: LandingContactModalProps) {
  const t = useTranslations("MarketingLanding.contact");
  const shared = useTranslations("MarketingLanding.shared");
  const slots = landingContactModalStyles();
  const { contactOpen, closeContact } = useLandingScroll();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayFocus(panelRef, contactOpen, closeContact);
  const nameRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (!contactOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContact();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => nameRef.current?.focus(), 120);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [contactOpen, closeContact]);

  useEffect(() => {
    if (contactOpen) return;
    const resetTimer = window.setTimeout(() => {
      setSending(false);
      setSuccess(false);
      setFirstName("");
    }, 300);
    return () => window.clearTimeout(resetTimer);
  }, [contactOpen]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    setFirstName(name.split(/\s+/)[0] || "");
    const email = String(fd.get("email") ?? "").trim();
    const note = String(fd.get("note") ?? "").trim();
    const website = String(fd.get("website") ?? "");
    const consent = fd.get("consent") === "on";
    setSending(true);
    try {
      await http.post<{ accepted: true }>("/public/contact", {
        name,
        email,
        note,
        consent,
        website,
      });
      setSuccess(true);
    } catch {
      window.location.href = `mailto:hello@gym4me.ir?subject=${encodeURIComponent("تماس با Gym4Me")}&body=${encodeURIComponent(`${name}\n${email}\n\n${note}`)}`;
    } finally {
      setSending(false);
    }
  };

  const successName = firstName || t("successFallbackName");

  return (
    <div
      className={cn(
        slots.root({ className }),
        !contactOpen && "pointer-events-none",
      )}
      aria-hidden={!contactOpen}
      inert={!contactOpen}
    >
      <button
        type="button"
        className={cn(
          slots.backdrop(),
          "h-auto min-h-0 rounded-none border-0 p-0 shadow-none",
        )}
        style={{ opacity: contactOpen ? 1 : 0 }}
        aria-label={t("closeAria")}
        onClick={closeContact}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className={slots.panel()}
        style={{
          opacity: contactOpen ? 1 : 0,
          transform: contactOpen
            ? "translateY(0) scale(1)"
            : "translateY(28px) scale(0.96)",
        }}
      >
        <div className={slots.header()}>
          <div>
            <LandingEyebrow>{t("eyebrow")}</LandingEyebrow>
            <ClipReveal
              id="contact-modal-title"
              as="h2"
              mode="lines"
              text={t("title")}
              className={slots.title()}
              active={contactOpen && !success}
              stagger={90}
            />
          </div>
          <CloseIconButton
            label={shared("close")}
            onPress={closeContact}
            tone="dark"
          />
        </div>

        {success ? (
          <div className={slots.success()}>
            <div className={slots.check()}>
              <Check size={22} className="text-accent-foreground" aria-hidden />
            </div>
            <Typography type="h4" className={slots.successTitle()}>
              {t("successTitle")}
            </Typography>
            <Typography
              type="body-sm"
              color="muted"
              className={slots.successBody()}
            >
              <TextWithBrand>
                {t("successBody", { name: successName })}
              </TextWithBrand>
            </Typography>
            <LandingPillButton variant="solid" onPress={closeContact}>
              {t("done")}
            </LandingPillButton>
          </div>
        ) : (
          <form autoComplete="off" className={slots.form()} onSubmit={onSubmit}>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <label className={slots.field()}>
              <span className={slots.label()}>{t("nameLabel")}</span>
              <input
                ref={nameRef}
                name="name"
                type="text"
                placeholder={t("namePlaceholder")}
                className={slots.input()}
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <label className={slots.field()}>
              <span className={slots.label()}>{t("emailLabel")}</span>
              <input
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                className={slots.input()}
                required
                dir="ltr"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <label className={slots.field()}>
              <span className={slots.label()}>{t("noteLabel")}</span>
              <textarea
                name="note"
                rows={3}
                placeholder={t("notePlaceholder")}
                className={slots.input()}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </label>
            <label className="flex items-start gap-2 text-xs leading-6 text-muted">
              <input name="consent" type="checkbox" required className="mt-1 size-4" />
              با ثبت فرم، با ذخیره نام، ایمیل و متن پیام برای پیگیری همین درخواست مطابق سیاست حریم خصوصی موافقم.
            </label>
            <Button
              variant="primary"
              isDisabled={sending}
              className={slots.submit()}
              render={(props) => (
                <button {...props} type="submit" disabled={sending} />
              )}
            >
              {sending ? t("submitting") : t("submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
