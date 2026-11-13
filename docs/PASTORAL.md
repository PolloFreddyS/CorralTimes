# La Voz del Pastor — “Una pausa entre el caos y el tilt”

This is a permanent Christian faith and reflection section. **It is not satire.** It has its own warm visual tone, it never
appears in the satirical grids or among "related" satire articles, and it uses its own Creative Studio rules.
"Filipenses 4:13" stays as the newspaper's permanent header reference.

## Model: an extension of the article system
A pastoral column is an **article with `category = PASTORAL`**, so it shares approval, revisions, edition assignment,
publication snapshots, audit and security with all other content. The structured extra lives in one 1:1 table,
`article_pastoral_details`, defined in `shared/domain/pastoral.ts`:

* **Reference:** `bookCode`, `chapter`, `verseStart`, `verseEnd`
* **Translation:** `translationCode`
* **Passage:** `passageMode` (`QUOTATION` | `PARAPHRASE`) and `passageText`
* **Content:** `theme`, `applications[]`, `prayerInvitation`, `prayerPrivacy`
* **Verification:** `verified`, `verifiedBy` (admin UUID), `verifiedAt`, `source`

The reflection is the article body: the same closed, structured document. It also gains a `scripture` block for any
additional passage, which must be marked as a quotation or a paraphrase. The illustration uses `PASTORAL_ILLUSTRATION` media.

## Scripture accuracy rules (enforced in code)

| Rule | Where |
|---|---|
| The reference must name one of the 66 canonical books, with a chapter within the book's range | `parseBibleReference` (`shared/domain/bible.ts`) |
| The exact verse number and the text are verified **by a person** | Mesa Pastoral verification checkbox + required source |
| An unverified **quotation** cannot be approved, and `toPublicPastoralDetails` throws if one reaches publishing | `validatePastoralDraft`, `toPublicPastoralDetails` |
| A paraphrase cannot contain quotation marks. It is rendered without `<blockquote>`, labeled "Paráfrasis de … · no es cita textual" | validator + `ScripturePassage` |
| Every passage displays its reference and translation, plus a translation notice. Reflections are labeled as commentary, not Scripture | `PastoralColumn` footer |
| The app never generates Bible text | no code path creates verse text |

## Translations & copyright
Registered translations: RVR1909 (public domain), RVR1960, NVI, NTV, LBLA, DHH (all copyrighted).

The app policy allows at most **10 consecutive quoted verses per column** for copyrighted translations, and 30 for RVR1909.
A copyright notice is always shown. **This is not legal advice.** Before production, the owner should confirm each publisher's
quotation terms (and the exact notice wording) and adjust `BIBLE_TRANSLATIONS`.

## Prayer & privacy
The prayer invitation is general. Approval requires declaring either that it contains no private requests, or that the person
gave explicit permission (consent recorded). The public contract omits the privacy flag and the verifier's identity. There is no
reader account and no prayer-request intake in this release.

## Public experience
* **Front page band:** placed right after the lead story, in a distinct warm style, showing the verse + reference + translation,
  the title, and a link.
* **Full column** at `/ediciones/:edition/:slug`. Order: header ornament, theme/date, title, the week's passage, illustration,
  reflection, "Para vivirlo esta semana", "Invitación a orar", translation notice.
* **Archive** at `/la-voz-del-pastor`, filterable by book, theme and year (date).
* No account is needed. Pages have their own Open Graph description: "La Voz del Pastor · <reference>".

## Mesa Pastoral (HQ)
Live validation as the column is edited:
* reference parsing with book autocomplete
* translation picker showing its license
* quotation / paraphrase choice
* word-by-word verification with a required source
* verse-count limit, title, theme, reflection, applications (up to 5), prayer invitation + privacy declaration
* a preview using the **same component the public sees**, and the archive

**Phase 4:** saving, revisions and approval (the button is disabled until then).

## Publication readiness
`evaluateReadiness` has a `pastoral` check:

| State | Result |
|---|---|
| No column | info (optional) |
| Column in the edition but not approved | **blocker** |
| Approved but passage unverified | **blocker** |
| Approved and verified | ok |

## Creative Studio
The `PASTORAL_ILLUSTRATION` role is 3:2 (1536×1024). The brief replaces the humor rules with the Creative Bible's `pastoral.tone`
and adds pastoral prohibitions: no caricature of sacred figures, no memes/LP/gaming humor, no Scripture text inside the image,
and no invented verses. It carries the verified reference, never the verse text.

## Demo content
The demo shows Filipenses 4:13 quoted from the **Reina-Valera 1909 (public domain)** and Mateo 11:28 as a **paraphrase**.
The reflections are respectful sample texts, marked as samples.
