"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  FieldError,
  InputGroup,
  Label,
  Spinner,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConfirmForgotPassword, useForgotPassword } from "@api/admin";
import { OTPInput } from "@repo/ui/otp-input";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { Form, FormFieldset, FormTextField } from "@/components/form";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";

import {
  FORGOT_PASSWORD_OTP_LENGTH,
  createAccountAuthForgotPasswordConfirmFormSchema,
} from "./AccountAuthForgotPasswordConfirmForm.schema";
import { accountAuthForgotPasswordConfirmFormStyles } from "./AccountAuthForgotPasswordConfirmForm.styles";
import type {
  AccountAuthForgotPasswordConfirmFormProps,
  AccountAuthForgotPasswordConfirmFormValues,
} from "./AccountAuthForgotPasswordConfirmForm.types";

const RESEND_COOLDOWN_SECONDS = 60;

export function AccountAuthForgotPasswordConfirmForm({
  phone,
  codeLabel,
  legend,
  passwordLabel,
  passwordPlaceholder,
  passwordConfirmLabel,
  passwordConfirmPlaceholder,
  showPassword,
  hidePassword,
  submitLabel,
  resendLabel,
  resendInPrefix,
  resendInSuffix,
  codeRequired,
  codeInvalid,
  passwordRequired,
  passwordMin,
  passwordMismatch,
  sent,
  onSuccess,
}: AccountAuthForgotPasswordConfirmFormProps) {
  const styles = accountAuthForgotPasswordConfirmFormStyles();
  const t = useTranslations("auth");
  const confirmForgotPassword = useConfirmForgotPassword();
  const forgotPassword = useForgotPassword();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isSucceeded, setIsSucceeded] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);

  const schema = useMemo(
    () =>
      createAccountAuthForgotPasswordConfirmFormSchema({
        codeRequired,
        codeInvalid,
        passwordRequired,
        passwordMin,
        passwordMismatch,
      }),
    [
      codeInvalid,
      codeRequired,
      passwordMin,
      passwordMismatch,
      passwordRequired,
    ],
  );

  const form = useForm<AccountAuthForgotPasswordConfirmFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      password: "",
      passwordConfirm: "",
    },
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

  const onSubmit = async (
    values: AccountAuthForgotPasswordConfirmFormValues,
  ) => {
    if (isSucceeded) {
      return;
    }

    try {
      await confirmForgotPassword.mutateAsync({
        phone,
        code: values.code,
        password: values.password,
      });
      setIsSucceeded(true);
      onSuccess();
    } catch (error) {
      toast.danger(t("resetErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || forgotPassword.isPending || isSucceeded) {
      return;
    }

    try {
      await forgotPassword.mutateAsync({ phone });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      form.setValue("code", "");
      toast.success(sent);
    } catch (error) {
      toast.danger(t("forgotErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const isBusy =
    isSucceeded || confirmForgotPassword.isPending || forgotPassword.isPending;

  return (
    <Form
      form={form}
      className={styles.root()}
      aria-labelledby="account-auth-forgot-confirm-title"
      onSubmit={onSubmit}
    >
      <FormFieldset className={styles.fieldset()}>
        <FormFieldset.Legend className="sr-only">{legend}</FormFieldset.Legend>
        <FormFieldset.Group className={styles.group()}>
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className={styles.otpField()}>
                <Label className="sr-only">{codeLabel}</Label>
                <div dir="ltr" lang="en" className={styles.otpWrap()}>
                  <OTPInput
                    length={FORGOT_PASSWORD_OTP_LENGTH}
                    value={field.value}
                    disabled={isBusy}
                    status={fieldState.invalid ? "error" : "idle"}
                    className={styles.otp()}
                    slotsClassName={styles.otpGroup()}
                    slotClassName={styles.slot()}
                    autoFocus
                    name="code"
                    enterKeyHint="next"
                    aria-label={codeLabel}
                    onBlur={field.onBlur}
                    onChange={(value) => {
                      field.onChange(value);
                      if (fieldState.invalid) {
                        form.clearErrors("code");
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isDisabled={cooldown > 0 || isBusy}
                  className={styles.resend()}
                  onPress={() => {
                    void handleResend();
                  }}
                >
                  {cooldown > 0 ? (
                    <span className={styles.resendTimer()}>
                      {resendInPrefix}{" "}
                      <span className={styles.resendSeconds()}>{cooldown}</span>{" "}
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

          <FormTextField<AccountAuthForgotPasswordConfirmFormValues>
            name="password"
            fullWidth
            isDisabled={isBusy}
            className={styles.field()}
          >
            <Label className={styles.label()}>{passwordLabel}</Label>
            <InputGroup variant="secondary" className={styles.inputGroup()}>
              <InputGroup.Prefix className={styles.prefix()}>
                <Icon name="lock-1" size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input
                className={styles.input()}
                type={passwordVisible ? "text" : "password"}
                autoComplete="new-password"
                enterKeyHint="next"
                placeholder={passwordPlaceholder}
              />
              <InputGroup.Suffix className={styles.suffix()}>
                <Button
                  type="button"
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={passwordVisible ? hidePassword : showPassword}
                  isDisabled={isBusy}
                  onPress={() => setPasswordVisible((value) => !value)}
                >
                  <Icon
                    name={passwordVisible ? "eye-slash" : "eye"}
                    size={18}
                    className="text-muted"
                  />
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </FormTextField>

          <FormTextField<AccountAuthForgotPasswordConfirmFormValues>
            name="passwordConfirm"
            fullWidth
            isDisabled={isBusy}
            className={styles.field()}
          >
            <Label className={styles.label()}>{passwordConfirmLabel}</Label>
            <InputGroup variant="secondary" className={styles.inputGroup()}>
              <InputGroup.Prefix className={styles.prefix()}>
                <Icon name="lock-1" size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input
                className={styles.input()}
                type={passwordConfirmVisible ? "text" : "password"}
                autoComplete="new-password"
                enterKeyHint="done"
                placeholder={passwordConfirmPlaceholder}
              />
              <InputGroup.Suffix className={styles.suffix()}>
                <Button
                  type="button"
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={
                    passwordConfirmVisible ? hidePassword : showPassword
                  }
                  isDisabled={isBusy}
                  onPress={() => setPasswordConfirmVisible((value) => !value)}
                >
                  <Icon
                    name={passwordConfirmVisible ? "eye-slash" : "eye"}
                    size={18}
                    className="text-muted"
                  />
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </FormTextField>
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
            {confirmForgotPassword.isPending ? <Spinner size="sm" /> : null}
            {submitLabel}
            <Icon name="key-1" size={18} />
          </Button>
        </FormFieldset.Actions>
      </FormFieldset>
    </Form>
  );
}
