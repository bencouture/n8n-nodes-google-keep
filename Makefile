.DEFAULT_GOAL:=help

##@ General

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: install
install: ## Install dependencies.
	npm install

.PHONY: lint
lint: install ## Run eslint against nodes/ and credentials/.
	npm run lint

.PHONY: test
test: install ## Run the Jest test suite.
	npm test

##@ Build

.PHONY: build
build: install ## Compile TypeScript and copy icon assets to dist/.
	npm run build

.PHONY: clean
clean: ## Remove build output.
	rm -rf dist
