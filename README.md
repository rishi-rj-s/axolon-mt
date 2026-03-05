# Axolon — Proforma Invoice Generator

A modern **Proforma Invoice Generator** built with **Angular v20** and **PrimeNG v20**, designed as an internal business tool with a desktop-application aesthetic. The app provides a complete invoicing workflow — from login to invoice creation — including editable line items, dynamic tax calculation, discount application, and full JSON data persistence, all within a compact, toolbar-driven interface powered by zoneless change detection and Angular Signals.

---

## ✨ New Features — Main Attraction

### Total Expense Field & Proportional Allocation

The standout feature of this application is the **Total Expense** system — a key addition for real-world invoicing workflows where overhead costs (shipping, logistics, handling) need to be distributed across line items.

| Feature | Description |
|---------|-------------|
| **Total Expense Input** | An editable numeric field in the invoice summary footer. Enter any overhead/shipping/logistics cost here. |
| **Proportional Expense Allocation** | The total expense is automatically distributed across all line items based on each item's proportion of the subtotal. For example, if Item A is 60% of the subtotal, it receives 60% of the total expense. |
| **Rounding-Safe Distribution** | The last line item absorbs any rounding remainder, ensuring the sum of allocated expenses always equals the total expense exactly. |
| **Auto-Recalculation** | Expense values recalculate instantly when quantities, prices, or the total expense value change — no manual refresh needed. |
| **Read-Only Expense Column** | Each line item's allocated expense is displayed in a non-editable column, preventing manual overrides while keeping full visibility. |

### JSON Data Export

Every time you click **Save**, the complete invoice (header fields, line items with allocated expenses, summary calculations, and notes) is serialized to structured JSON and written to the `output/` directory as a timestamped file — ready for downstream processing, API integration, or audit trails.

---

## 🏗 Technical Highlights

### Architecture & Scaling

- **Standalone Components Only** — No NgModules. Every component is standalone with explicit `imports`, making them fully tree-shakeable and independently testable.
- **Lazy-Loaded Routes** — Both the Login and Invoice pages are lazy-loaded via `loadComponent()`, keeping the initial bundle minimal (~77 kB transferred).
- **Smart/Dumb Component Pattern** — `InvoiceShell` is the smart container owning all state. Child components (`InvoiceHeader`, `InvoiceLineItems`, `InvoiceSummary`, `InvoiceToolbar`, `InvoiceActions`) receive slices of the form via `input()` signals and emit events via `output()` signals.
- **Mock Data Service** — All dropdown data (vendors, items, tax groups, currencies) is served through a single injectable service. Swap it with a real HTTP service for production — zero component changes needed.

### Dynamic Properties & Reactivity

- **Zoneless Change Detection** — The app runs without Zone.js, using Angular's experimental `provideZonelessChangeDetection()`. All reactivity is signal-driven.
- **Angular Signals** — `signal()`, `computed()`, `input()`, and `output()` are used throughout. No legacy `@Input()` / `@Output()` decorators.
- **Reactive Forms + FormArray** — The invoice form is a single reactive `FormGroup` containing a `FormArray` for line items. Adding/removing rows dynamically updates all calculations.
- **Reactive Calculation Chain** — `lineItems.valueChanges` → subtotal → discount → tax → total → expense allocation. Each step is chained via RxJS subscriptions on the form controls.
- **OnPush Change Detection** — Every component uses `ChangeDetectionStrategy.OnPush` for maximum rendering efficiency.

### Interactivity & UX

- **PrimeNG p-table** — Line items are rendered in a scrollable data table with inline editing for quantity/price and a dropdown for item selection.
- **Desktop-App Aesthetic** — Fixed viewport layout with a compact toolbar at the top, form body in the middle, and action bar at the bottom. No page scrolling — internal panel scrolling only.
- **Login Flow** — Form-validated username/password with reactive form validation. Social auth buttons (Google, Microsoft, Apple) for visual completeness. 1-second branded loader animation before redirect.
- **Confirmation Dialogs** — Destructive actions (Clear) trigger PrimeNG confirmation dialogs.
- **Toast Notifications** — Save success/failure is communicated via PrimeNG toast messages.
- **Default Data Population** — On navigation to the invoice page, the form is pre-populated from `src/assets/defaults/invoice-defaults.json`, simulating a loaded record.

### Code Standards (Angular v20)

- `@for ... track` and `@if` template syntax (no `*ngFor` / `*ngIf`)
- `inject()` function (no constructor injection)
- Simplified file names: `login.ts`, `invoice-shell.ts` (no `.component` suffix)
- Path aliases: `@core/*`, `@models/*`, `@features/*` (no relative `../../` imports)

---

## 📁 Project Structure

```
axolon-mt/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   └── services/
│   │   │       └── mock-data.service.ts      # Mock data for dropdowns
│   │   ├── features/
│   │   │   ├── login/
│   │   │   │   ├── login.ts                  # Login component
│   │   │   │   ├── login.html                # Login template
│   │   │   │   └── login.scss                # Login styles
│   │   │   └── invoice/
│   │   │       ├── invoice-shell.ts          # Smart container
│   │   │       ├── invoice-shell.html
│   │   │       ├── invoice-shell.scss
│   │   │       ├── invoice-header/           # Header fields (dropdowns, dates)
│   │   │       ├── invoice-line-items/       # Editable data table
│   │   │       ├── invoice-summary/          # Totals & expense input
│   │   │       ├── invoice-toolbar/          # Navigation toolbar
│   │   │       └── invoice-actions/          # Save, Clear, Close buttons
│   │   ├── models/
│   │   │   └── invoice.model.ts              # TypeScript interfaces
│   │   ├── app.ts                            # Root component
│   │   ├── app.html
│   │   ├── app.config.ts                     # App providers
│   │   └── app.routes.ts                     # Lazy-loaded routes
│   ├── assets/
│   │   └── defaults/
│   │       └── invoice-defaults.json         # Default form data
│   └── styles.scss                           # Global styles
├── output/                                   # Saved invoice JSON files
├── tsconfig.json                             # Path aliases configured
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **pnpm** (recommended) or npm

### Installation

```bash
# Clone the repo
git clone https://github.com/rishi-rj-s/axolon-mt.git
cd axolon-mt

# Install dependencies
pnpm install
```

### Development

```bash
# Start Angular dev server
pnpm dev
```

### Build

```bash
# Production build
pnpm build
```

Output is written to `dist/axolon-mt/`.

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular | 20.3.x |
| UI Library | PrimeNG | 20.4.x |
| Icons | PrimeIcons | 7.0.x |
| Styling | SCSS | — |
| Fonts | Inter (via @fontsource) | — |
| Package Manager | pnpm | 10.x |
| Save Server | Express | 5.x |
| Language | TypeScript | 5.9.x |

---

## 📊 Bundle Analysis

| Chunk | Size | Transfer |
|-------|------|----------|
| Initial (vendor + styles) | ~287 kB | ~78 kB |
| Invoice (lazy) | ~554 kB | ~95 kB |
| Login (lazy) | ~40 kB | ~10 kB |

---

## 📝 License

Private project — not licensed for redistribution.
