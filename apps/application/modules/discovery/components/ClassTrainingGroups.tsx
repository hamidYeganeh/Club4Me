"use client";
import { Checkbox as HeroCheckbox } from "@heroui/react";
import { siteUrl } from "@/lib/site-metadata";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@api/http/client";
import { Button, Input } from "@heroui/react";
import { Counter } from "@/components/counter";
import { fieldClass, errorText } from "@modules/training/shared";

type Group = {
  id: string;
  title: string;
  goal: number;
  isOwner: boolean;
  members: { name: string; isMe: boolean; attendanceCount: number }[];
};
export function ClassTrainingGroups({
  classId,
  eligible,
}: {
  classId: string;
  eligible: boolean;
}) {
  const client = useQueryClient();
  const key = ["athlete", "class-groups", classId];
  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      http.get<{ items: Group[] }>(`/athlete/club-classes/${classId}/groups`),
    enabled: eligible,
  });
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState(2);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [token, setToken] = useState("");
  const act = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
      await client.invalidateQueries({ queryKey: key });
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      id="class-training-group"
      className="scroll-mt-24 space-y-3 rounded-3xl border border-border bg-surface p-5"
      aria-label="هم‌تمرینی در این کلاس"
    >
      <h2 className="text-lg font-bold">با هم ادامه بدهیم</h2>
      <p className="text-sm leading-7 text-muted">
        گروه خصوصی تا ۸ نفر از همین کلاس. هدف مشترک، تعداد حضور در هفت روز اخیر
        است.
      </p>
      <Button
        variant="secondary"
        onPress={() => {
          const url = new URL(
            `/discovery/business-class?classId=${classId}`,
            siteUrl,
          );
          url.searchParams.delete("groupInvite");
          setInviteUrl(url.toString());
        }}
      >
        دریافت لینک کلاس برای دعوت دوست
      </Button>
      {!eligible && (
        <p className="text-xs leading-6 text-muted">
          بعد از ثبت‌نام قطعی، می‌توانی گروه بسازی یا با لینک دعوت عضو گروه شوی.
          هر نفر جداگانه ثبت‌نام می‌کند.
        </p>
      )}
      {eligible && (
        <>
          {query.isPending && <p role="status">در حال دریافت گروه‌ها…</p>}
          {query.isError && (
            <div role="alert">
              <p>گروه‌ها دریافت نشدند.</p>
              <Button variant="ghost" onPress={() => void query.refetch()}>
                تلاش دوباره
              </Button>
            </div>
          )}
          {query.data?.items.map((group) => (
            <div
              key={group.id}
              className="space-y-3 rounded-2xl bg-surface-secondary p-4"
            >
              <h3 className="font-semibold">{group.title}</h3>
              <p className="text-xs text-muted">
                هدف هر نفر: {group.goal.toLocaleString("fa-IR")} حضور در هفت روز
              </p>
              <ul className="space-y-2">
                {group.members.map((member, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>
                      {member.name}
                      {member.isMe ? " (شما)" : ""}
                    </span>
                    <span>
                      {member.attendanceCount.toLocaleString("fa-IR")} حضور{" "}
                      {member.attendanceCount >= group.goal ? "✓" : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {group.isOwner && (
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busy}
                    onPress={() =>
                      void act(async () => {
                        const result = await http.post<{
                          token: string;
                          classId: string;
                        }>(`/athlete/club-classes/groups/${group.id}/invite`);
                        const url = new URL(
                          `/discovery/business-class?classId=${classId}`,
                          siteUrl,
                        );
                        url.searchParams.set("groupInvite", result.token);
                        setInviteUrl(url.toString());
                        setMessage(
                          "لینک تازه آماده شد؛ لینک قبلی گروه دیگر معتبر نیست.",
                        );
                      })
                    }
                  >
                    ساخت لینک دعوت تازه
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={busy}
                  onPress={() => {
                    if (
                      window.confirm(
                        group.isOwner
                          ? "گروه برای همه بسته شود؟"
                          : "از گروه خارج شوی و اشتراک حضورت متوقف شود؟",
                      )
                    )
                      void act(() =>
                        http.delete(`/athlete/club-classes/groups/${group.id}`),
                      );
                  }}
                >
                  {group.isOwner ? "بستن گروه" : "خروج از گروه"}
                </Button>
              </div>
            </div>
          ))}
          <details className="rounded-2xl border border-border p-3">
            <summary className="min-h-11 cursor-pointer text-sm font-semibold">
              ساخت گروه یا پذیرش دعوت
            </summary>
            <div className="mt-3 space-y-3">
              <HeroCheckbox
                className="flex items-start gap-3 text-xs leading-6"
                isSelected={accepted}
                onChange={(e) => setAccepted(e)}
              >
                <HeroCheckbox.Content>
                  <HeroCheckbox.Control>
                    <HeroCheckbox.Indicator />
                  </HeroCheckbox.Control>
                  نام و تعداد حضور ثبت‌شده من در این کلاس برای اعضای گروه نمایش
                  داده شود. با خروج، اشتراک متوقف می‌شود.
                </HeroCheckbox.Content>
              </HeroCheckbox>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (accepted)
                    void act(() =>
                      http.post(`/athlete/club-classes/${classId}/groups`, {
                        title,
                        goal,
                        accepted: true,
                      }),
                    );
                }}
              >
                <label className="block text-sm">
                  نام گروه
                  <Input
                    required
                    maxLength={80}
                    className={fieldClass}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  هدف حضور در هفت روز
                  <Counter
                    min={1}
                    max={7}
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                  />
                </label>
                <Button
                  type="submit"
                  isDisabled={!accepted || busy || !title.trim()}
                >
                  ساخت گروه خصوصی
                </Button>
              </form>
              <form
                className="space-y-3 border-t border-border pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const current = new URL(
                    window.location.href,
                  ).searchParams.get("groupInvite");
                  let invite = token.trim() || current || "";
                  try {
                    invite =
                      new URL(invite).searchParams.get("groupInvite") ?? invite;
                  } catch {
                    /* A token can also be entered directly. */
                  }
                  if (accepted)
                    void act(() =>
                      http.post(
                        `/athlete/club-classes/${classId}/groups/join`,
                        { token: invite, accepted: true },
                      ),
                    );
                }}
              >
                <label className="block text-sm">
                  لینک دعوت
                  <Input
                    className={fieldClass}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="لینک دعوت را اینجا وارد کن"
                  />
                </label>
                <p className="text-xs text-muted">
                  اگر با لینک دعوت وارد شده‌ای، کافی است پذیرش دعوت را بزنی.
                </p>
                <Button
                  type="submit"
                  variant="secondary"
                  isDisabled={!accepted || busy}
                >
                  پذیرش دعوت
                </Button>
              </form>
            </div>
          </details>
        </>
      )}
      {inviteUrl && (
        <div className="space-y-2">
          <label className="block text-xs">
            لینک آماده اشتراک
            <Input
              readOnly
              dir="ltr"
              value={inviteUrl}
              className={fieldClass}
              onFocus={(e) => e.target.select()}
            />
          </label>
          <Button
            size="sm"
            variant="secondary"
            onPress={async () => {
              try {
                await navigator.clipboard.writeText(inviteUrl);
                setMessage("لینک کپی شد.");
              } catch {
                setMessage("لینک را از کادر بالا انتخاب و کپی کن.");
              }
            }}
          >
            کپی لینک
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm leading-7">
          {message}
        </p>
      )}
    </section>
  );
}
