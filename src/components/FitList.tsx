import * as React from "react";
import { useFitList } from "../hooks/useFitList";
import type { FitListDisclosureRenderArgs, FitListProps } from "../types";

function defaultDisclosure({
  hiddenCount,
  isOpen,
  toggleOpen,
}: FitListDisclosureRenderArgs<unknown>) {
  return (
    <button type="button" onClick={toggleOpen} aria-expanded={isOpen}>
      +{hiddenCount}
    </button>
  );
}

/**
 * Responsive single-row list that keeps the items that fit visible and places
 * the rest behind a configurable disclosure control.
 *
 * `FitList` is useful for chips, tags, breadcrumbs, recipients, filters, and
 * other horizontally laid out items where preserving a clean single-row layout
 * matters more than showing every element at once.
 *
 * Features:
 * - automatic fit calculation based on available width
 * - customizable disclosure renderer (`+3`, `Show more`, menu trigger, etc.)
 * - controlled or uncontrolled open state
 * - trim from the start or the end of the list
 * - actual DOM measurement or estimated-width mode
 */
export function FitList<T>({
  items,
  getItemKey,
  renderItem,
  renderDisclosure = defaultDisclosure,
  className,
  listClassName,
  itemClassName,
  disclosureClassName,
  sizerClassName,
  emptyFallback = null,
  spacing = 8,
  trimFrom = "end",
  disclosurePlacement = "edge",
  maxVisibleItems,
  reserveDisclosureSpace = false,
  disclosureWidth,
  estimateItemWidth,
  measurementMode = "actual",
  open,
  defaultOpen = false,
  onOpenChange,
}: FitListProps<T>) {
  const disclosureMeasureRef = React.useRef<HTMLSpanElement | null>(null);
  const isDefaultDisclosureRenderer = renderDisclosure === defaultDisclosure;

  const measureDisclosureWidth = React.useCallback(
    (hiddenCount: number) => {
      if (typeof disclosureWidth === "number") return disclosureWidth;
      const node = disclosureMeasureRef.current;
      if (!node) return 44;

      // The default disclosure label changes width with the hidden count, so we
      // temporarily swap its text content to measure the exact width needed.
      if (isDefaultDisclosureRenderer) {
        const previous = node.textContent;
        node.textContent = `+${hiddenCount}`;
        const width = node.offsetWidth;
        node.textContent = previous;
        return width;
      }

      return node.offsetWidth;
    },
    [isDefaultDisclosureRenderer, disclosureWidth]
  );

  const {
    containerRef,
    registerItem,
    registerMeasureItem,
    registerDisclosure,
    visibleItems,
    hiddenItems,
    hiddenCount,
    isOpen,
    setOpen,
    toggleOpen,
  } = useFitList({
    items,
    getItemKey,
    spacing,
    trimFrom,
    maxVisibleItems,
    reserveDisclosureSpace,
    disclosureWidth,
    estimateItemWidth,
    measurementMode,
    open,
    defaultOpen,
    onOpenChange,
    measureDisclosureWidth: isDefaultDisclosureRenderer
      ? measureDisclosureWidth
      : undefined,
  });

  const visibleEntries = React.useMemo(() => {
    if (isOpen) {
      return items.map((item, index) => ({ item, index }));
    }

    if (trimFrom === "end") {
      return items
        .slice(0, visibleItems.length)
        .map((item, index) => ({ item, index }));
    }

    const startIndex = items.length - visibleItems.length;
    return items
      .slice(startIndex)
      .map((item, index) => ({ item, index: startIndex + index }));
  }, [trimFrom, isOpen, items, visibleItems.length]);

  // Avoid mounting a second copy of a custom disclosure renderer in the hidden
  // measurement tree. Some interactive renderers (for example Radix popovers)
  // keep shared state and can open twice when two trigger instances exist.
  const shouldRenderMeasuredDisclosure = isDefaultDisclosureRenderer;

  if (items.length === 0) {
    return <>{emptyFallback}</>;
  }

  const disclosureArgs: FitListDisclosureRenderArgs<T> = {
    hiddenCount,
    hiddenItems: [...hiddenItems] as T[],
    visibleItems: [...visibleItems] as T[],
    isOpen,
    setOpen,
    toggleOpen,
  };

  const disclosureChildren = renderDisclosure(disclosureArgs);
  const disclosureControl =
    isDefaultDisclosureRenderer && React.isValidElement(disclosureChildren)
      ? React.cloneElement(disclosureChildren, {
          className: disclosureClassName,
        } as React.HTMLAttributes<HTMLElement>)
      : disclosureChildren;

  const isAdjacentDisclosure = disclosurePlacement === "adjacent" && !isOpen;
  const shouldPlaceDisclosureBeforeItems =
    isAdjacentDisclosure && trimFrom === "start";

  const disclosureNode = hiddenCount > 0 || reserveDisclosureSpace ? (
    <div
      ref={registerDisclosure}
      style={{
        visibility: hiddenCount > 0 ? "visible" : "hidden",
        flex: "0 0 auto",
        whiteSpace: "nowrap",
        display: "block",
      }}
    >
      {hiddenCount > 0 ? disclosureControl : <span aria-hidden="true">+0</span>}
    </div>
  ) : null;

  const itemsNode = (
    <div
      className={listClassName}
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing,
        minWidth: 0,
        flex: isAdjacentDisclosure ? "0 1 auto" : "1 1 auto",
        overflow: "hidden",
      }}
    >
      {visibleEntries.map(({ item, index }) => {
        const key = getItemKey(item, index);
        return (
          <div
            key={key}
            ref={registerItem(key)}
            className={itemClassName}
            style={{
              minWidth: 0,
              flex: "0 0 auto",
              whiteSpace: "nowrap",
            }}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing,
          minWidth: 0,
          whiteSpace: "nowrap",
        }}
      >
        {shouldPlaceDisclosureBeforeItems ? disclosureNode : null}
        {itemsNode}
        {shouldPlaceDisclosureBeforeItems ? null : disclosureNode}
      </div>

      {/*
        Hidden measurement tree used to capture accurate intrinsic widths without
        affecting layout or interactivity.
      */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
          overflow: "hidden",
          opacity: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing }}>
          {items.map((item, index) => {
            const key = getItemKey(item, index);
            return (
              <span
                key={`measure:${String(key)}`}
                ref={registerMeasureItem(key)}
                className={sizerClassName ?? itemClassName}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                }}
              >
                {renderItem(item, index)}
              </span>
            );
          })}

          {shouldRenderMeasuredDisclosure ? (
            <span
              ref={disclosureMeasureRef}
              className={disclosureClassName}
              style={{ display: "inline-flex", whiteSpace: "nowrap" }}
            >
              {disclosureControl}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
