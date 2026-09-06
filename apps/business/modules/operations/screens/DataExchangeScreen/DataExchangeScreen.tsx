"use client";

import {
  type OperationsDataKind,
  type OperationsImportResult,
  useBusinessClubs,
  useExportBusinessOperations,
  useImportBusinessOperations,
} from "@api/business";
import { Button, Card, Chip, toast } from "@heroui/react";
import { type ChangeEvent, useState } from "react";

const input =
  "h-11 rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm outline-none focus:border-focus focus:ring-3 focus:ring-focus/15";

export function DataExchangeScreen() {
  const clubs = useBusinessClubs();
  const [selectedClub, setSelectedClub] = useState("");
  const clubId = selectedClub || clubs.data?.items[0]?.id || "";
  const [kind, setKind] = useState<OperationsDataKind>("students");
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [contentBase64, setContentBase64] = useState("");
  const [preview, setPreview] = useState<OperationsImportResult | null>(null);
  const exporter = useExportBusinessOperations(clubId);
  const importer = useImportBusinessOperations(clubId);

  const exportFile = async () => {
    try {
      const result = await exporter.mutateAsync({ kind, format });
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("فایل خروجی آماده شد");
    } catch {
      toast.danger("دریافت خروجی ناموفق بود");
    }
  };

  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        setContentBase64(await fileToBase64(file));
        setRows([]);
        toast.success("فایل Excel برای بررسی آماده شد");
      } else {
        const parsed = parseCsv(await file.text());
        setRows(parsed);
        setContentBase64("");
        toast.success(
          `${parsed.length.toLocaleString("fa-IR")} ردیف خوانده شد`,
        );
      }
      setPreview(null);
    } catch {
      setRows([]);
      toast.danger("ساختار CSV معتبر نیست");
    }
  };

  const runImport = async (dryRun: boolean) => {
    if (kind !== "students" && kind !== "payments") return;
    try {
      const result = await importer.mutateAsync({
        kind,
        templateVersion: 1,
        format: contentBase64 ? "xlsx" : "csv",
        dryRun,
        ...(contentBase64 ? { contentBase64 } : { rows }),
      });
      setPreview(result);
      if (!dryRun) {
        setRows([]);
        setContentBase64("");
        toast.success(
          `${result.imported.toLocaleString("fa-IR")} ردیف وارد شد`,
        );
      }
    } catch {
      toast.danger("پردازش فایل انجام نشد");
    }
  };

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">ورود و خروج داده</h1>
        <p className="mt-1 text-sm text-muted">
          خروجی CSV مالی و حضور‌وغیاب؛ ورود گروهی با اعتبارسنجی قبل از ثبت
        </p>
        <Card className="app-card mt-6 p-5 shadow-none active:scale-100">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-muted">
              باشگاه
              <select
                className={input}
                value={clubId}
                onChange={(event) => setSelectedClub(event.target.value)}
              >
                {clubs.data?.items.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              فرمت خروجی
              <select
                className={input}
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as "csv" | "xlsx")
                }
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm text-muted">
              نوع داده
              <select
                className={input}
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as OperationsDataKind);
                  setRows([]);
                  setPreview(null);
                }}
              >
                <option value="students">شاگردها</option>
                <option value="coaches">مربی‌ها</option>
                <option value="classes">کلاس‌ها</option>
                <option value="payments">پرداخت‌ها</option>
                <option value="attendance">حضور‌وغیاب</option>
              </select>
            </label>
          </div>
          <Button
            className="mt-4"
            variant="secondary"
            isPending={exporter.isPending}
            onPress={() => void exportFile()}
          >
            دریافت خروجی {format === "xlsx" ? "Excel" : "CSV"}
          </Button>
        </Card>

        <Card className="app-card mt-5 p-5 shadow-none active:scale-100">
          <h2 className="text-lg font-semibold">ورود گروهی</h2>
          {!(["students", "payments"] as OperationsDataKind[]).includes(
            kind,
          ) ? (
            <p className="mt-3 text-sm text-muted">
              این نوع داده فعلاً فقط خروجی دارد؛ ورود گروهی برای شاگردها و
              پرداخت‌ها فعال است.
            </p>
          ) : (
            <>
              <input
                className="mt-4 block w-full rounded-xl border border-dashed border-border p-4 text-sm"
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => void pickFile(event)}
              />
              <p className="mt-2 text-xs text-muted">
                حداکثر ۵٬۰۰۰ ردیف؛ بررسی اولیه هیچ داده‌ای ذخیره نمی‌کند.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  isDisabled={!rows.length && !contentBase64}
                  isPending={importer.isPending}
                  onPress={() => void runImport(true)}
                >
                  بررسی فایل
                </Button>
                <Button
                  variant="primary"
                  isDisabled={
                    !preview ||
                    preview.errors.length > 0 ||
                    (!rows.length && !contentBase64)
                  }
                  isPending={importer.isPending}
                  onPress={() => void runImport(false)}
                >
                  ثبت نهایی
                </Button>
              </div>
            </>
          )}
          {preview ? <ImportPreview result={preview} /> : null}
        </Card>
      </div>
    </main>
  );
}

function ImportPreview({ result }: { result: OperationsImportResult }) {
  return (
    <div className="mt-5 rounded-2xl bg-default/30 p-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <Chip size="sm">کل: {result.total.toLocaleString("fa-IR")}</Chip>
        <Chip size="sm" color="success">
          معتبر: {result.valid.toLocaleString("fa-IR")}
        </Chip>
        <Chip size="sm" color={result.errors.length ? "danger" : "success"}>
          خطا: {result.errors.length.toLocaleString("fa-IR")}
        </Chip>
      </div>
      {result.errors.length ? (
        <ul className="mt-3 max-h-52 list-disc overflow-auto pr-5 text-danger">
          {result.errors.slice(0, 100).map((error) => (
            <li key={`${error.row}-${error.message}`}>
              ردیف {error.row.toLocaleString("fa-IR")}: {error.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-success">فایل آماده ثبت نهایی است.</p>
      )}
    </div>
  );
}

function parseCsv(text: string) {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' && quoted && source[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some(Boolean)) records.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) records.push(row);
  const [headers, ...values] = records;
  if (!headers?.length || quoted) throw new Error("Invalid CSV");
  return values.map((cells) =>
    Object.fromEntries(
      headers.map((header, index) => [header, cells[index] ?? ""]),
    ),
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}
