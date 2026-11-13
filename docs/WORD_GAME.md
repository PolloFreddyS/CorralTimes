# El Palabrero del Corral ("Adivina el tilt")

This is an original five-letter word game. It uses none of Wordle's branding, art or code.

* **Rules:** 5 letters, 6 attempts, per-letter feedback that handles duplicates correctly (two passes, `scoreGuess`).
* **Normalization:** uppercase; accents and diaeresis removed; **Ñ is its own letter**; only A–Z and Ñ allowed.
* **Accessibility:** feedback uses color + icon + dashed border (✓ correct, ◉ present, – absent). Every cell and key has an ARIA label.
  It works with a physical keyboard and an on-screen keyboard (with Ñ).
* **Privacy:** no accounts. Progress is stored only in `localStorage` under `ct:palabrero:<puzzleId>`
  (edition-specific). It contains guesses and feedback, never the answer.
* **Sharing:** an emoji grid plus the score and URL. No letters are included.

## Secrecy
* The answer exists only in the Worker. `GET /api/public/puzzles/:id` returns `{id, editionNumber, length, maxAttempts, clue}`.
* `POST …/guess` returns only `{guess, feedback, solved}`.
* The dictionary lives server-side. Unknown words return `422 NOT_IN_DICTIONARY`.
* `scripts/check-bundle-secrets.mjs` fails the build if a demo answer appears in `dist/client`.
* Activation windows are enforced, so unreleased puzzles return 404.
* **Limitation:** with a small public word list, someone determined can brute-force the answer by automated guessing.
  Rate limiting (Phase 8, Workers rate-limit binding) raises the cost but cannot guarantee secrecy.
  After expiry the answer may be revealed.

## Dictionary
Phase 1 has a ~250-word demo list plus a few community terms (`worker/puzzles/dictionary.ts`). Phase 8 replaces it with a
validated, licensed Spanish word list plus admin-managed community terms.
