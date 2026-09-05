"use client";

import { Button, Card, Spinner, toast } from "@heroui/react";
import { useBusinessClubs } from "@api/business";
import { useClubReviews, useRespondToClubReview } from "@api";
import { useState } from "react";

export function BusinessReviewsScreen() {
  const clubs = useBusinessClubs();
  const [picked, setPicked] = useState("");
  const clubId = picked || clubs.data?.items[0]?.id || "";
  const reviews = useClubReviews(clubId);
  const respond = useRespondToClubReview(clubId);
  return <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold">نظرهای باشگاه</h1><p className="mt-1 text-sm text-muted">مشاهده بازخورد ورزشکاران و پاسخ رسمی باشگاه</p></div><select className="h-11 rounded-xl border border-border bg-surface px-3 text-sm" value={clubId} onChange={(event) => setPicked(event.target.value)}>{clubs.data?.items.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></div>{reviews.isPending ? <div className="grid min-h-64 place-items-center"><Spinner /></div> : <div className="mt-5 grid gap-4">{reviews.data?.items.map((review) => <Card key={review.id} className="rounded-2xl border border-border bg-surface p-5"><div className="flex justify-between gap-3"><strong>{review.title || "نظر ورزشکار"}</strong><span className="text-warning">{"★".repeat(review.rating)}</span></div><p className="mt-3 text-sm leading-7 text-muted">{review.body}</p>{review.ownerResponse ? <div className="mt-4 rounded-xl bg-surface-secondary p-3 text-sm"><strong>پاسخ باشگاه:</strong> {review.ownerResponse.body}</div> : <Button className="mt-4" size="sm" variant="secondary" isPending={respond.isPending} onPress={() => { const body = window.prompt("پاسخ باشگاه را بنویسید:")?.trim(); if (!body) return; void respond.mutateAsync({ reviewId: review.id, body }).then(() => toast.success("پاسخ ثبت شد")).catch(() => toast.danger("ثبت پاسخ انجام نشد")); }}>ثبت پاسخ</Button>}</Card>)}{!reviews.data?.items.length ? <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">هنوز نظری ثبت نشده است.</p> : null}</div>}</div></main>;
}
