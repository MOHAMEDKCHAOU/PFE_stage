import { describe, it, expect } from "vitest";
import { parseSafeUrl } from "@/lib/safe-url";

describe("parseSafeUrl — allowed", () => {
  it.each([
    ["https://example.com", "https://example.com/", true],
    ["  https://example.com/a?b=1#c  ", "https://example.com/a?b=1#c", true],
    ["http://example.com:8080/x", "http://example.com:8080/x", true],
    ["/capsule/abc?x=1#top", "/capsule/abc?x=1#top", false],
    ["mailto:hello@example.com", "mailto:hello@example.com", false],
    ["tel:+33123456789", "tel:+33123456789", false],
  ])("%s", (input, href, external) => {
    const result = parseSafeUrl(input);
    expect(result?.href).toBe(href);
    expect(result?.external).toBe(external);
  });

  it("exposes the destination host for external links", () => {
    expect(parseSafeUrl("https://shop.example.com/p")?.host).toBe("shop.example.com");
  });
});

describe("parseSafeUrl — refused", () => {
  const BS = String.fromCharCode(92);
  it.each([
    ["javascript", "javascript:alert(1)"],
    ["mixed case", "JaVaScRiPt:alert(1)"],
    ["entity-free leading space", " javascript:alert(1)"],
    ["tab inside scheme", "java\tscript:alert(1)"],
    ["newline inside scheme", "java\nscript:alert(1)"],
    ["NUL byte", "java\u0000script:alert(1)"],
    ["zero-width space", "java​script:alert(1)"],
    ["data URL", "data:text/html,<script>alert(1)</script>"],
    ["vbscript", "vbscript:msgbox(1)"],
    ["file", "file:///etc/passwd"],
    ["blob", "blob:https://example.com/x"],
    ["ftp", "ftp://example.com"],
    ["protocol-relative", "//evil.com"],
    ["backslash host trick", `https:/${BS}evil.com`],
    ["internal path with backslash", `/${BS}evil.com`],
    ["credentials in URL", "https://faymoos.com@evil.com"],
    ["user:pass in URL", "https://user:pass@example.com"],
    ["space in host", "https://ex ample.com"],
    ["bad phone", "tel:12 34"],
    ["empty mailto", "mailto:"],
    ["empty", ""],
    ["too long", `https://example.com/${"a".repeat(800)}`],
  ])("%s", (_name, input) => {
    expect(parseSafeUrl(input)).toBeNull();
  });

  it.each([null, undefined, 42, {}, ["https://example.com"]])("non-string %p", (input) => {
    expect(parseSafeUrl(input)).toBeNull();
  });
});
