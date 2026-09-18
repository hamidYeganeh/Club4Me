"use client";

import { type ReactNode } from "react";
import {
  Ssgoi,
  type SsgoiConfig,
  type SsgoiTransitionRule,
} from "@ssgoi/react";
import { axis, zoom } from "@ssgoi/react/view-transitions";

const routeTransition = axis({ type: "y", variant: "non-directional" });
const authSlideTransition = axis({ type: "x", variant: "snappy" });
const detailTransition = zoom({ type: "expand", variant: "fade" });
const bookingTransition = axis({ type: "z" });

const transitionRules: SsgoiTransitionRule[] = [
  {
    priority: 50,
    on: [
      "/discovery/clubs/:id/slots",
      "/athlete/reservations",
      "/athlete/reservations/:id",
      "/coach/reservations",
    ],
    transition: bookingTransition,
    preserveScroll: { from: true, to: false },
  },
  {
    priority: 40,
    on: [
      "/discovery/clubs/:id",
      "/discovery/clubs/:id/gallery",
      "/discovery/coaches/:id",
      "/discovery/coaches/:id/gallery",
      "/discovery/classes/:id",
      "/discovery/classes/:id/gallery",
      "/discovery/business-class",
      "/discovery/business-classes/:id",
    ],
    transition: detailTransition,
    preserveScroll: { from: true, to: false },
  },
  {
    priority: 30,
    on: "/auth/**",
    transition: authSlideTransition,
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
