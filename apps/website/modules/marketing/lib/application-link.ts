/** Keep product links on the configured application host. */
export function applicationLink(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APPLICATION_URL ?? "https://app.gym4me.ir";
  return `${base.replace(/\/$/, "")}${path}`;
}
