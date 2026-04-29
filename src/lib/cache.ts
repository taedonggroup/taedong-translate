import { prisma } from "./prisma";
import { sha256 } from "./hash";

export interface CacheLookupResult {
  text: string;
  translated: string | null;
  hash: string;
}

// Look up many texts at once. Returns one result per input text.
export async function lookupMany(
  texts: string[],
  fromLang: string,
  toLang: string,
): Promise<CacheLookupResult[]> {
  const hashes = texts.map((t) => sha256(t));
  const uniqueHashes = Array.from(new Set(hashes));

  if (uniqueHashes.length === 0) {
    return texts.map((t) => ({ text: t, translated: null, hash: sha256(t) }));
  }

  let rows: { textHash: string; translated: string }[] = [];
  try {
    rows = await prisma.translationCache.findMany({
      where: {
        textHash: { in: uniqueHashes },
        fromLang,
        toLang,
      },
      select: { textHash: true, translated: true },
    });
  } catch {
    // Cache table missing or DB down — treat as full miss.
    return texts.map((t, i) => ({
      text: t,
      translated: null,
      hash: hashes[i],
    }));
  }

  const map = new Map(rows.map((r) => [r.textHash, r.translated]));

  // Bump lastUsedAt + hits for hits (best-effort, don't await per-row).
  const hitHashes = uniqueHashes.filter((h) => map.has(h));
  if (hitHashes.length > 0) {
    prisma.translationCache
      .updateMany({
        where: { textHash: { in: hitHashes }, fromLang, toLang },
        data: { lastUsedAt: new Date(), hits: { increment: 1 } },
      })
      .catch(() => {});
  }

  return texts.map((t, i) => ({
    text: t,
    translated: map.get(hashes[i]) ?? null,
    hash: hashes[i],
  }));
}

export async function writeMany(
  entries: Array<{
    text: string;
    translated: string;
    fromLang: string;
    toLang: string;
    provider: string;
  }>,
): Promise<void> {
  if (entries.length === 0) return;

  // Use createMany with skipDuplicates so concurrent writes don't crash.
  try {
    await prisma.translationCache.createMany({
      data: entries.map((e) => ({
        textHash: sha256(e.text),
        fromLang: e.fromLang,
        toLang: e.toLang,
        sourceText: e.text,
        translated: e.translated,
        provider: e.provider,
      })),
      skipDuplicates: true,
    });
  } catch {
    // Cache writes are best-effort — never fail the user request.
  }
}
