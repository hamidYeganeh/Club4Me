import { StructuredData } from "@/modules/discovery/components";
import { absoluteUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Gym4Me — رزرو، برنامه تمرین و پیشرفت",
  "باشگاه و مربی پیدا کن، کلاس رزرو کن و برنامه تمرین، پیشرفت و عضویتت را دنبال کن.",
  "/",
);
import { LandingHomeScreen } from "@modules/landing/screens/LandingHomeScreen";

export default function Home() {
  return (
    <>
      <StructuredData
        value={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": absoluteUrl("/#organization"),
              name: "Gym4Me",
              url: absoluteUrl("/"),
            },
            {
              "@type": "WebSite",
              "@id": absoluteUrl("/#website"),
              name: "Gym4Me",
              url: absoluteUrl("/"),
              inLanguage: "fa-IR",
              publisher: { "@id": absoluteUrl("/#organization") },
            },
          ],
        }}
      />
      <LandingHomeScreen />
    </>
  );
}
