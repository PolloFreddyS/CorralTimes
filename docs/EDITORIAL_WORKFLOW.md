# Editorial workflow

```
Submission:  SUBMITTED → UNDER_REVIEW → NEEDS_INFORMATION ↔ UNDER_REVIEW → APPROVED | REJECTED → ARCHIVED
Article:     EDITORIAL_DRAFT → READY_FOR_LAYOUT → READY_FOR_PUBLICATION ─(edition publish)→ PUBLISHED → ARCHIVED
Edition:     DRAFT → IN_REVIEW → READY → SCHEDULED → PUBLISHED → ARCHIVED   (PUBLISHED → READY = emergency unpublish)
```

Source: `shared/domain/submission.ts` and `shared/domain/workflow.ts`, both unit-tested.

Pastoral columns (La Voz del Pastor) follow the **same article lifecycle** (category `PASTORAL`). They also require a verified passage before approval. See [PASTORAL.md](PASTORAL.md).

Rules:
* Approving a submission does **not** create or publish an article. An admin decides.
* An article becomes PUBLISHED only when its edition is published, which freezes a snapshot.
* Evidence (the submission) is never overwritten by satire. The two live in separate tables.
* Stories are never carried over automatically from previous editions.
* Changing a published edition creates a new `edition_revisions` row. Published LP data is never silently modified.

The weekly 13 steps (spec v2 §23) map to these modules:

| Steps | Module |
|---|---|
| 1 | Press Pass |
| 2 | Buzón de Chismes |
| 3 | Mesa Editorial |
| 4 | La Imprenta |
| 5–7 | Creative Studio |
| 8 | Wall Street del Tilt + Power Rankings |
| 9 | El Palabrero |
| 10–11 | Centro de Publicación |
| 12 | Permanent `/ediciones/:slug` URL |
| 13 | WhatsApp announcement |
