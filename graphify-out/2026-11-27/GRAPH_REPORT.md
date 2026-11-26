# Graph Report - bibi-store  (2026-11-26)

## Corpus Check
- 209 files · ~94,323 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 1, .prisma 1, .css 1)

## Summary
- 589 nodes · 951 edges · 61 communities (52 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- html2canvas / free-solid-svg-icons / rea
- next-on-pages / route / dynamic
- HeroBanner / DEFAULT_IMAGES / HeroBanner
- bcryptjs@^2.4.3 / jsonwebtoken@^9.0.2 / 
- client-s3@^3.1176.0 / client-s3 / next
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
- next / next.config / nextConfig
- tokens / ThemeTokens
- block-dangerous-git.sh / block-dangerous
- framer-motion@^14.14.0 / framer-motion
- html2canvas@^1.4.1 / html2canvas
- adapter-d1@^7.10.1 / adapter-d1
- mcp.json / cloudflare

## God Nodes (most connected - your core abstractions)
1. `react` - 27 edges
2. `next` - 24 edges
3. `@fortawesome/free-solid-svg-icons` - 16 edges
4. `@fortawesome/react-fontawesome` - 16 edges
5. `Button()` - 15 edges
6. `useCart()` - 15 edges
7. `cn()` - 15 edges
8. `compilerOptions` - 15 edges
9. `run_wizard()` - 12 edges
10. `PaymentSlipSection()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getD1OrderDetail()`  [EXTRACTED]
  src/app/api/orders/[id]/route.ts → src/lib/d1.ts
- `GET()` --calls--> `getD1Reviews()`  [EXTRACTED]
  src/app/api/reviews/route.ts → src/lib/d1.ts
- `POST()` --calls--> `createD1Review()`  [EXTRACTED]
  src/app/api/reviews/route.ts → src/lib/d1.ts
- `RootLayout()` --calls--> `CartDrawer()`  [EXTRACTED]
  src/app/layout.tsx → src/components/customer/CartDrawer.tsx
- `HomePage()` --calls--> `HeroBanner()`  [EXTRACTED]
  src/app/page.tsx → src/components/customer/HeroBanner.tsx

## Import Cycles
- None detected.

## Communities (61 total, 9 thin omitted)

### Community 0 - "html2canvas / free-solid-svg-icons / rea"
Cohesion: 0.09
Nodes (49): @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, react, CartPage(), CheckoutPage(), OrderSuccessPage(), runtime, STATUS_CONFIG (+41 more)

### Community 1 - "next-on-pages / route / dynamic"
Cohesion: 0.05
Nodes (52): @cloudflare/next-on-pages, dynamic, GET(), handleUpdateOrder(), PATCH(), PUT(), RouteContext, runtime (+44 more)

### Community 2 - "HeroBanner / DEFAULT_IMAGES / HeroBanner"
Cohesion: 0.08
Nodes (33): DEFAULT_IMAGES, HeroBanner(), ImageCard, ImageCarouselHero(), ImageCarouselHeroProps, CursorDrivenParticleTypography(), CursorDrivenParticleTypographyProps, Particle (+25 more)

### Community 3 - "bcryptjs@^2.4.3 / jsonwebtoken@^9.0.2 / "
Cohesion: 0.06
Nodes (21): bcryptjs@^2.4.3, jsonwebtoken@^9.0.2, @prisma/client@^5.22.0, prisma, { PrismaClient }, PRODUCTS, bcryptjs, jsonwebtoken (+13 more)

### Community 4 - "client-s3@^3.1176.0 / client-s3 / next"
Cohesion: 0.09
Nodes (20): @aws-sdk/client-s3@^3.1176.0, @aws-sdk/client-s3, next, dynamic, runtime, dynamic, POST(), runtime (+12 more)

### Community 5 - "package.json / devDependencies / autopre"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.20, @cloudflare/next-on-pages@^1.13.16, postcss@^8.4.49, prisma@^5.22.0, @types/bcryptjs@^2.4.6, @types/canvas-confetti@^1.9.0, @types/jsonwebtoken@^9.0.8 (+19 more)

### Community 6 - "dependencies / canvas-confetti@^1.9.4 / "
Cohesion: 0.10
Nodes (21): dependencies, canvas-confetti@^1.9.4, @fortawesome/fontawesome-svg-core@^7.3.1, @fortawesome/free-brands-svg-icons@^7.3.1, @fortawesome/free-regular-svg-icons@^7.3.1, @fortawesome/free-solid-svg-icons@^7.3.1, @fortawesome/react-fontawesome@^3.5.0, gsap@^3.15.1 (+13 more)

### Community 7 - "template.sh / ask() / ask_secret()"
Cohesion: 0.22
Nodes (18): ask(), ask_secret(), banner(), _clear(), _existing(), finish(), note(), open_url() (+10 more)

### Community 8 - "tsconfig.json / compilerOptions / allowJ"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 9 - "jose@^6.2.18 / jose / auth"
Cohesion: 0.25
Nodes (5): jose@^6.2.18, jose, getAdminSession(), secretKey, verifyAdminToken()

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

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `client-s3@^3.1176.0 / client-s3 / next` to `html2canvas / free-solid-svg-icons / rea`, `next-on-pages / route / dynamic`, `HeroBanner / DEFAULT_IMAGES / HeroBanner`, `bcryptjs@^2.4.3 / jsonwebtoken@^9.0.2 / `, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `, `jose@^6.2.18 / jose / auth`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `html2canvas / free-solid-svg-icons / rea` be split into smaller, more focused modules?**
  _Cohesion score 0.09154929577464789 - nodes in this community are weakly interconnected._
- **Why does `react` connect `html2canvas / free-solid-svg-icons / rea` to `HeroBanner / DEFAULT_IMAGES / HeroBanner`, `client-s3@^3.1176.0 / client-s3 / next`, `package.json / devDependencies / autopre`, `dependencies / canvas-confetti@^1.9.4 / `?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `next-on-pages / route / dynamic` be split into smaller, more focused modules?**
  _Cohesion score 0.054274084124830396 - nodes in this community are weakly interconnected._
- **Why does `@prisma/client` connect `bcryptjs@^2.4.3 / jsonwebtoken@^9.0.2 / ` to `next-on-pages / route / dynamic`, `package.json / devDependencies / autopre`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `HeroBanner / DEFAULT_IMAGES / HeroBanner` be split into smaller, more focused modules?**
  _Cohesion score 0.08478513356562137 - nodes in this community are weakly interconnected._
- **Should `bcryptjs@^2.4.3 / jsonwebtoken@^9.0.2 / ` be split into smaller, more focused modules?**
  _Cohesion score 0.06156156156156156 - nodes in this community are weakly interconnected._