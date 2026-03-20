import type * as React from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useControllableState } from "./useControllableState";
import type { UseFitListOptions, UseFitListResult } from "../types";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function getEstimatedWidth<T>(
  item: T,
  index: number,
  estimatedItemWidth: number | ((item: T, index: number) => number) | undefined,
  fallback: number
) {
  if (typeof estimatedItemWidth === "function")
    return estimatedItemWidth(item, index);
  if (typeof estimatedItemWidth === "number") return estimatedItemWidth;
  return fallback;
}

/**
 * Headless hook that calculates which items can fit in a single horizontal row.
 *
 * The hook measures the container and item widths, then returns visible/hidden
 * slices plus refs and callbacks needed to wire the calculation into your own UI.
 * Use this when you need the fitting logic without the default `FitList`
 * renderer.
 *
 * @example
 * ```tsx
 * const fit = useFitList({
 *   items: tags,
 *   getKey: (tag) => tag.id,
 *   gap: 8,
 * });
 * ```
 */
export function useFitList<T>({
  items,
  getKey,
  reserveOverflowSpace = false,
  overflowWidth,
  gap = 8,
  collapseFrom = "end",
  estimatedItemWidth,
  measurementMode = "live",
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  measureOverflowWidth,
}: UseFitListOptions<T>): UseFitListResult<T> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overflowRef = useRef<HTMLElement | null>(null);
  const itemNodeMap = useRef(new Map<React.Key, HTMLElement>());
  const measureNodeMap = useRef(new Map<React.Key, HTMLElement>());
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [isExpanded, setExpanded] = useControllableState<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });

  const compute = useCallback(() => {
    if (isExpanded) {
      setVisibleCount(items.length);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      setVisibleCount(items.length);
      return;
    }

    const containerWidth = container.clientWidth;
    if (!containerWidth) {
      setVisibleCount(items.length);
      return;
    }

    const keys = items.map(getKey);
    const itemWidths = items.map((item, index) => {
      const key = keys[index];
      const measureNode = measureNodeMap.current.get(key);
      const liveNode = itemNodeMap.current.get(key);
      if (measurementMode === "live") {
        if (measureNode) return measureNode.offsetWidth;
        if (liveNode) return liveNode.offsetWidth;
      }
      return getEstimatedWidth(item, index, estimatedItemWidth, 96);
    });

    let nextVisible = items.length;

    // Walk down from "all items visible" until the row fits within the container.
    for (let count = items.length; count >= 0; count -= 1) {
      const hiddenCount = items.length - count;
      const visibleWidths =
        collapseFrom === "end"
          ? itemWidths.slice(0, count)
          : itemWidths.slice(items.length - count);

      const itemsWidth = visibleWidths.reduce((sum, width) => sum + width, 0);
      const itemsGap = count > 1 ? gap * (count - 1) : 0;

      let currentOverflowWidth = 0;
      if (hiddenCount > 0) {
        if (typeof overflowWidth === "number") {
          currentOverflowWidth = overflowWidth;
        } else if (measureOverflowWidth) {
          currentOverflowWidth = measureOverflowWidth(hiddenCount);
        } else {
          currentOverflowWidth = overflowRef.current?.offsetWidth ?? 44;
        }
      } else if (reserveOverflowSpace) {
        if (typeof overflowWidth === "number") {
          currentOverflowWidth = overflowWidth;
        } else {
          currentOverflowWidth = overflowRef.current?.offsetWidth ?? 44;
        }
      }

      const overflowGap =
        (hiddenCount > 0 || reserveOverflowSpace) && count > 0 ? gap : 0;
      const total = itemsWidth + itemsGap + overflowGap + currentOverflowWidth;

      if (total <= containerWidth) {
        nextVisible = count;
        break;
      }
    }

    setVisibleCount((prev) => (prev === nextVisible ? prev : nextVisible));
  }, [
    collapseFrom,
    estimatedItemWidth,
    gap,
    getKey,
    isExpanded,
    items,
    measurementMode,
    measureOverflowWidth,
    overflowWidth,
    reserveOverflowSpace,
  ]);

  useIsoLayoutEffect(() => {
    compute();
  }, [compute]);

  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(compute);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [compute]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [compute]);

  const registerItem = useCallback(
    (key: React.Key) => (node: HTMLElement | null) => {
      if (node) {
        itemNodeMap.current.set(key, node);
      } else {
        itemNodeMap.current.delete(key);
      }
    },
    []
  );

  const registerMeasureItem = useCallback(
    (key: React.Key) => (node: HTMLElement | null) => {
      if (node) {
        measureNodeMap.current.set(key, node);
      } else {
        measureNodeMap.current.delete(key);
      }
    },
    []
  );

  const registerOverflow = useCallback((node: HTMLElement | null) => {
    overflowRef.current = node;
  }, []);

  const clampedVisibleCount = Math.max(0, Math.min(visibleCount, items.length));

  const visibleItems = useMemo(() => {
    if (isExpanded) return [...items];
    if (collapseFrom === "end") return items.slice(0, clampedVisibleCount);
    return items.slice(items.length - clampedVisibleCount);
  }, [clampedVisibleCount, collapseFrom, isExpanded, items]);

  const hiddenItems = useMemo(() => {
    if (isExpanded) return [];
    if (collapseFrom === "end") return items.slice(clampedVisibleCount);
    return items.slice(0, items.length - clampedVisibleCount);
  }, [clampedVisibleCount, collapseFrom, isExpanded, items]);

  const toggleExpanded = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded, setExpanded]);

  return {
    containerRef,
    registerItem,
    registerMeasureItem,
    registerOverflow,
    visibleItems: visibleItems as T[],
    hiddenItems: hiddenItems as T[],
    hiddenCount: hiddenItems.length,
    isExpanded,
    setExpanded,
    toggleExpanded,
    recompute: compute,
  };
}
