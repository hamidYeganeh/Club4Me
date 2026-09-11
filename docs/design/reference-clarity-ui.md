# Reference-inspired clarity pass

The supplied Iconly screenshots are visual references. Their promotional copy, branding, sample balances, and unrelated product actions are not application requirements or assets.

Implemented using Gym4Me's existing theme tokens, Persian text, RTL layout, icons, and HeroUI components:

- **Floating navigation** — references 5, 11, 16, and 32: contained surface, clear selected destination, and a separate accent action within the existing five-item navigation. Role destinations, safe-area handling, and keyboard hiding remain intact.
- **Wallet** — references 1, 17, 20, 24, and 36: prominent balance, quiet reserved-credit detail, tactile copy control, and compact signed transactions with dates. Empty history offers the existing referral-code action.
- **Training** — references 12, 14, 16, 22, and 28: compact summaries, one accent, actual active days out of the last 28 days, and selectable daily counts. This is an activity summary, not an invented fitness goal.
- **Notifications** — references 6 and 26: count badges and a themed empty-state illustration with a route to the user's reservations. Read/unread filter names remain stable for assistive technology.
- **Upload** — reference 8: larger upload symbol, accent-colored transfer progress, and 44px remove/retry controls with keyboard focus indicators.
- **Quick access** — references 21 and 40: consistent icon tiles and restrained surface borders.

Shared `VisualEmptyState` and `ProgressMeter` components support this visual vocabulary. All new surfaces use existing accent, background, border, foreground, and radius tokens. No new dependencies or external assets were added.

Validation: application and UI package type checks, lint on edited components, mobile wallet recovery, notification read/filter flow, home next-action navigation in both themes, and offline training completion/sync. Wallet, notification, and progress layouts were also checked at 320, 375, and 820px in light and dark modes.
