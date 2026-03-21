import * as React from "react";
import { useFitList } from "../hooks/useFitList";
import type { FitListOverflowRenderArgs, FitListProps } from "../types";

type ButtonLikeProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children?: React.ReactNode;
};

function defaultOverflow({ hiddenCount }: { hiddenCount: number }) {
  return <span>+{hiddenCount}</span>;
}

/**
 * Responsive single-row list that hides overflowing items behind a configurable
 * overflow affordance.
 *
 * `FitList` is useful for chips, tags, breadcrumbs, recipients, filters, and
 * other horizontally laid out items where preserving a clean single-row layout
 * matters more than showing every element at once.
 *
 * Features:
 * - automatic fit calculation based on available width
 * - customizable overflow renderer (`+3`, `Show more`, badge, etc.)
 * - controlled or uncontrolled expanded state
 * - collapse from the start or the end of the list
 * - live DOM measurement or estimated-width mode
 */
export function FitList<T>({
  items,
  getKey,
  renderItem,
  renderOverflow = defaultOverflow,
  className,
  listClassName,
  itemClassName,
  overflowClassName,
  measureClassName,
  emptyFallback = null,
  gap = 8,
  collapseFrom = "end",
  reserveOverflowSpace = false,
  overflowWidth,
  estimatedItemWidth,
  measurementMode = "live",
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  as = "div",
  onOverflowClick,
  overflowAs = "button",
}: FitListProps<T>) {
  const Component = as as keyof React.JSX.IntrinsicElements;
  const OverflowComponent = overflowAs as keyof React.JSX.IntrinsicElements;
  const overflowMeasureRef = React.useRef<HTMLSpanElement | null>(null);
  const isDefaultOverflowRenderer = renderOverflow === defaultOverflow;

  const measureOverflowWidth = React.useCallback(
    (hiddenCount: number) => {
      if (typeof overflowWidth === "number") return overflowWidth;
      const node = overflowMeasureRef.current;
      if (!node) return 44;

      // The default overflow label changes width with the hidden count, so we
      // temporarily swap its text content to measure the exact width needed.
      if (isDefaultOverflowRenderer) {
        const previous = node.textContent;
        node.textContent = `+${hiddenCount}`;
        const width = node.offsetWidth;
        node.textContent = previous;
        return width;
      }

      return node.offsetWidth;
    },
    [isDefaultOverflowRenderer, overflowWidth]
  );

  const {
    containerRef,
    registerItem,
    registerMeasureItem,
    registerOverflow,
    visibleItems,
    hiddenItems,
    hiddenCount,
    isExpanded,
    setExpanded,
    toggleExpanded,
  } = useFitList({
    items,
    getKey,
    gap,
    collapseFrom,
    reserveOverflowSpace,
    overflowWidth,
    estimatedItemWidth,
    measurementMode,
    expanded,
    defaultExpanded,
    onExpandedChange,
    measureOverflowWidth: isDefaultOverflowRenderer ? measureOverflowWidth : undefined,
  });

  const visibleEntries = React.useMemo(() => {
    if (isExpanded) {
      return items.map((item, index) => ({ item, index }));
    }

    if (collapseFrom === "end") {
      return items
        .slice(0, visibleItems.length)
        .map((item, index) => ({ item, index }));
    }

    const startIndex = items.length - visibleItems.length;
    return items
      .slice(startIndex)
      .map((item, index) => ({ item, index: startIndex + index }));
  }, [collapseFrom, isExpanded, items, visibleItems.length]);

  // Avoid mounting a second copy of a custom overflow renderer in the hidden
  // measurement tree. Some interactive renderers (for example Radix popovers)
  // keep shared state and can open twice when two trigger instances exist.
  const shouldRenderMeasuredOverflow = isDefaultOverflowRenderer;

  if (items.length === 0) {
    return <>{emptyFallback}</>;
  }

  const overflowArgs: FitListOverflowRenderArgs<T> = {
    hiddenCount,
    hiddenItems: [...hiddenItems] as T[],
    visibleItems: [...visibleItems] as T[],
    isExpanded,
    setExpanded,
    toggle: toggleExpanded,
  };

  const overflowChildren = renderOverflow(overflowArgs);

  const overflowButtonProps: ButtonLikeProps = {
    className: overflowClassName,
    type: "button",
    onClick: (event) => onOverflowClick?.(overflowArgs, event as React.MouseEvent<HTMLElement>),
    "aria-expanded": isExpanded,
    children: overflowChildren,
  };

  const content = (
    <>
      <div
        className={listClassName}
        style={{
          display: "flex",
          alignItems: "center",
          gap,
          minWidth: 0,
          flex: "1 1 auto",
          overflow: "hidden",
        }}
      >
        {visibleEntries.map(({ item, index }) => {
          const key = getKey(item, index);
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

      {(hiddenCount > 0 || reserveOverflowSpace) && (
        <div
          ref={registerOverflow}
          style={{
            visibility: hiddenCount > 0 ? "visible" : "hidden",
            flex: "0 0 auto",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          {hiddenCount > 0 ? (
            overflowAs === "button" ? (
              <button {...overflowButtonProps} />
            ) : (
              React.createElement(
                OverflowComponent,
                { className: overflowClassName },
                overflowChildren
              )
            )
          ) : (
            <span aria-hidden="true">+0</span>
          )}
        </div>
      )}
    </>
  );

  const root = React.createElement(
    Component,
    {
      ref: containerRef as React.Ref<any>,
      className,
      style: {
        display: "flex",
        alignItems: "center",
        gap,
        minWidth: 0,
        whiteSpace: "nowrap",
      },
    },
    content
  );

  return (
    <>
      {root}

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
        <div style={{ display: "flex", alignItems: "center", gap }}>
          {items.map((item, index) => {
            const key = getKey(item, index);
            return (
              <span
                key={`measure:${String(key)}`}
                ref={registerMeasureItem(key)}
                className={measureClassName ?? itemClassName}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                }}
              >
                {renderItem(item, index)}
              </span>
            );
          })}

          {shouldRenderMeasuredOverflow ? (
            <span
              ref={overflowMeasureRef}
              className={overflowClassName}
              style={{ display: "inline-flex", whiteSpace: "nowrap" }}
            >
              {overflowChildren}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
