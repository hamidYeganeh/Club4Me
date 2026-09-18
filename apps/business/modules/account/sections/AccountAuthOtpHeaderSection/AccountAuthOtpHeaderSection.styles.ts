import { tv } from "tailwind-variants";

export const accountAuthOtpHeaderSectionStyles = tv({
  slots: {
    root: "mb-6 flex h-12 w-full items-center self-stretch",
    back: "size-11 min-w-11 rounded-full border border-border bg-transparent text-foreground hover:bg-transparent active:bg-transparent data-[hover=true]:bg-transparent data-[pressed=true]:bg-transparent",
  },
});
