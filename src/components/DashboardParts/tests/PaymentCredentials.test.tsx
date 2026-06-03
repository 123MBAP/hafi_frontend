/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PaymentCredentialsCard from "../PaymentCredentials";

beforeEach(() => {
  localStorage.setItem("token", "fake-token");
  global.fetch = vi.fn(() =>
    Promise.resolve({
      status: 200,
      json: () =>
        Promise.resolve({
          methods: { mtn: { phone: "0780000000", registeredName: "Provider" } },
        }),
    })
  ) as any;
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

test("shows saved MTN method as text and registered name", async () => {
  render(<PaymentCredentialsCard />);
  // Wait for the text nodes that the component renders in read-only mode
  expect(await screen.findByText("0780000000")).toBeInTheDocument();
  expect(await screen.findByText("Provider")).toBeInTheDocument();
});