# Reference cards in the application

The two supplied boards guide presentation. Their labels and example values are design content, not instructions or application data. Existing brand tokens, Persian typography, RTL, and theme support remain authoritative.

| Reference family | Application placement | Behavior and data |
| --- | --- | --- |
| Activity suggestions | Athlete home recommendations | Sport badge, bottom-aligned title and metadata, trailing arrow. The entire card opens its actual class. Capacity, price, reason and distance come from recommendations. |
| Workout exercise list | Athlete training plan days | Numbered exercise rows with sets, repetitions and weight. The day action starts the existing session, preserving consent and availability checks. |
| Workout results | Athlete and coach exercise library | Muscle badges, equipment metadata, exercise title, existing animation and instructions. Search and filters remain active. |
| Fitness metrics | Training progress and coach training summary | Colored panels for completed sessions, recorded sets and volume, derived from sessions. |
| Workout history | Athlete progress | Session status, date, title and bars for recorded repetitions per completed set. Expandable details preserve weights, repetitions and notes. |
| Notifications | Athlete and coach notifications | Neutral rows with semantic colored icons for success, change/reminder, failure or general events. Read status and destination actions are retained. |
| Pricing plans | Coach service purchases | Plan type badge and title opposite the actual price; package terms and the existing checkout action remain visible. |

Existing settings rows, discovery cards and dashboard metrics already use the shared Sandow adapter. Nutrition, hydration, biometric sensors, AI chat and community cards require corresponding product features and real data; this change does not represent those capabilities as available.

Shared card parts live in `apps/application/components/ui/feature-cards.tsx` and its CSS module. Colors use semantic theme variables and card sizes grow with content. Focus rings, minimum 44px navigation affordances, reduced motion and RTL arrows are included.
