"use client";
import { useEffect, useState } from "react";
import { trainingApi } from "@api/domains/training";
import { useIdentity } from "./shared";

export function ExerciseAnimation({ id, name }: { id: string; name: string }) {
  const identity = useIdentity();
  return <AnimationSession key={`${identity}:${id}`} id={id} name={name} />;
}
function AnimationSession({ id, name }: { id: string; name: string }) {
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const abort = new AbortController();
    let objectUrl = "";
    trainingApi
      .animation(id, abort.signal)
      .then((blob) => {
        if (abort.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      });
    return () => {
      abort.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, id]);
  return (
    <div className="space-y-2">
      {url && (
        <video
          aria-label={`انیمیشن ${name}`}
          src={url}
          muted
          autoPlay
          loop
          playsInline
          controls
          controlsList="nodownload"
          preload="metadata"
          className="aspect-video w-full rounded-xl bg-surface-secondary"
        />
      )}
      {enabled && !url && !error && <p role="status">در حال دریافت انیمیشن…</p>}
      {error && (
        <p role="alert">
          انیمیشن دریافت نشد؛ اتصال را بررسی و دوباره تلاش کنید.
        </p>
      )}
      <button
        type="button"
        className="rounded-lg border border-border px-3 py-2 text-sm"
        onClick={() => {
          setError(false);
          setUrl("");
          setEnabled(!enabled);
        }}
      >
        {enabled ? "بستن انیمیشن" : "نمایش انیمیشن حرکت"}
      </button>
    </div>
  );
}
