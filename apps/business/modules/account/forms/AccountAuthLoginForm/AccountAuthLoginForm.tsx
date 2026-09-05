"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  InputGroup,
  Label,
  Spinner,
  toast,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@api/business";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { Form, FormFieldset, FormTextField } from "@/components/form";
import { SmoothInputGroupInput } from "@repo/ui/smooth-input";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";
import { formatIranianPhoneDisplay, toE164IranianPhone } from "@/lib/phone";

import { createAccountAuthLoginFormSchema } from "./AccountAuthLoginForm.schema";
import { accountAuthLoginFormStyles } from "./AccountAuthLoginForm.styles";
import type {
  AccountAuthLoginFormProps,
  AccountAuthLoginFormValues,
} from "./AccountAuthLoginForm.types";

export function AccountAuthLoginForm({
  phoneLabel,
  phonePlaceholder,
  passwordLabel,
  passwordPlaceholder,
  showPassword,
  hidePassword,
  rememberLabel,
  forgotLabel,
  submitLabel,
  legend,
  phoneRequired,
  phoneInvalid,
  passwordRequired,
  passwordMin,
  onSuccess,
}: AccountAuthLoginFormProps) {
  const styles = accountAuthLoginFormStyles();
  const router = useRouter();
  const t = useTranslations("auth");
  const login = useLogin();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSucceeded, setIsSucceeded] = useState(false);

  const schema = useMemo(
    () =>
      createAccountAuthLoginFormSchema({
        phoneRequired,
        phoneInvalid,
        passwordRequired,
        passwordMin,
      }),
    [passwordMin, passwordRequired, phoneInvalid, phoneRequired],
  );

  const form = useForm<AccountAuthLoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
      password: "",
      remember: true,
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: AccountAuthLoginFormValues) => {
    if (isSucceeded) {
      return;
    }

    try {
      await login.mutateAsync({
        phone: toE164IranianPhone(values.phone),
        password: values.password,
        remember: values.remember,
      });
      setIsSucceeded(true);
      onSuccess();
    } catch (error) {
      toast.danger(t("loginErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const isBusy = isSucceeded || login.isPending;

  return (
    <Form
      form={form}
      className={styles.root()}
      aria-labelledby="account-auth-login-title"
      onSubmit={onSubmit}
    >
      <FormFieldset className={styles.fieldset()}>
        <FormFieldset.Legend className="sr-only">{legend}</FormFieldset.Legend>
        <FormFieldset.Group className={styles.group()}>
          <FormTextField<AccountAuthLoginFormValues>
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
                <Icon name="telephone-1" size={18} />
              </InputGroup.Prefix>
              <SmoothInputGroupInput
                className={styles.input()}
                inputMode="tel"
                autoComplete="tel"
                enterKeyHint="next"
                placeholder={phonePlaceholder}
              />
            </InputGroup>
          </FormTextField>

          <FormTextField<AccountAuthLoginFormValues>
            name="password"
            fullWidth
            isDisabled={isBusy}
            className={styles.field()}
          >
            <Label className={styles.label()}>{passwordLabel}</Label>
            <InputGroup
              variant="secondary"
              className={styles.inputGroup()}
              dir="ltr"
            >
              <InputGroup.Prefix className={styles.prefix()}>
                <Icon name="lock-1" size={18} />
              </InputGroup.Prefix>
              <SmoothInputGroupInput
                className={styles.input()}
                type={passwordVisible ? "text" : "password"}
                autoComplete="current-password"
                enterKeyHint="done"
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

          <div className={styles.meta()}>
            <Controller
              name="remember"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  isDisabled={isBusy}
                  isSelected={field.value}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                >
                  <Checkbox.Content className={styles.remember()}>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    {rememberLabel}
                  </Checkbox.Content>
                </Checkbox>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={styles.forgot()}
              onPress={() => router.push("/auth/forgot-password")}
            >
              {forgotLabel}
            </Button>
          </div>
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
            {login.isPending ? <Spinner size="sm" /> : null}
            {submitLabel}
            <Icon name="arrow-left" size={18} />
          </Button>
        </FormFieldset.Actions>
      </FormFieldset>
    </Form>
  );
}
