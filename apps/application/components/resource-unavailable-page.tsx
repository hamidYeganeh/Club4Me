"use client";
import { Button } from "@heroui/react";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { TaskStatusIntro } from "@/components/task-status-intro";
export function ResourceUnavailablePage({title, onRetry, backHref="/coach/reservations"}:{title:string;onRetry:()=>void;backHref?:string}) {
 return <main className="app-page gap-5"><SecondaryHeader title={title} showFilter={false} backHref={backHref}/><TaskStatusIntro title="اطلاعات در دسترس نیست" tone="danger">دریافت اطلاعات کامل نشد. اتصال خود را بررسی کنید و دوباره تلاش کنید.</TaskStatusIntro><Button variant="primary" onPress={onRetry}>تلاش دوباره</Button></main>;
}
