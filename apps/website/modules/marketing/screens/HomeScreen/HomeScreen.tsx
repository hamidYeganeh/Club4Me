"use client";

import dynamic from "next/dynamic";
import { LandingScrollProvider } from "../../lib/landing-scroll";
import "../../lib/landing.css";
import { LandingHeroSection } from "../../sections/LandingHeroSection";
import { LandingLoader } from "../../sections/LandingLoader";
import { LandingMenuOverlay } from "../../sections/LandingMenuOverlay";
import { LandingContactModal } from "../../sections/LandingContactModal";
import { homeScreenStyles } from "./HomeScreen.styles";

const LandingTrustSection = dynamic(() =>
  import("../../sections/LandingTrustSection").then((mod) => ({
    default: mod.LandingTrustSection,
  })),
);

const LandingFeaturesSection = dynamic(() =>
  import("../../sections/LandingFeaturesSection").then((mod) => ({
    default: mod.LandingFeaturesSection,
  })),
);

const LandingSportsSection = dynamic(() =>
  import("../../sections/LandingSportsSection").then((mod) => ({
    default: mod.LandingSportsSection,
  })),
);

const LandingClubsSection = dynamic(() =>
  import("../../sections/LandingClubsSection").then((mod) => ({
    default: mod.LandingClubsSection,
  })),
);

const LandingClassesSection = dynamic(() =>
  import("../../sections/LandingClassesSection").then((mod) => ({
    default: mod.LandingClassesSection,
  })),
);

const LandingStatsSection = dynamic(() =>
  import("../../sections/LandingStatsSection").then((mod) => ({
    default: mod.LandingStatsSection,
  })),
);

const LandingTestimonialsSection = dynamic(() =>
  import("../../sections/LandingTestimonialsSection").then((mod) => ({
    default: mod.LandingTestimonialsSection,
  })),
);

const LandingBlogsSection = dynamic(() =>
  import("../../sections/LandingBlogsSection").then((mod) => ({
    default: mod.LandingBlogsSection,
  })),
);

const LandingFaqSection = dynamic(() =>
  import("../../sections/LandingFaqSection").then((mod) => ({
    default: mod.LandingFaqSection,
  })),
);

const LandingDownloadSection = dynamic(() =>
  import("../../sections/LandingDownloadSection").then((mod) => ({
    default: mod.LandingDownloadSection,
  })),
);

const LandingBookingSection = dynamic(() =>
  import("../../sections/LandingBookingSection").then((mod) => ({
    default: mod.LandingBookingSection,
  })),
);

const LandingAboutUsSection = dynamic(() =>
  import("../../sections/LandingAboutUsSection").then((mod) => ({
    default: mod.LandingAboutUsSection,
  })),
);

const LandingFooterSection = dynamic(() =>
  import("../../sections/LandingFooterSection").then((mod) => ({
    default: mod.LandingFooterSection,
  })),
);

export function HomeScreen() {
  return (
    <LandingScrollProvider
      overlays={
        <>
          <LandingLoader />
          <LandingMenuOverlay />
          <LandingContactModal />
        </>
      }
    >
      <main className={homeScreenStyles.root} dir="rtl" lang="fa">
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingTrustSection />
        <LandingAboutUsSection />
        <LandingSportsSection />
        <LandingStatsSection />
        <LandingClubsSection />
        <LandingClassesSection />
        <LandingTestimonialsSection />
        <LandingBookingSection />
        <LandingBlogsSection />
        <LandingDownloadSection />
        <LandingFaqSection />
        <LandingFooterSection />
      </main>
    </LandingScrollProvider>
  );
}
