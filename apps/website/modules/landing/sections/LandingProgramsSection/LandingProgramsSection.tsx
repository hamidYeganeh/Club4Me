import { Icon } from "@theme/icon";
import { getTranslations } from "next-intl/server";

import { CoverImage } from "@/components/cover-image";
import { Reveal } from "@/components/reveal";
import { media } from "@/lib/media";

import { landingProgramsSectionStyles } from "./LandingProgramsSection.styles";
import type { LandingProgram } from "./LandingProgramsSection.types";

const programs: LandingProgram[] = [
  {
    id: "strength",
    icon: "weight",
    image: media.programs.strength,
    span: "lg:col-span-7 lg:row-span-2",
  },
  {
    id: "hiit",
    icon: "stopwatch",
    image: media.programs.hiit,
    span: "lg:col-span-5",
  },
  {
    id: "boxing",
    icon: "boxing",
    image: media.programs.boxing,
    span: "lg:col-span-5",
  },
  {
    id: "yoga",
    icon: "person-yoga",
    image: media.programs.yoga,
    span: "lg:col-span-12",
  },
];

export async function LandingProgramsSection() {
  const styles = landingProgramsSectionStyles();
  const t = await getTranslations();

  return (
    <section id="programs" className={styles.root()}>
      <div className={styles.inner()}>
        <Reveal>
          <h2 className={styles.title()}>{t("landing.programs.title")}</h2>
        </Reveal>

        <div className={styles.grid()}>
          {programs.map((program, index) => {
            const layout =
              program.id === "strength"
                ? "featured"
                : program.id === "yoga"
                  ? "wide"
                  : "default";
            const itemStyles = landingProgramsSectionStyles({ layout });

            return (
              <Reveal
                key={program.id}
                delayMs={index * 70}
                className={program.span}
              >
                <article className={itemStyles.card()}>
                  <div className={itemStyles.layout()}>
                    <div className={itemStyles.media()}>
                      <CoverImage
                        src={program.image.src}
                        alt={program.image.alt}
                      />
                    </div>
                    <div className={itemStyles.body()}>
                      <span className={itemStyles.icon()}>
                        <Icon name={program.icon} size="md" />
                      </span>
                      <h3 className={itemStyles.heading()}>
                        {t(`landing.programs.${program.id}Title`)}
                      </h3>
                      <p className={itemStyles.copy()}>
                        {t(`landing.programs.${program.id}Body`)}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
