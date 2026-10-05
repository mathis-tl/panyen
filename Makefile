.PHONY: install verify ci dev publier publier-contexte \
	collecter-carburants-national collecter-arretes-martinique collecter-carburants \
	verifier-carburants publier-carburants carburants

install:
	uv sync --locked
	npm --prefix web ci
	mkdir -p build

verify:
	uv run ruff check .
	uv run pytest
	mkdir -p build
	uv run dbt debug --project-dir dbt --profiles-dir dbt
	uv run dbt build --project-dir dbt --profiles-dir dbt --select stg_ipc+ ecsp_alimentation_2022+ ecsp_niveaux+ ecsp_alimentation_formules+ revenus_ecart_national+ evenements_contexte+
	npm --prefix web run test
	npm --prefix web run build

ci:
	$(MAKE) install
	UV_LOCKED=1 $(MAKE) verify

publier:
	uv run python publication/publier_differentiel_ipc.py

publier-contexte:
	uv run python publication/publier_seeds_contexte.py

collecter-carburants-national:
	uv run python ingest/prix_carburants_national.py

collecter-arretes-martinique:
	uv run python ingest/arretes_carburants_martinique.py

collecter-carburants: collecter-carburants-national collecter-arretes-martinique

verifier-carburants:
	mkdir -p build
	uv run dbt build --project-dir dbt --profiles-dir dbt --select stg_carburants+ stg_arretes+ stg_insee_carburants+ prix_max_carburants_martinique+

publier-carburants:
	uv run python publication/publier_carburants.py

carburants: collecter-carburants publier-carburants

dev:
	npm --prefix web run dev
