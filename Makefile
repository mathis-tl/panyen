.PHONY: install verify ci dev publier

install:
	uv sync --locked
	npm --prefix web ci
	mkdir -p build

verify:
	uv run ruff check .
	uv run pytest
	mkdir -p build
	uv run dbt debug --project-dir dbt --profiles-dir dbt
	uv run dbt build --project-dir dbt --profiles-dir dbt --select stg_ipc+ ecsp_alimentation_2022+
	npm --prefix web run test
	npm --prefix web run build

ci:
	$(MAKE) install
	UV_LOCKED=1 $(MAKE) verify

publier:
	uv run python publication/publier_differentiel_ipc.py

dev:
	npm --prefix web run dev
