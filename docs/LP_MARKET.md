# Wall Street del Tilt (LP market)

* **Registry seed (11 Riot IDs)** lives in `shared/domain/lp.ts` (`INITIAL_LP_PLAYERS`). Unicode is preserved and `parseRiotId` is tested.
  Demo data **never** uses these real IDs, so no fake stats are attributed to real people.
* **Missing data is `null`, never 0.** `formatLpDelta(null)` returns "s/d". `sumKnown` reports how many values are missing.
* **Queues:** Solo/Duo, Flex. Per entry it stores start/end rank, LP change, games, quality
  (`COMPLETE | SOURCE_PROVIDED | FALLBACK_BASELINE | PARTIAL | MISSING | ERROR`), source and collection timestamp.

## Calculation methods (Phase 7)
| Method | Rule |
|---|---|
| **DPM-like** | Within the 7-day window (Saturday–Friday, `coverageWindow`): latest score minus first score. |
| **Strict** | Latest score minus the last snapshot *before* the window. If none exists, it falls back to DPM-like and is flagged `FALLBACK_BASELINE`. |

Imports that only contain final deltas are stored as `SOURCE_PROVIDED`, with no fabricated baseline.

## Providers
`ManualImportProvider` (JSON/CSV and pasted output from Divilight's Claude workflow, with validation and preview) comes first.
Future providers: a Divilight provider, an authorized dpm.lol provider and a Riot API provider.
**No bot-protection bypass and no undocumented endpoints.**

"SINCRONIZAR BOLSA LP" explains that sync is unavailable until an authorized provider exists. It never simulates success.

## Public view
`/bolsa-lp` is live with demo data. It shows:
* group total cards
* CVD-safe diverging bars with tooltips
* a weekly total history line
* the full table, with timestamps and source

Only approved and frozen snapshots are published.
