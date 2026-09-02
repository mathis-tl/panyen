# Panyen Context

Context consolidated on 2026-09-01 from `CLAUDE.md`, `README.md`, `docs/CONTEXTE.md`, `docs/SOURCES.md`, and `ROADMAP.md`.

## Project in one line

`panyen` is a static data site that answers one question: since the 2022 measured price gap between Martinique and mainland France, has the gap widened or narrowed?

## Methodological frame

- The site compares evolutions, not price levels, because each CPI index is base-100 on its own territory.
- The only known level gap comes from the Insee 2022 spatial comparison survey.
- Any extrapolation of today's level gap is an estimate and must be labeled as such.
- Fuel is the exception where real monthly prices exist, but Martinique and mainland France still follow different pricing regimes.

## Current source-of-truth files

- `CLAUDE.md`: session rules, non-negotiables, known verified facts, out-of-scope decisions.
- `docs/CONTEXTE.md`: why the project exists, what it can and cannot answer, glossary, exclusions.
- `docs/SOURCES.md`: verified source inventory, exact endpoints, confirmed idbanks, what each source does not provide.
- `ROADMAP.md`: milestone plan and definitions of done.
- `README.md`: public framing of guarantees, limitations, and decisions.

## Engineering shape

- Pipeline target: `Insee + fuel data -> DuckDB + dbt -> Parquet -> static page using DuckDB-WASM`.
- No server.
- `ingest/` writes raw timestamped inputs only.
- dbt layering is expected to be `stg_ -> int_ -> fct_/dim_`.
- If a dbt quality test fails, nothing new is published.

## User-facing rules that should affect implementation guidance

- French everywhere: file names, columns, comments, and responses unless requested otherwise.
- One subject at a time.
- Evidence first, then 2-3 scoped options, then wait for Mathis before implementation when the task is in analysis mode.
- Any doubtful line or missing month must fail loudly, never be silently repaired.
- Provenance must survive end to end: source id, raw file, and collection time must remain traceable.

## Known project facts already established

- Insee SDMX is open and usable without a key.
- Confirmed 2025-base idbanks already include food for Martinique and France, plus Martinique energy.
- The "nine-rank rule" is a working heuristic for finding related idbanks and still needs confirmation for some categories.
- National fuel open data contained 9,915 stations on 2026-08-29 and zero DOM station entries; this absence is part of the domain reality, not a data-quality hole.
- Bouclier Qualité Prix is intentionally excluded because it does not provide per-product price series.

## Frontend constraints already chosen

- The front must not imply direct index-level comparison between territories.
- Substantial frontend work should stay anti-slop: choose maintained libraries, keep motion sparse and purposeful, and reserve animation budget for rare state changes.
- For this repo, a data-first UI matters more than decorative interaction.
