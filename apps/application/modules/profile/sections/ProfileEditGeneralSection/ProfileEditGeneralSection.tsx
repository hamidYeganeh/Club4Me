"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAccountMe, useAccountProfileChoices } from "@api/account";
import {
  Button,
  InputGroup,
  Label,
  Separator,
  Skeleton,
  TextField,
  Typography,
} from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { formatIranianPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { ProfileEditFieldSheet } from "../../components";

import {
  formatProfileBirthdate,
  getProfileFullName,
} from "../../profile.utils";
import type { ProfileEditField } from "../../profile.types";
import { profileEditGeneralSectionStyles } from "./ProfileEditGeneralSection.styles";
import type { ProfileEditFieldRowProps } from "./ProfileEditGeneralSection.types";

export function ProfileEditGeneralSection() {
  const styles = profileEditGeneralSectionStyles();
  const t = useTranslations("profile");
  const me = useAccountMe();
  const choices = useAccountProfileChoices();
  const requested = useSearchParams().get("field");
  const [activeField, setActiveField] = useState<ProfileEditField | null>(
    () => {
      const fields: Record<string, ProfileEditField> = {
        firstName: "name",
        lastName: "name",
        birthdate: "birthdate",
        gender: "gender",
        activityLevel: "activity-level",
        idCard: "id-card",
      };
      return requested ? (fields[requested] ?? null) : null;
    },
  );

  const name = getProfileFullName(me.data);
  const birthdate = formatProfileBirthdate(me.data?.birthdate);
  const gender = choices.data?.genders.find(
    (choice) => choice.value === me.data?.gender,
  )?.label;
  const activityLevel = choices.data?.activityLevels.find(
    (choice) => choice.value === me.data?.activityLevel,
  )?.label;
  const idCard = me.data?.idCard ?? null;
  const phone = me.data?.phone ? formatIranianPhoneDisplay(me.data.phone) : "";

  return (
    <section className={styles.root()} aria-labelledby="profile-edit-general">
      <Typography
        type="h6"
        id="profile-edit-general"
        className={styles.heading()}
      >
        <Icon
          name="shapes-triangle-square-circlce"
          size={18}
          className={styles.headingIcon()}
        />
        {t("editGeneral")}
      </Typography>

      <div className={styles.list()}>
        {me.isPending
          ? Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className={styles.field()}
                aria-busy="true"
                aria-label="در حال بارگذاری اطلاعات پروفایل"
              >
                <Skeleton className="h-3.5 w-24 rounded-lg" />
                <Skeleton className="h-14 w-full rounded-[1.15rem]" />
              </div>
            ))
          : null}

        {!me.isPending ? (
          <>
            <ProfileEditFieldRow
              field="name"
              onPress={() => setActiveField("name")}
              label={t("editName")}
              value={name}
              emptyLabel={t("editEmpty")}
              prefixIcon="user"
            />

            <ProfileEditFieldRow
              field="gender"
              onPress={() => setActiveField("gender")}
              label={t("editGender")}
              value={gender ?? null}
              emptyLabel={t("editSelect")}
              prefixIcon="gender-female"
              suffix={<Icon name="chevron-down" size={16} />}
            />

            <ProfileEditFieldRow
              field="activity-level"
              onPress={() => setActiveField("activity-level")}
              label={t("editActivityLevel")}
              value={activityLevel ?? null}
              emptyLabel={t("editSelect")}
              prefixIcon="person-running"
              suffix={<Icon name="chevron-down" size={16} />}
            />

            <ProfileEditFieldRow
              field="id-card"
              onPress={() => setActiveField("id-card")}
              label={t("editIdCard")}
              value={idCard}
              emptyLabel={t("editEmpty")}
              prefixIcon="identity-card-1"
              suffix={
                <Icon
                  name="question-mark-circle"
                  size={18}
                  aria-hidden
                  title={t("idCardInfo")}
                />
              }
            />

            <ProfileEditFieldRow
              field="birthdate"
              onPress={() => setActiveField("birthdate")}
              label={t("editBirthdate")}
              value={birthdate}
              emptyLabel={t("editEmpty")}
              valueDir="ltr"
              suffix={<Icon name="calendar-1" size={18} />}
            />

            <TextField
              isDisabled
              isReadOnly
              fullWidth
              name="phone"
              value={phone}
              className={styles.field()}
            >
              <Label className={styles.label()}>{t("editPhone")}</Label>
              <InputGroup
                variant="secondary"
                className={styles.phoneGroup()}
                dir="ltr"
              >
                <InputGroup.Prefix className={styles.phonePrefix()}>
                  <span className={styles.phoneTrigger()} aria-hidden>
                    <IranFlag className={styles.flag()} />
                    <Icon
                      name="chevron-down"
                      size={14}
                      className="text-muted"
                    />
                  </span>
                  <Separator
                    orientation="vertical"
                    className={styles.phoneSeparator()}
                  />
                </InputGroup.Prefix>
                <InputGroup.Input className={styles.phoneInput()} />
                <InputGroup.Suffix>
                  <Icon
                    name="question-mark-circle"
                    size={18}
                    className="text-muted"
                    aria-hidden
                    title={t("phoneInfo")}
                  />
                </InputGroup.Suffix>
              </InputGroup>
            </TextField>
          </>
        ) : null}
      </div>

      {activeField ? (
        <ProfileEditFieldSheet
          field={activeField}
          open
          onOpenChange={(open) => {
            if (!open) setActiveField(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ProfileEditFieldRow({
  onPress,
  label,
  value,
  emptyLabel,
  prefixIcon,
  suffix,
  valueDir,
  field,
}: ProfileEditFieldRowProps) {
  const styles = profileEditGeneralSectionStyles();
  const t = useTranslations("profile");
  const display = value?.trim() || emptyLabel;
  const isEmpty = !value?.trim();

  return (
    <div className={styles.field()}>
      <span className={styles.label()} id={`profile-edit-${field}`}>
        {label}
      </span>
      <Button
        variant="secondary"
        fullWidth
        onPress={onPress}
        aria-label={t("editFieldAria", { field: label })}
        className={styles.row()}
      >
        {prefixIcon ? (
          <Icon
            name={prefixIcon}
            size={18}
            className="shrink-0 text-foreground"
          />
        ) : null}
        <span
          dir={valueDir}
          className={cn(styles.value(), isEmpty && styles.empty())}
        >
          {display}
        </span>
        {suffix ? <span className={styles.suffix()}>{suffix}</span> : null}
      </Button>
    </div>
  );
}

function IranFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 9 6" className={className} aria-hidden focusable="false">
      <rect width="9" height="2" fill="#239f40" />
      <rect width="9" height="2" y="2" fill="#fff" />
      <rect width="9" height="2" y="4" fill="#da0000" />
    </svg>
  );
}
