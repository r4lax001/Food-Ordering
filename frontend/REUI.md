# ReUI in PhungPong

Installed manually from the official public `base-nova` registry on 2026-10-18,
following https://reui.io/docs/get-started. Source lives in `src/components/reui/`.
These are ReUI source components, not visual approximations.

| Component | Source | Used in |
| --- | --- | --- |
| Badge | https://reui.io/r/base-nova/badge.json | Menu availability and order/reservation statuses |
| Alert | https://reui.io/r/base-nova/alert.json | Shared API error feedback and retry action |
| Number Field | https://reui.io/r/base-nova/number-field.json | Quantity selection in food details and cart |

Adaptations: imports use the local `src/lib/cn.js` helper (`clsx` + `tailwind-merge`);
Number Field uses existing Lucide icons and omits its unused scrub-area API.
The exported controls and Base UI behavior are retained. PhungPong semantic color
tokens are defined in `styles.css`; touch sizing and layout live in `responsive.css`.
The mobile navigation is a custom side panel using Base UI Dialog, not a ReUI
premium block. It provides modal focus containment, Escape, backdrop dismissal,
focus return, and body scroll locking.

`components.json` registers `@reui`; Vite and `jsconfig.json` both resolve `@/`.
ReUI's MIT notice is included in `licenses/REUI-LICENSE.md`. No paid blocks,
license keys, hosted service, or runtime requests to ReUI are required.

## Responsive verification

Start MySQL, Express on port 3000 and the frontend on port 5173, then run:

```powershell
npm --prefix frontend ci
npm --prefix frontend run test:responsive
```

The test uses an installed Google Chrome through Playwright, in an isolated
browser profile. It checks 12 viewport sizes from 320px to 2560px, content clipping,
quantity interaction, keyboard focus and error/empty states. A seeded menu is
required. Authenticated read-only layout checks use the existing local demo admin
file if available, or `UI_ADMIN_EMAIL` and `UI_ADMIN_PASSWORD` environment variables.
Without credentials those checks are explicitly marked as skipped in the report.
No credentials or tokens are written to the report. Output is in
`docs/evidence/responsive/`.

The matrix is browser viewport emulation; it does not claim physical iOS/Android
device or Safari verification. The application keeps its existing API contracts.
