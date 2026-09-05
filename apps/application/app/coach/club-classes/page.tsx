"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CoachClubClassScreen } from "@modules/coach/screens/CoachClubClassScreen";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";

function Content() {
  const params = useSearchParams();
  return <CoachClubClassScreen classId={params.get("classId") ?? ""} />;
}

export default function CoachClubClassPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <Content />
    </Suspense>
  );
}
