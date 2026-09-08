"use client";

import Link from "@/components/app-link";
import { useRouter } from "next/navigation";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { motion, useReducedMotion } from "motion/react";

import { markWelcomeSeen } from "@/lib/welcome-onboarding";

import { welcomeCopySectionStyles } from "./WelcomeCopySection.styles";
import type { WelcomeCopySectionProps } from "./WelcomeCopySection.types";

export function WelcomeCopySection({
  title,
  subtitle,
  getStarted,
  alreadyHaveAccount,
  signIn,
}: WelcomeCopySectionProps) {
  const styles = welcomeCopySectionStyles();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={styles.root()}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.copy()}>
        <Typography type="h2" align="center" className={styles.title()}>{title}</Typography>
        <Typography type="body" color="muted" align="center" className={styles.subtitle()}>{subtitle}</Typography>
      </div>

      <div className={styles.actions()}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          className={styles.button()}
          onPress={() => router.push("/welcome/introduce")}
        >
          {getStarted}
          <Icon name="chevron-right" size={18} />
        </Button>

        <Typography type="body-sm" color="muted" className={styles.signInRow()}>
          {alreadyHaveAccount}{" "}
          <Link
            href="/auth"
            className={styles.signIn()}
            onClick={() => markWelcomeSeen()}
          >
            {signIn}
          </Link>
        </Typography>
      </div>
    </motion.section>
  );
}
