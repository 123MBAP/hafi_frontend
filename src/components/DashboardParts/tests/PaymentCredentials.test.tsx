/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ token: "fake-token" }),
}));

vi.mock("../../../context/DarkMode", () => ({
  useDarkMode: () => ({ darkMode: false, toggleDarkMode: vi.fn() }),
}));

import PaymentCredentialsCard from "../PaymentCredentials";

test("shows saved MTN method as text and registered name", () => {
  render(
    <PaymentCredentialsCard
      methodsProp={{
        mtn: { phone: "0780000000", registeredName: "Provider" },
      }}
      readOnly
    />
  );

  expect(screen.getByText("0780000000")).toBeInTheDocument();
  expect(screen.getByText("Provider")).toBeInTheDocument();
});