"use client";

import { Input as HeroInput } from "@heroui/react";
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
      <HeroInput
        type="search"
        maxLength={200}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={navigates}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
      />
      {!navigates && value ? (
        <button
          type="button"
          aria-label="پاک‌کردن جست‌وجو"
          onClick={() => onChange("")}
          className="grid size-8 shrink-0 place-items-center rounded-full outline-none hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Icon name="close-x" size={16} />
        </button>
      ) : null}
    </label>
  );
}
