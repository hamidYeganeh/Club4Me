import type { CSSProperties, HTMLAttributes } from "react";
import type { DOMMotionComponents, MotionProps } from "@ui/landing-motion";

export const lineShadowTextElements = {
  article: "article",
  div: "div",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  li: "li",
  p: "p",
  section: "section",
  span: "span",
} as const;

export type LineShadowTextElement = keyof typeof lineShadowTextElements;

export interface LineShadowTextProps
  extends Omit<HTMLAttributes<HTMLElement>, keyof MotionProps>, MotionProps {
  children: string;
  shadowColor?: string;
  as?: LineShadowTextElement;
  className?: string;
  style?: CSSProperties;
}

export type LineShadowMotionElement = Extract<
  keyof DOMMotionComponents,
  LineShadowTextElement
>;
