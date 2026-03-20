import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FitList } from "../components/FitList";

describe("FitList", () => {
  it("renders all items", () => {
    render(
      <FitList
        items={["Security", "Startups"]}
        getKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        measurementMode="estimate"
        estimatedItemWidth={80}
        reserveOverflowSpace={false}
      />
    );

    expect(screen.getByText("Security")).toBeTruthy();
    expect(screen.getByText("Startups")).toBeTruthy();
  });

  it("renders the empty fallback when there are no items", () => {
    render(
      <FitList
        items={[] as string[]}
        getKey={(item) => item}
        renderItem={(item) => <span>{item}</span>}
        emptyFallback={<span>—</span>}
      />
    );

    expect(screen.getByText("—")).toBeTruthy();
  });
});
