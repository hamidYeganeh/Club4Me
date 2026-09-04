"use client";

import { Button, Card, Typography } from "@heroui/react";

export function MockPaymentGateway({
  title,
  amount,
  isPending,
  onResult,
}: {
  title: string;
  amount: number;
  isPending: boolean;
  onResult: (result: "approve" | "reject") => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-5 backdrop-blur-lg">
      <Card className="w-full max-w-md rounded-3xl border border-white/10 bg-surface p-6 shadow-2xl">
        <span className="w-fit rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning">
          درگاه پرداخت آزمایشی
        </span>
        <Typography type="h4" weight="bold" className="mt-4">
          {title}
        </Typography>
        <p className="mt-2 text-sm text-muted">
          این درگاه واقعی نیست. نتیجه پرداخت را برای تست انتخاب کنید.
        </p>
        <div className="mt-5 rounded-2xl bg-surface-secondary p-4 text-center">
          <p className="text-xs text-muted">مبلغ قابل پرداخت</p>
          <p className="mt-1 text-2xl font-black text-accent">
            {amount.toLocaleString("fa-IR")} ریال
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            isPending={isPending}
            onPress={() => onResult("approve")}
          >
            پرداخت موفق
          </Button>
          <Button
            variant="danger"
            isDisabled={isPending}
            onPress={() => onResult("reject")}
          >
            پرداخت ناموفق
          </Button>
        </div>
      </Card>
    </div>
  );
}
