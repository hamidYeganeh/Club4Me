"use client";
import { useLandingScroll } from "./landing-scroll";
export function useScrollSmootherReady() {
  return useLandingScroll().smootherReady;
}
