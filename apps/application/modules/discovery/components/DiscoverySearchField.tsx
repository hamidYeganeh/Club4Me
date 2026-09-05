"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@theme/icon";

export function DiscoverySearchField({
  value,
  onChange,
  placeholder = "جست‌وجو...",
  href,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  href?: string;
}) {
  const router = useRouter();
  const navigates = Boolean(href);

  return (
    <label
      className="app-field app-reveal flex items-center gap-3 text-muted"
      onClick={() => {
        if (href) router.push(href);
      }}
    >
      <Icon name="magnifying-glass" size={20} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={navigates}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
      />
    </label>
  );
}
