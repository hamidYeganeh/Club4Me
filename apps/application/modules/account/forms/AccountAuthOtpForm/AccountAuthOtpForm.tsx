"use client";

import { useMemo, useState, useEffect } from "react";
import { InputGroup, Label, toast } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequestOtp } from "@api/account";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Form, FormFieldset, FormTextField } from "@/components/form";
import { SmoothInputGroupInput } from "@repo/ui/smooth-input";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";
import { formatIranianPhoneDisplay, toE164IranianPhone } from "@/lib/phone";

import { createAccountAuthOtpFormSchema } from "./AccountAuthOtpForm.schema";
import { accountAuthOtpFormStyles } from "./AccountAuthOtpForm.styles";
import type {
  AccountAuthOtpFormProps,
  AccountAuthOtpFormValues,
} from "./AccountAuthOtpForm.types";

export function AccountAuthOtpForm({
  formId,
  phoneLabel,
  phonePlaceholder,
  legend,
  phoneRequired,
  phoneInvalid,
  onSuccess,
  onSubmitStateChange,
}: AccountAuthOtpFormProps) {
  const styles = accountAuthOtpFormStyles();
  const t = useTranslations("auth");
  const requestOtp = useRequestOtp();
  const [isSucceeded, setIsSucceeded] = useState(false);

  const schema = useMemo(
    () => createAccountAuthOtpFormSchema({ phoneRequired, phoneInvalid }),
    [phoneInvalid, phoneRequired],
  );

  const form = useForm<AccountAuthOtpFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: AccountAuthOtpFormValues) => {
    if (isSucceeded) {
      return;
    }

    const phone = toE164IranianPhone(values.phone);

    try {
      await requestOtp.mutateAsync({ phone });
      setIsSucceeded(true);
      onSuccess(phone);
    } catch (error) {
      toast.danger(t("errorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const isBusy = isSucceeded || requestOtp.isPending;

  useEffect(() => {
    onSubmitStateChange?.({
      isBusy,
      isPending: requestOtp.isPending,
    });
  }, [isBusy, requestOtp.isPending, onSubmitStateChange]);

  return (
    <Form
      id={formId}
      form={form}
      className={styles.root()}
      aria-labelledby="account-auth-otp-title"
      onSubmit={onSubmit}
    >
      <FormFieldset className={styles.fieldset()}>
        <FormFieldset.Legend className="sr-only">{legend}</FormFieldset.Legend>
        <FormFieldset.Group className={styles.group()}>
          <FormTextField<AccountAuthOtpFormValues>
            name="phone"
            fullWidth
            isDisabled={isBusy}
            className={styles.field()}
            transform={formatIranianPhoneDisplay}
            variant="secondary"
          >
            <Label className="sr-only">{phoneLabel}</Label>
            <InputGroup
              variant="secondary"
              className={styles.inputGroup()}
              dir="ltr"
            >
              <SmoothInputGroupInput
                className={styles.input()}
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="done"
                placeholder={phonePlaceholder}
              />
            </InputGroup>
          </FormTextField>
        </FormFieldset.Group>
      </FormFieldset>
    </Form>
  );
}
