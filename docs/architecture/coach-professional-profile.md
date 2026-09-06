# Coach professional profiles

The professional profile editor at `/coach/profile/professional` saves a structured
`professionalProfile` object through `PATCH /api/v1/coach/profile`. Existing
`bio`, `languages`, `minAcceptedAge` and `maxAcceptedAge` fields are also shown in
public discovery.

The new object contains:

- `audience`, `goals`, `levels` and `prerequisites` for suitability.
- `firstSession`, `planning`, `followUp` and `progressTracking` for the coaching process.
- `introductionVideoUrl`, a public HTTPS link opened on demand.
- `credentials`: title/grade, issuer, year, optional ISO expiration date and attachment.
- `achievements`: title/role, organization/event and year.
- `successStories`: anonymous title, initial goal, duration, outcome and publication consent.

Fields are optional at the profile level. The DTO and Mongoose schema initialize
empty collections for new profiles; public serialization and the editor also
handle existing documents without this object. No data migration is required.

Certificate attachments must be ready media owned by the coach. Their IDs are
omitted from public profile responses and are resolved to viewable URLs for the
administrator's profile details. Media storage itself uses the existing media
access policy. Uploading a certificate or approving a profile does not verify the
certificate's authenticity; the public section states this explicitly. Per-certificate
verification is not implemented by this change.

A success story cannot be submitted unless the coach declares publication consent.
Public serializers also exclude any legacy story without that declaration. This
records the coach's declaration, not independent evidence of consent or outcomes.

Profile saving preserves existing contact links and sport-specific metadata. Sport
replacement is skipped when the selection is unchanged. If the selection changes,
existing certificate references, specialty IDs, experience, achievements and custom
attributes are retained; the service retains verification status when the certificate
set is unchanged. Age validation checks the merged document, including partial updates.

Public discovery search also matches specialty titles, goals and audience text.

Validation covers DTO restrictions, schema defaults, attachment ownership, age
boundaries, preservation of sport verification and public serialization. The mobile
Playwright scenarios cover form save/reload, image attachment, invalid ages, old
profiles, public sections and viewport overflow. During development the shared Next
shell stalled before either page mounted; those same browser scenarios passed in a
temporary Vite harness mounting the real screens with the API and UI providers.
