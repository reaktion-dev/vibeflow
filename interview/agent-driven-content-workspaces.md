---
sessionID: ses_fe694f663ffeJdxNhHxpQPmRg1
title: Agent-Driven Content Workspaces
version: 1.0
date_created: 2026-08-19
status: final
owner: agent
tags: [spec, design, video, docs, flow, artifacts]
---

# Agent-Driven Content Workspaces

## Introduction

Vibeflow pivots from editor-centric to agent-first: specialized AI agents autonomously create content (images, video, documents) inside sandboxes, with lightweight "mini-editor" surfaces for review and tweaks — modeled on AionUi's cowork philosophy. The Design workspace is vector-first: AI generates a base image, the system traces it into editable SVG paths, and a PixiJS-rendered mini-editor lets users tweak vectors that export as SVG + raster. This spec defines the agent-driven workspaces (Design, Video, Docs, Flow), the artifact foundation, and the build order for a solo maintainer.

## 1. Purpose & Scope

- **Audience**: solo maintainer of Vibeflow; this spec guides foundation work, then one content workspace at a time.
- **Boundaries**: NOT full editors — no full canvas/vector editor, no Remotion timeline editor, no node-graph editor. Users already own Photoshop/After Effects/Illustrator/Office; Vibeflow produces native, editable artifacts (SVG, MP4, OOXML) and supervises autonomous generation. The Design mini-editor is a light vector tweak surface (edit traced paths, restyle, export).
- **Assumptions**: auth + project CRUD + the agent harness chat already work end-to-end; content workspaces build on `lib/ai/harness/opencode-agent.ts`; artifacts are stored in Cloudflare R2; generation runs on the Node server runtime (>=22, per `ai` v7 requirement; sharp needs >=20.9).
- **Decided**:
  - Docs = native OOXML (PPTX/DOCX/XLSX), download-first, format chosen per generation in chat.
  - Video assembly = server-side ffmpeg on Vercel Node runtime.
  - Generation = budget-gated autonomy with NO default budget — the user sets the per-project budget at creation.
  - Flow pipelines = agent-executed in-sandbox.
  - Build order = Foundation → Design → Video → Docs → Flow.
  - Workspace tools = host-executed `HarnessAgent.tools` + per-tool `toolApproval`.
  - Design = vector-first: trace-first with graphic-style prompts; auto-trace after each generation plus a manual re-trace control (preset/simplify); PixiJS-rendered mini-editor (custom path data model + hand-rolled hit-testing, export via `graphicsContextToSvg()`).
  - Image model = user-chosen per project at first generation.
  - Video voice = user-chosen at first video generation per project.
  - Deployment = Vercel (feasible with verified mitigations; Next 16.3 upgrade required).
- **Provisional out of scope (confirm later)**: MCP/ACP runtime, 24/7 scheduling, multi-agent team orchestration, in-browser preview of office files.

## 2. Definitions

- **Harness agent**: the OpenCode-based agent (`@ai-sdk/harness-opencode`) running in a Vercel Firecracker microVM, with permission gates and approval UI.
- **Host-executed tool**: a custom AI SDK `tool()` registered on `HarnessAgent.tools`; the OpenCode adapter forwards its spec in the bridge start message and submits results back — runs on the Next.js host, not in the sandbox.
- **Workspace**: the per-project-type surface = agent chat + artifact gallery + preview/tweak panel.
- **Artifact**: a generated deliverable (image, video, document, audio, pipeline) with metadata + storage reference.
- **Mini-editor**: lightweight per-artifact-type tweak controls — for Design: edit traced vector paths (move/restyle, layers), export SVG + raster; for Video: reorder/trim/regenerate scenes; for Docs: chat iteration on structured content. Not a full editor.
- **Vectorization (trace)**: converting a generated raster image into SVG paths (bitmap tracing) so the design becomes editable vectors.
- **SVG document**: the editable design model (paths, layers, fills/strokes) stored as metadata and rendered to raster for export.
- **Path data model**: the app-owned representation of vector geometry (points/curves, fills/strokes, layers) that the PixiJS editor renders and mutates — PixiJS has no path-editing API, so edits rebuild Graphics from this model.
- **Approval gate**: user Approve/Deny step before expensive/paid operations; for custom tools this is `toolApproval: { toolName: 'user-approval' }` which pauses the turn (same UX as builtin writeFile/runCommand approvals).
- **Budget gate**: per-project spend cap set by the user at creation; the agent runs freely under it and must request approval above it (hard stop at cap).
- **Generation run**: one agent-driven creation action (prompt, provider, model, params, result asset).
- **Pipeline manifest**: agent-authored JSON describing ordered stages (used by the Flow workspace).
- **OOXML**: the XML-based format of .pptx/.docx/.xlsx files.

## 3. Requirements, Constraints & Guidelines

### Requirements

- **REQ-001**: Type-based workspace routing — `app/projects/[id]` branches on `project.type` (confirmed gap: page currently renders the code IDE for every type) and renders the matching workspace; code projects keep the existing IDE. Evolve the existing partial `WorkspaceLayout` shell into the real per-type surface.
- **REQ-002**: Artifact foundation — implement the `asset` table (verified: schema-only today, zero code references) with R2 storage, per-project gallery, and zod-validated metadata. Net-new work.
- **REQ-003**: Design workspace (vector-first) — a designer agent with an image-generation tool; the generated raster is traced into editable SVG paths (vtracer primary, potrace+Posterize for flat graphics); a PixiJS-rendered mini-editor (v8.19) renders and tweaks the vectors via a custom path data model with hand-rolled hit-testing, exporting edited SVG via `graphicsContextToSvg()`; export as SVG (native, editable in Illustrator/Inkscape/Figma) + rasterized PNG/JPG/WebP (resvg-js → sharp). Model chosen by the user at first generation per project, overridable per generation. Trace trigger (DECIDED): auto-trace after each generation, plus a manual re-trace control (preset/simplify) for quality tuning.
- **REQ-004**: Video workspace — a video agent producing script → ElevenLabs voiceover → per-scene images → MP4 assembled server-side with fluent-ffmpeg + ffmpeg-static; voice chosen by the user at first video generation per project (like the image model), overridable per generation; mini-timeline for reorder/trim/regenerate scene; export. Scene images may reuse the design pipeline's raster output.
- **REQ-005**: Docs workspace — a docs agent generating native OOXML files (PPTX/DOCX/XLSX via pptxgenjs/docx/exceljs) that open in real Office apps; download-first delivery; tweak loop = chat iteration on structured content, then recompile. Format selection (DECIDED): per generation in chat — the user names the format in the prompt or the agent asks.
- **REQ-006**: Flow workspace — agent-authored pipelines from natural language; the agent itself executes its own manifest in-sandbox, walking stages via its tools and streaming per-step status; progress persisted to `workflow_run`/`workflow_run_step` (verified: tables exist, imported nowhere).
- **REQ-007**: Budget-gated autonomy (DECIDED) — NO default budget: the user sets the per-project generation budget at project creation (required field in the creation modal); generation runs freely within it; approval required above it or for risky ops; hard stop at cap; env provides a ceiling cap.
- **REQ-008**: Harness extension pattern (DECIDED) — each workspace ships as host-executed custom tools registered on `HarnessAgent.tools` (verified API: `tools: { name: tool({ description, inputSchema, execute }) }`; OpenCode adapter forwards specs in the bridge start message and submits `tool-result` events). Custom tools are NOT governed by `permissionMode` — each declares `toolApproval: { toolName: 'user-approval' | 'approved' | 'denied' | 'not-applicable' }`. MCP (`mcpServers` on `createOpenCode`) is deferred: MCP tools run in-sandbox and bypass host `toolApproval`, so they cannot enforce cost gates.

### Security

- **SEC-001**: All workspace routes/actions require an authenticated session (Better Auth + `proxy.ts` guard).
- **SEC-002**: Artifact access is project-scoped; R2 objects are private — `asset.url` stores the R2 object key, served via server-side proxy or short-lived signed URLs; ownership checks on every read/write.
- **SEC-003**: Agent tools that touch external paid services use approval/secret gates (existing `TOOL_APPROVAL_SECRET` pattern) — no unapproved spend; budget enforcement is server-side, not agent-side.

### Constraints

- **CON-001**: Stack is fixed: Next.js 16 (upgrade to 16.3 required — fixes sharp+Turbopack native-binary bug), React 19, Tailwind 4, AI SDK v7 + `@ai-sdk/harness-opencode`, Drizzle + Neon Postgres, Better Auth, Cloudflare R2, PixiJS v8.19 (vector editor). `ai` v7 requires Node >=22.
- **CON-002**: Source of truth for content = R2 artifacts + `asset` rows; `design_project.canvas_data` stores the editable SVG document + editor state (paths, layers, styles); `video_project.composition` stores the scene manifest. Both detail tables (verified unique-project 1:1) are thin metadata.
- **CON-003**: Deployment = Vercel Node runtime functions (DECIDED, verified feasible). Native stack: ffmpeg-static (~76MB) via `outputFileTracingIncludes` + `serverExternalPackages: ['ffmpeg-static', 'sharp', '@resvg/resvg-js']` + 3009MB memory in vercel.json (official vercel-labs pattern). Constraints: 250MB uncompressed (5GB via Large Functions + Fluid Compute), Hobby 300s / Pro 800s max duration, 500MB ephemeral `/tmp` (per-instance, treat as non-durable), 4.5MB request/body cap (media moves via R2 presigned URLs, never request bodies). sharp requires Next 16.3 (16.2 + Turbopack = ERR_DLOPEN_FAILED). Heavy video work beyond MVP may require a small worker VM (Vercel stays frontend).
- **CON-004**: Most JSON columns in the schema are `text`, not JSONB — parse-on-write convention.

### Guidelines

- **GUD-001**: Deliver native editable formats — SVG for design (opens in Illustrator/Inkscape/Figma), MP4 for video, OOXML for docs; never force app-locked formats.
- **GUD-002**: UI is supervision + tweaks, never a full editor.
- **GUD-003**: Milestone order (DECIDED): Foundation (routing + artifacts + R2) → Design → Video → Docs → Flow — cheapest-first, each workspace proves the pattern before the next.

## 4. Interfaces & Data Contracts

- **Project types**: `project_type` enum = `code | design | video | flow` (verified `lib/db/schema.ts:17-22`); routing key in `app/projects/[id]`.
- **Artifact record** — maps onto the verified `asset` table (`lib/db/schema.ts:313-332`): `id` (text PK), `projectId` (FK cascade), `name` (notNull), `type` (varchar(50) free text; canonical values `image | svg | video | audio | document | export | pipeline`), `mimeType`, `url` (notNull = R2 object key for private access), `sizeBytes` (int), `metadata` (text JSON: `{ status: 'pending'|'running'|'ready'|'failed', source: { provider, model, prompt, seed?, params }, costMicros, approvals: [] }`), `createdAt`. Drizzle type: `export type Asset`.
- **Custom tool registration** (verified API shape): `tools: { generateImage: tool({ description, inputSchema: z.object({...}), execute: async (args) => ({ assetIds }) }) }` on `HarnessAgent`; `toolApproval: { generateImage: 'user-approval' }` for paid tools. Tool results surface as `tool-result` parts rendered by existing `HarnessToolParts`.
- **Image-gen tool**: input `{ prompt, model?, size?, seed?, count? }` → output `{ assetIds[] }`; implemented via AI SDK `generateImage()` + `openrouter.imageModel()` (returns base64/uint8Array in-memory); direct REST `POST /api/v1/images` fallback if provider-specific params are needed; `toolApproval: 'user-approval'` (paid). Model defaults to the project's chosen model (set at first generation; stored in `project.config`), overridable per call. Prompts default to graphic/flat style for traceability (per trace-first decision).
- **Trace tool**: input `{ assetId, options?: { preset: 'photo'|'poster'|'bw', simplify?, palette? } }` → output `{ svgAssetId }` — raster → SVG paths via `@visioncortex/vtracer` (WASM, `convertBuffer(buffer, { preset, mode: 'spline', simplify })`); `potrace` + `Posterize` for flat graphics; traced SVG stored as an `svg`-type asset and as the editable SVG document in `design_project.canvas_data`.
- **SVG document contract** (Design mini-editor): `{ viewBox, layers: [{ id, name, visible, locked, paths: [{ d, fill, stroke, strokeWidth, opacity }] }], exportPreset: { format: 'png'|'jpeg'|'webp', scale: 1|2, quality? } }` — stored in `design_project.canvas_data`; the PixiJS editor maintains a parallel path data model (points/curves) for editing and re-renders Graphics on each mutation; export SVG via `graphicsContextToSvg(context, precision)`; raster via `@resvg/resvg-js` (PNG, deterministic) then sharp (JPG/WebP) into an `export`-type asset.
- **Budget contract**: per-project ledger `{ projectId, budgetCents (user-set at creation), spentCents, overBudget: boolean }`; generation endpoints reject when `spentCents + estimatedCost > budgetCents` unless an approved override exists; atomic increment under concurrency; env ceiling cap.
- **Video scene manifest**: `{ title, scenes: [{ imagePrompt, voiceLine, durationSec, captions? }], voice: { voiceId, model }, format: { resolution, fps } }` — voice from the project's chosen voice (set at first video generation; stored in `project.config`), overridable per generation; assembled server-side with fluent-ffmpeg (images @ framerate + MP3 → h264/aac MP4); working files in `/tmp`, inputs/outputs via R2.
- **Pipeline manifest (Flow)**: `{ id, name, stages: [{ id, type: 'input'|'agent'|'tool'|'condition'|'output', params }], version }` — agent-executed; each stage maps 1:1 to a `workflow_run_step` row (verified columns: runId, nodeId, nodeType free-text, status enum pending/running/success/failed/cancelled, input/output/error, startedAt/completedAt/durationMs) under a `workflow_run`; the agent emits step transitions via the chat stream.
- **Docs artifact**: agent authors structured content (outline/rows/slides JSON or Markdown) → server-side compiler (pptxgenjs/docx/exceljs) produces the Buffer → R2 + `asset` row → download. Format chosen per generation in chat (user names it in the prompt or the agent asks).
- **Route map** (new): workspace routes branch under existing `/projects/[id]`; dead links `/code /design /video /flow` in `AppSidebar` to be re-pointed; `WorkspaceLayout` (verified props: workspaceId/workspaceName/workspaceType/children) evolved per type.

## 5. Acceptance Criteria

- **AC-001**: Given a `design` project opened at `/projects/[id]`, When it loads, Then the design workspace (chat + gallery + tweak panel) renders — never the code IDE.
- **AC-002**: Given an agent image generation completes, When the tool result returns, Then the artifact is in R2 with an `asset` row and appears in the project gallery.
- **AC-003**: Given a generation request whose estimated cost exceeds the remaining project budget, When submitted, Then execution blocks until the user approves in the chat UI (or rejects).
- **AC-004**: Given a video prompt, When the agent finishes, Then an MP4 + scene manifest are produced server-side and the mini-timeline allows reorder/trim/regenerate + export.
- **AC-005**: Given a docs prompt, When the agent finishes, Then a native PPTX/DOCX/XLSX is downloadable and opens correctly in the matching Office app.
- **AC-006**: Given a Flow pipeline authored by the agent, When executed in-sandbox, Then per-stage progress streams in order and `workflow_run`/`workflow_run_step` are persisted with correct statuses.
- **AC-007**: Given an unauthenticated request to any workspace route, When accessed, Then the user is redirected to sign-in (proxy guard).
- **AC-008**: Given spend reaches the project budget cap, When the agent attempts another paid generation, Then the request is rejected with an over-budget error until approved.
- **AC-009**: Given a paid custom tool (e.g. generateImage) is invoked, When the agent calls it, Then the turn pauses with an `approval-requested` part until the user approves/denies (toolApproval: 'user-approval').
- **AC-010**: Given a generated raster image, When the trace tool runs, Then an SVG asset with editable paths is produced and opens in the vector mini-editor.
- **AC-011**: Given a design project with no chosen model, When the user triggers the first generation, Then the model picker is shown and the choice is persisted to the project.
- **AC-012**: Given a project being created, When the user submits the creation form, Then a generation budget is required and persisted to the project.
- **AC-013**: Given an edited SVG document in the mini-editor, When the user exports, Then an SVG file (native) and a rasterized PNG/JPG/WebP at the chosen scale are produced and downloadable.
- **AC-014**: Given a traced SVG loaded in the PixiJS editor, When the user drags/restyles a path, Then the path data model updates, the Graphics re-render, and the edited geometry exports correctly via graphicsContextToSvg().
- **AC-015**: Given a video project with no chosen voice, When the user triggers the first video generation, Then the voice picker is shown and the choice is persisted to the project.
- **AC-016**: Given a deployed Vercel function, When it runs ffmpeg/sharp/resvg, Then the native binaries load and render correctly (Next 16.3, outputFileTracingIncludes, serverExternalPackages).

## 6. Test Automation Strategy

- No test framework currently exists in package.json (per recon) — establish minimal tooling as part of foundation work.
- **Unit**: zod contract validation for artifact/pipeline/scene/SVG-document manifests; budget ledger math; tool inputSchema validation; path data model ↔ SVG round-trip.
- **Integration** (API routes): provider clients (image/TTS/office) mocked at the boundary; assert R2 upload + DB rows + SSE stream shape + budget rejection paths + toolApproval pause/resume + trace output (valid SVG) + SVG→raster render output.
- **E2E** (Playwright): routing by project type; budget-gate approval flow; gallery render; model picker; voice picker; vector editor interactions (drag/restyle/export); export download.
- **Golden files**: minimal generated PPTX/XLSX fixtures asserted for validity; traced SVG fixtures validated (well-formed XML, non-empty paths); render fixtures compared against expected dimensions/formats.
- **Deploy smoke test**: ffmpeg/sharp/resvg binaries load and render on the Vercel Node runtime (AC-016).

## 7. Rationale & Context

- Building full editors is commodity work and uneconomic for a solo developer; AionUi validates the agent-first model with native-file output (`.pptx`/`.docx`/`.xlsx`) and preview-over-edit.
- Vector-first design (user decision): tracing the AI raster into SVG paths makes the mini-editor output genuinely editable in Illustrator/Inkscape/Figma — aligned with GUD-001. Trace-first with graphic-style prompts (user decision) keeps trace quality high; photographic prompts degrade on trace.
- PixiJS-rendered editor (user decision, accepted trade-off): PixiJS v8.19 is a renderer, not an editor — stroke hit-testing is a known pain point and there is no path-point manipulation API, so the editor maintains a custom path data model and re-renders Graphics on each edit, exporting via `graphicsContextToSvg()`. More DIY than SVG.js/DOM, but matches the user's Pixi intent and gives WebGL-scale rendering.
- Vercel deployment (user decision, verified feasible): ffmpeg-static is officially supported (vercel-labs pattern: outputFileTracingIncludes + serverExternalPackages + 3009MB memory); sharp needs Next 16.3 (16.2+Turbopack bug); resvg-js fine when kept external. MVP video (30s slideshow, ~8s render) is a small job within limits; heavy video work may later move to a small worker VM with Vercel as frontend.
- Verified tracing landscape: `@visioncortex/vtracer` (WASM, no native deps, `photo`/`poster`/`bw` presets) is the only option with a real photo pipeline; `potrace` + `Posterize` for flat graphics. Export: `@resvg/resvg-js` 2.6.2 (deterministic, usvg preprocessing, PNG-only) → sharp for JPG/WebP; font caveat: `fontFiles` + `loadSystemFonts: false` for reproducible text.
- The codebase is schema-first: verified `asset` and `workflow_run`/`workflow_run_step` are defined but referenced nowhere in app code — the foundation and Flow engine are net-new; editor-era columns (`canvas_data`, `composition`) become thin metadata.
- Verified routing gap: `app/projects/[id]/page.tsx` passes only id+name to `ProjectWorkspace` → `ResizableIDE`; no type flows into rendering. `WorkspaceLayout` is the seed for per-type surfaces.
- Budget-gated autonomy with a user-set per-project budget keeps cost control explicit at creation time; enforcement is server-side so the agent cannot bypass it.
- Host-executed tools over MCP (verified research): `HarnessAgent.tools` runs on the host where provider SDKs + R2 live and honors `toolApproval` per tool; MCP tools run in-sandbox and bypass host approval gates — wrong for paid generation. MCP deferred to Phase 2.
- Agent-executed Flow pipelines avoid building a second runtime; the manifest is a contract for observability (step rows) rather than a new executor.

## 8. Dependencies & External Integrations

- **EXT-001**: Cloudflare R2 (S3-compatible) — env keys present (`R2_*`), currently unused; needs a client + signed-URL/proxy flow for private objects. Media moves via presigned URLs (Vercel 4.5MB payload cap).
- **EXT-002**: ElevenLabs TTS — `@elevenlabs/elevenlabs-js` v2.64.0 (MIT, Node >=18): `client.textToSpeech.convert(voiceId, { text, modelId })` → ReadableStream → concat to MP3 Buffer. Env key present.
- **EXT-003**: Image generation — AI SDK `generateImage()` + `@openrouter/ai-sdk-provider` v0.7.5 `openrouter.imageModel()`; OpenRouter slugs already defined in `lib/ai/models.ts` (Seedream 5.0 / Qwen Image 3 / Krea 2; exact slugs like `qwen/qwen-image-3-pro` to verify at build time). Provider abstraction so Stability/Replicate (keys present) can plug in.
- **EXT-004**: Office file generation — `pptxgenjs` 4.0.1 (PPTX), `docx` 9.7.1 (DOCX), `exceljs` 4.4.0 (XLSX); all MIT, Node-first, Buffer output.
- **EXT-005**: ffmpeg (DECIDED: server-side on Vercel) — `fluent-ffmpeg` 2.1.3 + `ffmpeg-static` 5.3.0 (GPL-3.0; lighter-copyleft alt `@ffmpeg-installer/ffmpeg` LGPL-2.1). Vercel pattern (verified): `outputFileTracingIncludes` + `serverExternalPackages: ['ffmpeg-static']` + 3009MB memory. Assembly: `-framerate 1/3 -i slide_%02d.jpg -i voiceover.mp3 -c:v libx264 -pix_fmt yuv420p -vf scale=1920:1080 -c:a aac -shortest -movflags +faststart out.mp4`. Remotion out of MVP scope.
- **EXT-006**: Harness tool integration (RESOLVED) — host-executed `HarnessAgent.tools` + `toolApproval` (verified API from ai-sdk.dev harness docs + vercel/ai source). MCP (`mcpServers` on `createOpenCode`) deferred to Phase 2.
- **EXT-007**: Raster processing — `sharp` 0.35.3 (Apache-2.0, Node >=20.9) for raster ops and JPG/WebP conversion from resvg PNG. **Requires Next 16.3** (16.2+Turbopack = ERR_DLOPEN_FAILED; verified open issue + confirmed fix); keep external via `serverExternalPackages`.
- **EXT-008**: Bitmap tracing (RESOLVED) — `@visioncortex/vtracer` v1.0.0-alpha.3 (WASM, no native deps, `convertBuffer(buffer, { preset: 'photo'|'poster'|'bw', mode: 'spline', simplify })`) primary; `potrace` v2.1.8 + `Posterize` for flat graphics.
- **EXT-009**: SVG→raster renderer (RESOLVED) — `@resvg/resvg-js` 2.6.2 (deterministic, usvg preprocessing, PNG output; `fontFiles` + `loadSystemFonts: false` for reproducible text) → sharp for JPG/WebP; keep external via `serverExternalPackages`; WASM fallback available.
- **EXT-010**: Vector mini-editor (RESOLVED) — PixiJS v8.19: import via `Graphics().svg()` / `Assets.load`, export via `graphicsContextToSvg(context, precision)`; editing via custom path data model + hand-rolled hit-testing (stroke width not honored by `containsPoint`).
- **EXT-011**: Existing: AI SDK v7 harness (OpenCode + Vercel Sandbox microVM, node24), Daytona REST client, Better Auth, Drizzle/Neon, Vercel AI Gateway.
- **EXT-012**: Vercel deployment (RESOLVED) — limits verified: 250MB uncompressed (5GB Large Functions + Fluid Compute), Hobby 300s / Pro 800s duration, 500MB ephemeral /tmp, 4.5MB payload cap, 2GB/4GB memory. Mitigations: outputFileTracingIncludes, serverExternalPackages, 3009MB memory bump, Next 16.3 upgrade, media via R2 presigned URLs. Heavy video → worker VM later.

## 9. Examples & Edge Cases

### Examples

- Custom tool registration example (verified shape): `new HarnessAgent({ harness: openCode, sandbox, tools: { generateImage: tool({ description: 'Generate an image from a prompt', inputSchema: z.object({ prompt: z.string(), size: z.string().optional() }), execute: async ({ prompt, size }) => ({ assetIds: await generateImage(prompt, size) }) }) }, toolApproval: { generateImage: 'user-approval' } })`.
- Artifact row example (mapped to verified `asset` columns): `{ id: 'ast_x', projectId: 'p_1', name: 'hero-image', type: 'image', mimeType: 'image/png', url: 'p_1/images/ast_x.png', sizeBytes: 2048123, metadata: '{"status":"ready","source":{"provider":"openrouter","model":"qwen/qwen-image-3-pro","prompt":"flat vector-style city skyline","seed":42},"costMicros":180000}' }`.
- Trace pipeline: `generateImage(prompt) → asset(image) → trace(assetId, { preset: 'poster' }) → asset(svg) + design_project.canvas_data ← PixiJS editor edits (path data model) → export → asset(export: svg + png/jpeg/webp)`.
- Trace call (verified shape): `vtracer.convertBuffer(buffer, { preset: 'poster', mode: 'spline', simplify: 1.5 })` → SVG string.
- SVG→raster call (verified shape): `new Resvg(svgString, { fitTo: { mode: 'width', value: 1200 }, background: 'rgba(255,255,255,1)' }).render().asPng()` → sharp `.webp({ quality: 85 }).toBuffer()`.
- PixiJS editor flow (verified shapes): `const g = new Graphics().svg(svgString)` to import; edits mutate the path data model and rebuild Graphics; `graphicsContextToSvg(g.context, 2)` to export the edited SVG.
- Vercel config example (verified pattern): `outputFileTracingIncludes: { '/app/convert': ['./node_modules/ffmpeg-static/ffmpeg'] }` + `serverExternalPackages: ['ffmpeg-static', 'sharp', '@resvg/resvg-js']` + vercel.json memory 3009.
- SVG document example: `{ "viewBox": "0 0 1920 1080", "layers": [ { "id": "l1", "name": "skyline", "visible": true, "locked": false, "paths": [ { "d": "M0,540 L120,320 ...", "fill": "#2a2a72", "stroke": null } ] } ], "exportPreset": { "format": "png", "scale": 2 } }`.
- Pipeline manifest example: `{ "id": "pipe_1", "stages": [ { "id": "s1", "type": "input", "params": { "source": "prompt" } }, { "id": "s2", "type": "agent", "params": { "task": "write script", "model": "default" } }, { "id": "s3", "type": "tool", "params": { "tool": "image-gen", "count": 3 } } ] }`.
- Video scene example: `{ "scenes": [ { "imagePrompt": "cinematic wide shot of a library", "voiceLine": "Chapter one...", "durationSec": 6 } ] }`.
- ffmpeg assembly snippet (fluent-ffmpeg): `.input('slide_%02d.jpg').inputOptions(['-framerate 1/3']).input('voiceover.mp3').outputOptions(['-c:v libx264','-pix_fmt yuv420p','-vf scale=1920:1080','-c:a aac','-shortest','-movflags +faststart']).save('out.mp4')`.

### Edge Cases

- Failed generation (status `failed` + retry).
- Approval timeout/expiry.
- R2 upload failure.
- Project without a sandbox.
- Cost runaway (hard stop at user-set budget).
- Provider rate limits (retry + backoff).
- Large office files (memory guard; exceljs streaming WorkbookWriter).
- Concurrent generations on one project.
- ffmpeg binary path resolution on Vercel (outputFileTracingIncludes).
- Ephemeral /tmp cleanup between invocations (treat as non-durable; R2 is the store).
- 4.5MB payload cap (media via presigned URLs).
- Function duration ceiling (Hobby 300s / Pro 800s — MVP slideshow fine).
- Text-JSON columns need JSON.parse on read.
- Budget ledger under concurrent runs (atomic increment).
- Agent cancels a pipeline mid-run (step statuses marked cancelled).
- toolApproval has no callback form (statuses only).
- Trace of a photographic image yields noisy paths (prompt for graphic style; offer re-trace with preset/simplify).
- Trace on missing base asset (error + retry).
- SVG with unsupported features in resvg (fallback to sharp/librsvg).
- Text in SVG requires fontFiles config.
- sharp native-binary mismatch on Vercel (Next 16.3 + platform-pinned deps + keep optional deps).
- PixiJS `containsPoint` ignores stroke width (hand-rolled hit-area for strokes).
- SVG import with unsupported features (text/filters/patterns) — strip or warn before import.

## 10. Validation Criteria

- zod schemas reject malformed artifact/pipeline/scene/SVG-document manifests.
- Integration tests with mocked providers pass for: image-gen tool → R2 + `asset` row; trace → valid SVG asset; docs → file Buffer + download; video → MP4 bytes + manifest; budget rejection + approval paths; toolApproval pause/resume; SVG→raster render output (dimensions/format); path data model ↔ SVG round-trip.
- Manual E2E checklist per workspace (create → prompt → generate → trace → tweak → export) recorded in docs.
- R2 round-trip test (write → read → signed URL/proxy) as a health check.
- Deploy smoke test: ffmpeg/sharp/resvg binaries load and render on the Vercel Node runtime (AC-016).

## 11. Related Specifications / Further Reading

- `README.md` (platform vision), `docs/ARCHITECTURE.md` (original 5-phase plan — superseded in part by this spec), `docs/development/*`.
- Reference implementations to build on: `lib/ai/harness/opencode-agent.ts`, `app/api/projects/[id]/chat/route.ts`, `lib/db/schema.ts` (project/asset/workflow tables — verified shapes), `proxy.ts` (auth guard), `components/ai-elements/*` (tool-part rendering, approvals), `components/workspace/WorkspaceLayout.tsx` (per-type shell seed).
- External references (verified): AI SDK harness docs (ai-sdk.dev/docs/ai-sdk-harnesses/harness-agent), OpenCode harness docs (ai-sdk.dev/providers/ai-sdk-harnesses/opencode), vercel/ai source (harness-agent-settings.ts, harness-v1-permission-mode.ts, opencode-harness.ts), AI SDK image generation docs, @openrouter/ai-sdk-provider image-model docs, pptxgenjs/docx/exceljs READMEs, @elevenlabs/elevenlabs-js autodocs, fluent-ffmpeg + ffmpeg-static npm pages, sharp docs (sharp.pixelplumbing.com), @visioncortex/vtracer, @resvg/resvg-js, pixi.js v8 SVG guide, Vercel functions limitations + runtimes docs, vercel-labs/ffmpeg-on-vercel, lovell/sharp#4567.

## Appendix: Q&A History

Q: What should the Docs workspace generate as its primary deliverable?
A: Native OOXML files — editable in real PowerPoint/Word/Excel (Recommended)

Q: Which engine should assemble the script → voiceover → images → MP4 pipeline?
A: Server-side ffmpeg (Recommended) — simplest, full control, no license concerns

Q: How autonomous should content generation be by default in the workspaces? (This sets the REQ-007 approval model and the whole UX rhythm.)
A: Budget-gated autonomy (Recommended) — agent generates freely within a per-run budget; approval only for over-budget or risky ops

Q: Where should the video assembly step (ffmpeg) actually run?
A: On the Next.js server with bundled ffmpeg-static (Recommended) — deterministic and testable; needs a long-lived Node server (ffmpeg-static is ~80MB, too big for small serverless functions)

Q: Who executes the pipeline stages in the Flow workspace (the agent authors the manifest; what runs it)?
A: The agent itself, in-sandbox (Recommended) — the agent walks its own manifest stage by stage via its tools, streaming step status; no second runtime to build

Q: After the foundation milestone (routing + artifacts + R2), which workspace should be built first?
A: Design → Video → Docs → Flow (Recommended) — cheapest first; proves the agent-driven pattern; video reuses design's image pipeline

Q: How deep should the Design workspace's mini-editor go in the MVP?
A: Add light composition — overlay text/branding + crop + export presets (closer to a mini design tool)

Q: Which image model should be the default for generation (cost vs quality baseline, overridable per project)?
A: User chooses at first generation in each project

Q: How should the Design mini-editor's composition tweaks (crop, text/branding overlays) feel in the UI?
A: This Is The reason why i mentioned using Pixi. I Would Like this to create Editable Vectors/SVG's instead of raster images. My Idea is That it would image generator for the base image/design, Then trace bitmap into editable paths. This means that that design Editor would be working with Vectors and SVGs instead of raster images

Q: What should the default per-run generation budget be (configurable per project and in env)?
A: No default — user sets the budget per project at creation

Q: How should the Design workspace get its editable vectors? (Bitmap tracing works best on flat/graphic images; photographic images trace into noisy paths.)
A: Trace-first with graphic-style prompts (Recommended) — the agent prompts for flat/illustration style, traces to SVG paths; photographic prompts degrade on trace

Q: What role should PixiJS play in the vector mini-editor? (Research on PixiJS v8 SVG/editing capabilities is running — this sets the editor architecture.)
A: PixiJS-rendered editor — traced SVG paths rendered as editable graphics in a WebGL canvas; drag/restyle paths, export edited SVG (Recommended, matches your Pixi intent)

Q: Where should Vibeflow run in production? (This locks CON-003: ffmpeg-static ~80MB, sharp/resvg native binaries, and a writable filesystem all need a real Node runtime.)
A: Im Planning on hosting this on Vercel

Q: How should the video voiceover voice be chosen? (ElevenLabs voices/models vary in cost and tone.)
A: User picks at first video generation per project (like the image model)

Q: How should the Docs workspace decide the output format (PPTX vs DOCX vs XLSX)?
A: Per generation in chat (Recommended) — the user names the format in the prompt or the agent asks; flexible and natural per request

Q: When should the raster → SVG trace happen in the Design workspace flow?
A: Both (Recommended) — auto-trace after each generation, plus a manual re-trace control (preset/simplify) for quality tuning