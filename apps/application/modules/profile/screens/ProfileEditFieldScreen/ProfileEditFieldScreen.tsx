"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  InputGroup,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import {
  useAccountMe,
  useUpdateAccountMe,
  type UpdateAccountMePayload,
} from "@api/account";
import { Icon } from "@theme/icon";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { getAccountApiErrorMessage } from "@/lib/account-api-error";
import { FormPageSkeleton } from "@/components/loading-skeletons";

import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";

import { getProfileEditFieldLabelKey } from "../../profile.utils";
import type { ProfileEditFieldScreenProps } from "./ProfileEditFieldScreen.types";

export function ProfileEditFieldScreen({
  role,
  field,
}: ProfileEditFieldScreenProps) {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const me = useAccountMe();
  const updateMe = useUpdateAccountMe();
  const label = t(getProfileEditFieldLabelKey(field));

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "">("");
  const [idCard, setIdCard] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!me.data || isInitialized) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setFirstName(me.data?.firstName ?? "");
      setLastName(me.data?.lastName ?? "");
      setGender(me.data?.gender ?? "");
      setIdCard(me.data?.idCard ?? "");
      setBirthdate(toDateInputValue(me.data?.birthdate));
      setIsInitialized(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isInitialized, me.data]);

  const isBusy = me.isLoading || updateMe.isPending;

  const hint = useMemo(() => {
    switch (field) {
      case "name":
        return t("editNameHint");
      case "gender":
        return t("editGenderHint");
      case "id-card":
        return t("idCardInfo");
      case "birthdate":
        return t("editBirthdateHint");
    }
  }, [field, t]);

  const onSubmit = async () => {
    const payload = buildPayload({
      field,
      firstName,
      lastName,
      gender,
      idCard,
      birthdate,
    });

    if (!payload) {
      toast.danger(t("editSaveError"), {
        description: t("editFieldInvalid"),
      });
      return;
    }

    try {
      await updateMe.mutateAsync(payload);
      toast.success(t("editSaved"));
      router.push(`/${role}/profile/edit`);
    } catch (error) {
      toast.danger(t("editSaveError"), {
        description: getAccountApiErrorMessage(error, tAuth),
      });
    }
  };

  if (me.isLoading || (!me.isError && !isInitialized)) {
    return <FormPageSkeleton fields={field === "name" ? 2 : 1} />;
  }

  return (
    <main className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden bg-transparent px-5">
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href={`/${role}/profile/edit`}
      />

      <section className="app-reveal mx-auto flex w-full max-w-md flex-1 flex-col gap-5 pt-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">{label}</h1>
          <p className="text-sm text-muted">{hint}</p>
        </header>

        {field === "name" ? (
          <div className="grid grid-cols-1 gap-4">
            <TextField
              name="firstName"
              value={firstName}
              onChange={setFirstName}
              isDisabled={isBusy}
              validationBehavior="aria"
            >
              <Label>{t("firstName")}</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <Icon name="user" size={18} />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder={t("firstNamePlaceholder")} />
              </InputGroup>
            </TextField>
            <TextField
              name="lastName"
              value={lastName}
              onChange={setLastName}
              isDisabled={isBusy}
              validationBehavior="aria"
            >
              <Label>{t("lastName")}</Label>
              <InputGroup variant="secondary">
                <InputGroup.Prefix>
                  <Icon name="user" size={18} />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder={t("lastNamePlaceholder")} />
              </InputGroup>
            </TextField>
          </div>
        ) : null}

        {field === "gender" ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={gender === "female" ? "primary" : "secondary"}
              size="lg"
              isDisabled={isBusy}
              onPress={() => setGender("female")}
            >
              {t("genderFemale")}
            </Button>
            <Button
              variant={gender === "male" ? "primary" : "secondary"}
              size="lg"
              isDisabled={isBusy}
              onPress={() => setGender("male")}
            >
              {t("genderMale")}
            </Button>
          </div>
        ) : null}

        {field === "id-card" ? (
          <TextField
            name="idCard"
            value={idCard}
            onChange={(value) =>
              setIdCard(value.replace(/\D/g, "").slice(0, 10))
            }
            isDisabled={isBusy}
            validationBehavior="aria"
          >
            <Label>{t("editIdCard")}</Label>
            <InputGroup variant="secondary" dir="ltr">
              <InputGroup.Prefix>
                <Icon name="identity-card-1" size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input
                inputMode="numeric"
                autoComplete="off"
                placeholder={t("idCardPlaceholder")}
              />
            </InputGroup>
          </TextField>
        ) : null}

        {field === "birthdate" ? (
          <TextField
            name="birthdate"
            value={birthdate}
            onChange={setBirthdate}
            isDisabled={isBusy}
            validationBehavior="aria"
          >
            <Label>{t("editBirthdate")}</Label>
            <InputGroup variant="secondary">
              <InputGroup.Prefix>
                <Icon name="calendar-1" size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input type="date" />
            </InputGroup>
          </TextField>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          isDisabled={isBusy}
          onPress={onSubmit}
          className="mt-auto w-full"
        >
          {updateMe.isPending ? <Spinner size="sm" /> : null}
          {tCommon("save")}
        </Button>
      </section>
    </main>
  );
}

function toDateInputValue(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const isoDate = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type BuildPayloadParams = {
  field: ProfileEditFieldScreenProps["field"];
  firstName: string;
  lastName: string;
  gender: "female" | "male" | "";
  idCard: string;
  birthdate: string;
};

function buildPayload(
  values: BuildPayloadParams,
): UpdateAccountMePayload | null {
  if (values.field === "name") {
    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();

    if (firstName.length < 2 || lastName.length < 2) {
      return null;
    }

    return { firstName, lastName };
  }

  if (values.field === "gender") {
    if (!values.gender) {
      return null;
    }

    return { gender: values.gender };
  }

  if (values.field === "id-card") {
    const idCard = values.idCard.trim();
    if (!/^\d{10}$/.test(idCard)) {
      return null;
    }

    return { idCard };
  }

  const birthdate = values.birthdate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    return null;
  }

  return { birthdate };
}
