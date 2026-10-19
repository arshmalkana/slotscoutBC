# SlotScout pipeline commands (Addendum A 10.2). Each is safe to re-run and resumes where it stopped.
# Run on the host, or in the ingest container: docker compose run --rm ingest make <command>
PIPE := npx tsx packages/pipeline/src/cli.ts
MONTH ?=

.PHONY: help install pull split queue extract build validate review-packet test release report monthly status approve signoff up down logs

help:
	@echo "pull split queue extract build validate review-packet test report monthly status release"
	@echo "people only: approve ITEM=<id> BY=<initials> [DECISION=approve|reject NOTE=...], signoff BY=<name>"

install:
	npm ci

pull:
	$(PIPE) pull $(if $(MONTH),--month $(MONTH)) $(ARGS)

split:
	$(PIPE) split $(if $(MONTH),--month $(MONTH))

queue:
	$(PIPE) queue $(if $(MONTH),--month $(MONTH))

extract:
	$(PIPE) extract $(if $(MONTH),--month $(MONTH)) $(ARGS)

build:
	$(PIPE) build $(if $(MONTH),--month $(MONTH))

validate:
	$(PIPE) validate

review-packet:
	$(PIPE) review-packet $(if $(MONTH),--month $(MONTH))

test:
	npx vitest run
	$(PIPE) test $(if $(MONTH),--month $(MONTH))

report:
	$(PIPE) report $(if $(MONTH),--month $(MONTH))

status:
	$(PIPE) status

monthly:
	$(PIPE) monthly $(if $(MONTH),--month $(MONTH))

release:
	$(PIPE) release $(if $(MONTH),--month $(MONTH))

# People only. Claude Code never runs these (CLAUDE.md).
approve:
	$(PIPE) approve --item "$(ITEM)" --by "$(BY)" --decision "$(or $(DECISION),approve)" --note "$(NOTE)"

signoff:
	$(PIPE) signoff --by "$(BY)" $(if $(MONTH),--month $(MONTH))

# Containers
up:
	docker compose up -d --build web

down:
	docker compose down

logs:
	docker compose logs -f web
