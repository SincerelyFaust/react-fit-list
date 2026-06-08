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
  estimateItemWidth: number | ((item: T, index: number) => number) | undefined,
  fallback: number
) {
  if (typeof estimateItemWidth === "function")
    return estimateItemWidth(item, index);
  if (typeof estimateItemWidth === "number") return estimateItemWidth;
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
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const compute = useCallback(() => {
    if (isOpen) {
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

    const keys = items.map(getItemKey);
    const itemWidths = items.map((item, index) => {
      const key = keys[index];
      const measureNode = measureNodeMap.current.get(key);
      const liveNode = itemNodeMap.current.get(key);
      if (measurementMode === "actual") {
        if (measureNode) return measureNode.offsetWidth;
        if (liveNode) return liveNode.offsetWidth;
      }
      return getEstimatedWidth(item, index, estimateItemWidth, 96);
    });

    const largestAllowedCount = Math.min(
      items.length,
      typeof maxVisibleItems === "number"
        ? Math.max(0, Math.floor(maxVisibleItems))
        : items.length
    );
    let nextVisible = largestAllowedCount;

    // Walk down from the maximum allowed visible count until the row fits.
    for (let count = largestAllowedCount; count >= 0; count -= 1) {
      const hiddenCount = items.length - count;
      const visibleWidths =
        trimFrom === "end"
          ? itemWidths.slice(0, count)
          : itemWidths.slice(items.length - count);

      const itemsWidth = visibleWidths.reduce((sum, width) => sum + width, 0);
      const itemsGap = count > 1 ? spacing * (count - 1) : 0;

      let currentDisclosureWidth = 0;
      if (hiddenCount > 0) {
        if (typeof disclosureWidth === "number") {
          currentDisclosureWidth = disclosureWidth;
        } else if (measureDisclosureWidth) {
          currentDisclosureWidth = measureDisclosureWidth(hiddenCount);
        } else {
          currentDisclosureWidth = disclosureRef.current?.offsetWidth ?? 44;
        }
      } else if (reserveDisclosureSpace) {
        if (typeof disclosureWidth === "number") {
          currentDisclosureWidth = disclosureWidth;
        } else {
          currentDisclosureWidth = disclosureRef.current?.offsetWidth ?? 44;
        }
      }

      const disclosureGap =
        (hiddenCount > 0 || reserveDisclosureSpace) && count > 0 ? spacing : 0;
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
    spacing,
    getItemKey,
    isOpen,
    items,
    measurementMode,
    maxVisibleItems,
    measureDisclosureWidth,
    disclosureWidth,
    reserveDisclosureSpace,
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

  const registerDisclosure = useCallback((node: HTMLElement | null) => {
    disclosureRef.current = node;
  }, []);

  const clampedVisibleCount = Math.max(0, Math.min(visibleCount, items.length));

  const visibleItems = useMemo(() => {
    if (isOpen) return [...items];
    if (trimFrom === "end") return items.slice(0, clampedVisibleCount);
    return items.slice(items.length - clampedVisibleCount);
  }, [clampedVisibleCount, trimFrom, isOpen, items]);

  const hiddenItems = useMemo(() => {
    if (isOpen) return [];
    if (trimFrom === "end") return items.slice(clampedVisibleCount);
    return items.slice(0, items.length - clampedVisibleCount);
  }, [clampedVisibleCount, trimFrom, isOpen, items]);

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
    isOpen,
    setOpen,
    toggleOpen,
    recompute: compute,
  };
}
