"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  FieldError,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  Spinner,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConfirmOtp, useRequestOtp } from "@api/account";
import NumberFlow from "@number-flow/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { Form, FormFieldset } from "@/components/form";
import { useSmsOtp } from "@/hooks/use-sms-otp";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";

import {
  OTP_CODE_LENGTH,
  createAccountAuthOtpConfirmFormSchema,
} from "./AccountAuthOtpConfirmForm.schema";
import { accountAuthOtpConfirmFormStyles } from "./AccountAuthOtpConfirmForm.styles";
import type {
  AccountAuthOtpConfirmFormProps,
  AccountAuthOtpConfirmFormValues,
} from "./AccountAuthOtpConfirmForm.types";

const RESEND_COOLDOWN_SECONDS = 60;

export function AccountAuthOtpConfirmForm({
  formId,
  phone,
  resendLabel,
  resendInPrefix,
  resendInSuffix,
  continueLabel,
  codeLabel,
  legend,
  codeRequired,
  codeInvalid,
  sent,
  onSuccess,
}: AccountAuthOtpConfirmFormProps) {
  const styles = accountAuthOtpConfirmFormStyles();
  const t = useTranslations("auth");
  const confirmOtp = useConfirmOtp();
  const requestOtp = useRequestOtp();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isSucceeded, setIsSucceeded] = useState(false);
  const [otpSessionKey, setOtpSessionKey] = useState(0);

  const schema = useMemo(
    () => createAccountAuthOtpConfirmFormSchema({ codeRequired, codeInvalid }),
    [codeInvalid, codeRequired],
  );

  const form = useForm<AccountAuthOtpConfirmFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = async (values: AccountAuthOtpConfirmFormValues) => {
    if (isSucceeded) {
      return;
    }

    try {
      const session = await confirmOtp.mutateAsync({
        phone,
        code: values.code,
      });
      setIsSucceeded(true);
      onSuccess(session.user);
    } catch (error) {
      toast.danger(t("confirmErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || requestOtp.isPending || isSucceeded) {
      return;
    }

    try {
      await requestOtp.mutateAsync({ phone });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpSessionKey((value) => value + 1);
      form.setValue("code", "");
      toast.success(sent);
    } catch (error) {
      toast.danger(t("errorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const isBusy = isSucceeded || confirmOtp.isPending || requestOtp.isPending;

  useSmsOtp({
    enabled: !isBusy,
    length: OTP_CODE_LENGTH,
    sessionKey: otpSessionKey,
    onCode: (code) => {
      form.setValue("code", code, { shouldValidate: true, shouldDirty: true });
      void form.handleSubmit(onSubmit)();
    },
  });

  return (
    <Form
      id={formId}
      form={form}
      className={styles.root()}
      aria-labelledby="account-auth-otp-confirm-title"
      onSubmit={onSubmit}
    >
      <FormFieldset className={styles.fieldset()}>
        <FormFieldset.Legend className="sr-only">{legend}</FormFieldset.Legend>
        <FormFieldset.Group className={styles.group()}>
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className={styles.field()}>
                <Label className="sr-only">{codeLabel}</Label>
                <div dir="ltr" lang="en" className={styles.otpWrap()}>
                  <InputOTP
                    maxLength={OTP_CODE_LENGTH}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={field.value}
                    isDisabled={isBusy}
                    isInvalid={fieldState.invalid}
                    variant="secondary"
                    className={styles.otp()}
                    dir="ltr"
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    name="code"
                    enterKeyHint="done"
                    style={{ direction: "ltr" }}
                    pasteTransformer={(text) => text.replace(/\D/g, "")}
                    onBlur={field.onBlur}
                    onComplete={(code) => {
                      field.onChange(code);
                      if (!isBusy) {
                        void form.handleSubmit(onSubmit)();
                      }
                    }}
                    onChange={(value) => {
                      field.onChange(value);
                      if (fieldState.invalid) {
                        form.clearErrors("code");
                      }
                    }}
                  >
                    <InputOTP.Group
                      className={styles.otpGroup()}
                      dir="ltr"
                      style={{ direction: "ltr" }}
                    >
                      {Array.from({ length: OTP_CODE_LENGTH }, (_, index) => (
                        <InputOTP.Slot
                          key={index}
                          index={index}
                          className={styles.slot()}
                        />
                      ))}
                    </InputOTP.Group>
                  </InputOTP>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isDisabled={cooldown > 0 || isBusy}
                  data-ready={cooldown <= 0 && !isBusy}
                  className={styles.resend()}
                  onPress={() => {
                    void handleResend();
                  }}
                >
                  {cooldown > 0 ? (
                    <span className={styles.resendTimer()}>
                      {resendInPrefix}{" "}
                      <NumberFlow
                        value={cooldown}
                        trend={-1}
                        className={styles.resendSeconds()}
                      />{" "}
                      {resendInSuffix}
                    </span>
                  ) : (
                    resendLabel
                  )}
                </Button>
                <div className={styles.error()} role="alert">
                  {fieldState.error?.message ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </div>
              </div>
            )}
          />
        </FormFieldset.Group>
        <FormFieldset.Actions className={styles.actions()}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isDisabled={isBusy}
            className={styles.button()}
          >
            {confirmOtp.isPending ? <Spinner size="sm" /> : null}
            {continueLabel}
            <Icon name="chevron-left" size={18} />
          </Button>
        </FormFieldset.Actions>
      </FormFieldset>
    </Form>
  );
}
