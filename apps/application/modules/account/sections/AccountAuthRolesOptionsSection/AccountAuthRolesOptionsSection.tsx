"use client";

import { useState } from "react";
import { Button, Spinner, toast } from "@heroui/react";
import { useRequestRole, type RequestableRole } from "@api/account";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { getAccountApiErrorMessage } from "@/lib/account-api-error";

import { accountAuthRolesOptionsSectionStyles } from "./AccountAuthRolesOptionsSection.styles";
import type {
  AccountAuthRoleOption,
  AccountAuthRolesOptionsSectionProps,
} from "./AccountAuthRolesOptionsSection.types";

export function AccountAuthRolesOptionsSection({
  athleteLabel,
  coachLabel,
  ownerLabel,
  onAthlete,
}: AccountAuthRolesOptionsSectionProps) {
  const styles = accountAuthRolesOptionsSectionStyles();
  const t = useTranslations("auth");
  const tRoles = useTranslations("auth.roles");
  const requestRole = useRequestRole();
  const [pendingRole, setPendingRole] = useState<RequestableRole | null>(null);

  const options: AccountAuthRoleOption[] = [
    {
      id: "athlete",
      label: athleteLabel,
      icon: "weight",
      tone: "athlete",
    },
    {
      id: "coach",
      label: coachLabel,
      icon: "whistle",
      tone: "coach",
    },
    {
      id: "owner",
      label: ownerLabel,
      icon: "building-2",
      tone: "owner",
    },
  ];

  const handleRequest = async (role: RequestableRole) => {
    if (requestRole.isPending) {
      return;
    }

    setPendingRole(role);

    try {
      await requestRole.mutateAsync(role);
      toast.success(tRoles("requestSentTitle"), {
        description: tRoles("requestSentBody"),
      });
    } catch (error) {
      toast.danger(t("requestErrorTitle"), {
        description: getAccountApiErrorMessage(error, t),
      });
    } finally {
      setPendingRole(null);
    }
  };

  const isBusy = requestRole.isPending;

  return (
    <section className={styles.root()} aria-labelledby="account-auth-roles-title">
      {options.map((option) => {
        const isPending = pendingRole === option.id;

        return (
          <Button
            key={option.id}
            variant="secondary"
            fullWidth
            isDisabled={isBusy}
            className={styles.item()}
            onPress={() => {
              if (option.id === "athlete") {
                onAthlete();
                return;
              }

              void handleRequest(option.id);
            }}
          >
            <span className={styles.icon({ tone: option.tone })}>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <Icon name={option.icon} size={20} />
              )}
            </span>
            <span className={styles.label()}>{option.label}</span>
            <Icon name="chevron-left" size={18} className={styles.chevron()} />
          </Button>
        );
      })}
    </section>
  );
}
