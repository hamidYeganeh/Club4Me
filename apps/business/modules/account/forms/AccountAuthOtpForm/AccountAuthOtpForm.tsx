"use client";

import { useMemo, useState } from "react";
import {
  Button,
  InputGroup,
  Label,
  ListBox,
  Select,
  Separator,
  Spinner,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequestOtp } from "@api/business";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { Form, FormFieldset, FormTextField } from "@/components/form";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";
import { formatIranianPhoneDisplay, toE164IranianPhone } from "@/lib/phone";

import { createAccountAuthOtpFormSchema } from "./AccountAuthOtpForm.schema";
import { accountAuthOtpFormStyles } from "./AccountAuthOtpForm.styles";
import type {
  AccountAuthOtpFormProps,
  AccountAuthOtpFormValues,
} from "./AccountAuthOtpForm.types";

export function AccountAuthOtpForm({
  phoneLabel,
  phonePlaceholder,
  countryLabel,
  iranLabel,
  continueLabel,
  legend,
  phoneRequired,
  phoneInvalid,
  onSuccess,
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
      country: "IR",
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

  return (
    <Form
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
          >
            <Label className="sr-only">{phoneLabel}</Label>
            <InputGroup
              variant="secondary"
              className={styles.inputGroup()}
              dir="ltr"
            >
              <InputGroup.Prefix className={styles.prefix()}>
                <Controller
                  name="country"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      aria-label={countryLabel}
                      isDisabled={isBusy}
                      value={field.value}
                      onChange={(key) => {
                        if (key === "IR") {
                          field.onChange(key);
                        }
                      }}
                    >
                      <Select.Trigger className={styles.trigger()}>
                        <IranFlag className={styles.flag()} />
                        <Icon name="chevron-down" size={14} className="text-muted" />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="IR" textValue={iranLabel}>
                            <span className="flex items-center gap-2">
                              <IranFlag className="size-4 overflow-hidden rounded-sm" />
                              {iranLabel}
                            </span>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  )}
                />
                <Separator
                  orientation="vertical"
                  className={styles.separator()}
                />
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
            {requestOtp.isPending ? <Spinner size="sm" /> : null}
            {continueLabel}
            <Icon name="arrow-left" size={18} />
          </Button>
        </FormFieldset.Actions>
      </FormFieldset>
    </Form>
  );
}

function IranFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 9 6"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="9" height="2" fill="#239f40" />
      <rect width="9" height="2" y="2" fill="#fff" />
      <rect width="9" height="2" y="4" fill="#da0000" />
    </svg>
  );
}
