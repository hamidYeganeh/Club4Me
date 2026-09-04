"use client";

import Link from "next/link";
import { useAccountMe } from "@api/account";
import { InputGroup, Label, Separator, TextField, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { formatIranianPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/cn";

import {
  formatProfileBirthdate,
  getProfileEditHref,
  getProfileFullName,
} from "../../profile.utils";
import { profileEditGeneralSectionStyles } from "./ProfileEditGeneralSection.styles";
import type {
  ProfileEditFieldRowProps,
  ProfileEditGeneralSectionProps,
} from "./ProfileEditGeneralSection.types";

export function ProfileEditGeneralSection({
  role,
}: ProfileEditGeneralSectionProps) {
  const styles = profileEditGeneralSectionStyles();
  const t = useTranslations("profile");
  const me = useAccountMe();

  const name = getProfileFullName(me.data);
  const birthdate = formatProfileBirthdate(me.data?.birthdate);
  const gender =
    me.data?.gender === "female"
      ? t("genderFemale")
      : me.data?.gender === "male"
        ? t("genderMale")
        : null;
  const idCard = me.data?.idCard ?? null;
  const phone = me.data?.phone
    ? formatIranianPhoneDisplay(me.data.phone)
    : "";

  return (
    <section className={styles.root()} aria-labelledby="profile-edit-general">
      <Typography type="h6" id="profile-edit-general" className={styles.heading()}>
        <Icon
          name="shapes-triangle-square-circlce"
          size={18}
          className={styles.headingIcon()}
        />
        {t("editGeneral")}
      </Typography>

      <div className={styles.list()}>
        <ProfileEditFieldRow
          field="name"
          href={getProfileEditHref(role, "name")}
          label={t("editName")}
          value={name}
          emptyLabel={t("editEmpty")}
          prefixIcon="user"
        />

        <ProfileEditFieldRow
          field="gender"
          href={getProfileEditHref(role, "gender")}
          label={t("editGender")}
          value={gender}
          emptyLabel={t("editSelect")}
          prefixIcon="gender-female"
          suffix={<Icon name="chevron-down" size={16} />}
        />

        <ProfileEditFieldRow
          field="id-card"
          href={getProfileEditHref(role, "id-card")}
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
          href={getProfileEditHref(role, "birthdate")}
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
                <Icon name="chevron-down" size={14} className="text-muted" />
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
      </div>
    </section>
  );
}

function ProfileEditFieldRow({
  href,
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
      <Link
        href={href}
        scroll={false}
        aria-label={t("editFieldAria", { field: label })}
        className={styles.row()}
      >
        {prefixIcon ? (
          <Icon name={prefixIcon} size={18} className="shrink-0 text-foreground" />
        ) : null}
        <span
          dir={valueDir}
          className={cn(styles.value(), isEmpty && styles.empty())}
        >
          {display}
        </span>
        {suffix ? <span className={styles.suffix()}>{suffix}</span> : null}
      </Link>
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
