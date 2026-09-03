"use client";

import { useMemo, useState } from "react";
import { Button, InputGroup, Label, Spinner, toast } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "@api/admin";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Form, FormFieldset, FormTextField } from "@/components/form";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";
import { formatIranianPhoneDisplay, toE164IranianPhone } from "@/lib/phone";

import { createAccountAuthForgotPasswordFormSchema } from "./AccountAuthForgotPasswordForm.schema";
import { accountAuthForgotPasswordFormStyles } from "./AccountAuthForgotPasswordForm.styles";
import type {
  AccountAuthForgotPasswordFormProps,
  AccountAuthForgotPasswordFormValues,
} from "./AccountAuthForgotPasswordForm.types";

export function AccountAuthForgotPasswordForm({
  phoneLabel,
  phonePlaceholder,
  submitLabel,
  legend,
  phoneRequired,
  phoneInvalid,
  onSuccess,
}: AccountAuthForgotPasswordFormProps) {
  const styles = accountAuthForgotPasswordFormStyles();
  const t = useTranslations("auth");
  const forgotPassword = useForgotPassword();
  const [isSucceeded, setIsSucceeded] = useState(false);

  const schema = useMemo(
    () =>
      createAccountAuthForgotPasswordFormSchema({
        phoneRequired,
        phoneInvalid,
      }),
    [phoneInvalid, phoneRequired],
  );

  const form = useForm<AccountAuthForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values: AccountAuthForgotPasswordFormValues) => {
    if (isSucceeded) {
      return;
    }

    const phone = toE164IranianPhone(values.phone);

    try {
      await forgotPassword.mutateAsync({ phone });
      setIsSucceeded(true);
      onSuccess(phone);
    } catch (error) {
      toast.danger(t("forgotErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const isBusy = isSucceeded || forgotPassword.isPending;

  return (
    <Form
      form={form}
      className={styles.root()}
      aria-labelledby="account-auth-forgot-title"
      onSubmit={onSubmit}
    >
      <FormFieldset className={styles.fieldset()}>
        <FormFieldset.Legend className="sr-only">{legend}</FormFieldset.Legend>
        <FormFieldset.Group className={styles.group()}>
          <FormTextField<AccountAuthForgotPasswordFormValues>
            name="phone"
            fullWidth
            isDisabled={isBusy}
            className={styles.field()}
            transform={formatIranianPhoneDisplay}
          >
            <Label className={styles.label()}>{phoneLabel}</Label>
            <InputGroup
              variant="secondary"
              className={styles.inputGroup()}
              dir="ltr"
            >
              <InputGroup.Prefix className={styles.prefix()}>
                <Icon name="mobile" size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input
                className={styles.input()}
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="done"
                placeholder={phonePlaceholder}
              />
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
            {forgotPassword.isPending ? <Spinner size="sm" /> : null}
            {submitLabel}
            <Icon name="key-1" size={18} />
          </Button>
        </FormFieldset.Actions>
      </FormFieldset>
    </Form>
  );
}
