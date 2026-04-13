import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/sites/[id]/crawl
// Crawls the site and extracts Korean text for translation
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: siteId } = await context.params;

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site || !site.domain) {
    return NextResponse.json(
      { error: "사이트를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const domain = site.domain.startsWith("http")
    ? site.domain
    : `https://${site.domain}`;

  try {
    // 1. Fetch homepage
    const homepageHtml = await fetchPage(domain);

    // 2. Extract internal links
    const links = extractInternalLinks(homepageHtml, domain);
    // Limit to ~10 pages to avoid excessive crawling
    const pagesToCrawl = [domain, ...links.slice(0, 9)];

    // 3. Fetch and extract text from all pages
    const allTexts: Record<string, Record<string, string>> = {};

    for (const url of pagesToCrawl) {
      let html: string;
      try {
        html = await fetchPage(url);
      } catch (pageError) {
        console.warn(`[crawl] Skipping ${url}:`, pageError);
        continue;
      }
      const pageTexts = extractTextsFromHtml(html, url, domain);
      // Merge into allTexts
      for (const [category, texts] of Object.entries(pageTexts)) {
        if (!allTexts[category]) allTexts[category] = {};
        Object.assign(allTexts[category], texts);
      }
    }

    // 4. Save as ko messages
    const messagesJson = JSON.stringify(allTexts);
    await prisma.siteMessages.upsert({
      where: { siteId_locale: { siteId, locale: "ko" } },
      update: { messages: messagesJson },
      create: { siteId, locale: "ko", messages: messagesJson },
    });

    return NextResponse.json({
      ok: true,
      pagesScanned: pagesToCrawl.length,
      categories: Object.keys(allTexts),
      totalKeys: Object.values(allTexts).reduce(
        (sum, cat) => sum + Object.keys(cat).length,
        0,
      ),
      messages: allTexts,
    });
  } catch (error) {
    console.error("[POST /api/sites/[id]/crawl]", error);
    return NextResponse.json(
      { error: "크롤링에 실패했습니다." },
      { status: 500 },
    );
  }
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "TaedongTranslateBot/1.0",
      Accept: "text/html",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /href=["']([^"']+)["']/g;
  const links = new Set<string>();
  let match: RegExpExecArray | null;

  const baseOrigin = new URL(baseUrl).origin;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    // Skip external, anchor, js, css, image links
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    )
      continue;
    if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|zip)$/i.test(href)) continue;
    if (href.startsWith("//")) href = "https:" + href;

    try {
      const resolved = href.startsWith("http")
        ? href
        : new URL(href, baseUrl).href;
      if (resolved.startsWith(baseOrigin) && !links.has(resolved)) {
        links.add(resolved);
      }
    } catch {
      // Ignore malformed hrefs
    }
  }

  return Array.from(links);
}

// Korean character detection regex
const KOREAN_REGEX = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;

function extractTextsFromHtml(
  html: string,
  pageUrl: string,
  baseUrl: string,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  // Remove script, style, noscript tags and HTML comments
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Determine page path for namespacing keys
  const path =
    new URL(pageUrl).pathname.replace(/^\//, "").replace(/\//g, "_") || "home";

  // Extract nav items
  const navMatches = cleanHtml.match(/<nav[\s\S]*?<\/nav>/gi);
  if (navMatches) {
    const navTexts = extractTextFromSection(navMatches.join(""));
    if (Object.keys(navTexts).length > 0) {
      result["nav"] = {};
      let i = 0;
      for (const text of Object.values(navTexts)) {
        result["nav"]["item_" + i] = text;
        i++;
      }
    }
  }

  // Extract headings (h1–h6)
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let headingMatch: RegExpExecArray | null;
  const headings: Record<string, string> = {};
  let hIdx = 0;
  while ((headingMatch = headingRegex.exec(cleanHtml)) !== null) {
    const text = stripTags(headingMatch[1]).trim();
    if (text && KOREAN_REGEX.test(text) && text.length > 1) {
      headings[path + "_heading_" + hIdx] = text;
      hIdx++;
    }
  }
  if (Object.keys(headings).length > 0) {
    if (!result["headings"]) result["headings"] = {};
    Object.assign(result["headings"], headings);
  }

  // Extract paragraphs
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch: RegExpExecArray | null;
  const paragraphs: Record<string, string> = {};
  let pIdx = 0;
  while ((pMatch = pRegex.exec(cleanHtml)) !== null) {
    const text = stripTags(pMatch[1]).trim();
    if (text && KOREAN_REGEX.test(text) && text.length > 3) {
      paragraphs[path + "_p_" + pIdx] = text;
      pIdx++;
    }
  }
  if (Object.keys(paragraphs).length > 0) {
    if (!result["content"]) result["content"] = {};
    Object.assign(result["content"], paragraphs);
  }

  // Extract buttons and links with Korean text
  const btnRegex = /<(?:button|a)[^>]*>([\s\S]*?)<\/(?:button|a)>/gi;
  let btnMatch: RegExpExecArray | null;
  const buttons: Record<string, string> = {};
  let bIdx = 0;
  while ((btnMatch = btnRegex.exec(cleanHtml)) !== null) {
    const text = stripTags(btnMatch[1]).trim();
    if (
      text &&
      KOREAN_REGEX.test(text) &&
      text.length > 1 &&
      text.length < 50
    ) {
      buttons[path + "_btn_" + bIdx] = text;
      bIdx++;
    }
  }
  if (Object.keys(buttons).length > 0) {
    if (!result["buttons"]) result["buttons"] = {};
    Object.assign(result["buttons"], buttons);
  }

  // Extract form labels
  const labelRegex = /<label[^>]*>([\s\S]*?)<\/label>/gi;
  let labelMatch: RegExpExecArray | null;
  const labels: Record<string, string> = {};
  let lIdx = 0;
  while ((labelMatch = labelRegex.exec(cleanHtml)) !== null) {
    const text = stripTags(labelMatch[1]).trim();
    if (text && KOREAN_REGEX.test(text) && text.length > 1) {
      labels["label_" + lIdx] = text;
      lIdx++;
    }
  }
  if (Object.keys(labels).length > 0) {
    if (!result["forms"]) result["forms"] = {};
    Object.assign(result["forms"], labels);
  }

  // Extract footer
  const footerMatches = cleanHtml.match(/<footer[\s\S]*?<\/footer>/gi);
  if (footerMatches) {
    const footerTexts = extractTextFromSection(footerMatches.join(""));
    if (Object.keys(footerTexts).length > 0) {
      result["footer"] = {};
      let i = 0;
      for (const text of Object.values(footerTexts)) {
        result["footer"]["item_" + i] = text;
        i++;
      }
    }
  }

  return result;
}

function extractTextFromSection(html: string): Record<string, string> {
  const texts: Record<string, string> = {};
  const tagContentRegex = />([^<]+)</g;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = tagContentRegex.exec(html)) !== null) {
    const text = match[1].trim();
    if (text && KOREAN_REGEX.test(text) && text.length > 1) {
      texts["text_" + idx] = text;
      idx++;
    }
  }
  return texts;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}
