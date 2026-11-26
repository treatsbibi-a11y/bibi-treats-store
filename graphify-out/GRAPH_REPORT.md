# Graph Report - bibi-store  (2026-11-27)

## Corpus Check
- 187 files · ~106,744 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .prisma 1, .css 1)

## Summary
- 1180 nodes · 1673 edges · 114 communities (98 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `657320f2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- html2canvas / free-solid-svg-icons / rea
- orders/[id]/route.ts
- HeroBanner / DEFAULT_IMAGES / HeroBanner
- sync-wrangler-env.mjs
- r2.ts
- package.json / devDependencies / autopre
- dependencies / canvas-confetti@^1.9.4 / 
- template.sh / ask() / ask_secret()
- tsconfig.json / compilerOptions / allowJ
- jose@^6.2.18 / jose / auth
- scripts / build / db:push
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- xlsx@^0.18.5 / xlsx / run-integration-te
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- hitl-loop.template.sh / capture() / hitl
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- openai.yaml / interface / display_name
- tailwindcss@^3.4.17 / tailwindcss / tail
- next.config.mjs
- tokens / ThemeTokens
- Steps
- Steps
- Prototyping Variants
- Issue tracker: GitHub
- Before and after
- mcp.json / cloudflare
- teach/SKILL.md
- Triage
- resolveD1Binding
- Codebase Design
- During the session
- HTML Report Format
- d1-remote.ts
- Ask Matt
- Diagnosing Bugs
- next
- payment-qr/route.ts
- d1.ts
- Steps
- Test-Driven Development
- Process
- writing-for-agents/SKILL.md
- Example tasks
- wayfinder/SKILL.md
- The types
- Runners
- The types
- Migrate to Shoehorn
- Scaffold Exercises
- software-factory/SKILL.md
- to-spec/SKILL.md
- Process
- <Questionnaire title>
- writing-shape/SKILL.md
- chief-of-staff/SKILL.md
- Observability platforms
- Sections
- writing-beats/SKILL.md
- loop-me/SKILL.md
- Reference
- bcryptjs
- seed-20.js
- status/route.ts
- track/route.ts
- CloudflareD1BoundStatement
- GLOSSARY.md Format
- writing-fragments/SKILL.md
- @fortawesome/free-regular-svg-icons@^7.3.1
- Badge.tsx
- implement-spec/SKILL.md
- CREDITS.md

## God Nodes (most connected - your core abstractions)
1. `resolveD1Binding()` - 37 edges
2. `react` - 30 edges
3. `next` - 28 edges
4. `formatPrice()` - 17 edges
5. `cn()` - 17 edges
6. `@fortawesome/free-solid-svg-icons` - 16 edges
7. `@fortawesome/react-fontawesome` - 16 edges
8. `Before and after` - 16 edges
9. `Button()` - 15 edges
10. `useCart()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `resolveD1Binding()`  [EXTRACTED]
  src/app/api/cloudflare/status/route.ts → src/lib/d1-remote.ts
- `GET()` --calls--> `fetchR2Object()`  [EXTRACTED]
  src/app/api/orders/[id]/payment-qr/route.ts → src/lib/d1-remote.ts
- `GET()` --calls--> `resolveD1Binding()`  [EXTRACTED]
  src/app/api/orders/[id]/payment-qr/route.ts → src/lib/d1-remote.ts
- `GET()` --calls--> `resolveD1Binding()`  [EXTRACTED]
  src/app/api/orders/[id]/route.ts → src/lib/d1-remote.ts
- `handleUpdateOrder()` --calls--> `getAdminSession()`  [EXTRACTED]
  src/app/api/orders/[id]/route.ts → src/lib/auth.ts

## Import Cycles
- None detected.

## Communities (114 total, 16 thin omitted)

### Community 0 - "html2canvas / free-solid-svg-icons / rea"
Cohesion: 0.06
Nodes (72): @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, framer-motion, react, CartPage(), CheckoutContent(), CheckoutPage(), metadata (+64 more)

### Community 1 - "orders/[id]/route.ts"
Cohesion: 0.12
Nodes (24): dynamic, GET(), handleUpdateOrder(), PATCH(), PUT(), RouteContext, runtime, VALID_STATUSES (+16 more)

### Community 2 - "HeroBanner / DEFAULT_IMAGES / HeroBanner"
Cohesion: 0.08
Nodes (36): @fortawesome/free-brands-svg-icons@^7.3.1, @fortawesome/free-brands-svg-icons, Footer(), DEFAULT_IMAGES, HeroBanner(), ImageCard, ImageCarouselHero(), ImageCarouselHeroProps (+28 more)

### Community 3 - "sync-wrangler-env.mjs"
Cohesion: 0.09
Nodes (15): jsonwebtoken@^9.0.2, jsonwebtoken, processDir(), fs, prisma, { PrismaClient }, candidates, envContent (+7 more)

### Community 4 - "r2.ts"
Cohesion: 0.21
Nodes (9): @aws-sdk/client-s3@^3.1176.0, @aws-sdk/client-s3, dynamic, POST(), runtime, deleteR2Object(), deleteFileFromR2(), r2Client (+1 more)

### Community 5 - "package.json / devDependencies / autopre"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.20, @cloudflare/next-on-pages@^1.13.16, postcss@^8.4.49, prisma@^5.22.0, @types/bcryptjs@^2.4.6, @types/canvas-confetti@^1.9.0, @types/jsonwebtoken@^9.0.8 (+19 more)

### Community 6 - "dependencies / canvas-confetti@^1.9.4 / "
Cohesion: 0.09
Nodes (23): dependencies, canvas-confetti@^1.9.4, @fortawesome/fontawesome-svg-core@^7.3.1, @fortawesome/free-solid-svg-icons@^7.3.1, @fortawesome/react-fontawesome@^3.5.0, framer-motion@^14.14.0, gsap@^3.15.1, html2canvas@^1.4.1 (+15 more)

### Community 7 - "template.sh / ask() / ask_secret()"
Cohesion: 0.14
Nodes (24): 1. Scope the procedure, 2. Map each stage's journey, 3. Author the wizard, 4. Verify and hand off, Process, Wizard, ask(), ask_secret() (+16 more)

### Community 8 - "tsconfig.json / compilerOptions / allowJ"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 9 - "jose@^6.2.18 / jose / auth"
Cohesion: 0.47
Nodes (3): getJwtSecretKey(), signAdminToken(), verifyAdminToken()

### Community 10 - "scripts / build / db:push"
Cohesion: 0.22
Nodes (9): scripts, build, db:push, db:seed, dev, lint, pages:build, postinstall (+1 more)

### Community 11 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 12 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 13 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 14 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 15 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 16 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 17 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 18 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 19 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 20 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 21 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 22 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 23 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 24 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 25 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 26 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 27 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 28 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 29 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 30 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 31 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 32 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 33 - "openai.yaml / interface / display_name"
Cohesion: 0.33
Nodes (5): interface, display_name, short_description, policy, allow_implicit_invocation

### Community 34 - "xlsx@^0.18.5 / xlsx / run-integration-te"
Cohesion: 0.40
Nodes (5): xlsx@^0.18.5, xlsx, assert(), results, run()

### Community 35 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 36 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 37 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 38 - "hitl-loop.template.sh / capture() / hitl"
Cohesion: 0.83
Nodes (3): capture(), hitl-loop.template.sh script, step()

### Community 39 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 40 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 41 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 42 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 43 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 44 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 45 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 46 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 47 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 48 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 49 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 50 - "openai.yaml / interface / display_name"
Cohesion: 0.50
Nodes (3): interface, display_name, short_description

### Community 51 - "tailwindcss@^3.4.17 / tailwindcss / tail"
Cohesion: 0.50
Nodes (3): tailwindcss@^3.4.17, tailwindcss, config

### Community 54 - "Steps"
Cohesion: 0.18
Nodes (9): block-dangerous-git.sh script, 1. Ask scope, 2. Copy the hook script, 3. Add hook to settings, 4. Ask about customization, 5. Verify, Setup Git Guardrails, Steps (+1 more)

### Community 55 - "Steps"
Cohesion: 0.14
Nodes (11): 1. Detect the environment, 2. Install dependency-cruiser, 3. Write the config, 4. Wire it into the checks, 5. Scaffold the example package, 6. Prove the rules bite, 7. Document the convention, Notes (+3 more)

### Community 56 - "Prototyping Variants"
Cohesion: 0.05
Nodes (35): 1. State the question, 2. Isolate the logic in a portable module, 3. Build the shareable HTML file, 4. Hand it over, 5. Capture the answer and the prototype, Anti-patterns, Logic Prototype, Process (+27 more)

### Community 57 - "Issue tracker: GitHub"
Cohesion: 0.06
Nodes (30): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary, Conventions, Issue tracker: GitHub, Pull requests as a triage surface (+22 more)

### Community 58 - "Before and after"
Cohesion: 0.06
Nodes (29): Arrows and generic link names (U21, U22), Badge with and without state (U9), Before and after, Card that explains itself (U4, U5), Chart header (U12, U13), Chart scaffolding and legend (U15, U16), Claim you cannot verify, Contents (+21 more)

### Community 61 - "teach/SKILL.md"
Cohesion: 0.07
Nodes (25): Learning Record Format, Numbering, Optional sections, Supersession, Template, What does _not_ qualify, When to write a learning record, MISSION.md Format (+17 more)

### Community 62 - "Triage"
Cohesion: 0.07
Nodes (25): Bad agent brief, Behavioral, not procedural, Complete acceptance criteria, Durability over precision, Examples, Explicit scope boundaries, Good agent brief (bug), Good agent brief (enhancement) (+17 more)

### Community 63 - "resolveD1Binding"
Cohesion: 0.19
Nodes (20): @prisma/client, DELETE(), dynamic, listD1ProductImages(), POST(), PUT(), RouteContext, runtime (+12 more)

### Community 64 - "Codebase Design"
Cohesion: 0.09
Nodes (21): 1. In-process, 2. Local-substitutable, 3. Remote but owned (Ports & Adapters), 4. True external (Mock), Deepening, Dependency categories, Seam discipline, Testing strategy: replace, don't layer (+13 more)

### Community 65 - "During the session"
Cohesion: 0.09
Nodes (19): ADR Format, Numbering, Optional sections, Template, What qualifies, When to offer an ADR, GLOSSARY.md Format, Rules (+11 more)

### Community 66 - "HTML Report Format"
Cohesion: 0.10
Nodes (18): Call-graph collapse, Candidate card, Cross-section (good for layered shallowness), Diagram patterns, Hand-built boxes-and-arrows (when Mermaid's layout fights you), Header, HTML Report Format, Mass diagram (good for "interface as wide as implementation") (+10 more)

### Community 67 - "d1-remote.ts"
Cohesion: 0.20
Nodes (16): dynamic, GET(), getProtectedQrImageUrl(), normalizeAssetKey(), runtime, CloudflareD1PreparedResult, createRemoteD1Binding(), deleteR2ViaRestApi() (+8 more)

### Community 68 - "Ask Matt"
Cohesion: 0.12
Nodes (14): Phase boundaries, Primary and secondary sources, The five options, The tree, These are judgement calls, Ask Matt, Codebase health, Context hygiene (+6 more)

### Community 69 - "Diagnosing Bugs"
Cohesion: 0.13
Nodes (14): Completion criterion: a tight loop that goes red, Diagnosing Bugs, Minimise, Non-deterministic bugs, Phase 1: Build a feedback loop, Phase 2: Reproduce + minimise, Phase 3: Hypothesise, Phase 4: Instrument (+6 more)

### Community 70 - "next"
Cohesion: 0.20
Nodes (9): next, dynamic, GET(), runtime, sitemap(), dynamic, GET(), runtime (+1 more)

### Community 71 - "payment-qr/route.ts"
Cohesion: 0.19
Nodes (12): dynamic, GET(), NO_STORE_HEADERS, OrderPaymentGate, resolveR2KeyFromQrUrl(), RouteContext, runtime, dynamic (+4 more)

### Community 72 - "d1.ts"
Cohesion: 0.25
Nodes (12): dynamic, GET(), POST(), runtime, computeReviewStats(), createD1Review(), CreateOrderInput, ensureReviewProductColumns() (+4 more)

### Community 73 - "Steps"
Cohesion: 0.15
Nodes (12): 1. Detect package manager, 2. Install dependencies, 3. Initialize Husky, 4. Create `.husky/pre-commit`, 5. Create `.lintstagedrc`, 6. Create `.prettierrc` (if missing), 7. Verify, 8. Commit (+4 more)

### Community 74 - "Test-Driven Development"
Cohesion: 0.15
Nodes (10): Designing for Mockability, When to Mock, Anti-patterns, Rules of the loop, Seams: where tests go, Test-Driven Development, What a good test is, Bad Tests (+2 more)

### Community 75 - "Process"
Cohesion: 0.15
Nodes (12): 1. Gather context, 2. Explore the codebase (optional), 3. Draft vertical slices, 4. Quiz the user, 5. Publish the tickets to the configured tracker, Acceptance criteria, Blocked by, <NN>: <Ticket title> (+4 more)

### Community 76 - "writing-for-agents/SKILL.md"
Cohesion: 0.15
Nodes (11): Context pointers, Information hierarchy, Leading words, Invocation, Router skills, Skill mechanics, Splitting by invocation, Pruning (+3 more)

### Community 77 - "Example tasks"
Cohesion: 0.17
Nodes (12): Example tasks, Failed automated reviews sit unfixed, Migrating to a stricter automated check, Production problems are found late, PRs wait for review, Ready tickets wait for someone to build them, Specs are too big for one run, The codebase drifts (+4 more)

### Community 78 - "wayfinder/SKILL.md"
Cohesion: 0.17
Nodes (11): Chart the map, Fog of war, Invocation, Out of scope, Plan, don't do, Refer by name, The Map, The map body (+3 more)

### Community 79 - "The types"
Cohesion: 0.18
Nodes (10): Agent-native git hosts, All-in-one platforms, Durable gotchas, Git hosts, Git storage for runs, Researching further, Review-first and decentralised git hosts, Self-hosted git hosts (+2 more)

### Community 80 - "Runners"
Cohesion: 0.18
Nodes (10): Bring-your-own worker, Bundled agent platforms, CI runners, MicroVM APIs, Own VPS or containers, Researching further, Runners, The questions that decide the slot (+2 more)

### Community 81 - "The types"
Cohesion: 0.18
Nodes (10): 1. Git-host tracker, 2. Agent-native dev tracker, 3. Open-source dev tracker, 4. General work tool, 5. Repo-native tracker, 6. Build-your-own, Durable gotchas, Researching further (+2 more)

### Community 82 - "Migrate to Shoehorn"
Cohesion: 0.20
Nodes (9): `as Type` → `fromPartial()`, `as unknown as Type` → `fromAny()`, Install, Large objects with few needed properties, Migrate to Shoehorn, Migration patterns, When to use each, Why shoehorn? (+1 more)

### Community 83 - "Scaffold Exercises"
Cohesion: 0.22
Nodes (8): Directory naming, Example: stubbing from a plan, Exercise variants, Lint rules summary, Moving/renaming exercises, Required files, Scaffold Exercises, Workflow

### Community 84 - "software-factory/SKILL.md"
Cohesion: 0.22
Nodes (6): Designing a factory, Fill every slot, Question every task, Services, Start slow, Tasks and runs

### Community 85 - "to-spec/SKILL.md"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Process, Solution, Testing Decisions, User Stories

### Community 86 - "Process"
Cohesion: 0.25
Nodes (7): 1. Pin the fixed point, 2. Identify the spec source, 3. Identify the standards sources, 4. Spawn both sub-agents in parallel, 5. Aggregate, Process, Why two axes

### Community 87 - "<Questionnaire title>"
Cohesion: 0.25
Nodes (7): Anything else?, Context, Document structure, How to answer, <Questionnaire title>, <Theme heading>, What load is the system expected to handle at launch?

### Community 88 - "writing-shape/SKILL.md"
Cohesion: 0.25
Nodes (7): Conversational feel, Format arguments to actually have, Grounding, Out of scope, Pulling from the pile, The loop, Writing rhythm

### Community 89 - "chief-of-staff/SKILL.md"
Cohesion: 0.29
Nodes (6): Procedures, Schedules, Strategic View, Subagents, Wiki, Write history, not the present

### Community 90 - "Observability platforms"
Cohesion: 0.29
Nodes (7): How runners hook in, Observability platforms, Researching further, Type 1: None (the runner or orchestrator product shows enough), Type 2: LLM and agent tracing platform, Type 3: General APM and logging backend, Type 4: LLM gateway with request logging

### Community 91 - "Sections"
Cohesion: 0.33
Nodes (5): Evidence, Guidance, Merge Danger, Sections, Summary

### Community 92 - "writing-beats/SKILL.md"
Cohesion: 0.33
Nodes (5): Ending the journey, Grounding, Pulling from the pile, What is a beat, Writing rhythm

### Community 93 - "loop-me/SKILL.md"
Cohesion: 0.40
Nodes (4): Definition of done, The loop lens, The workspace, Vocabulary

### Community 94 - "Reference"
Cohesion: 0.40
Nodes (4): Files, Implementation vs Review, Reference, Steps

### Community 95 - "bcryptjs"
Cohesion: 0.40
Nodes (3): bcryptjs@^2.4.3, bcryptjs, prisma

### Community 96 - "seed-20.js"
Cohesion: 0.40
Nodes (3): prisma, { PrismaClient }, PRODUCTS

### Community 97 - "status/route.ts"
Cohesion: 0.40
Nodes (4): @cloudflare/next-on-pages, dynamic, GET(), runtime

### Community 98 - "track/route.ts"
Cohesion: 0.50
Nodes (4): cleanPhone(), dynamic, POST(), runtime

### Community 100 - "GLOSSARY.md Format"
Cohesion: 0.50
Nodes (3): GLOSSARY.md Format, Rules, Structure

### Community 101 - "writing-fragments/SKILL.md"
Cohesion: 0.50
Nodes (3): File format, What is a fragment, Writing rhythm

### Community 102 - "@fortawesome/free-regular-svg-icons@^7.3.1"
Cohesion: 0.33
Nodes (4): @fortawesome/free-regular-svg-icons@^7.3.1, recharts@^2.15.1, @fortawesome/free-regular-svg-icons, recharts

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `html2canvas / free-solid-svg-icons / rea`, `status/route.ts`, `orders/[id]/route.ts`, `track/route.ts`, `r2.ts`, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `, `payment-qr/route.ts`, `d1.ts`, `d1-remote.ts`, `HeroBanner / DEFAULT_IMAGES / HeroBanner`, `jose@^6.2.18 / jose / auth`, `resolveD1Binding`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `html2canvas / free-solid-svg-icons / rea` be split into smaller, more focused modules?**
  _Cohesion score 0.0633923472301542 - nodes in this community are weakly interconnected._
- **Why does `react` connect `html2canvas / free-solid-svg-icons / rea` to `HeroBanner / DEFAULT_IMAGES / HeroBanner`, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `, `Badge.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `orders/[id]/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1164021164021164 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `resolveD1Binding` to `seed-20.js`, `orders/[id]/route.ts`, `sync-wrangler-env.mjs`, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `, `bcryptjs`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `HeroBanner / DEFAULT_IMAGES / HeroBanner` be split into smaller, more focused modules?**
  _Cohesion score 0.07632850241545894 - nodes in this community are weakly interconnected._
- **Should `sync-wrangler-env.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08923076923076922 - nodes in this community are weakly interconnected._