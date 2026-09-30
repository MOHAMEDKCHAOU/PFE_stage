import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SmartSpaceViewer } from "@/components/SmartSpaceViewer";

function render(hotspot: { type: string; targetUrl?: string | null; metadata?: unknown }) {
  return renderToStaticMarkup(
    <SmartSpaceViewer
      panoramaUrl="/uploads/spaces/s1/panorama.jpg"
      hotspots={[{ id: "h1", label: "Hotspot", yaw: 0, pitch: 0, ...hotspot }]}
    />,
  );
}

describe("SmartSpaceViewer — hotspot rendering", () => {
  it.each(["javascript:alert(document.cookie)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.com"])(
    "never renders %s as a link (even if stored before validation)",
    (targetUrl) => {
      const html = render({ type: "LINK", targetUrl });
      expect(html).not.toContain("<a");
      expect(html).not.toMatch(/javascript:|data:text|\/\/evil/i);
      expect(html).toContain("<button");
    },
  );

  it("opens external links in a new tab without opener/referrer and shows the domain", () => {
    const html = render({ type: "LINK", targetUrl: "https://shop.example.com/p" });
    expect(html).toContain('href="https://shop.example.com/p"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer nofollow ugc"');
    expect(html).toContain("shop.example.com");
  });

  it("keeps internal links in the same tab", () => {
    const html = render({ type: "PROJECT", targetUrl: "/capsule/demo" });
    expect(html).toContain('href="/capsule/demo"');
    expect(html).not.toContain('target="_blank"');
  });

  it("renders INFO as a button, never a link", () => {
    const html = render({ type: "INFO", targetUrl: "https://example.com", metadata: { description: "Détail" } });
    expect(html).not.toContain("<a");
    expect(html).toContain("<button");
  });

  it('never uses href="#" for a hotspot without link', () => {
    const html = render({ type: "CTA", targetUrl: null });
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain("<a");
  });
});
