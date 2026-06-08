import type * as React from "react";

/**
 * Controls which side of the list gets trimmed first when there is not enough
 * horizontal space to render every item.
 *
 * - `"end"`: keep the first items visible and hide items from the tail.
 * - `"start"`: keep the last items visible and hide items from the head.
 */
export type TrimFrom = "end" | "start";

/**
 * Controls where the disclosure is rendered relative to the visible items.
 *
 * - `"edge"`: keep the disclosure at the far edge of the row.
 * - `"adjacent"`: render the disclosure next to the trimmed side.
 */
export type DisclosurePlacement = "edge" | "adjacent";

/**
 * Determines how item widths are measured when calculating how many items fit.
 *
 * - `"actual"`: use rendered measurement nodes for accurate widths.
 * - `"estimated"`: use `estimateItemWidth` for lower-cost calculations.
 */
export type FitListMeasurementMode = "actual" | "estimated";

/**
 * Arguments passed to `renderDisclosure` so consumers can customize the control
 * used to reveal, preview, or list hidden items.
 */
export type FitListDisclosureRenderArgs<T = unknown> = {
  /**
   * Number of items hidden in the closed list. This remains populated while
   * open so disclosure controls can still show counts or close the list.
   */
  hiddenCount: number;
  /**
   * Items hidden in the closed list. This remains populated while open so
   * menus/popovers can keep showing the overflow segment.
   */
  hiddenItems: T[];
  /** Items currently visible in the rendered list. */
  visibleItems: T[];
  /** Items that fit while the list is closed. */
  closedVisibleItems: T[];
  /** Items that overflow while the list is closed. */
  closedHiddenItems: T[];
  /** Whether the closed list overflows. */
  isOverflowing: boolean;
  /** Whether the list is currently open to reveal all items. */
  isOpen: boolean;
  /** Sets the open state directly. */
  setOpen: (open: boolean) => void;
  /** Toggles between closed and open states. */
  toggleOpen: () => void;
};

/**
 * Options accepted by {@link useFitList}.
 */
export type UseFitListOptions<T> = {
  /** Source items that should be measured and rendered into the fit calculation. */
  items: readonly T[];
  /** Returns a stable React key for each item. */
  getItemKey: (item: T, index: number) => React.Key;
  /** Horizontal spacing, in pixels, between items and the disclosure. Negative values are clamped to `0`. */
  spacing?: number;
  /** Which side should be trimmed first when the content overflows. */
  trimFrom?: TrimFrom;
  /** Maximum number of items allowed in the closed list, even when more fit. */
  maxVisibleItems?: number;
  /**
   * Keeps disclosure space reserved even when all items currently fit. Useful
   * when you want layout to stay stable while container width changes.
   */
  reserveDisclosureSpace?: boolean;
  /**
   * Fixed disclosure width in pixels. Supply this when your disclosure control
   * has a known size and you want to skip measuring it.
   */
  disclosureWidth?: number;
  /**
   * Estimated width used in `"estimated"` mode, or as a fallback when an actual
   * measurement is not available.
   */
  estimateItemWidth?: number | ((item: T, index: number) => number);
  /** Strategy used to determine item widths. */
  measurementMode?: FitListMeasurementMode;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Called whenever open state changes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Optional callback used to measure the disclosure width for a given hidden
   * count. This is useful when the default disclosure label changes size.
   */
  measureDisclosureWidth?: (hiddenCount: number) => number;
};

/**
 * Result returned by {@link useFitList}.
 */
export type UseFitListResult<T> = {
  /** Ref that must be attached to the outer list container. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Registers a visible item node so its width can be measured. */
  registerItem: (key: React.Key) => (node: HTMLElement | null) => void;
  /** Registers a hidden measurement node for accurate width calculations. */
  registerMeasureItem: (key: React.Key) => (node: HTMLElement | null) => void;
  /** Registers the disclosure node so its width can be measured. */
  registerDisclosure: (node: HTMLElement | null) => void;
  /** Items currently visible in the rendered list. */
  visibleItems: T[];
  /** Items currently hidden while the list is rendered. Empty when open. */
  hiddenItems: T[];
  /** Number of items currently hidden while the list is rendered. `0` when open. */
  hiddenCount: number;
  /** Items that fit while the list is closed. */
  closedVisibleItems: T[];
  /** Items that overflow while the list is closed. */
  closedHiddenItems: T[];
  /** Number of items that overflow while the list is closed. */
  closedHiddenCount: number;
  /** Whether the closed list has overflow items. */
  isOverflowing: boolean;
  /** Whether the list is currently open. */
  isOpen: boolean;
  /** Sets the open state directly. */
  setOpen: (open: boolean) => void;
  /** Toggles between closed and open states. */
  toggleOpen: () => void;
  /** Forces the hook to recompute visibility using current measurements. */
  recompute: () => void;
};

/**
 * Props accepted by the {@link FitList} component.
 */
export type FitListProps<T> = {
  /** Items to render. */
  items: readonly T[];
  /** Returns a stable React key for each item. */
  getItemKey: (item: T, index: number) => React.Key;
  /** Renders a single item in the list. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Renders the disclosure control. Return your own button/menu trigger here if
   * you need custom click handling or markup.
   */
  renderDisclosure?: (args: FitListDisclosureRenderArgs<T>) => React.ReactNode;
  /** Class applied to the root container. */
  className?: string;
  /** Class applied to the visible-items wrapper. */
  listClassName?: string;
  /** Class applied to each visible item wrapper. */
  itemClassName?: string;
  /** Class applied to the default disclosure button. */
  disclosureClassName?: string;
  /** Props spread onto the root container. */
  rootProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Props spread onto the visible-items wrapper. */
  listProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Props spread onto each visible item wrapper. */
  itemProps?:
    | React.HTMLAttributes<HTMLDivElement>
    | ((item: T, index: number) => React.HTMLAttributes<HTMLDivElement>);
  /** Props spread onto the disclosure wrapper. */
  disclosureWrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  /**
   * Class applied to hidden measurement nodes. Use this when item sizing depends
   * on CSS classes and must match the rendered item styles.
   */
  sizerClassName?: string;
  /** Content rendered when `items` is empty. Defaults to `null`. */
  emptyFallback?: React.ReactNode;
  /** Horizontal spacing, in pixels, between items and the disclosure. Negative values are clamped to `0`. */
  spacing?: number;
  /** Which side should be trimmed first when there is not enough room. */
  trimFrom?: TrimFrom;
  /** Controls whether the disclosure stays pinned to the row edge or sits next to the trimmed side. */
  disclosurePlacement?: DisclosurePlacement;
  /** Maximum number of items allowed in the closed list, even when more fit. */
  maxVisibleItems?: number;
  /** Keeps disclosure space reserved even when everything fits. */
  reserveDisclosureSpace?: boolean;
  /** Fixed disclosure width in pixels. */
  disclosureWidth?: number;
  /** Estimated item width used in `"estimated"` mode. */
  estimateItemWidth?: number | ((item: T, index: number) => number);
  /** Strategy used to determine widths. */
  measurementMode?: FitListMeasurementMode;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Called whenever open state changes. */
  onOpenChange?: (open: boolean) => void;
};
