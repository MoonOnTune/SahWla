import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { installTestDomGlobals } from "./tests/helpers/test-env";

installTestDomGlobals();

afterEach(() => {
  cleanup();
});
