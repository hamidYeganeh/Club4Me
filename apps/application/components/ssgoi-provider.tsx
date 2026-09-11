"use client";

import { type ReactNode } from "react";
import {
  Ssgoi,
  type SsgoiConfig,
  type SsgoiTransitionRule,
} from "@ssgoi/react";
import { axis } from "@ssgoi/react/view-transitions";

// One quiet fade/rise for route changes; route rules still own scroll restoration.
const routeTransition = axis({ type: "y", variant: "non-directional" });

const transitionRules: SsgoiTransitionRule[] = [
  {
    priority: 30,
    on: [
      "/discovery/clubs/:id",
      "/discovery/clubs/:id/**",
      "/discovery/coaches/:id",
      "/discovery/coaches/:id/**",
      "/discovery/classes/:id",
      "/discovery/classes/:id/**",
      "/discovery/business-class",
      "/discovery/business-classes/:id",
    ],
    transition: routeTransition,
    preserveScroll: { from: true, to: false },
  },
  {
    priority: 20,
    on: "/discovery/map",
    transition: routeTransition,
  },
  {
    priority: 20,
    on: "/*/profile/edit",
    transition: routeTransition,
  },
  {
    priority: 20,
    on: "/*/profile/image",
    transition: routeTransition,
  },
  {
    on: "/auth/**",
    except: "/auth",
    transition: routeTransition,
  },
  {
    on: "/welcome/**",
    except: "/welcome",
    transition: routeTransition,
  },
  {
    ordered: [
      "/athlete",
      "/discovery",
      "/athlete/reservations",
      "/athlete/profile",
    ],
    transition: routeTransition,
  },
  {
    ordered: ["/coach", "/discovery", "/coach/reservations", "/coach/profile"],
    transition: routeTransition,
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
