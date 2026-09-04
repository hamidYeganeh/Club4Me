"use client";

import { useMemo, useState } from "react";
import { Button, InputGroup, Label, Spinner, toast } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSetPassword } from "@api/account";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";

import { Form, FormFieldset, FormTextField } from "@/components/form";
import { PasswordStrength } from "@/components/password-strength";
import { SmoothInputGroupInput } from "@/components/smooth-input";
import { getAccountApiErrorMessage } from "@/lib/account-api-error";

import { createAccountAuthSetPasswordFormSchema } from "./AccountAuthSetPasswordForm.schema";
import { accountAuthSetPasswordFormStyles } from "./AccountAuthSetPasswordForm.styles";
import type {
  AccountAuthSetPasswordFormProps,
  AccountAuthSetPasswordFormValues,
} from "./AccountAuthSetPasswordForm.types";

export function AccountAuthSetPasswordForm({
  formId,
  legend,
  passwordLabel,
  passwordPlaceholder,
  passwordConfirmLabel,
  passwordConfirmPlaceholder,
  showPassword,
  hidePassword,
  submitLabel,
  passwordRequired,
  passwordMin,
  passwordMismatch,
  strengthLabels,
  onSuccess,
}: AccountAuthSetPasswordFormProps) {
  const styles = accountAuthSetPasswordFormStyles();
  const t = useTranslations("auth");
  const setPassword = useSetPassword();
  const [isSucceeded, setIsSucceeded] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);

  const schema = useMemo(
    () =>
      createAccountAuthSetPasswordFormSchema({
        passwordRequired,
        passwordMin,
        passwordMismatch,
      }),
    [passwordMin, passwordMismatch, passwordRequired],
  );

  const form = useForm<AccountAuthSetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
    mode: "onSubmit",
  });

  const passwordValue = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  });

  const onSubmit = async (values: AccountAuthSetPasswordFormValues) => {
    if (isSucceeded) {
      return;
    }

    try {
      await setPassword.mutateAsync({ password: values.password });
      setIsSucceeded(true);
      onSuccess();
    } catch (error) {
      toast.danger(t("resetErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  };

  const isBusy = isSucceeded || setPassword.isPending;

  return (
    <Form
      id={formId}
      form={form}
      className={styles.root()}
      aria-labelledby="account-auth-set-password-title"
      onSubmit={onSubmit}
    >
      <FormFieldset className={styles.fieldset()}>
        <FormFieldset.Legend className="sr-only">{legend}</FormFieldset.Legend>
        <FormFieldset.Group className={styles.group()}>
          <div className={styles.passwordBlock()}>
            <FormTextField<AccountAuthSetPasswordFormValues>
              name="password"
              fullWidth
              isDisabled={isBusy}
              className={styles.field()}
              variant="secondary"
            >
              <Label className="sr-only">{passwordLabel}</Label>
              <InputGroup
                variant="secondary"
                className={styles.inputGroup()}
                dir="ltr"
              >
                <SmoothInputGroupInput
                  className={styles.input()}
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  autoFocus
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

            <PasswordStrength
              password={passwordValue ?? ""}
              labels={strengthLabels}
              className={styles.strength()}
            />
          </div>

          <FormTextField<AccountAuthSetPasswordFormValues>
            name="passwordConfirm"
            fullWidth
            isDisabled={isBusy}
            className={styles.field()}
            variant="secondary"
          >
            <Label className="sr-only">{passwordConfirmLabel}</Label>
            <InputGroup
              variant="secondary"
              className={styles.inputGroup()}
              dir="ltr"
            >
              <SmoothInputGroupInput
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
                  onPress={() =>
                    setPasswordConfirmVisible((value) => !value)
                  }
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
            {setPassword.isPending ? <Spinner size="sm" /> : null}
            {submitLabel}
            <Icon name="chevron-left" size={18} />
          </Button>
        </FormFieldset.Actions>
      </FormFieldset>
    </Form>
  );
}
