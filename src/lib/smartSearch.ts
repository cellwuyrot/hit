import { prisma } from "./prisma";
import { getDb } from "./db";

const RU_TO_EN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const EN_TO_RU: Record<string, string> = {
  a: "а", b: "б", c: "с", d: "д", e: "е", f: "ф", g: "г", h: "х",
  i: "и", j: "дж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п",
  q: "к", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "кс",
  y: "й", z: "з",
  sh: "ш", ch: "ч", th: "т", ph: "ф", zh: "ж",
};

function transliterateToEn(text: string): string {
  return text.toLowerCase().split("").map(c => RU_TO_EN[c] ?? c).join("");
}

function transliterateToRu(text: string): string {
  const lower = text.toLowerCase();
  let result = "";
  let i = 0;
  while (i < lower.length) {
    const two = lower.slice(i, i + 2);
    if (EN_TO_RU[two]) {
      result += EN_TO_RU[two];
      i += 2;
    } else if (EN_TO_RU[lower[i]]) {
      result += EN_TO_RU[lower[i]];
      i += 1;
    } else {
      result += lower[i];
      i += 1;
    }
  }
  return result;
}

function isRussian(text: string): boolean {
  return /[а-яё]/i.test(text);
}

function isLatin(text: string): boolean {
  return /[a-z]/i.test(text);
}

/**
 * Expand a search query into multiple search terms using:
 * 1. Original query
 * 2. Transliteration (ru→en or en→ru)
 * 3. Synonyms from DB
 */
export async function expandSearchQuery(query: string): Promise<string[]> {
  const normalized = query.toLowerCase().trim();
  const terms = new Set<string>([normalized]);

  // Transliteration
  if (isRussian(normalized)) {
    terms.add(transliterateToEn(normalized));
  }
  if (isLatin(normalized)) {
    terms.add(transliterateToRu(normalized));
  }

  // Split into words for multi-word queries
  const words = normalized.split(/\s+/).filter(w => w.length >= 2);

  // Look up synonyms for each word and for the full query
  const lookupTerms = [...words, normalized];
  const synonyms = await prisma.searchSynonym.findMany({
    where: {
      OR: [
        { word: { in: lookupTerms } },
        { synonym: { in: lookupTerms } },
      ],
    },
  });

  for (const syn of synonyms) {
    terms.add(syn.word);
    terms.add(syn.synonym);
    if (isRussian(syn.synonym)) terms.add(transliterateToEn(syn.synonym));
    if (isLatin(syn.synonym)) terms.add(transliterateToRu(syn.synonym));
    if (isRussian(syn.word)) terms.add(transliterateToEn(syn.word));
    if (isLatin(syn.word)) terms.add(transliterateToRu(syn.word));
  }

  return [...terms].filter(t => t.length >= 2);
}

/**
 * Search products using FTS5 full-text search with prefix matching.
 * Returns product IDs ranked by relevance.
 */
export function searchFTS5(terms: string[], limit: number = 20): string[] {
  const db = getDb();

  // Build FTS5 query with OR and prefix matching
  const ftsQuery = terms
    .map(t => `"${t.replace(/"/g, '""')}"*`)
    .join(" OR ");

  try {
    const rows = db.prepare(
      `SELECT product_id FROM product_fts WHERE product_fts MATCH ? ORDER BY rank LIMIT ?`
    ).all(ftsQuery, limit) as { product_id: string }[];
    return rows.map(r => r.product_id);
  } catch {
    // If FTS5 query fails (e.g., table doesn't exist yet), fall back
    return [];
  }
}

/**
 * Build Prisma OR conditions for smart search across multiple fields (fallback)
 */
export function buildSearchConditions(terms: string[]): Record<string, unknown>[] {
  const conditions: Record<string, unknown>[] = [];
  for (const term of terms) {
    conditions.push(
      { name: { contains: term } },
      { brand: { contains: term } },
      { description: { contains: term } },
      { tags: { contains: term } },
      { productType: { contains: term } },
    );
  }
  return conditions;
}
