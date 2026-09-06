import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@theme/provider";
import { faMessages } from "@i18n/messages";
import { ApplicationShell } from "@/components/application-shell";
import { NativeRoutes } from "./routes";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <NextIntlClientProvider
      locale="fa"
      timeZone="Asia/Tehran"
      messages={faMessages}
    >
      <ApplicationShell>
        <NativeRoutes />
      </ApplicationShell>
    </NextIntlClientProvider>
  </ThemeProvider>,
);
