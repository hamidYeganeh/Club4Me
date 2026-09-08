"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Button,
  Calendar,
  InputGroup,
  Label,
  Skeleton,
  TextField,
  toast,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import NumberFlow from "@number-flow/react";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeroSection } from "@modules/account/sections/AccountAuthOtpHeroSection";
import {
  type AccountActivityLevel,
  type AccountGender,
  type AccountProfileChoice,
  type UpdateAccountMePayload,
  useAccountMe,
  useAccountProfileChoices,
  useConfirmOtp,
  useRequestOtp,
  useUpdateAccountMe,
  useVerifyIdCard,
} from "@api/account";
import { Icon, type IconName } from "@theme/icon";
import { useTranslations } from "next-intl";
import { OTPInput } from "@repo/ui/otp-input";
import { accountAuthOtpConfirmFormStyles } from "@modules/account/forms/AccountAuthOtpConfirmForm/AccountAuthOtpConfirmForm.styles";
import { accountAuthOtpFormStyles } from "@modules/account/forms/AccountAuthOtpForm/AccountAuthOtpForm.styles";

import { BottomSheet } from "@/components/motion/bottom-sheet";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";
import { cn } from "@/lib/cn";
import { useSmsOtp } from "@/hooks/use-sms-otp";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";

import type { ProfileEditField } from "../profile.types";

const GENDER_ICONS: Record<AccountGender, IconName> = {
  female: "gender-female",
  male: "gender-male",
  other: "gender-transgender",
};

const ACTIVITY_ICONS: Record<AccountActivityLevel, IconName> = {
  "very-active": "person-running",
  normal: "person-walking",
  "very-lazy": "sleep-zzz",
};

const RESEND_COOLDOWN_SECONDS = 60;
const ID_CARD_OTP_LENGTH = 5;

export function ProfileEditFieldSheet({
  field,
  open,
  onOpenChange,
}: {
  field: ProfileEditField;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tOtp = useTranslations("auth.otp");
  const tOtpConfirm = useTranslations("auth.otp.confirm");
  const isKeyboardOpen = useKeyboardOpen();
  const me = useAccountMe();
  const choices = useAccountProfileChoices(open);
  const updateMe = useUpdateAccountMe();
  const [firstName, setFirstName] = useState(() => me.data?.firstName ?? "");
  const [lastName, setLastName] = useState(() => me.data?.lastName ?? "");
  const [gender, setGender] = useState<AccountGender | "">(
    () => me.data?.gender ?? "",
  );
  const [genderDescription, setGenderDescription] = useState(
    () => me.data?.genderDescription ?? "",
  );
  const [activityLevel, setActivityLevel] = useState<AccountActivityLevel | "">(
    () => me.data?.activityLevel ?? "",
  );
  const [idCard, setIdCard] = useState(() => me.data?.idCard ?? "");
  const [birthdate, setBirthdate] = useState(() =>
    toDateInputValue(me.data?.birthdate),
  );
  const [idCardVerificationStage, setIdCardVerificationStage] = useState<
    "edit" | "verify"
  >("edit");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSessionKey, setOtpSessionKey] = useState(0);
  const needsChoices = field === "gender" || field === "activity-level";
  const verifyIdCard = useVerifyIdCard();
  const requestOtp = useRequestOtp();
  const confirmOtp = useConfirmOtp();
  const otpStyles = accountAuthOtpConfirmFormStyles();
  const otpRequestStyles = accountAuthOtpFormStyles();
  const isIdCardField = field === "id-card";
  const isVerifyingIdCard =
    isIdCardField && idCardVerificationStage === "verify";

  const isPending = useMemo(
    () =>
      updateMe.isPending ||
      verifyIdCard.isPending ||
      requestOtp.isPending ||
      confirmOtp.isPending,
    [
      updateMe.isPending,
      verifyIdCard.isPending,
      requestOtp.isPending,
      confirmOtp.isPending,
    ],
  );

  const title = useMemo(() => {
    switch (field) {
      case "name":
        return t("editNameTitle");
      case "gender":
        return t("editGenderTitle");
      case "activity-level":
        return t("editActivityLevelTitle");
      case "id-card":
        return t("editIdCardTitle");
      case "birthdate":
        return t("editBirthdateTitle");
    }
  }, [field, t]);

  useEffect(() => {
    if (!isVerifyingIdCard) {
      const reset = window.setTimeout(() => {
        setResendCooldown(0);
        setOtpCode("");
      }, 0);
      return () => window.clearTimeout(reset);
    }
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isVerifyingIdCard, resendCooldown]);

  const startIdCardVerification = async () => {
    const prepared = idCard.trim();
    if (!/^\d{10}$/.test(prepared)) {
      toast.danger(t("editSaveError"), {
        description: t("editFieldInvalid"),
      });
      return;
    }
    if (!me.data?.phone) {
      toast.danger(t("editSaveError"), {
        description: tAuth("idCardVerificationUnavailable"),
      });
      return;
    }
    try {
      await verifyIdCard.mutateAsync({ idCard: prepared });
      await requestOtp.mutateAsync({ phone: me.data.phone });
      setIdCardVerificationStage("verify");
      setOtpSessionKey((value) => value + 1);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(tAuth("idCardVerificationSent"));
    } catch (error) {
      toast.danger(t("editSaveError"), {
        description: getAccountApiErrorMessage(error, tAuth),
      });
    }
  };

  const resendOtp = async () => {
    if (!me.data?.phone || resendCooldown > 0 || isPending) {
      return;
    }
    try {
      await requestOtp.mutateAsync({ phone: me.data.phone });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpSessionKey((value) => value + 1);
      setOtpCode("");
      toast.success(tAuth("idCardVerificationSent"));
    } catch (error) {
      toast.danger(t("editSaveError"), {
        description: getAccountApiErrorMessage(error, tAuth),
      });
    }
  };

  const confirmIdCardOtp = async (completedCode = otpCode) => {
    if (!me.data?.phone) {
      toast.danger(t("editSaveError"), {
        description: tAuth("idCardVerificationUnavailable"),
      });
      return;
    }
    if (!/^\d{5}$/.test(completedCode)) {
      toast.danger(t("editSaveError"), {
        description: tAuth("otpInvalid"),
      });
      return;
    }

    try {
      await confirmOtp.mutateAsync({
        phone: me.data.phone,
        code: completedCode,
      });
      await updateMe.mutateAsync({ idCard });
      toast.success(t("editSaved"));
      onOpenChange(false);
    } catch (error) {
      toast.danger(t("editSaveError"), {
        description: getAccountApiErrorMessage(error, tAuth),
      });
    }
  };

  const submit = async () => {
    if (isIdCardField) {
      if (isVerifyingIdCard) {
        await confirmIdCardOtp();
        return;
      }
      await startIdCardVerification();
      return;
    }
    const payload = buildPayload({
      field,
      firstName,
      lastName,
      gender,
      genderDescription,
      activityLevel,
      idCard,
      birthdate,
    });
    if (!payload) {
      toast.danger(t("editSaveError"), {
        description: t("editFieldInvalid"),
      });
      return;
    }
    try {
      await updateMe.mutateAsync(payload);
      toast.success(t("editSaved"));
      onOpenChange(false);
    } catch (error) {
      toast.danger(t("editSaveError"), {
        description: getAccountApiErrorMessage(error, tAuth),
      });
    }
  };

  useSmsOtp({
    enabled:
      isVerifyingIdCard && !isPending && idCardVerificationStage === "verify",
    length: ID_CARD_OTP_LENGTH,
    sessionKey: otpSessionKey,
    onCode: (code) => {
      setOtpCode(code);
      if (!isPending) {
        void confirmIdCardOtp(code);
      }
    },
  });

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      title={title}
      className="max-h-[92dvh]"
      headerAction={
        <Button
          isIconOnly
          variant="ghost"
          aria-label={tCommon("close")}
          className="-mt-2 size-11 min-w-11 text-muted"
          onPress={() => onOpenChange(false)}
        >
          <Icon name="close-x" size={24} />
        </Button>
      }
    >
      <form
        className="flex min-h-full flex-col gap-5 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {field === "name" ? (
          <div className="grid gap-4">
            <TextField
              value={firstName}
              onChange={setFirstName}
              isDisabled={updateMe.isPending}
              validationBehavior="aria"
            >
              <Label>{t("firstName")}</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <Icon name="user" size={18} />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder={t("firstNamePlaceholder")} />
              </InputGroup>
            </TextField>
            <TextField
              value={lastName}
              onChange={setLastName}
              isDisabled={updateMe.isPending}
              validationBehavior="aria"
            >
              <Label>{t("lastName")}</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <Icon name="user" size={18} />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder={t("lastNamePlaceholder")} />
              </InputGroup>
            </TextField>
          </div>
        ) : null}

        {field === "gender" ? (
          <ChoiceState
            isPending={choices.isPending}
            isError={choices.isError}
            onRetry={() => void choices.refetch()}
          >
            <div className="flex gap-2.5">
              {(choices.data?.genders ?? []).map((choice) => (
                <GenderChoice
                  key={choice.value}
                  choice={choice}
                  selected={gender === choice.value}
                  disabled={updateMe.isPending}
                  onSelect={setGender}
                />
              ))}
            </div>
            {gender === "other" ? (
              <TextField className="mt-5" isDisabled={updateMe.isPending}>
                <Label>{t("genderDescriptionLabel")}</Label>
                <InputGroup variant="secondary">
                  <InputGroup.TextArea
                    rows={4}
                    maxLength={300}
                    value={genderDescription}
                    onChange={(event) =>
                      setGenderDescription(event.target.value)
                    }
                    placeholder={t("genderDescriptionPlaceholder")}
                  />
                </InputGroup>
                <div className="mt-1 text-end text-xs text-muted">
                  {genderDescription.length.toLocaleString("fa-IR")} / ۳۰۰
                </div>
              </TextField>
            ) : null}
          </ChoiceState>
        ) : null}

        {field === "activity-level" ? (
          <ChoiceState
            isPending={choices.isPending}
            isError={choices.isError}
            onRetry={() => void choices.refetch()}
          >
            <div className="grid gap-3">
              {(choices.data?.activityLevels ?? []).map((choice) => (
                <ActivityChoice
                  key={choice.value}
                  choice={choice}
                  selected={activityLevel === choice.value}
                  disabled={updateMe.isPending}
                  onSelect={setActivityLevel}
                />
              ))}
            </div>
          </ChoiceState>
        ) : null}

        {field === "id-card" ? (
          idCardVerificationStage === "edit" ? (
            <div className="flex w-full flex-col items-center">
              <AccountAuthOtpHeroSection
                alt={tOtp("illustrationAlt")}
                size={isKeyboardOpen ? "compact" : "default"}
              />
              <AccountAuthOtpCopySection
                title={t("editIdCardTitle")}
                subtitle={t("idCardInfo")}
                cue={false}
              />
              <TextField
                isDisabled={isPending}
                validationBehavior="aria"
                className={otpRequestStyles.root()}
              >
                <Label className="sr-only">{t("editIdCard")}</Label>
                <InputGroup
                  variant="secondary"
                  dir="ltr"
                  className={otpRequestStyles.inputGroup()}
                >
                  <InputGroup.Input
                    className={otpRequestStyles.input()}
                    inputMode="numeric"
                    autoComplete="off"
                    enterKeyHint="done"
                    value={idCard}
                    onChange={(event) =>
                      setIdCard(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    placeholder={t("idCardPlaceholder")}
                  />
                </InputGroup>
              </TextField>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center">
              <AccountAuthOtpHeroSection
                alt={tOtp("illustrationAlt")}
                size={isKeyboardOpen ? "compact" : "default"}
              />
              <AccountAuthOtpCopySection
                title={tOtpConfirm("title")}
                cue={false}
              />
              <div className="mt-1 mb-4 flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
                <span
                  dir="ltr"
                  className="text-sm font-medium tracking-wide text-foreground tabular-nums"
                >
                  {idCard}
                </span>
                <span aria-hidden className="h-3 w-px bg-separator" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto min-h-0 gap-1 px-1 py-0.5 text-accent"
                  isDisabled={isPending}
                  onPress={() => setIdCardVerificationStage("edit")}
                >
                  <Icon name="pencil-1" size={14} />
                  {tOtpConfirm("editPhone")}
                </Button>
              </div>
              <AccountAuthOtpCopySection subtitle={t("idCardOtpHint")} />
              <div className={otpStyles.root()}>
                <div dir="ltr" lang="en" className={otpStyles.otpWrap()}>
                  <OTPInput
                    length={ID_CARD_OTP_LENGTH}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={isPending}
                    className={otpStyles.otp()}
                    slotsClassName={otpStyles.otpGroup()}
                    slotClassName={otpStyles.slot()}
                    autoFocus
                    name="idCardOtp"
                    enterKeyHint="done"
                    aria-label={t("idCardOtpLabel")}
                    onComplete={(code) => void confirmIdCardOtp(code)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isDisabled={resendCooldown > 0 || isPending}
                  data-ready={resendCooldown <= 0 && !isPending}
                  className={otpStyles.resend()}
                  onPress={() => {
                    void resendOtp();
                  }}
                >
                  {resendCooldown > 0 ? (
                    <span className={otpStyles.resendTimer()}>
                      {t("resendIn")}{" "}
                      <NumberFlow
                        value={resendCooldown}
                        trend={-1}
                        className={otpStyles.resendSeconds()}
                      />
                    </span>
                  ) : (
                    t("idCardResend")
                  )}
                </Button>
              </div>
            </div>
          )
        ) : null}

        {field === "birthdate" ? (
          <div className="flex justify-center">
            <Calendar
              aria-label={t("editBirthdate")}
              isDisabled={updateMe.isPending}
              value={birthdate ? parseDate(birthdate) : null}
              onChange={(date) => setBirthdate(date?.toString() ?? "")}
              className="w-full max-w-sm"
            >
              <Calendar.Header>
                <Calendar.NavButton slot="previous" />
                <Calendar.Heading />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </div>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className={cn(
            "mt-2 w-full font-bold",
            isIdCardField && "h-16 rounded-2xl active:scale-[0.98]",
          )}
          isPending={isPending}
          isDisabled={
            isPending ||
            (needsChoices && (choices.isPending || choices.isError))
          }
        >
          {isVerifyingIdCard ? tCommon("confirm") : tCommon("apply")}
          {isIdCardField ? <Icon name="chevron-left" size={18} /> : null}
        </Button>
      </form>
    </BottomSheet>
  );
}

function ChoiceState({
  isPending,
  isError,
  onRetry,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("profile");
  if (isPending) {
    return (
      <div className="grid gap-3" aria-label={t("choicesLoading")}>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-[1.35rem]" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="rounded-[1.35rem] border border-danger/25 bg-danger/8 p-4 text-sm text-danger">
        {t("choicesError")}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-3 w-full"
          onPress={onRetry}
        >
          {t("choicesRetry")}
        </Button>
      </div>
    );
  }
  return children;
}

function GenderChoice({
  choice,
  selected,
  disabled,
  onSelect,
}: {
  choice: AccountProfileChoice<AccountGender>;
  selected: boolean;
  disabled: boolean;
  onSelect: (value: AccountGender) => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      aria-pressed={selected}
      isDisabled={disabled}
      onPress={() => onSelect(choice.value)}
      className={cn(
        "!h-28 min-w-0 flex-1 flex-col gap-2 rounded-[1.35rem] border border-border bg-surface-secondary px-2 text-foreground shadow-sm",
        selected && "!border-accent !bg-accent/8 !text-accent",
      )}
    >
      <Icon name={GENDER_ICONS[choice.value]} size={30} />
      <span className="text-sm font-bold">{choice.label}</span>
    </Button>
  );
}

function ActivityChoice({
  choice,
  selected,
  disabled,
  onSelect,
}: {
  choice: AccountProfileChoice<AccountActivityLevel>;
  selected: boolean;
  disabled: boolean;
  onSelect: (value: AccountActivityLevel) => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      aria-pressed={selected}
      isDisabled={disabled}
      onPress={() => onSelect(choice.value)}
      className={cn(
        "!h-auto min-h-24 w-full justify-start gap-4 rounded-[1.35rem] border border-border bg-surface-secondary px-4 py-4 text-start text-foreground shadow-sm",
        selected && "border-accent bg-accent/8",
      )}
    >
      <Icon
        name={ACTIVITY_ICONS[choice.value]}
        size={32}
        className={cn("shrink-0 text-muted", selected && "text-accent")}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{choice.label}</span>
        {choice.description ? (
          <span className="mt-1 block text-sm font-normal text-muted">
            {choice.description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg border border-border text-transparent",
          selected && "border-accent bg-accent text-accent-foreground",
        )}
      >
        <Icon name="check" size={17} />
      </span>
    </Button>
  );
}

function toDateInputValue(value: string | undefined): string {
  if (!value) return "";
  const isoDate = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : "";
}

function buildPayload(values: {
  field: ProfileEditField;
  firstName: string;
  lastName: string;
  gender: AccountGender | "";
  genderDescription: string;
  activityLevel: AccountActivityLevel | "";
  idCard: string;
  birthdate: string;
}): UpdateAccountMePayload | null {
  if (values.field === "name") {
    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    return firstName.length >= 2 && lastName.length >= 2
      ? { firstName, lastName }
      : null;
  }
  if (values.field === "gender") {
    if (!values.gender) return null;
    const genderDescription = values.genderDescription.trim();
    if (values.gender === "other" && !genderDescription) return null;
    return {
      gender: values.gender,
      ...(values.gender === "other" ? { genderDescription } : {}),
    };
  }
  if (values.field === "activity-level") {
    return values.activityLevel
      ? { activityLevel: values.activityLevel }
      : null;
  }
  if (values.field === "id-card") {
    const idCard = values.idCard.trim();
    return /^\d{10}$/.test(idCard) ? { idCard } : null;
  }
  const birthdate = values.birthdate.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(birthdate) ? { birthdate } : null;
}
