"use client";

import { useState, type ComponentProps } from "react";
import { ClubSlotsSection } from "./ClubSlotsSection";
import { ClubBenefitProductsSection } from "./ClubBenefitProductsSection";
import styles from "./club-pricing.module.css";

export function ClubPricingSection({
  club,
}: ComponentProps<typeof ClubSlotsSection>) {
  const [view, setView] = useState<"reservations" | "packages">("packages");
  return (
    <section className="py-6" aria-label="رزرو و بسته‌های باشگاه">
      <h2 className="mb-6 text-center text-3xl font-extrabold">
        رزرو و بسته‌ها
      </h2>
      <div className="mx-auto max-w-sm px-4">
        <div className={styles.planTabs} aria-label="نوع رزرو">
          <button
            type="button"
            aria-pressed={view === "reservations"}
            onClick={() => setView("reservations")}
          >
            رزرو جلسه
          </button>
          <button
            type="button"
            aria-pressed={view === "packages"}
            onClick={() => setView("packages")}
          >
            بسته‌ها و عضویت‌ها
          </button>
        </div>
      </div>
      <div hidden={view !== "packages"}>
        <ClubBenefitProductsSection clubId={club.id} />
      </div>
      <div hidden={view !== "reservations"}>
        <ClubSlotsSection club={club} />
      </div>
    </section>
  );
}
