import React from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FitList } from "../components/FitList";

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

describe("FitList", () => {
  it("renders all items", () => {
    render(
      <FitList
        items={["Security", "Startups"]}
        getItemKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurementMode="estimated"
        estimateItemWidth={80}
        reserveDisclosureSpace={false}
      />
    );

    expect(screen.getAllByText("Security").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Startups").length).toBeGreaterThan(0);
  });

  it("renders the empty fallback when there are no items", () => {
    render(
      <FitList
        items={[] as string[]}
        getItemKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        emptyFallback={<span>—</span>}
      />
    );

    expect(screen.getByText("—")).toBeTruthy();
  });

  it("keeps the disclosure at the row end by default", () => {
    const { container } = render(
      <FitList
        items={["A", "B", "C", "D"]}
        getItemKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurementMode="estimated"
        estimateItemWidth={80}
        disclosureWidth={40}
        trimFrom="start"
      />
    );

    expect(container.firstElementChild?.textContent).toBe("CD+2");
  });

  it("lets the trailing disclosure sit next to the visible items", () => {
    const { container } = render(
      <FitList
        items={["A", "B", "C", "D"]}
        getItemKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurementMode="estimated"
        estimateItemWidth={80}
        disclosureWidth={40}
        trimFrom="end"
        disclosurePlacement="adjacent"
      />
    );

    const root = container.firstElementChild as HTMLElement;
    const itemsRow = root.firstElementChild as HTMLElement;

    expect(root.textContent).toBe("AB+2");
    expect(itemsRow.style.flex).toBe("0 1 auto");
  });

  it("can place the disclosure next to the hidden segment", () => {
    const { container } = render(
      <FitList
        items={["A", "B", "C", "D"]}
        getItemKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurementMode="estimated"
        estimateItemWidth={80}
        disclosureWidth={40}
        trimFrom="start"
        disclosurePlacement="adjacent"
      />
    );

    expect(container.firstElementChild?.textContent).toBe("+2CD");
  });

  it("honors maxVisibleItems before measuring available space", () => {
    const { container } = render(
      <FitList
        items={["A", "B", "C", "D"]}
        getItemKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurementMode="estimated"
        estimateItemWidth={20}
        disclosureWidth={40}
        maxVisibleItems={2}
      />
    );

    expect(container.firstElementChild?.textContent).toBe("AB+2");
  });
});
