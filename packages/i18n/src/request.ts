import { getRequestConfig } from "next-intl/server";

import { defaultLocale, timeZone } from "./config";
import { faMessages } from "./locales/fa/messages";

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages: faMessages,
  timeZone,
}));
