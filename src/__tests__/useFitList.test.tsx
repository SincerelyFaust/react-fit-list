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
  it("computes visible and hidden items in estimated mode", () => {
    const { result } = renderHook(() =>
      useFitList({
        items: ["A", "B", "C", "D"],
        getItemKey: (item) => item,
        measurementMode: "estimated",
        estimateItemWidth: 80,
        disclosureWidth: 40,
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

  it("respects reserveDisclosureSpace even when everything fits", () => {
    const { result } = renderHook(() =>
      useFitList({
        items: ["A", "B"],
        getItemKey: (item) => item,
        measurementMode: "estimated",
        estimateItemWidth: 80,
        disclosureWidth: 80,
        reserveDisclosureSpace: true,
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

  it("limits the closed list with maxVisibleItems", () => {
    const { result } = renderHook(() =>
      useFitList({
        items: ["A", "B", "C", "D"],
        getItemKey: (item) => item,
        measurementMode: "estimated",
        estimateItemWidth: 20,
        disclosureWidth: 40,
        maxVisibleItems: 2,
      })
    );

    const container = document.createElement("div");
    result.current.containerRef.current = container;

    act(() => {
      result.current.recompute();
    });

    expect(result.current.visibleItems).toEqual(["A", "B"]);
    expect(result.current.hiddenItems).toEqual(["C", "D"]);
  });

  it("supports controlled open state", () => {
    const onOpenChange = vi.fn();

    const { result, rerender } = renderHook(
      ({ open }: { open?: boolean }) =>
        useFitList({
          items: ["A", "B", "C"],
          getItemKey: (item) => item,
          measurementMode: "estimated",
          estimateItemWidth: 80,
          disclosureWidth: 40,
          open,
          onOpenChange,
        }),
      {
        initialProps: { open: false },
      }
    );

    const container = document.createElement("div");
    result.current.containerRef.current = container;

    act(() => {
      result.current.toggleOpen();
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);

    rerender({ open: true });

    act(() => {
      result.current.recompute();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.visibleItems).toEqual(["A", "B", "C"]);
    expect(result.current.hiddenItems).toEqual([]);
  });
});
