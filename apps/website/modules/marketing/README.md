# Gym4Me landing page

The homepage uses the source Gym4Me section components, responsive style files, local imagery, phone mockup, and scoped Persian copy. Shared theme colors resolve to this workspace's theme tokens.

Animations use the existing UI package's Motion runtime, CSS transitions, and native scroll observers. Native scrolling replaces Swiper and GSAP: the hero rail uses scroll snap, hero/coach parallax follows section progress, and the phone uses a sticky section with scroll-driven content. Reduced motion disables decorative movement and leaves the phone manually scrollable.

`NEXT_PUBLIC_APPLICATION_URL` selects the app destination (default `https://app.gym4me.ir`). Store buttons use `NEXT_PUBLIC_APP_STORE_URL` and `NEXT_PUBLIC_PLAY_STORE_URL`; unconfigured store buttons remain disabled. The contact form opens an email draft for review and does not simulate a successful server submission.

Run `npm run dev --workspace=website`, `npm run lint --workspace=website`, `npm run check-types --workspace=website`, and `npm run build --workspace=website` from the repository root.
