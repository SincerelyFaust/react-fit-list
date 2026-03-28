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
        getKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurement="estimate"
        itemWidthEstimate={80}
        preserveOverflowSpace={false}
      />
    );

    expect(screen.getAllByText("Security").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Startups").length).toBeGreaterThan(0);
  });

  it("renders the empty fallback when there are no items", () => {
    render(
      <FitList
        items={[] as string[]}
        getKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        emptyContent={<span>—</span>}
      />
    );

    expect(screen.getByText("—")).toBeTruthy();
  });

  it("keeps the overflow at the row end by default", () => {
    const { container } = render(
      <FitList
        items={["A", "B", "C", "D"]}
        getKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurement="estimate"
        itemWidthEstimate={80}
        overflowWidth={40}
        collapseFrom="start"
      />
    );

    expect(container.firstElementChild?.textContent).toBe("CD+2");
  });

  it("lets trailing overflow hug the inline visible item", () => {
    const { container } = render(
      <FitList
        items={["A", "B", "C", "D"]}
        getKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurement="estimate"
        itemWidthEstimate={80}
        overflowWidth={40}
        collapseFrom="end"
        overflowPosition="inline"
      />
    );

    const root = container.firstElementChild as HTMLElement;
    const itemsRow = root.firstElementChild as HTMLElement;

    expect(root.textContent).toBe("AB+2");
    expect(itemsRow.style.flex).toBe("0 1 auto");
  });

  it("can place the overflow next to the hidden segment", () => {
    const { container } = render(
      <FitList
        items={["A", "B", "C", "D"]}
        getKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurement="estimate"
        itemWidthEstimate={80}
        overflowWidth={40}
        collapseFrom="start"
        overflowPosition="inline"
      />
    );

    expect(container.firstElementChild?.textContent).toBe("+2CD");
  });
});
