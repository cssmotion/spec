<p align="center">
  <img src="../cssm-brand/badge/cssm-badge-dark.svg" alt="CSSMotion" />
</p>

# CSSMotion (.cssm) Specification v1.0.0

> **The open animation format for the modern web — powered entirely by CSS.**

---

## What is .cssm?

A `.cssm` file is a ZIP archive that packages a CSS animation so it can be shared, dropped into any website, and rendered by browsers **with zero JavaScript runtime** — a portable, distributable container for CSS animations.

### The core idea

Every `.cssm` file contains:

```
my-animation.cssm (ZIP)
├── manifest.json           ← spec-compliant metadata (this document)
├── animation.svg           ← vector shapes only, no animation code
├── animation.css           ← @keyframes, @property, animation rules
├── preview/
│   ├── thumbnail.png       ← static 400×400px preview
│   └── preview.gif         ← optional animated GIF preview
└── variants/               ← optional alternate themes/modes
    ├── dark.css
    └── reduced-motion.css
```

The SVG holds the **structure**. The CSS holds the **motion**. The manifest holds the **contract**.

---

## Why .cssm?

| Feature | **.cssm** |
|---|---|
| Runtime dependency | Zero — browser-native |
| SEO / image search | CSS SVG animations are indexed |
| Themeable | CSS custom properties (`@property`) |
| Scroll-driven | `animation-timeline: scroll()` |
| Inspectable | Readable, hackable CSS |
| Dark mode | `variants` with `mediaQuery` |
| Accessibility | `reducedMotionBehavior` enforced by player |
| Design tokens | Typed `@property` tokens |
| File size | Lean CSS + optimized SVG |

---

## Specification

### File Format

A `.cssm` file is a **ZIP archive** (Deflate compression) with the `.cssm` file extension and MIME type `application/zip+cssmotion`.

### manifest.json

The `manifest.json` file MUST be placed at the **root** of the ZIP archive.

The JSON Schema for validation is published at:

```
https://cssmotion.dev/schema/1.0.0/manifest.json
```

Reference it in your manifest for IDE IntelliSense:

```json
{
  "$schema": "https://cssmotion.dev/schema/1.0.0/manifest.json"
}
```

---

### Top-Level Fields

| Field | Required | Type | Description |
|---|---|---|---|
| `specVersion` | ✅ | `string` (semver) | Which spec version this manifest targets |
| `identity` | ✅ | `object` | Name, ID, tags, category, revision |
| `attribution` | ✅ | `object` | Author, license |
| `playback` | ✅ | `object` | Duration, loop, triggers |
| `accessibility` | ✅ | `object` | Reduced motion behavior, WCAG level |
| `assets` | ✅ | `object` | Paths to SVG and CSS files |
| `dimensions` | ➖ | `object` | Intrinsic size and scaling |
| `theming` | ➖ | `object` | CSS token API, variants |
| `technical` | ➖ | `object` | CSS features used, browser support |
| `custom` | ➖ | `object` | Platform-specific or tooling extension data |

---

### `identity`

```json
"identity": {
  "id": "confetti-burst",
  "name": "Confetti Burst",
  "description": "A celebratory confetti explosion.",
  "tags": ["celebration", "confetti", "success"],
  "category": "feedback",
  "generator": "CSSMotion Studio 1.0.0",
  "createdAt": "2026-03-17T10:00:00Z",
  "revision": 1
}
```

**`id`** — URL-safe slug. Pattern: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`.

**`category`** — One of: `ui`, `feedback`, `loading`, `illustration`, `background`, `transition`, `icon`, `brand`.

---

### `playback`

```json
"playback": {
  "duration": 1200,
  "iterationCount": 1,
  "direction": "normal",
  "fillMode": "forwards",
  "easing": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "autoplay": true,
  "triggers": {
    "hover": false,
    "click": true,
    "inView": true,
    "scroll": false
  }
}
```

All values map directly to CSS `animation-*` properties. The `<cssm-player>` web component reads these to configure itself.

**`duration`** — Milliseconds per cycle. For scroll-driven animations, set to `0`.

**`triggers`** — Declarative event wiring for the player:
- `hover` → CSS class added on `:hover`
- `click` → CSS class added on click event
- `inView` → IntersectionObserver, class added when element enters viewport
- `scroll` → Links to `animation-timeline: scroll()` or `view()` in the CSS

---

### `theming.tokens`

This is the core of the CSS custom property API.

```json
"tokens": [
  {
    "name": "--cssm-primary-color",
    "type": "color",
    "defaultValue": "#FF6B6B",
    "description": "Primary particle colour",
    "group": "colors",
    "required": false
  },
  {
    "name": "--cssm-duration-scale",
    "type": "number",
    "defaultValue": "1",
    "description": "Duration multiplier (0.5 = 2× faster)",
    "group": "timing"
  }
]
```

**Rules:**
1. Token `name` MUST start with `--cssm-` to prevent collisions with host page variables.
2. Every token declared here MUST be registered with `@property` in `animation.css`.
3. `type` MUST match the `@property { syntax: '<type>' }` value.
4. The `defaultValue` MUST match the `@property { initial-value: ... }` value.

**Valid `type` values:** `color`, `length`, `number`, `angle`, `percentage`, `string`, `integer`.

**Token `group` values (for theming panel UI):** `colors`, `timing`, `shape`, `layout`, `typography`, `effects`.

**Consumer usage:**

```css
/* Override tokens in your own stylesheet */
cssm-player#my-animation {
  --cssm-primary-color: #6C63FF;
  --cssm-duration-scale: 1.5;
}
```

---

### `theming.variants`

Variants are alternate CSS files inside the ZIP that override token values:

```json
"variants": [
  {
    "id": "dark",
    "name": "Dark Mode",
    "file": "variants/dark.css",
    "mediaQuery": "(prefers-color-scheme: dark)"
  },
  {
    "id": "compact",
    "name": "Compact",
    "file": "variants/compact.css",
    "mediaQuery": null
  }
]
```

If `mediaQuery` is set, the player applies the variant automatically when the query matches. If `null`, the developer applies it explicitly:

```html
<cssm-player src="confetti.cssm" variant="compact"></cssm-player>
```

---

### `accessibility`

```json
"accessibility": {
  "reducedMotionBehavior": "static",
  "reducedMotionFile": null,
  "flashRisk": "none",
  "seizureRisk": false,
  "wcagLevel": "AA"
}
```

**`reducedMotionBehavior`** (required):

| Value | Behavior |
|---|---|
| `"static"` | Show the first SVG frame only — no animation plays |
| `"reduced"` | Load `reducedMotionFile` CSS — a simplified version of the animation |
| `"none"` | Animate regardless — only for **essential** animations. Requires `autoplayNote`. |

**`wcagLevel`** — `"A"`, `"AA"`, `"AAA"`, or `"unverified"`. AA or higher required for Featured status on cssmotion.dev.

**`flashRisk`** — `"none"`, `"low"`, or `"high"`. Animations with `"high"` are blocked from Featured status.

---

### `technical`

```json
"technical": {
  "cssFeatures": ["@keyframes", "@property", "animation-timeline", "clip-path"],
  "scrollDriven": false,
  "requiresJS": false,
  "minBrowserSupport": {
    "chrome": "115",
    "firefox": "120",
    "safari": "17",
    "edge": "115"
  }
}
```

**`requiresJS`** — MUST always be `false`. The animation itself must be pure CSS.

**`cssFeatures`** — The player checks these against `CSS.supports()` and warns or degrades gracefully.

Valid feature values: `@keyframes`, `@property`, `animation-timeline`, `animation-composition`, `clip-path`, `filter`, `mask`, `transform-style-3d`, `view-transition`, `scroll-driven`, `css-nesting`, `container-queries`, `color-mix`, `linear-easing`.

---

## `animation.svg` Requirements

- MUST be a valid SVG document
- MUST NOT contain `<style>`, `<animate>`, `<animateTransform>`, SMIL, or inline animation attributes
- SHOULD use semantic `id` attributes on animatable elements so CSS can target them
- SHOULD be optimized with SVGO before packaging

---

## `animation.css` Requirements

- MUST contain all `@keyframes` definitions
- MUST register each token declared in `manifest.theming.tokens` with `@property`
- SHOULD use `@layer cssm-base` to avoid specificity conflicts with host pages
- MUST include `@media (prefers-reduced-motion: reduce)` rules — unless `reducedMotionBehavior` is `"reduced"` (separate file) or justified `"none"`
- MUST use the `--cssm-` prefix for all custom properties
- MUST NOT use `!important` (except inside reduced-motion fallback rules)

```css
/* Correct structure for animation.css */
@layer cssm-base {

  @property --cssm-primary-color {
    syntax: '<color>';
    initial-value: #FF6B6B;
    inherits: false;
  }

  @keyframes confetti-fall {
    0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
    20%  { opacity: 1; }
    100% { transform: translateY(var(--cssm-spread-radius)) rotate(720deg); opacity: 0; }
  }

  .cssm-particle {
    animation: confetti-fall 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .cssm-particle {
      animation: none;
    }
  }

}
```

---

## `<cssm-player>` Web Component

The reference player implementation. Zero dependencies. ~3KB gzipped.

```html
<script type="module" src="https://cdn.cssmotion.dev/player/1.x/cssm-player.js"></script>

<!-- Basic usage -->
<cssm-player src="confetti.cssm"></cssm-player>

<!-- With overrides -->
<cssm-player
  src="confetti.cssm"
  autoplay
  loop
  triggers="inView"
  variant="dark"
></cssm-player>
```

The player:
1. Fetches and unzips the `.cssm` file
2. Reads `manifest.json`
3. Injects the SVG inline into its shadow DOM
4. Appends a `<style>` tag with the CSS
5. Sets up triggers (hover, click, IntersectionObserver, scroll)
6. Checks `prefers-reduced-motion` and applies `reducedMotionBehavior`
7. Applies auto-matching variants (e.g. dark mode)
8. Checks `technical.cssFeatures` against `CSS.supports()` and emits warnings

---

## Versioning

The spec follows **Semantic Versioning (semver)**:

- **PATCH** — Clarifications, description-only changes, adding enum values
- **MINOR** — New optional fields (backward compatible; old players skip unknown keys)
- **MAJOR** — Breaking changes to required fields, field removals, or semantic changes

Players MUST silently ignore unknown fields from higher minor versions of the same major version. A player that handles `1.2.0` MUST be able to read a `1.5.0` manifest.

---

## Validation

Validate a `.cssm` file using the CLI:

```bash
npx @cssm/validator my-animation.cssm
```

Or the Node API:

```js
import { validate } from '@cssm/validator';

const result = await validate('./my-animation.cssm');
if (!result.valid) {
  console.error(result.errors);
}
```

---

## Examples

| File | Description |
|---|---|
| `examples/simple-fade/` | Minimal valid manifest — bare minimum required fields |
| `examples/confetti-burst/` | Full manifest with tokens, variants, and triggers |
| `examples/reveal-on-scroll/` | Scroll-driven animation using `animation-timeline: view()` |

---

## License

The CSSMotion specification is published under **CC0-1.0** (public domain). Build freely.

The `@cssm/player` and `@cssm/validator` reference implementations are **MIT licensed**.

---

## Contributing

Issues and proposals welcome at: `https://github.com/cssmotion/spec`

Please read `CONTRIBUTING.md` before opening a PR.
