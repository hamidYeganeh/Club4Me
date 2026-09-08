"use client";
import Link from "@/components/app-link";
import { useRouter } from "next/navigation";
import {
  useAccountMe,
  useMyRoleRequests,
  type RequestableRole,
} from "@api/account";
import { useTranslations } from "next-intl";
import { AuthScreen } from "@/components/auth-screen";
import { AuthPageIntro } from "@/components/auth-page-intro";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";
import { getApplicationRoles, getRolePath } from "@/lib/post-auth-path";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { AccountAuthRolesOptionsSection } from "../sections/AccountAuthRolesOptionsSection";

const labels = {
  pending: "در حال بررسی",
  approved: "تأیید شده",
  rejected: "تأیید نشده",
};
export function RoleRequestScreen({ role }: { role: RequestableRole }) {
  const router = useRouter();
  const me = useAccountMe();
  const requests = useMyRoleRequests();
  const t = useTranslations("auth.roles");
  const failure = getQueryFailure(requests.error, requests.fetchStatus);
  const existing = requests.data?.items
    .filter((item) => item.role === role)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const granted = me.data?.roles.includes(role);
  return (
    <AuthScreen>
      <SecondaryHeader
        title={role === "coach" ? "درخواست مربیگری" : "درخواست مالک باشگاه"}
        showFilter={false}
        backHref="/auth/roles?manage=1"
      />
      {failure ? (
        <RequestFailureState
          error={failure}
          onRetry={() => void requests.refetch()}
        />
      ) : requests.isPending ? (
        <p className="p-6" role="status">
          در حال دریافت وضعیت درخواست…
        </p>
      ) : granted ||
        existing?.status === "pending" ||
        existing?.status === "approved" ? (
        <>
          <AuthPageIntro
            title={
              granted ? "این نقش برای شما فعال است" : "درخواست شما ثبت شده است"
            }
            subtitle="وضعیت درخواست را در صفحهٔ پیگیری ببینید."
          />
          <Link
            className="rounded-2xl bg-accent px-5 py-3 font-bold text-accent-foreground"
            href="/auth/roles/requests"
          >
            پیگیری درخواست‌ها
          </Link>
        </>
      ) : (
        <AccountAuthRolesOptionsSection
          athleteLabel={t("athlete")}
          coachLabel={t("coach")}
          ownerLabel={t("owner")}
          grantedRoles={getApplicationRoles(me.data?.roles ?? [])}
          requestRole={role}
          onRequestRoleChange={() => router.replace("/auth/roles/requests")}
          onSelectRole={() => {}}
        />
      )}
    </AuthScreen>
  );
}
export function RoleRequestsScreen() {
  const requests = useMyRoleRequests();
  const me = useAccountMe();
  const failure = getQueryFailure(requests.error, requests.fetchStatus);
  return (
    <main className="app-page gap-5">
      <SecondaryHeader
        title="پیگیری درخواست‌های نقش"
        action={
          <button
            type="button"
            className="text-xs font-bold"
            disabled={requests.isFetching}
            onClick={() => void Promise.all([requests.refetch(), me.refetch()])}
          >
            به‌روزرسانی
          </button>
        }
        showFilter={false}
        backHref="/auth/roles?manage=1"
      />
      <AuthPageIntro
        title="قدم بعدی فعالیت حرفه‌ای"
        subtitle="وضعیت درخواست مربیگری یا مدیریت باشگاه را اینجا دنبال کنید."
      />
      {requests.isPending && !failure ? (
        <p role="status">در حال دریافت درخواست‌ها…</p>
      ) : null}
      {failure ? (
        <RequestFailureState
          error={failure}
          onRetry={() => void requests.refetch()}
        />
      ) : null}
      {!failure && requests.isSuccess && !requests.data.items.length ? (
        <section className="app-card p-6">
          <h2 className="font-bold">هنوز درخواستی ندارید</h2>
          <p className="mt-2 text-sm text-muted">
            از صفحهٔ نقش‌ها، نوع فعالیت خود را انتخاب کنید.
          </p>
          <Link
            href="/auth/roles?manage=1"
            className="mt-4 inline-block font-bold"
          >
            انتخاب نقش
          </Link>
        </section>
      ) : null}
      {requests.data?.items
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((item) => (
          <article key={item.id} className="app-card space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">
                {item.role === "coach"
                  ? "درخواست مربیگری"
                  : "درخواست مالک باشگاه"}
              </h2>
              <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs">
                {labels[item.status]}
              </span>
            </div>
            <p className="text-sm text-muted">
              {item.details.displayName} · {item.details.city}
            </p>
            <p className="text-xs text-muted">
              ثبت در {new Date(item.createdAt).toLocaleDateString("fa-IR")}
            </p>
            <p className="text-sm leading-7">
              {item.status === "pending"
                ? "درخواست در انتظار بررسی است. پس از بررسی، وضعیت همین صفحه به‌روز می‌شود."
                : item.status === "rejected"
                  ? "درخواست تأیید نشده است. می‌توانید اطلاعات خود را اصلاح و دوباره درخواست ثبت کنید."
                  : "درخواست تأیید شده است."}
            </p>
            {item.status === "rejected" ? (
              <Link
                href={`/auth/roles/${item.role}`}
                className="inline-block rounded-xl bg-accent px-4 py-2 font-bold text-accent-foreground"
              >
                ثبت درخواست دوباره
              </Link>
            ) : null}
            {item.status === "approved" &&
            me.data?.roles.includes(item.role) ? (
              <Link
                href={getRolePath(item.role)}
                className="inline-block font-bold"
              >
                ورود به حساب {item.role === "coach" ? "مربی" : "باشگاه"}
              </Link>
            ) : null}
          </article>
        ))}
    </main>
  );
}
