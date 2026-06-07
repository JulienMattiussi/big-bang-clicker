default: help

help: ## Display available commands
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	npm install

start: ## Start application in development
	npm run dev

build: ## Build application for production
	npm run build

preview: build ## Preview production build locally
	npm run preview

lint: ## Run ESLint
	npm run lint

format: ## Format code with Prettier
	npm run format

format-check: ## Check formatting with Prettier
	npm run format:check

typecheck: ## Run TypeScript type checker
	npx tsc -b --noEmit

test: test-unit ## Run all tests (alias for unit tests)

test-unit: ## Run unit and component tests
	npm run test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage report
	npm run test:coverage

test-e2e: ## Run e2e tests with Playwright (installs Chromium on first run)
	npx playwright install chromium
	npm run test:e2e

test-e2e-ui: ## Run e2e tests with Playwright UI
	npm run test:e2e:ui

.PHONY: sim sim-view
sim: ## Run balance simulations (writes sim/results/*.json); play the game meanwhile
	npx vitest run --config sim/vitest.sim.config.ts

sim-view: ## Show the simulation viewer URL (needs `make start` running)
	@echo "Viewer : http://localhost:1138/sim/viewer/  (lance 'make start' si besoin)"

fix: format lint ## Format and lint all code

check: build lint typecheck test-unit ## Run all checks (build, lint, typecheck, unit tests)
	@echo "All checks passed!"

clean: ## Remove build artifacts and dependencies
	rm -rf dist node_modules
