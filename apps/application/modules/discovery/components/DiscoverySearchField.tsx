import { Icon } from "@theme/icon";

export function DiscoverySearchField({
  value,
  onChange,
  placeholder = "جست‌وجو...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="app-field app-reveal flex items-center gap-3 text-muted">
      <Icon name="magnifying-glass" size={20} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
      />
    </label>
  );
}
