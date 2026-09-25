import type { BlogPostSeoInput, SeoWarning } from "./types";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function isUrlSafeSlug(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

export function firstParagraph(text: string): string {
  const md = text.replace(/^#.*$/m, ""); // drop H1 line
  const para = md.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p.length > 0);
  return para ?? "";
}

export function countInternalLinks(body: string): number {
  // Count both absolute (same-site) and relative internal links.
  // Relative: [label](/path), [label](blog/slug). Absolute: [label](https://mysite/...)
  // Exclude obvious external authorities (waec, neco, gov) and any absolute
  // URL that does not look like a site-internal path.
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(body)) !== null) {
    const raw = (m[1] ?? "").trim().replace(/^<|>$/g, "").split(/\s+/)[0] ?? "";
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;
    // Relative site links are always internal: /features, /blog/slug, blog/slug
    if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../") || /^blog\//i.test(raw)) {
      count += 1;
      continue;
    }
    if (/^https?:\/\//i.test(raw)) {
      // Exclude well-known external authorities from the internal count.
      if (/^https?:\/\/(?:www\.)?(?:waec|neco|gov)[\w.-]*\./i.test(raw)) continue;
      // Heuristic: absolute URLs pointing at common site paths count as internal.
      if (/\/(blog|features|pricing|result-verification|demo|about|contact)([\/?#]|$)/i.test(raw)) {
        count += 1;
      }
    }
  }
  return count;
}

export function validateBlogSeo(p: BlogPostSeoInput): SeoWarning[] {
  const warnings: SeoWarning[] = [];
  const metaTitle = p.metaTitle ?? p.title;
  if (metaTitle.length > 60) warnings.push({ code: "META_TITLE_LONG", message: `Meta title is ${metaTitle.length} chars (>60).`, severity: "warning" });
  const metaDesc = p.metaDescription ?? p.excerpt ?? "";
  if (metaDesc.length > 160) warnings.push({ code: "META_DESC_LONG", message: `Meta description is ${metaDesc.length} chars (>160).`, severity: "warning" });
  if (!p.featuredImageAltText) warnings.push({ code: "MISSING_IMG_ALT", message: "Featured image alt text is missing.", severity: "warning" });
  if (p.internalLinkCount === 0) warnings.push({ code: "NO_INTERNAL_LINKS", message: "No internal links detected in body.", severity: "warning" });
  if (!isUrlSafeSlug(p.slug)) warnings.push({ code: "SLUG_UNSAFE", message: "Slug is not URL-safe.", severity: "warning" });
  if (p.primaryKeywordText ?? p.primaryKeyword) {
    const kw = (p.primaryKeywordText ?? p.primaryKeyword ?? "").toLowerCase();
    const h1 = (p.body.match(/^#\s+(.+)$/m)?.[1] ?? "").toLowerCase();
    const opening = firstParagraph(p.body).toLowerCase();
    const inTitle = p.title.toLowerCase().includes(kw);
    const inH1 = h1.includes(kw);
    const inOpening = opening.includes(kw);
    if (!inTitle && !inH1 && !inOpening) warnings.push({ code: "KEYWORD_MISSING", message: "Primary keyword not found in title, H1, or opening paragraph.", severity: "warning" });
  }
  return warnings;
}
