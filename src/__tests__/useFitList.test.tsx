import React from "react";
import { act, renderHook } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { useFitList } from "../hooks/useFitList";

const originalClientWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientWidth"
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get() {
      return 220;
    },
  });
});

afterAll(() => {
  if (originalClientWidth) {
    Object.defineProperty(
      HTMLElement.prototype,
      "clientWidth",
      originalClientWidth
    );
    return;
  }

  Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
});

describe("useFitList", () => {
  it("computes visible and hidden items in estimate mode", () => {
    const { result } = renderHook(() =>
      useFitList({
        items: ["A", "B", "C", "D"],
        getKey: (item) => item,
        measurement: "estimate",
        itemWidthEstimate: 80,
        overflowWidth: 40,
      })
    );

    const container = document.createElement("div");
    result.current.containerRef.current = container;

    act(() => {
      result.current.recompute();
    });

    expect(result.current.visibleItems).toEqual(["A", "B"]);
    expect(result.current.hiddenItems).toEqual(["C", "D"]);
    expect(result.current.hiddenCount).toBe(2);
  });

  it("respects preserveOverflowSpace even when everything fits", () => {
    const { result } = renderHook(() =>
      useFitList({
        items: ["A", "B"],
        getKey: (item) => item,
        measurement: "estimate",
        itemWidthEstimate: 80,
        overflowWidth: 80,
        preserveOverflowSpace: true,
      })
    );

    const container = document.createElement("div");
    result.current.containerRef.current = container;

    act(() => {
      result.current.recompute();
    });

    expect(result.current.visibleItems).toEqual(["A"]);
    expect(result.current.hiddenItems).toEqual(["B"]);
    expect(result.current.hiddenCount).toBe(1);
  });

  it("supports controlled expanded state", () => {
    const onExpandedChange = vi.fn();

    const { result, rerender } = renderHook(
      ({ expanded }: { expanded?: boolean }) =>
        useFitList({
          items: ["A", "B", "C"],
          getKey: (item) => item,
          measurement: "estimate",
          itemWidthEstimate: 80,
          overflowWidth: 40,
          expanded,
          onExpandedChange,
        }),
      {
        initialProps: { expanded: false },
      }
    );

    const container = document.createElement("div");
    result.current.containerRef.current = container;

    act(() => {
      result.current.toggleExpanded();
    });

    expect(onExpandedChange).toHaveBeenCalledWith(true);

    rerender({ expanded: true });

    act(() => {
      result.current.recompute();
    });

    expect(result.current.isExpanded).toBe(true);
    expect(result.current.visibleItems).toEqual(["A", "B", "C"]);
    expect(result.current.hiddenItems).toEqual([]);
  });
});
