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

function toNonNegativeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback;
}

function getEstimatedWidth<T>(
  item: T,
  index: number,
  estimateItemWidth: number | ((item: T, index: number) => number) | undefined,
  fallback: number
) {
  if (typeof estimateItemWidth === "function") {
    return toNonNegativeNumber(estimateItemWidth(item, index), fallback);
  }

  return toNonNegativeNumber(estimateItemWidth, fallback);
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
 *   getItemKey: (tag) => tag.id,
 *   spacing: 8,
 * });
 * ```
 */
export function useFitList<T>({
  items,
  getItemKey,
  reserveDisclosureSpace = false,
  disclosureWidth,
  spacing = 8,
  trimFrom = "end",
  maxVisibleItems,
  estimateItemWidth,
  measurementMode = "actual",
  open,
  defaultOpen = false,
  onOpenChange,
  measureDisclosureWidth,
}: UseFitListOptions<T>): UseFitListResult<T> {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const disclosureRef = useRef<HTMLElement | null>(null);
  const itemNodeMap = useRef(new Map<React.Key, HTMLElement>());
  const measureNodeMap = useRef(new Map<React.Key, HTMLElement>());
  const animationFrameRef = useRef<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const normalizedSpacing = toNonNegativeNumber(spacing, 8);
  const normalizedDisclosureWidth =
    typeof disclosureWidth === "number"
      ? toNonNegativeNumber(disclosureWidth, 0)
      : undefined;

  const compute = useCallback(() => {
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

    const keys = items.map(getItemKey);
    const itemWidths = items.map((item, index) => {
      const key = keys[index];
      const measureNode = measureNodeMap.current.get(key);
      const liveNode = itemNodeMap.current.get(key);
      if (measurementMode === "actual") {
        if (measureNode) return toNonNegativeNumber(measureNode.offsetWidth, 0);
        if (liveNode) return toNonNegativeNumber(liveNode.offsetWidth, 0);
      }
      return getEstimatedWidth(item, index, estimateItemWidth, 96);
    });

    const largestAllowedCount = Math.min(
      items.length,
      typeof maxVisibleItems === "number" && Number.isFinite(maxVisibleItems)
        ? Math.max(0, Math.floor(maxVisibleItems))
        : items.length
    );
    let nextVisible = largestAllowedCount;

    const prefixWidths = [0];
    for (const width of itemWidths) {
      prefixWidths.push(prefixWidths[prefixWidths.length - 1] + width);
    }

    const getVisibleItemsWidth = (count: number) => {
      if (count <= 0) return 0;
      if (trimFrom === "end") return prefixWidths[count];

      const startIndex = items.length - count;
      return prefixWidths[items.length] - prefixWidths[startIndex];
    };

    const getDisclosureWidth = (hiddenCount: number) => {
      const needsDisclosure = hiddenCount > 0 || reserveDisclosureSpace;
      if (!needsDisclosure) return 0;

      if (typeof normalizedDisclosureWidth === "number") {
        return normalizedDisclosureWidth;
      }

      if (measureDisclosureWidth) {
        return toNonNegativeNumber(measureDisclosureWidth(hiddenCount), 44);
      }

      return toNonNegativeNumber(disclosureRef.current?.offsetWidth, 44);
    };

    // Walk down from the maximum allowed visible count until the row fits.
    // Prefix sums keep each candidate check O(1) instead of repeatedly slicing
    // and reducing item widths. This makes recomputes scale linearly with the
    // number of items.
    for (let count = largestAllowedCount; count >= 0; count -= 1) {
      const hiddenCount = items.length - count;
      const itemsWidth = getVisibleItemsWidth(count);
      const itemsGap = count > 1 ? normalizedSpacing * (count - 1) : 0;
      const currentDisclosureWidth = getDisclosureWidth(hiddenCount);
      const disclosureGap =
        (hiddenCount > 0 || reserveDisclosureSpace) && count > 0
          ? normalizedSpacing
          : 0;
      const total = itemsWidth + itemsGap + disclosureGap + currentDisclosureWidth;

      if (total <= containerWidth) {
        nextVisible = count;
        break;
      }
    }

    setVisibleCount((prev) => (prev === nextVisible ? prev : nextVisible));
  }, [
    trimFrom,
    estimateItemWidth,
    normalizedSpacing,
    getItemKey,
    items,
    measurementMode,
    maxVisibleItems,
    measureDisclosureWidth,
    normalizedDisclosureWidth,
    reserveDisclosureSpace,
  ]);

  const requestRecompute = useCallback(() => {
    if (typeof window === "undefined") {
      compute();
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;
      compute();
    });
  }, [compute]);

  useIsoLayoutEffect(() => {
    compute();
  }, [compute]);

  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(requestRecompute);

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [requestRecompute]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", requestRecompute);
    return () => window.removeEventListener("resize", requestRecompute);
  }, [requestRecompute]);

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

  const registerDisclosure = useCallback((node: HTMLElement | null) => {
    disclosureRef.current = node;
  }, []);

  const clampedVisibleCount = Math.max(0, Math.min(visibleCount, items.length));

  const closedVisibleItems = useMemo(() => {
    if (trimFrom === "end") return items.slice(0, clampedVisibleCount);
    return items.slice(items.length - clampedVisibleCount);
  }, [clampedVisibleCount, trimFrom, items]);

  const closedHiddenItems = useMemo(() => {
    if (trimFrom === "end") return items.slice(clampedVisibleCount);
    return items.slice(0, items.length - clampedVisibleCount);
  }, [clampedVisibleCount, trimFrom, items]);

  const visibleItems = useMemo(() => {
    if (isOpen) return [...items];
    return closedVisibleItems;
  }, [closedVisibleItems, isOpen, items]);

  const hiddenItems = useMemo(() => {
    if (isOpen) return [];
    return closedHiddenItems;
  }, [closedHiddenItems, isOpen]);

  const toggleOpen = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  return {
    containerRef,
    registerItem,
    registerMeasureItem,
    registerDisclosure,
    visibleItems: visibleItems as T[],
    hiddenItems: hiddenItems as T[],
    hiddenCount: hiddenItems.length,
    closedVisibleItems: closedVisibleItems as T[],
    closedHiddenItems: closedHiddenItems as T[],
    closedHiddenCount: closedHiddenItems.length,
    isOverflowing: closedHiddenItems.length > 0,
    isOpen,
    setOpen,
    toggleOpen,
    recompute: compute,
  };
}
