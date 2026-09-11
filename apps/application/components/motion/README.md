# Application motion

Preserve the app's Sandow surfaces, accent palette, Persian typography, RTL layout,
control radii and existing API behavior when adapting registry components.

## Implemented

- `active-indicator.tsx`: adapted from the inspected [beUI tabs registry](https://beui.dev/r/tabs.json), used by bottom navigation and saved-item filters. Links retain navigation semantics; filters retain `aria-pressed` and native keyboard activation.
- Existing [beUI bottom sheet](https://beui.dev/components/motion/bottom-sheet) and report feedback adaptation now use shared timing.
- Expandable metric cards, onboarding checklist, welcome copy and chart entry defaults use the same easing.
- `AppMotionProvider` supplies Motion defaults and respects the system motion preference, including React portals.
- SSGOI route rules use the same fade/rise effect while retaining their scroll-restoration rules.

`lib/ease.ts` is the timing source for React/Motion and GSAP. `app/motion.css`
mirrors it for CSS: 160ms feedback, 240ms controls, 320ms reveals, 480ms chart entry.
Use the shared transitions instead of adding a library's default bounce or timing.
Gesture inertia and continuous data/loading animations have distinct functional
purposes; don't replace those with fixed-duration transitions.

## Other requested references

[Bklit](https://bklit.com/docs) is already configured in `components.json` for charts.
[SmoothUI](https://smoothui.dev/docs/components/animated-tabs) was reviewed for
selection indicators and reduced-motion behavior. The new indicator comes from
beUI; it is not a SmoothUI installation.

[Ripplix](https://www.ripplix.com/) and
[FreeFrontend](https://freefrontend.com/ui-micro-interaction/) are visual references,
not runtime dependencies. OpenUI, Watermelon UI and Motion Primitives pages could
not be reliably retrieved during this pass; Amicro did not expose readable source.
No component from those sources is claimed as installed. Choose sources per
feature rather than installing every library into the app.
