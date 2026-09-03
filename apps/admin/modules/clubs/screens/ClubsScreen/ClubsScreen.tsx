import { Chip } from "@heroui/react";
import { getTranslations } from "next-intl/server";

const clubs = [
  { name: "باشگاه کارگر", city: "تهران", members: "۴۲۰", status: "active" },
  { name: "باشگاه ونک", city: "تهران", members: "286", status: "active" },
  { name: "باشگاه سعادت‌آباد", city: "تهران", members: "۱۹۸", status: "review" },
  { name: "باشگاه اصفهان مرکزی", city: "اصفهان", members: "۳۱۲", status: "active" },
] as const;

export async function ClubsScreen() {
  const t = await getTranslations();

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">{t("clubsPage.title")}</h1>
      <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface">
        <table className="w-full text-start text-sm">
          <thead className="bg-surface-secondary text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t("clubsPage.name")}</th>
              <th className="px-4 py-3 font-medium">{t("clubsPage.city")}</th>
              <th className="px-4 py-3 font-medium">{t("clubsPage.members")}</th>
              <th className="px-4 py-3 font-medium">{t("clubsPage.status")}</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.name} className="border-t border-border">
                <td className="px-4 py-4 font-medium">{club.name}</td>
                <td className="px-4 py-4 text-muted">{club.city}</td>
                <td className="px-4 py-4 tabular-nums">{club.members}</td>
                <td className="px-4 py-4">
                  <Chip
                    color={club.status === "active" ? "success" : "warning"}
                    size="sm"
                  >
                    {club.status === "active"
                      ? t("clubsPage.active")
                      : t("clubsPage.review")}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
