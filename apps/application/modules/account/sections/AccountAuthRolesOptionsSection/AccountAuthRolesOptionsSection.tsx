"use client";

import Image from "next/image";
import type { FormEvent } from "react";
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
  requestRole: formRole,
  onRequestRoleChange,
  onSelectRole,
}: AccountAuthRolesOptionsSectionProps) {
  const styles = accountAuthRolesOptionsSectionStyles();
  const t = useTranslations("auth");
  const tRoles = useTranslations("auth.roles");
  const requestRole = useRequestRole();
  const requests = useMyRoleRequests();
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
      onRequestRoleChange(null);
    } catch (error) {
      toast.danger(t("requestErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    }
  }

  if (formRole) {
    return (
      <section
        className={styles.formRoot()}
        aria-labelledby="role-request-title"
      >
        <RoleRequestForm
          role={formRole}
          pending={requestRole.isPending}
          onSubmit={submit}
        />
      </section>
    );
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
                  onRequestRoleChange(requestableRole);
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
    </section>
  );
}

function RoleRequestForm({
  role,
  pending,
  onSubmit,
}: {
  role: RequestableRole;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const styles = accountAuthRolesOptionsSectionStyles();
  const isCoach = role === "coach";
  return (
    <>
      <div className={styles.hero()}>
        <Image
          src="/role-request-upload.png"
          alt="ارسال اطلاعات برای بررسی درخواست نقش"
          width={768}
          height={416}
          priority
          className={styles.heroImage()}
        />
        <Typography
          type="h2"
          weight="bold"
          id="role-request-title"
          className={styles.heroTitle()}
        >
          {isCoach ? "درخواست مربیگری" : "درخواست مدیریت مجموعه"}
        </Typography>
        <Typography
          type="body-sm"
          color="muted"
          className={styles.heroDescription()}
        >
          اطلاعات واقعی فعالیت خود را وارد کنید تا درخواست شما سریع‌تر بررسی
          شود.
        </Typography>
      </div>
      <Form onSubmit={onSubmit} className={styles.form()}>
        <RoleField
          name="displayName"
          label="نام و نام خانوادگی"
          placeholder="نام کامل خود را وارد کنید"
          icon="user"
          className={styles.field()}
          minLength={2}
          maxLength={100}
        />
        <RoleField
          name="city"
          label="شهر محل فعالیت"
          placeholder="مثلاً تهران"
          icon="pin-1"
          className={styles.field()}
          minLength={2}
          maxLength={100}
        />
        {isCoach ? (
          <>
            <RoleField
              name="specialty"
              label="رشته یا تخصص ورزشی"
              placeholder="مثلاً بدنسازی و تناسب اندام"
              icon="weight"
              className={styles.field()}
              minLength={2}
              maxLength={200}
            />
            <RoleField
              name="experienceYears"
              label="سابقه مربیگری (سال)"
              placeholder="مثلاً ۵"
              icon="calendar-1"
              className={styles.field()}
              type="number"
              min={0}
              max={80}
            />
            <RoleField
              name="credentials"
              label="مدارک و گواهی‌ها (اختیاری)"
              placeholder="مدارک تخصصی یا گواهی‌های معتبر"
              className={styles.field()}
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
              placeholder="نام رسمی مجموعه"
              icon="building-2"
              className={styles.field()}
              minLength={2}
              maxLength={150}
            />
            <RoleField
              name="businessType"
              label="نوع مجموعه (باشگاه، استودیو و...)"
              placeholder="مثلاً باشگاه بدنسازی"
              icon="building-1"
              className={styles.field()}
              minLength={2}
              maxLength={100}
            />
          </>
        )}
        <RoleField
          name="description"
          label={
            isCoach
              ? "درباره سابقه و شیوه مربیگری"
              : "درباره مجموعه و برنامه فعالیت"
          }
          placeholder={
            isCoach
              ? "خلاصه‌ای از تجربه، تخصص و شیوه کار خود بنویسید"
              : "خلاصه‌ای از خدمات، امکانات و برنامه فعالیت مجموعه بنویسید"
          }
          className={styles.field()}
          minLength={20}
          maxLength={1000}
          multiline
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isPending={pending}
          className={styles.submit()}
        >
          {!pending ? <Icon name="paper-plane-diagonal" size={20} /> : null}
          {pending ? "در حال ارسال..." : "ارسال درخواست"}
        </Button>
      </Form>
    </>
  );
}

function RoleField({
  label,
  multiline,
  optional,
  className,
  min,
  max,
  icon,
  placeholder,
  ...props
}: React.ComponentProps<typeof TextField> & {
  label: string;
  multiline?: boolean;
  optional?: boolean;
  className?: string;
  min?: number;
  max?: number;
  icon?: React.ComponentProps<typeof Icon>["name"];
  placeholder?: string;
}) {
  return (
    <TextField {...props} isRequired={!optional}>
      <Label>{label}</Label>
      <InputGroup variant="secondary" className={className}>
        {icon ? (
          <InputGroup.Prefix className="text-muted">
            <Icon name={icon} size={20} />
          </InputGroup.Prefix>
        ) : null}
        {multiline ? (
          <InputGroup.TextArea rows={3} placeholder={placeholder} />
        ) : (
          <InputGroup.Input min={min} max={max} placeholder={placeholder} />
        )}
      </InputGroup>
    </TextField>
  );
}
