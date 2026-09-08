"use client";

import { type ReactNode } from "react";
import {
  Ssgoi,
  type SsgoiConfig,
  type SsgoiTransitionRule,
} from "@ssgoi/react";
import { axis, drill, sheet, zoom } from "@ssgoi/react/view-transitions";

const transitionRules: SsgoiTransitionRule[] = [
  {
    priority: 20,
    from: "/discovery",
    to: "/discovery/clubs/:id",
    transition: zoom({ type: "blur", variant: "fade" }),
  },
  {
    priority: 20,
    on: "/discovery/map",
    transition: axis({ type: "y" }),
  },
  {
    priority: 20,
    on: "/*/profile/edit",
    transition: sheet({ type: "static" }),
  },
  {
    priority: 20,
    on: "/*/profile/image",
    transition: sheet({ type: "static" }),
  },
  {
    on: "/auth/**",
    except: "/auth",
    transition: drill(),
  },
  {
    on: "/welcome/**",
    except: "/welcome",
    transition: drill(),
  },
  {
    ordered: [
      "/athlete",
      "/discovery",
      "/athlete/reservations",
      "/athlete/profile",
    ],
    transition: axis({ type: "y", variant: "non-directional" }),
  },
  {
    ordered: ["/coach", "/discovery", "/coach/reservations", "/coach/profile"],
    transition: axis({ type: "y", variant: "non-directional" }),
  },
];

const config: SsgoiConfig = {
  transitions: () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? []
      : transitionRules,
};

type SsgoiProviderProps = {
  children: ReactNode;
};

export function SsgoiProvider({ children }: SsgoiProviderProps) {
  return <Ssgoi config={config}>{children}</Ssgoi>;
}
