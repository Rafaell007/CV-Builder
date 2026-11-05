import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@/shared/testing";
import { useElementByIdRef } from "./useElementByIdRef";

function Probe({ id, forwardedRef }: { id: string; forwardedRef: React.Ref<HTMLInputElement> }) {
  useElementByIdRef(forwardedRef, id);
  return <input id={id} />;
}

describe("useElementByIdRef", () => {
  it("fills the ref with the element that has the id", () => {
    const ref = createRef<HTMLInputElement>();

    const { container } = render(<Probe id="code" forwardedRef={ref} />);

    expect(ref.current).toBe(container.querySelector("#code"));
  });

  it("accepts a missing ref", () => {
    expect(() => render(<Probe id="code" forwardedRef={null} />)).not.toThrow();
  });
});
