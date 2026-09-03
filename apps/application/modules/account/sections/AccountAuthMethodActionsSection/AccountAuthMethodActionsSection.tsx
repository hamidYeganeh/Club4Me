"use client";

import { Button, Spinner, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

import { accountAuthMethodActionsSectionStyles } from "./AccountAuthMethodActionsSection.styles";
import type { AccountAuthMethodActionsSectionProps } from "./AccountAuthMethodActionsSection.types";

export function AccountAuthMethodActionsSection({
  formId,
  submitLabel,
  alternateLabel,
  orLabel,
  isBusy = false,
  isPending = false,
  showAlternate = true,
  onAlternatePress,
}: AccountAuthMethodActionsSectionProps) {
  const styles = accountAuthMethodActionsSectionStyles();

  return (
    <section className={styles.root()} aria-label={submitLabel}>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        size="lg"
        fullWidth
        isDisabled={isBusy}
        className={styles.submit()}
      >
        {isPending ? <Spinner size="sm" /> : null}
        {submitLabel}
        <Icon name="chevron-right" size={18} />
      </Button>

      {showAlternate ? (
        <>
          <div className={styles.divider()}>
            <span className={styles.rule()} />
            <Typography
              type="body-xs"
              weight="medium"
              color="muted"
              className={styles.caption()}
            >
              {orLabel}
            </Typography>
            <span className={styles.rule()} />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            className={styles.alternate()}
            onPress={onAlternatePress}
          >
            {alternateLabel}
            <Icon name="arrow-left" size={18} />
          </Button>
        </>
      ) : null}
    </section>
  );
}
