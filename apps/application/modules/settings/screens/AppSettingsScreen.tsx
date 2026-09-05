"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Button, Skeleton, Switch, toast } from "@heroui/react";
import {
  useDeleteAccount,
  useLogout,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  trackNotificationPreferenceChanged,
  type NotificationPreferences,
} from "@api";
import { Icon } from "@theme/icon";

import {
  disablePushNotifications,
  enablePushNotifications,
  getPushNotificationState,
} from "@/lib/push-notifications";
import { openExternalUrl } from "@/lib/native-browser";
import { PermissionGrantSheet } from "@/components/permissions/permission-grant-sheet";
import { getRequestFailurePresentation } from "@/lib/request-failure";
import { getQueryFailure } from "@/lib/request-failure";
import { RequestFailureState } from "@/components/request-failure-state";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

type Props = { role: "athlete" | "coach" };
type PreferenceKey = keyof NotificationPreferences;

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://gym4me.ir";

const notificationItems: Array<{
  key: PreferenceKey;
  title: string;
  description: string;
}> = [
  {
    key: "bookingUpdates",
    title: "تغییرات رزرو",
    description: "تأیید، لغو یا جابه‌جایی زمان رزرو",
  },
  {
    key: "reminders",
    title: "یادآوری کلاس",
    description: "یادآوری نزدیک‌شدن زمان شروع تمرین",
  },
  {
    key: "discovery",
    title: "کلاس‌های جدید",
    description: "کلاس جدید مربی‌ها و باشگاه‌های موردعلاقه",
  },
  {
    key: "marketing",
    title: "پیشنهادهای ویژه",
    description: "تخفیف‌ها و پیام‌های غیرضروری؛ پیش‌فرض خاموش است",
  },
];

export function AppSettingsScreen({ role }: Props) {
  const router = useRouter();
  const preferences = useNotificationPreferences();
  const preferencesFailure = getQueryFailure(
    preferences.error,
    preferences.fetchStatus,
  );
  const updatePreferences = useUpdateNotificationPreferences();
  const deleteAccount = useDeleteAccount();
  const logout = useLogout();
  const [pushState, setPushState] = useState<
    "enabled" | "disabled" | "denied" | "unsupported"
  >("disabled");
  const [version, setVersion] = useState("وب");
  const [pushPrimerOpen, setPushPrimerOpen] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);

  useEffect(() => {
    void getPushNotificationState().then(setPushState);
    if (Capacitor.isNativePlatform()) {
      void App.getInfo().then((info) =>
        setVersion(`${info.version} (${info.build})`),
      );
    }
  }, []);

  const togglePush = async (enabled: boolean) => {
    if (enabled) {
      setPushPrimerOpen(true);
      return;
    }
    try {
      await disablePushNotifications();
      setPushState("disabled");
      trackNotificationPreferenceChanged({
        preference_name: "push_enabled",
        is_enabled: false,
      });
    } catch {
      toast.danger("غیرفعال‌سازی اعلان‌ها ناموفق بود.");
    }
  };

  const grantPushAccess = async () => {
    setRequestingPush(true);
    try {
      const state = await enablePushNotifications();
      setPushState(state);
      if (state === "enabled") {
        trackNotificationPreferenceChanged({
          preference_name: "push_enabled",
          is_enabled: true,
        });
      }
      if (state === "denied") {
        toast.warning(
          "مجوز اعلان بسته است؛ آن را از تنظیمات Android فعال کنید.",
        );
      }
    } catch {
      toast.danger("فعال‌سازی اعلان‌ها ناموفق بود.");
    } finally {
      setRequestingPush(false);
      setPushPrimerOpen(false);
    }
  };

  const togglePreference = async (key: PreferenceKey, enabled: boolean) => {
    try {
      await updatePreferences.mutateAsync({ [key]: enabled });
    } catch {
      toast.danger("ذخیره تنظیم اعلان ناموفق بود.");
    }
  };

  const removeAccount = async () => {
    const confirmed = window.confirm(
      "حساب و اطلاعات شخصی شما حذف می‌شود و این عملیات قابل بازگشت نیست. ادامه می‌دهید؟",
    );
    if (!confirmed) return;
    try {
      await deleteAccount.mutateAsync();
      router.replace("/auth");
    } catch (error) {
      const failure = getRequestFailurePresentation(error);
      toast.danger(failure.title, { description: failure.description });
    }
  };

  const signOut = async () => {
    try {
      await logout.mutateAsync();
      router.replace("/auth");
    } catch (error) {
      const failure = getRequestFailurePresentation(error);
      toast.danger(failure.title, { description: failure.description });
    }
  };

  const openExternal = (path: string) =>
    void openExternalUrl(`${WEBSITE_URL}${path}`);

  return (
    <main className="app-page gap-5">
      <SecondaryHeader
        title="تنظیمات"
        showFilter={false}
        backHref={`/${role}/profile`}
      />

      <SettingsSection title="اعلان‌ها">
        <SettingRow
          title="اعلان‌های دستگاه"
          description={
            pushState === "denied"
              ? "مجوز در تنظیمات دستگاه غیرفعال است"
              : "نمایش اعلان حتی وقتی اپ بسته است"
          }
        >
          <Switch
            aria-label="اعلان‌های دستگاه"
            isSelected={pushState === "enabled"}
            isDisabled={pushState === "unsupported"}
            onChange={togglePush}
          >
            <Switch.Content aria-label="اعلان‌های دستگاه">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </SettingRow>
        {preferencesFailure ? (
          <RequestFailureState
            compact
            error={preferencesFailure}
            onRetry={() => void preferences.refetch()}
          />
        ) : (
          notificationItems.map((item) => (
            <SettingRow
              key={item.key}
              title={item.title}
              description={item.description}
            >
              {preferences.isPending ? (
                <Skeleton
                  className="h-7 w-12 shrink-0 rounded-full"
                  aria-label={`در حال بارگذاری ${item.title}`}
                />
              ) : (
                <Switch
                  aria-label={item.title}
                  isSelected={preferences.data?.[item.key] ?? false}
                  isDisabled={updatePreferences.isPending}
                  onChange={(enabled) =>
                    void togglePreference(item.key, enabled)
                  }
                >
                  <Switch.Content aria-label={item.title}>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              )}
            </SettingRow>
          ))
        )}
      </SettingsSection>

      <SettingsSection title="حریم خصوصی و پشتیبانی">
        <LinkRow
          title="کیف پول و دعوت دوستان"
          onPress={() => router.push(`/${role}/benefits`)}
        />
        {role === "coach" ? (
          <LinkRow
            title="زمان‌های در دسترس مربی"
            onPress={() => router.push("/coach/availability")}
          />
        ) : null}
        <LinkRow
          title="سیاست حریم خصوصی"
          onPress={() => openExternal("/privacy")}
        />
        <LinkRow
          title="قوانین استفاده"
          onPress={() => openExternal("/terms")}
        />
        <LinkRow
          title="درخواست حذف اطلاعات"
          onPress={() => openExternal("/account-deletion")}
        />
        <LinkRow
          title="تماس با پشتیبانی"
          onPress={() =>
            role === "athlete"
              ? router.push("/athlete/support")
              : openExternal("/support")
          }
        />
      </SettingsSection>

      <SettingsSection title="حساب کاربری">
        <div className="p-4">
          <Button
            variant="secondary"
            className="mb-3 w-full"
            isDisabled={logout.isPending}
            onPress={() => void signOut()}
          >
            {logout.isPending ? "در حال خروج…" : "خروج از حساب"}
          </Button>
          <Button
            variant="danger"
            className="w-full"
            isDisabled={deleteAccount.isPending}
            onPress={() => void removeAccount()}
          >
            {deleteAccount.isPending ? "در حال حذف…" : "حذف دائمی حساب"}
          </Button>
          <p className="mt-3 text-xs leading-6 text-muted">
            اطلاعات پروفایل، موقعیت‌ها، ذخیره‌شده‌ها، نظرها و توکن‌های دستگاه
            حذف می‌شوند.
          </p>
        </div>
      </SettingsSection>

      <p className="font-brand pb-5 text-center text-xs text-muted" dir="ltr">
        Gym4Me {version}
      </p>

      <PermissionGrantSheet
        kind="notifications"
        open={pushPrimerOpen}
        pending={requestingPush}
        onOpenChange={setPushPrimerOpen}
        onGrant={grantPushAccess}
      />
    </main>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-semibold text-muted">{title}</h2>
      <div className="app-card divide-y divide-white/7 overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function LinkRow({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center justify-between p-4 text-start"
    >
      <span className="font-medium">{title}</span>
      <Icon name="chevron-left" size={18} className="text-muted" />
    </button>
  );
}
