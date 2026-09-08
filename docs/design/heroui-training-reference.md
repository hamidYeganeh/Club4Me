# Training UI — HeroUI Community kit reference

Source: user-provided `HeroUI Figma Kit V3 (Community).fig`, export dated 2026-06-23. The original archive remains outside the repository. No kit source, extracted asset library, or OpenGym code/media is redistributed here.

The archive's canvas was decoded locally using fig-kiwi 0.0.1 with kiwi-schema 0.5.0, raw-deflate schema decoding and Zstandard message decoding. The earlier parser failed on the newer primitive types; upgrading the temporary reader resolved it. This is a component kit, not a ready-made fitness flow. Only the thumbnail was rendered; component properties were inspected from the decoded nodes, not represented as full visual frame verification.

## Verified references and application mapping

| Kit node | Verified values | Use in training |
| --- | --- | --- |
| Button `2218:6174` | Primary/default/md, height 36, radius 24, gap 8, horizontal padding 16 | Existing HeroUI Button and ButtonLink, radius 24; touch targets expanded to at least 44 |
| Button `2218:6187` | Separate hover variant, same geometry | HeroUI's built-in interactive states |
| Card header `3013:10541` | Gap 16, header/content composition | Compound Card.Header, Title, Description, Content and Footer |
| Input `13605:49580` and `13605:49582` | Text/number, radius 12, horizontal padding 12, height 36 | Labeled fields with radius 12 and 44-pixel minimum touch height |
| NumberField `13741:10521` | Default state; hover/focus/filled/error variants exist | Numeric set fields with explicit labels, bounds, and committed values |

Keep the app's Persian font, RTL layout and existing green semantic accent instead of replacing the entire product theme with the kit's default blue. Existing semantic surface/foreground tokens support light and dark modes. Use the app's IranDateInput and Tehran conversion for coach assignment dates. Screen layouts are app-specific, not claimed as pixel-perfect copies of kit templates.

The embedded license describes use in finished applications and restricts redistribution as a design resource. The kit remains an internal reference; source files and extracted component libraries are not shipped.
