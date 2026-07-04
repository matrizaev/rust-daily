# Milestone 4 Implementation Plan

## Goal

Make the app installable and usable after the first load without a network connection.

Milestone 4 should add PWA readiness around the existing static frontend app:

- install metadata
- service worker registration
- app shell caching
- current lesson/content caching
- validation worker asset caching
- offline status UI
- update handling
- GitHub Pages-compatible build configuration

This milestone should not change the learning model, validation semantics, or local progress behavior.

## Scope

Milestone 4 should include:

- Web app manifest.
- App icons.
- Service worker.
- Service worker registration.
- App shell precaching.
- Validation worker asset caching.
- Same-origin asset runtime caching.
- Offline status indicator.
- Basic app update flow.
- Production smoke test with `npm run build` and `npm run preview`.
- GitHub Pages deployment base-path support.

Milestone 4 should not include:

- Browser Rust compiler integration.
- New lesson authoring pipeline.
- Import/export.
- Cloud sync.
- Accounts.
- Notifications.
- Advanced background sync.
- Push notifications.
- Multiple lesson packs.
- Analytics.

## Recommended PWA Approach

Use `vite-plugin-pwa` rather than a hand-written service worker.

Reasoning:

- Vite emits hashed asset names.
- The validation worker is emitted as a separate hashed asset.
- A plugin can generate a precache manifest safely.
- Manual precache lists are easy to get wrong after every build.

Recommended mode:

- `strategies: "generateSW"`.
- Register explicitly from app code.
- Use generated precache for build assets.
- Add runtime caching only for same-origin static assets.

If the plugin adds too much complexity, fall back to a hand-written service worker in a later revision, but start with the plugin.

## Install Metadata

Add PWA metadata:

- App name: `Rust Daily`.
- Short name: `Rust Daily`.
- Description: `Daily idiomatic Rust practice without autocomplete or AI.`
- Theme color: match current UI background.
- Background color: match current UI background.
- Display: `standalone`.
- Start URL: `./`.
- Scope: `./`.

Required icon assets:

```text
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-512.png
```

The existing SVG favicon can stay, but installable PWAs need PNG icons with appropriate sizes.

## Vite Configuration

Update `vite.config.ts` to include:

- React plugin.
- PWA plugin.
- Base path configuration.

Base path should support both GitHub Pages project URLs and custom domains.

Recommended environment variable:

```text
VITE_BASE_PATH=/rust-daily/
```

Vite config rule:

- Use `process.env.VITE_BASE_PATH ?? "/"`.

Examples:

- GitHub Pages project site: `/rust-daily/`.
- Custom domain root: `/`.

Do not hard-code one deployment target in source files.

## Service Worker Registration

Create:

```text
src/pwa/registerServiceWorker.ts
```

Responsibilities:

- Register service worker only in production builds.
- Detect when a new service worker is waiting.
- Expose update state to the app.
- Allow user-triggered update/reload.
- Fail quietly if service workers are unavailable.

Do not register a service worker during normal Vite dev unless explicitly testing PWA behavior. Dev service workers often create confusing stale-cache states.

## PWA State UI

Create:

```text
src/components/PwaStatus.tsx
```

Show compact status only when useful:

- Offline: `Offline mode`.
- Update available: `Update available` with a `Reload` button.
- Caching unsupported or failed: do not interrupt the main workflow.

Recommended placement:

- App shell top edge or Daily Home footer.
- Avoid modal interruptions.

The UI should not claim full offline validation for lessons whose validation assets are not cached.

## Caching Strategy

### Precache

Precache build-time app assets:

- `index.html`.
- Hashed JS chunks.
- Hashed CSS chunks.
- Validation worker chunk.
- Manifest.
- Icons.
- Favicon.

Because lesson content is currently imported from JSON into the app bundle, it is covered by JS chunk caching. If content becomes external static JSON later, it should be explicitly precached or runtime cached.

### Runtime Cache

Cache only same-origin, GET requests.

Recommended runtime strategy:

- Static hashed assets: cache-first.
- Navigation requests: network-first with cached app fallback.
- Icons/manifest: cache-first.

Do not cache:

- Cross-origin requests.
- Development server assets.
- Browser extension URLs.
- User source code as fetch payloads.

Drafts and progress stay in LocalStorage. The service worker should not manage those values.

## Offline Behavior

After one successful online load, the user should be able to:

- Open the app shell while offline.
- Open today's cached lesson.
- Edit code.
- Save drafts locally.
- View progress locally.
- Reveal hints.
- Run currently cached structural validation.

If an asset is not cached:

- Show a clear offline message.
- Preserve drafts.
- Retry when the user is online again.

## Validation Asset Caching

Milestone 2 emits a validation worker asset during build.

Milestone 4 must confirm:

- The validation worker chunk is included in the precache.
- Check still works after switching the browser offline.
- The worker URL resolves correctly under GitHub Pages base paths.

This is the highest-risk part of the milestone because worker URLs and base paths can fail silently after deployment.

## Proposed File Changes

```text
vite.config.ts                  # Add PWA plugin and base config.
package.json                    # Add PWA dependency if needed.
index.html                      # Add manifest/theme metadata if not plugin-generated.
public/
  icons/
    icon-192.png
    icon-512.png
    maskable-512.png
src/
  pwa/
    registerServiceWorker.ts
  components/
    PwaStatus.tsx
  App.tsx                       # Render PWA status.
```

Optional:

```text
public/offline.html             # Only if navigation fallback needs a separate page.
```

## Implementation Steps

1. Add PWA dependency.
   - Install `vite-plugin-pwa`.
   - Keep dependency pinned in `package-lock.json`.

2. Add icon assets.
   - Create 192px, 512px, and maskable 512px PNG icons.
   - Keep visual simple and readable at small sizes.

3. Configure Vite base path.
   - Add `base: process.env.VITE_BASE_PATH ?? "/"`.
   - Confirm local dev still works.
   - Confirm production build works with `/` and `/rust-daily/`.

4. Configure PWA plugin.
   - Add manifest metadata.
   - Generate service worker.
   - Include icons and favicon.
   - Ensure generated worker precaches the validation worker chunk.

5. Add service worker registration.
   - Register only in production.
   - Expose update available state.
   - Provide reload/update action.

6. Add PWA status UI.
   - Show offline status when `navigator.onLine === false`.
   - Listen for `online` and `offline` events.
   - Show update available when registration reports waiting worker.

7. Test production preview.
   - `npm run build`.
   - `npm run preview`.
   - Open app.
   - Verify manifest and service worker registration.

8. Test offline behavior.
   - Load app online.
   - Switch browser offline.
   - Reload.
   - Confirm app shell renders.
   - Confirm lesson opens.
   - Confirm draft storage still works.
   - Confirm Check works for the structural validation lesson.

9. Test base path.
   - Build with `VITE_BASE_PATH=/rust-daily/`.
   - Preview or inspect generated asset URLs.
   - Confirm worker asset path uses the base path correctly.

## Acceptance Criteria

Milestone 4 is complete when:

- Production build includes a valid web app manifest.
- App has installable PWA metadata.
- Service worker registers in production preview.
- App shell loads after first online load while offline.
- Today's lesson is available offline after first online load.
- Drafts and progress still work offline.
- Check works offline for the structural validation lesson after assets are cached.
- App displays offline status when offline.
- App can surface an available update without interrupting the lesson.
- Build supports GitHub Pages project base path.
- `npm run build` passes.
- Required Fallow checks pass.

## Suggested Manual QA

Run through this checklist:

- Run `npm run build`.
- Run `npm run preview`.
- Open the preview URL.
- Confirm browser devtools shows a web app manifest.
- Confirm service worker is registered.
- Open the first lesson.
- Run Check once while online.
- Switch browser devtools to offline.
- Reload the page.
- Confirm the app shell still loads.
- Confirm the lesson still opens.
- Edit code and confirm draft persistence still works.
- Run Check and confirm structural validation still works.
- Return to Daily Home and confirm progress still displays.
- Switch back online.
- Confirm offline status clears.

## GitHub Pages QA

Before publishing:

- Build with `VITE_BASE_PATH=/rust-daily/`.
- Confirm generated asset URLs start with `/rust-daily/`.
- Confirm hash routing still works.
- Confirm service worker scope is correct for `/rust-daily/`.

For a custom domain rooted at the app:

- Build with `VITE_BASE_PATH=/`.
- Confirm generated asset URLs start at root.

## Risks

### Stale Service Worker

Risk:

- User gets stuck on an old app shell.

Mitigation:

- Show update available state.
- Provide a reload button.
- Avoid aggressive `skipWaiting` unless the UI controls reload timing.

### Base Path Breakage

Risk:

- GitHub Pages project path breaks assets or worker URLs.

Mitigation:

- Use Vite `base`.
- Test both `/` and `/rust-daily/` builds.

### Validation Worker Not Cached

Risk:

- App loads offline but Check fails.

Mitigation:

- Verify worker chunk appears in the precache.
- Test offline Check in production preview.

### Oversized Cache

Risk:

- Future browser Rust engine assets become too large.

Mitigation:

- Milestone 4 only caches current structural validation assets.
- Browser Rust engine caching is deferred until the browser Rust milestone.

## Handoff to Milestone 5

Milestone 4 should leave these seams ready for content expansion:

- App shell is cacheable.
- Current lesson and validation assets work offline.
- Base path is deployment-safe.
- Local progress/drafts survive offline use.

Milestone 5 can then focus on content authoring workflow and a larger initial lesson set.
