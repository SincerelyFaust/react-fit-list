import type * as React from "react";

/**
 * Controls which side of the list gets collapsed first when there is not enough
 * horizontal space to render every item.
 *
 * - `"end"`: keep the first items visible and collapse items from the tail.
 * - `"start"`: keep the last items visible and collapse items from the head.
 */
export type CollapseFrom = "end" | "start";

/**
 * Controls where the overflow affordance is rendered relative to the visible
 * items.
 *
 * - `"end"`: always render the overflow affordance at the far end of the row.
 * - `"closest"`: render the overflow affordance next to the hidden segment.
 */
export type OverflowPlacement = "end" | "closest";

/**
 * Determines how item widths are measured when calculating how many items fit.
 *
 * - `"live"`: use hidden measurement nodes / rendered nodes for accurate widths.
 * - `"estimate"`: use `estimatedItemWidth` for lower-cost calculations.
 */
export type FitListMeasurementMode = "live" | "estimate";

/**
 * Arguments passed to `renderOverflow` so consumers can customize the overflow
 * affordance (for example `+3`, `Show 3 more`, or a badge/menu trigger).
 */
export type FitListOverflowRenderArgs<T = unknown> = {
  /** Number of items currently hidden because they do not fit. */
  hiddenCount: number;
  /** Items currently hidden behind the overflow affordance. */
  hiddenItems: T[];
  /** Items currently visible in the collapsed list. */
  visibleItems: T[];
  /** Whether the list is currently expanded to reveal all items. */
  isExpanded: boolean;
  /** Sets the expanded state directly. */
  setExpanded: (expanded: boolean) => void;
  /** Toggles between collapsed and expanded states. */
  toggle: () => void;
};

/**
 * Options accepted by {@link useFitList}.
 */
export type UseFitListOptions<T> = {
  /** Source items that should be measured and rendered into the fit calculation. */
  items: readonly T[];
  /** Returns a stable React key for each item. */
  getKey: (item: T, index: number) => React.Key;
  /**
   * Keeps overflow space reserved even when all items currently fit.
   * Useful when you want layout to stay stable while container width changes.
   */
  reserveOverflowSpace?: boolean;
  /**
   * Fixed overflow width in pixels. Supply this when your overflow trigger has a
   * known size and you want to skip measuring it.
   */
  overflowWidth?: number;
  /** Horizontal spacing, in pixels, between items and the overflow trigger. */
  gap?: number;
  /** Which side should collapse first when the content overflows. */
  collapseFrom?: CollapseFrom;
  /**
   * Estimated width used in `"estimate"` mode, or as a fallback when a live
   * measurement is not available.
   */
  estimatedItemWidth?: number | ((item: T, index: number) => number);
  /** Strategy used to determine item widths. */
  measurementMode?: FitListMeasurementMode;
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Uncontrolled initial expanded state. */
  defaultExpanded?: boolean;
  /** Called whenever expanded state changes. */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Optional callback used to measure the overflow trigger width for a given
   * `hiddenCount`. This is useful when the overflow label changes size.
   */
  measureOverflowWidth?: (hiddenCount: number) => number;
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
  /** Registers the overflow node so its width can be measured. */
  registerOverflow: (node: HTMLElement | null) => void;
  /** Items currently visible in the collapsed list. */
  visibleItems: T[];
  /** Items currently hidden behind the overflow affordance. */
  hiddenItems: T[];
  /** Number of hidden items. */
  hiddenCount: number;
  /** Whether the list is currently expanded. */
  isExpanded: boolean;
  /** Sets the expanded state directly. */
  setExpanded: (expanded: boolean) => void;
  /** Toggles between collapsed and expanded states. */
  toggleExpanded: () => void;
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
  getKey: (item: T, index: number) => React.Key;
  /** Renders a single item in the list. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Renders the overflow affordance. Receives the hidden items/count plus
   * optional expansion helpers for custom implementations.
   */
  renderOverflow?: (args: FitListOverflowRenderArgs<T>) => React.ReactNode;
  /** Class applied to the root container. */
  className?: string;
  /** Class applied to the inner list that contains visible items. */
  listClassName?: string;
  /** Class applied to each visible item wrapper. */
  itemClassName?: string;
  /** Class applied to the overflow trigger wrapper. */
  overflowClassName?: string;
  /**
   * Class applied to hidden measurement nodes. Use this when item sizing depends
   * on CSS classes and must match the rendered item styles.
   */
  measureClassName?: string;
  /** Content rendered when `items` is empty. Defaults to `null`. */
  emptyFallback?: React.ReactNode;
  /** Horizontal spacing, in pixels, between items and overflow trigger. */
  gap?: number;
  /** Which side should collapse first when there is not enough room. */
  collapseFrom?: CollapseFrom;
  /** Controls whether the overflow stays pinned to the row end or hugs the hidden segment. */
  overflowPlacement?: OverflowPlacement;
  /** Keeps overflow space reserved even when everything fits. */
  reserveOverflowSpace?: boolean;
  /** Fixed overflow width in pixels. */
  overflowWidth?: number;
  /** Estimated item width used in `"estimate"` mode. */
  estimatedItemWidth?: number | ((item: T, index: number) => number);
  /** Strategy used to determine widths. */
  measurementMode?: FitListMeasurementMode;
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Uncontrolled initial expanded state. */
  defaultExpanded?: boolean;
  /** Called whenever expanded state changes. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Root element tag name. Defaults to `"div"`. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Called when the overflow trigger is clicked. No action is performed by default. */
  onOverflowClick?: (args: FitListOverflowRenderArgs<T>, event: React.MouseEvent<HTMLElement>) => void;
  /** Overflow trigger element tag name. Defaults to `"button"`. */
  overflowAs?: keyof React.JSX.IntrinsicElements;
};
