import type { BusinessClassAttendance } from "@api/business";

const status: Record<string, string> = {
  unrecorded: "ثبت نشده",
  present: "حاضر",
  absent: "غایب",
  excused: "موجه",
};
export function AttendanceHistory({
  changes,
}: {
  changes?: BusinessClassAttendance["changes"];
}) {
  if (!changes?.length) return null;
  return (
    <details className="basis-full text-xs text-muted">
      <summary className="cursor-pointer py-2">سابقه ثبت و اصلاح حضور</summary>
      <ol className="space-y-2">
        {changes.map((change, index) => (
          <li key={index}>
            {new Date(change.at).toLocaleString("fa-IR", {
              timeZone: "Asia/Tehran",
            })}{" "}
            · {status[change.before] ?? change.before} ←{" "}
            {status[change.after] ?? change.after}
            {change.beforeCredits !== null && change.afterCredits !== null && (
              <span>
                {" "}
                · اعتبار: {change.beforeCredits.toLocaleString("fa-IR")} ←{" "}
                {change.afterCredits.toLocaleString("fa-IR")}
              </span>
            )}
            <span className="ms-2">ثبت‌کننده: {change.actorId.slice(-6)}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
