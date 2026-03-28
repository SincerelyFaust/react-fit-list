# react-fit-list

[![npm version](https://img.shields.io/npm/v/react-fit-list.svg)](https://www.npmjs.com/package/react-fit-list)

![Demo](https://raw.githubusercontent.com/SincerelyFaust/react-fit-list/main/.github/images/demo.gif)

👉 **Live demo:** https://sincerelyfaust.github.io/react-fit-list/

📦 **npm:** https://www.npmjs.com/package/react-fit-list

`react-fit-list` is a headless React utility for rendering a single horizontal row of items, keeping what fits visible and collapsing the rest behind an overflow trigger.

It ships with:

- a ready-to-use `<FitList />` component
- a headless `useFitList()` hook for custom renderers
- TypeScript types for component and hook APIs

## Installation

```bash
npm install react-fit-list
```

## Quick start

```tsx
import { FitList } from 'react-fit-list'

const items = [
  { id: 1, label: 'Security' },
  { id: 2, label: 'Startups' },
  { id: 3, label: 'Fintech' },
  { id: 4, label: 'B2B SaaS' },
]

export function Example() {
  return (
    <div style={{ width: 240 }}>
      <FitList
        items={items}
        getKey={(item) => item.id}
        renderItem={(item) => (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid #d0d7de',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </span>
        )}
      />
    </div>
  )
}
```

## Why react-fit-list

- Keeps horizontal UI elements on one line without forcing you into a styled component library.
- Gives you a simple default component when you want fast adoption.
- Exposes the fitting logic as a hook when you need custom structure or interaction.
- Stays focused on one job: deciding which items fit and how many are hidden.

## Component or hook?

Use `<FitList />` when you want the fitting behavior with the least amount of setup.

Use `useFitList()` when you want full control over markup, overflow interaction, positioning, or accessibility semantics.

## Design goals

- Headless-first API with minimal assumptions about your UI.
- Reliable single-row fitting for chips, tags, breadcrumbs, recipients, and similar content.
- Predictable behavior with either live DOM measurement or width estimates.
- Small public API that is easy to understand and customize.

## Component API

### `<FitList />`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly T[]` | — | Items to fit into a single row. |
| `getKey` | `(item, index) => React.Key` | — | Returns a stable React key for each item. |
| `renderItem` | `(item, index) => React.ReactNode` | — | Renders a single item. |
| `renderOverflow` | `(args) => React.ReactNode` | `({ hiddenCount }) => +hiddenCount` | Renders the overflow trigger contents. |
| `className` | `string` | — | Class applied to the root row. |
| `itemsClassName` | `string` | — | Class applied to the visible-items wrapper. |
| `itemClassName` | `string` | — | Class applied to each visible item wrapper. |
| `overflowButtonClassName` | `string` | — | Class applied to the overflow button element. |
| `measurementClassName` | `string` | `itemClassName` | Class applied to hidden measurement nodes when sizing depends on matching CSS. |
| `emptyContent` | `React.ReactNode` | `null` | Content rendered when `items` is empty. |
| `gap` | `number` | `8` | Space between items and the overflow trigger. |
| `collapseFrom` | `'end' \| 'start'` | `'end'` | Which side of the list gets collapsed first. |
| `overflowPosition` | `'edge' \| 'inline'` | `'edge'` | Keep the overflow trigger at the row edge or place it next to the hidden side. |
| `preserveOverflowSpace` | `boolean` | `false` | Reserve room for the overflow trigger even when everything fits. |
| `overflowWidth` | `number` | auto | Fixed overflow width in pixels. Useful when the trigger size is known. |
| `itemWidthEstimate` | `number \| ((item, index) => number)` | fallback `96` | Width estimate used in `estimate` mode or before live measurements are available. |
| `measurement` | `'live' \| 'estimate'` | `'live'` | Width calculation strategy. |
| `expanded` | `boolean` | uncontrolled | Controlled expanded state. |
| `defaultExpanded` | `boolean` | `false` | Initial expanded state for uncontrolled usage. |
| `onExpandedChange` | `(expanded: boolean) => void` | — | Called when expanded state changes. |
| `onOverflowClick` | `(args, event) => void` | — | Called when the overflow button is clicked. |

### Overflow render args

`renderOverflow` and `onOverflowClick` receive the same overflow state object:

```ts
{
  hiddenCount: number
  hiddenItems: T[]
  visibleItems: T[]
  isExpanded: boolean
  setExpanded: (expanded: boolean) => void
  toggle: () => void
}
```

## Hook API

### `useFitList()`

```tsx
import { useFitList } from 'react-fit-list'

const fit = useFitList({
  items,
  getKey: (item) => item.id,
  gap: 8,
})
```

#### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `readonly T[]` | — | Items to measure. |
| `getKey` | `(item, index) => React.Key` | — | Returns a stable React key for each item. |
| `gap` | `number` | `8` | Space between items and overflow. |
| `collapseFrom` | `'end' \| 'start'` | `'end'` | Which side collapses first. |
| `preserveOverflowSpace` | `boolean` | `false` | Reserve space for overflow even when all items fit. |
| `overflowWidth` | `number` | auto | Fixed overflow width in pixels. |
| `itemWidthEstimate` | `number \| ((item, index) => number)` | fallback `96` | Width estimate for `estimate` mode. |
| `measurement` | `'live' \| 'estimate'` | `'live'` | Width calculation strategy. |
| `expanded` | `boolean` | uncontrolled | Controlled expanded state. |
| `defaultExpanded` | `boolean` | `false` | Initial expanded state. |
| `onExpandedChange` | `(expanded: boolean) => void` | — | Called whenever expanded state changes. |
| `measureOverflowWidth` | `(hiddenCount: number) => number` | — | Custom overflow width measurement callback. |

#### Return value

| Field | Type | Description |
| --- | --- | --- |
| `containerRef` | `RefObject<HTMLDivElement \| null>` | Attach to the outer container. |
| `registerItem` | `(key) => (node) => void` | Registers visible item nodes for measurement. |
| `registerMeasureItem` | `(key) => (node) => void` | Registers hidden measurement nodes. |
| `registerOverflow` | `(node) => void` | Registers the overflow node. |
| `visibleItems` | `T[]` | Items currently visible in the collapsed row. |
| `hiddenItems` | `T[]` | Items currently hidden behind overflow. |
| `hiddenCount` | `number` | Number of hidden items. |
| `isExpanded` | `boolean` | Whether the list is expanded. |
| `setExpanded` | `(expanded: boolean) => void` | Sets expanded state directly. |
| `toggleExpanded` | `() => void` | Toggles expanded state. |
| `recompute` | `() => void` | Re-runs the fit calculation using current measurements. |

## Rendering and customization notes

### Measurement modes

- `measurement="live"` uses rendered DOM nodes for the most accurate fit calculation.
- `measurement="estimate"` uses `itemWidthEstimate`, which is useful when widths are predictable or when you want to avoid live measurement costs.

### Class names

- `className` styles the outer row container.
- `itemsClassName` styles the wrapper that contains the visible items.
- `itemClassName` styles each visible item wrapper.
- `overflowButtonClassName` styles the built-in overflow button.
- `measurementClassName` styles the hidden measurement nodes and should usually match item sizing styles when CSS changes intrinsic width.

### Overflow interaction

`FitList` always renders the overflow affordance as a `<button>`. If you need a custom trigger, custom positioning, or your own interaction model, use `useFitList()` and render the UI yourself.

## Notes

- Keep item content on one line for the most predictable results.
- Use stable keys from `getKey`; changing keys between renders invalidates width measurements.
- If item width depends on CSS, make sure the measurement nodes receive matching styles.
- The package is safe to render in SSR environments. Layout measurement only happens in the browser after mount.