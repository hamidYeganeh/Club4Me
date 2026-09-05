"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BusinessClassDetailScreen } from "@modules/discovery/screens/BusinessClassDetailScreen";
import { DetailPageSkeleton } from "@/components/loading-skeletons";

function Content() {
  const params = useSearchParams();
  return <BusinessClassDetailScreen classId={params.get("classId") ?? ""} />;
}

export default function BusinessClassPage() {
  return (
    <Suspense fallback={<DetailPageSkeleton />}>
      <Content />
    </Suspense>
  );
}
