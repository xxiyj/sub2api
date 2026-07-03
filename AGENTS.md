# AGENTS.md

This file is for AI coding agents working in this repository.

## Project Identity

This repository is a customized fork of `Wei-Shaw/sub2api`.

At its core, Sub2API is an AI API gateway platform that:

- manages upstream AI accounts
- exposes gateway-compatible APIs to downstream users
- handles authentication, routing, billing, quotas, rate limits, payments, and admin operations

This fork adds a strong second concern:

- long-term maintenance of a **template/custom deployment branch**
- custom binary build, release, update, and rollback workflows

Do not treat this repo as a greenfield app. It is an actively maintained upstream fork with local template workflow overlays.

## Branch Model

This repo uses a two-line model documented in `docs/TEMPLATE_WORKFLOW_CN.md`.

- `main`: tracks upstream as cleanly as possible
- `my-template`: holds local template/custom operational changes

Expected maintenance flow:

1. sync `upstream/main` into local `main`
2. merge `main` into `my-template`
3. resolve conflicts only on `my-template`

If you are making local changes, assume they usually belong on `my-template`, unless the user explicitly asks otherwise.

## Recent Repository Direction

Recent git history shows the fork is currently focused on template deployment operations, especially:

- custom release workflow
- custom binary update workflow
- custom binary rollback workflow
- upstream sync reliability

When choosing where to edit, prefer preserving this repo's role as a maintainable upstream-following fork.

## Must-Read Files Before Editing

Read these first when relevant:

- `README.md`
- `README_CN.md`
- `DEV_GUIDE.md`
- `docs/TEMPLATE_WORKFLOW_CN.md`
- `deploy/README.md`
- `docs/PAYMENT_CN.md` or `docs/PAYMENT.md` when touching payments
- `deploy/config.example.yaml` when touching configuration behavior

For code generation or backend schema work, also inspect:

- `backend/Makefile`
- `backend/go.mod`
- `backend/ent/schema/`
- `backend/cmd/server/main.go`

For frontend work, inspect:

- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/src/main.ts`
- `frontend/src/router/index.ts`

## High-Level Architecture

### Backend

- language: Go
- entrypoint: `backend/cmd/server/main.go`
- web framework: Gin
- ORM/schema: Ent
- DI/codegen: Wire
- major layers:
  - `internal/server/routes`: route registration
  - `internal/handler`: HTTP handlers
  - `internal/service`: business logic
  - `internal/repository`: data access support
  - `ent/schema`: persistent model definitions

### Frontend

- framework: Vue 3
- build tool: Vite
- state: Pinia
- router: Vue Router
- package manager: `pnpm`

Frontend build artifacts are emitted into:

- `backend/internal/web/dist`

That means frontend changes that must ship inside the backend binary require a frontend build before backend embed builds.

## Sub2API Directory Structure

Use this as the quick map of the repository before editing.

```text
sub2api/
├── .github/         # CI workflows and repository automation
├── assets/          # logos, partner images, and other static branding assets
├── backend/         # Go backend service
│   ├── cmd/         # executable entrypoints
│   ├── ent/         # Ent schema and generated ORM code
│   ├── internal/    # backend application logic
│   ├── migrations/  # database migration files and migration docs
│   ├── resources/   # packaged backend resources
│   └── scripts/     # backend helper scripts
├── deploy/          # deployment files, Docker/systemd/update/rollback scripts
├── docs/            # project docs, payment docs, template workflow docs, legal docs
├── frontend/        # Vue frontend
│   ├── public/      # public static frontend assets
│   └── src/         # frontend source code
├── scripts/         # repository-level helper scripts
├── skills/          # local skill/plugin-related assets
├── tools/           # maintenance/build helper tools
├── AGENTS.md        # instructions for AI coding agents
├── DEV_GUIDE.md     # local developer notes and environment caveats
├── README.md        # English project overview
├── README_CN.md     # Chinese project overview
└── README_JA.md     # Japanese project overview
```

### Important Subdirectories

#### `backend/internal/`

Primary backend implementation area, including:

- config loading
- HTTP handlers
- route registration
- services and business logic
- setup/runtime behavior

Treat this as core product logic, not template-only surface.

#### `frontend/src/`

Primary frontend implementation area, including:

- `api/` for API wrappers
- `components/` for reusable UI pieces
- `views/` for page-level UI
- `router/` for route definitions and guards
- `stores/` for Pinia state

Some parts of `frontend/src/` are template-friendly, but many parts are core behavior.

#### `deploy/`

This fork's most important local customization area for operational workflows:

- Docker deploy files
- binary install files
- custom update/rollback scripts
- service unit files

#### `docs/`

Contains:

- product/operator docs
- payment docs
- template branch maintenance workflow
- compliance/legal docs

## Template-Only Editing Rule

Default editing policy for this fork:

- prefer changing template-surface files first
- avoid changing core upstream behavior unless the user confirms

### Safe-by-default template scope

Prefer to stay within these files/directories whenever the request can reasonably be solved there:

- `frontend/src/components/layout/`
- `frontend/src/style.css`
- `frontend/public/`
- `assets/`
- `docs/`
- `deploy/`
- `scripts/`
- `AGENTS.md`

These are the primary places for:

- branding
- layout shell changes
- static assets
- deployment/operator workflow customization
- local fork documentation

### Confirm before changing core behavior

If the task requires editing any of the following, ask the user for confirmation first:

- `backend/`
- `frontend/src/api/`
- `frontend/src/views/`
- `frontend/src/router/`
- `frontend/src/stores/`
- `frontend/src/composables/`
- `frontend/src/main.ts`
- `frontend/src/App.vue`

Reason: these files usually affect real product behavior, upgrade compatibility, or upstream merge difficulty.

### How to decide

Ask yourself:

1. Can this be solved by changing layout, styling, assets, deploy files, or docs only?
2. If yes, stay in template scope.
3. If no, stop and get confirmation before changing core logic files.

## Agent Operating Rules

### 1. Respect the fork nature of the repo

Do not casually refactor core upstream structure unless the user explicitly asks.

Prefer:

- small, localized changes
- patterns already present in upstream code
- changes that are easy to merge across future upstream updates

Avoid:

- large renames
- broad architectural rewrites
- cosmetic churn across many upstream files

### 2. Prefer existing local workflows

This repo already has documented workflows for:

- upstream sync
- custom release creation
- custom binary deployment
- rollback

If the user asks about deployment or updating production, prefer those documented custom workflows over inventing a new one.

In particular, for template/custom production deployments, be careful with the official upstream upgrade path. The local docs explicitly warn that official binary upgrade flows can overwrite custom template builds.

### 3. Assume the working tree may be dirty

Do not revert unrelated user changes.

Before editing:

- check `git status --short`
- identify whether touched files already contain local modifications
- work with existing changes instead of overwriting them

### 4. Use the right package/build tools

- frontend package manager: `pnpm`, not `npm`
- backend build/test: `go`
- schema/codegen work: regenerate Ent and Wire when needed

### 5. Keep docs aligned with real file locations

This repo has local documentation overlays. When editing docs, verify links and paths actually match the repository layout in this fork.

## Common Commands

### Repo inspection

```bash
git status --short
git log --oneline --decorate -n 20
rg --files
```

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
pnpm run build
pnpm run lint:check
pnpm run typecheck
pnpm run test:run
```

### Backend

```bash
cd backend
go run ./cmd/server
go test -tags=unit ./...
go test -tags=integration ./...
golangci-lint run ./...
```

### Code generation

```bash
cd backend
go generate ./ent
go generate ./cmd/server
```

### Root shortcuts

```bash
make build
make test
```

## Change-Specific Guidance

### Common Customization Hotspots

If a request sounds like "template adjustment", "branding", "custom fork behavior", or "local deployment workflow", inspect these areas first.

### Branding and UI shell

- `frontend/src/components/layout/`
- `frontend/src/style.css`
- `frontend/src/App.vue`
- `frontend/src/views/`
- `frontend/public/`
- `assets/`

These are the most likely places for local template differentiation such as:

- layout changes
- color/theme overrides
- navigation changes
- logos and other static assets
- user-facing entry flow adjustments

This fork already appears to carry local UI shell edits, so read diffs carefully before touching them.

### Embedded frontend delivery

- `frontend/vite.config.ts`
- `backend/internal/web/`
- `backend/cmd/server/main.go`

If a frontend change is intended to ship in the backend binary, verify the embedded asset path and embed build flow still make sense.

### Deployment and operator workflow

- `deploy/update-custom-binary.sh`
- `deploy/rollback-custom-binary.sh`
- `deploy/install.sh`
- `deploy/docker-compose*.yml`
- `deploy/README.md`
- `docs/TEMPLATE_WORKFLOW_CN.md`
- `.github/workflows/custom-release.yml`
- `.github/workflows/release.yml`

These define how this fork is actually released and operated.

### GitHub Actions trigger rules

Do not assume "GitHub Actions only run on tags" in this repository.

Current workflow trigger behavior:

- `backend-ci.yml`
  - runs on every `push`
  - runs on every `pull_request`
- `security-scan.yml`
  - runs on every `push`
  - runs on every `pull_request`
  - also runs on a weekly schedule
- `cla.yml`
  - runs only for PR/issue-comment related events
  - effectively relevant to the upstream repository contribution flow
- `release.yml`
  - release workflow
  - runs on tag push matching `v*`
  - can also be started manually with `workflow_dispatch`
- `custom-release.yml`
  - custom template release workflow
  - runs on tag push matching `custom-v*`
  - can also be started manually with `workflow_dispatch`

### Tag naming rules that matter

If the goal is to trigger a release workflow by tag push, the tag name must match the workflow pattern:

- upstream/general release: `v*`
  - example: `v0.1.143`
- custom template release: `custom-v*`
  - example: `custom-v0.1.143-1`

If the tag does not match these patterns, the corresponding release workflow will not trigger from tag push.

### Practical rule for agents

- ordinary commit/push: expect CI and security workflows to run
- tag push `v*`: expect upstream/general release workflow
- tag push `custom-v*`: expect custom template release workflow
- if the user asks about "release by tag", verify the exact tag prefix before acting

### Runtime configuration

- `deploy/config.example.yaml`
- `backend/internal/config/`
- `backend/internal/service/setting_service.go`

If the request mentions settings, policies, environment variables, operator toggles, or deployment behavior, start here.

### Gateway protocol behavior

- `backend/internal/server/routes/gateway.go`
- `backend/internal/handler/`
- `backend/internal/service/gateway_*`
- `backend/internal/service/openai_*`
- `backend/internal/service/gemini_*`
- `backend/internal/service/grok_*`
- `backend/internal/service/antigravity_*`

Requests involving API compatibility, request forwarding, model routing, or provider behavior usually land here.

### Admin and business workflows

- `backend/internal/server/routes/admin.go`
- `backend/internal/handler/admin/`
- `backend/internal/service/admin_*`
- `frontend/src/views/admin/`
- `frontend/src/api/admin/`

### Payment system

- `backend/internal/handler/payment_*`
- `backend/internal/service/payment_*`
- `frontend/src/views/user/Payment*`
- `frontend/src/views/admin/orders/`
- `frontend/src/api/payment.ts`
- `frontend/src/api/admin/payment.ts`
- `docs/PAYMENT_CN.md`
- `docs/ADMIN_PAYMENT_INTEGRATION_API.md`

### If editing frontend UI

- check whether the change also affects embedded production output
- if yes, run `pnpm run build`
- avoid breaking route guards or injected settings flow
- note that some layout files may already be locally customized in this fork

### If editing backend API behavior

- inspect route registration first
- then inspect handler
- then inspect service logic
- check whether admin, user, gateway, payment, and setup paths are separated
- add or update focused tests when behavior changes

### If editing Ent schema

- modify `backend/ent/schema/*`
- regenerate Ent and Wire
- ensure generated code is included in the change

### If editing deployment behavior

- read `deploy/README.md`
- read `docs/TEMPLATE_WORKFLOW_CN.md`
- preserve the custom binary update/rollback path unless explicitly replacing it

### If editing payment-related behavior

- read `docs/PAYMENT_CN.md` or `docs/PAYMENT.md`
- check admin APIs under `/api/v1/admin`
- verify webhook and provider assumptions remain consistent with docs

## Minimal Checklists

### Before editing

1. Check `git status --short`.
2. Confirm whether target files already contain local fork or user edits.
3. Read the nearest relevant docs.
4. Decide whether the change belongs to upstream-style product logic or local template logic.
5. Choose the smallest safe file set that can implement the request.

### Before claiming success

1. Re-read the changed files.
2. Verify file paths, config names, and docs references still match this fork.
3. Run the narrowest useful verification:
   - frontend UI change: `pnpm run build` or targeted test
   - backend logic change: targeted `go test`
   - schema/config change: generation and/or config sanity check
   - deployment script change: shell/script sanity review and path/argument review
4. Check whether embedded frontend output is required.
5. Check whether docs should be updated because of the change.

### Before updating docs

1. Verify the real file path exists in this fork.
2. Prefer fork-local paths over stale upstream references.
3. If a workflow is specific to `my-template`, say that explicitly.

## Known Project-Specific Gotchas

- `pnpm-lock.yaml` must stay in sync with `frontend/package.json`
- frontend and backend documentation may lag actual versions; verify against source files
- this fork contains custom deployment docs not present in plain upstream assumptions
- embedded frontend builds require backend-facing output in `backend/internal/web/dist`
- setup flow and normal runtime flow are different; do not assume config already exists on first boot
- recent local changes may live in layout and style files, so review existing diffs carefully before editing UI shell code

## Preferred Agent Workflow

For most tasks:

1. inspect `git status`
2. read the nearest relevant docs
3. inspect the narrowest code path that implements the behavior
4. make the smallest viable change
5. run the narrowest meaningful verification
6. report any doc/version mismatches you notice

## What Good Changes Look Like Here

Good changes in this repo usually have these traits:

- compatible with future upstream merges
- documented when they affect deployment or operator workflow
- minimal blast radius
- aligned with existing Go/Vue patterns
- verified with the project's existing command set

If you are unsure whether to optimize for elegance or mergeability, optimize for mergeability.
