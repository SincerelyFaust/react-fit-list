import * as React from "react";
import { useFitList } from "../hooks/useFitList";
import type { FitListDisclosureRenderArgs, FitListProps } from "../types";

function mergeClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ") || undefined;
}

function defaultDisclosure({
  hiddenCount,
  isOpen,
  toggleOpen,
}: FitListDisclosureRenderArgs<unknown>) {
  const label = isOpen
    ? "Show fewer items"
    : `Show ${hiddenCount} more item${hiddenCount === 1 ? "" : "s"}`;

  return (
    <button
      type="button"
      onClick={toggleOpen}
      aria-expanded={isOpen}
      aria-label={label}
    >
      {isOpen ? "Show less" : `+${hiddenCount}`}
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
  rootProps,
  listProps,
  itemProps,
  disclosureWrapperProps,
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
  const normalizedSpacing =
    typeof spacing === "number" && Number.isFinite(spacing)
      ? Math.max(0, spacing)
      : 8;

  const measureDisclosureWidth = React.useCallback(
    (hiddenCount: number) => {
      if (typeof disclosureWidth === "number" && Number.isFinite(disclosureWidth)) {
        return Math.max(0, disclosureWidth);
      }

      const node = disclosureMeasureRef.current;
      if (!node) return 44;

      // The default disclosure label changes width with the hidden count, so we
      // temporarily update this dedicated hidden text node. This avoids mutating
      // the visible React-rendered button markup.
      if (isDefaultDisclosureRenderer) {
        node.textContent = `+${hiddenCount}`;
      }

      return Math.max(0, node.offsetWidth || 44);
    },
    [isDefaultDisclosureRenderer, disclosureWidth]
  );

  const {
    containerRef,
    registerItem,
    registerMeasureItem,
    registerDisclosure,
    visibleItems,
    closedVisibleItems,
    closedHiddenItems,
    closedHiddenCount,
    isOverflowing,
    isOpen,
    setOpen,
    toggleOpen,
  } = useFitList({
    items,
    getItemKey,
    spacing: normalizedSpacing,
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
        .slice(0, closedVisibleItems.length)
        .map((item, index) => ({ item, index }));
    }

    const startIndex = items.length - closedVisibleItems.length;
    return items
      .slice(startIndex)
      .map((item, index) => ({ item, index: startIndex + index }));
  }, [trimFrom, isOpen, items, closedVisibleItems.length]);

  // Avoid mounting a second copy of a custom disclosure renderer in the hidden
  // measurement tree. Some interactive renderers (for example Radix popovers)
  // keep shared state and can open twice when two trigger instances exist.
  const shouldRenderMeasuredDisclosure = isDefaultDisclosureRenderer;

  if (items.length === 0) {
    return <>{emptyFallback}</>;
  }

  const disclosureArgs: FitListDisclosureRenderArgs<T> = {
    hiddenCount: closedHiddenCount,
    hiddenItems: [...closedHiddenItems] as T[],
    visibleItems: [...visibleItems] as T[],
    closedVisibleItems: [...closedVisibleItems] as T[],
    closedHiddenItems: [...closedHiddenItems] as T[],
    isOverflowing,
    isOpen,
    setOpen,
    toggleOpen,
  };

  const disclosureChildren = renderDisclosure(disclosureArgs);
  const disclosureControl =
    isDefaultDisclosureRenderer && React.isValidElement(disclosureChildren)
      ? React.cloneElement(disclosureChildren, {
          className: mergeClassNames(
            disclosureClassName,
            (disclosureChildren.props as { className?: string }).className
          ),
        } as React.HTMLAttributes<HTMLElement>)
      : disclosureChildren;

  const isAdjacentDisclosure = disclosurePlacement === "adjacent" && !isOpen;
  const shouldPlaceDisclosureBeforeItems =
    isAdjacentDisclosure && trimFrom === "start";
  const shouldRenderDisclosure = isOverflowing || reserveDisclosureSpace;

  const disclosureNode = shouldRenderDisclosure ? (
    <div
      {...disclosureWrapperProps}
      ref={registerDisclosure}
      className={disclosureWrapperProps?.className}
      style={{
        visibility: isOverflowing ? "visible" : "hidden",
        flex: "0 0 auto",
        whiteSpace: "nowrap",
        display: "block",
        ...disclosureWrapperProps?.style,
      }}
    >
      {isOverflowing ? disclosureControl : <span aria-hidden="true">+0</span>}
    </div>
  ) : null;

  const itemsNode = (
    <div
      {...listProps}
      className={mergeClassNames(listClassName, listProps?.className)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: normalizedSpacing,
        minWidth: 0,
        flex: isAdjacentDisclosure ? "0 1 auto" : "1 1 auto",
        overflow: "hidden",
        ...listProps?.style,
      }}
    >
      {visibleEntries.map(({ item, index }) => {
        const key = getItemKey(item, index);
        const resolvedItemProps =
          typeof itemProps === "function" ? itemProps(item, index) : itemProps;

        return (
          <div
            {...resolvedItemProps}
            key={key}
            ref={registerItem(key)}
            className={mergeClassNames(itemClassName, resolvedItemProps?.className)}
            style={{
              minWidth: 0,
              flex: "0 0 auto",
              whiteSpace: "nowrap",
              ...resolvedItemProps?.style,
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
        {...rootProps}
        ref={containerRef}
        className={mergeClassNames(className, rootProps?.className)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: normalizedSpacing,
          minWidth: 0,
          whiteSpace: "nowrap",
          ...rootProps?.style,
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
          position: "absolute",
          visibility: "hidden",
          height: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: normalizedSpacing }}>
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
              +{Math.max(0, closedHiddenCount)}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
