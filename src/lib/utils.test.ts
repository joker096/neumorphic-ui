import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins valid class names", () => {
    expect(cn("p", "q", "r")).toBe("p q r");
  });

  it("ignores falsey inputs", () => {
    expect(cn("p", false, null, undefined, "", 0, "q")).toBe("p q");
  });

  it("supports arrays and object syntax", () => {
    expect(cn(["p", ["q", "r"]])).toBe("p q r");
    expect(cn("p", { q: true, r: false })).toBe("p q");
  });

  it("merges conflicting Tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("m-2 m-4", "m-0")).toBe("m-0");
  });
});
