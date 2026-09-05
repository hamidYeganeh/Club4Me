"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  Chip,
  Form,
  InputGroup,
  Label,
  Spinner,
  TextField,
  Typography,
  toast,
} from "@heroui/react";
import {
  useMyRoleRequests,
  useRequestRole,
  type RequestableRole,
} from "@api/account";
import { trackOnboardingCompleted } from "@api";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { getAccountApiErrorMessage } from "@/lib/account-api-error";
import { accountAuthRolesOptionsSectionStyles } from "./AccountAuthRolesOptionsSection.styles";
import type {
  AccountAuthRoleOption,
  AccountAuthRolesOptionsSectionProps,
} from "./AccountAuthRolesOptionsSection.types";

const statusLabels = {
  pending: "در حال بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
} as const;

export function AccountAuthRolesOptionsSection({
  athleteLabel,
  coachLabel,
  ownerLabel,
  grantedRoles,
  isFirstTime,
  onSelectRole,
}: AccountAuthRolesOptionsSectionProps) {
  const styles = accountAuthRolesOptionsSectionStyles();
  const t = useTranslations("auth");
  const tRoles = useTranslations("auth.roles");
  const requestRole = useRequestRole();
  const requests = useMyRoleRequests();
  const [formRole, setFormRole] = useState<RequestableRole | null>(null);
  const options: AccountAuthRoleOption[] = [
    { id: "athlete", label: athleteLabel, icon: "weight", tone: "athlete" },
    { id: "coach", label: coachLabel, icon: "whistle", tone: "coach" },
    { id: "owner", label: ownerLabel, icon: "building-2", tone: "owner" },
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRole || requestRole.isPending) return;
    const data = new FormData(event.currentTarget);
    try {
      await requestRole.mutateAsync({
        role: formRole,
        payload: {
          details: {
            displayName: String(data.get("displayName") ?? "").trim(),
            city: String(data.get("city") ?? "").trim(),
            description: String(data.get("description") ?? "").trim(),
            ...(formRole === "coach"
              ? {
                  experienceYears: Number(data.get("experienceYears")),
                  specialty: String(data.get("specialty") ?? "").trim(),
                  credentials:
                    String(data.get("credentials") ?? "").trim() || undefined,
                }
              : {
                  businessName: String(data.get("businessName") ?? "").trim(),
                  businessType: String(data.get("businessType") ?? "").trim(),
                }),
          },
        },
      });
      trackOnboardingCompleted({ selected_role: formRole });
      toast.success(tRoles("requestSentTitle"), {
        description: tRoles("requestSentBody"),
      });
      setFormRole(null);
    } catch (error) {
      toast.danger(t("requestErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  }

  return (
    <section
      className={styles.root()}
      aria-labelledby="account-auth-roles-title"
    >
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const granted = grantedRoles.includes(option.id);
          const latest =
            option.id === "athlete"
              ? undefined
              : requests.data?.items.find((item) => item.role === option.id);
          const pending = latest?.status === "pending";
          return (
            <Button
              key={option.id}
              variant={formRole === option.id ? "secondary" : "tertiary"}
              fullWidth
              isDisabled={
                !granted && (pending || latest?.status === "approved")
              }
              className={styles.item()}
              onPress={() => {
                if (granted) {
                  if (isFirstTime)
                    trackOnboardingCompleted({ selected_role: option.id });
                  onSelectRole(option.id);
                } else if (option.id !== "athlete") {
                  const requestableRole = option.id;
                  setFormRole((current) =>
                    current === requestableRole ? null : requestableRole,
                  );
                }
              }}
            >
              <span className={styles.icon({ tone: option.tone })}>
                <Icon name={option.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className={styles.label()}>{option.label}</span>
                <span className="text-xs text-muted">
                  {granted
                    ? "نقش فعال"
                    : pending
                      ? "درخواست ثبت شده"
                      : latest?.status === "rejected"
                        ? "امکان درخواست دوباره"
                        : "درخواست این نقش"}
                </span>
              </span>
              {granted ? (
                <Chip size="sm" color="success">
                  فعال
                </Chip>
              ) : latest ? (
                <Chip
                  size="sm"
                  color={
                    latest.status === "rejected"
                      ? "danger"
                      : latest.status === "approved"
                        ? "success"
                        : "warning"
                  }
                >
                  {statusLabels[latest.status]}
                </Chip>
              ) : (
                <Icon
                  name="chevron-left"
                  size={18}
                  className={styles.chevron()}
                />
              )}
            </Button>
          );
        })}
      </div>
      {requests.isPending ? (
        <div className="flex justify-center py-2">
          <Spinner size="sm" />
        </div>
      ) : null}
      {formRole ? (
        <RoleRequestForm
          role={formRole}
          pending={requestRole.isPending}
          onSubmit={submit}
          onCancel={() => setFormRole(null)}
        />
      ) : null}
    </section>
  );
}

function RoleRequestForm({
  role,
  pending,
  onSubmit,
  onCancel,
}: {
  role: RequestableRole;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const input = "border border-border bg-surface-secondary";
  return (
    <div className="app-reveal rounded-[1.75rem] border border-border bg-surface p-5 shadow-sm">
      <Typography type="h4" weight="bold">
        درخواست نقش {role === "coach" ? "مربی" : "مالک مجموعه"}
      </Typography>
      <p className="mt-1 text-sm leading-6 text-muted">
        این اطلاعات برای بررسی درخواست در اختیار مدیر قرار می‌گیرد.
      </p>
      <Form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        <RoleField
          name="displayName"
          label="نام و نام خانوادگی"
          className={input}
          minLength={2}
          maxLength={100}
        />
        <RoleField
          name="city"
          label="شهر محل فعالیت"
          className={input}
          minLength={2}
          maxLength={100}
        />
        {role === "coach" ? (
          <>
            <RoleField
              name="specialty"
              label="رشته یا تخصص ورزشی"
              className={input}
              minLength={2}
              maxLength={200}
            />
            <RoleField
              name="experienceYears"
              label="سابقه مربیگری (سال)"
              className={input}
              type="number"
              min={0}
              max={80}
            />
            <RoleField
              name="credentials"
              label="مدارک و گواهی‌ها (اختیاری)"
              className={input}
              maxLength={500}
              multiline
              optional
            />
          </>
        ) : (
          <>
            <RoleField
              name="businessName"
              label="نام باشگاه یا مجموعه"
              className={input}
              minLength={2}
              maxLength={150}
            />
            <RoleField
              name="businessType"
              label="نوع مجموعه (باشگاه، استودیو و...)"
              className={input}
              minLength={2}
              maxLength={100}
            />
          </>
        )}
        <RoleField
          name="description"
          label={
            role === "coach"
              ? "درباره سابقه و شیوه مربیگری"
              : "درباره مجموعه و برنامه فعالیت"
          }
          className={input}
          minLength={20}
          maxLength={1000}
          multiline
        />
        <div className="flex gap-2 pt-1">
          <Button type="submit" variant="primary" fullWidth isPending={pending}>
            ارسال درخواست
          </Button>
          <Button
            type="button"
            variant="secondary"
            isDisabled={pending}
            onPress={onCancel}
          >
            انصراف
          </Button>
        </div>
      </Form>
    </div>
  );
}

function RoleField({
  label,
  multiline,
  optional,
  className,
  min,
  max,
  ...props
}: React.ComponentProps<typeof TextField> & {
  label: string;
  multiline?: boolean;
  optional?: boolean;
  className?: string;
  min?: number;
  max?: number;
}) {
  return (
    <TextField {...props} isRequired={!optional}>
      <Label>{label}</Label>
      <InputGroup variant="secondary" className={className}>
        {multiline ? (
          <InputGroup.TextArea rows={3} />
        ) : (
          <InputGroup.Input min={min} max={max} />
        )}
      </InputGroup>
    </TextField>
  );
}
