const translitMap: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const wordDict: Record<string, string> = {
  "продукты": "produkty",
  "питания": "pitaniya",
  "продукты питания": "produkty-pitaniya",
  "бытовая": "bytovaya",
  "химия": "khimiya",
  "бытовая химия": "bytovaya-khimiya",
  "электроника": "elektronika",
  "садоводство": "sadovodstvo",
  "товары": "tovary",
  "для": "dlya",
  "дома": "doma",
  "товары для дома": "tovary-dlya-doma",
  "напитки": "napitki",
  "снеки": "sneki",
  "чипсы": "chipsy",
  "сухарики": "sukhariki",
  "крекеры": "krekery",
  "энергетики": "energetiki",
  "энергетические напитки": "energy-drinks",
  "кондитерские": "konditerskie",
  "изделия": "izdeliya",
  "кондитерские изделия": "konditerskie-izdeliya",
  "молочные": "molochnye",
  "молочные продукты": "molochnye-produkty",
  "замороженные": "zamorozhennye",
  "замороженные продукты": "zamorozhennye-produkty",
  "консервы": "konservy",
  "крупы": "krupy",
  "макароны": "makarony",
  "масло": "maslo",
  "мясо": "myaso",
  "мясные": "myasnye",
  "овощи": "ovoshchi",
  "фрукты": "frukty",
  "рыба": "ryba",
  "морепродукты": "moreprodukty",
  "соусы": "sousy",
  "специи": "spetsii",
  "хлеб": "khleb",
  "выпечка": "vypechka",
  "чай": "chaj",
  "кофе": "kofe",
  "вода": "voda",
  "соки": "soki",
  "канцелярия": "kantselyariya",
  "одежда": "odezhda",
  "обувь": "obuv",
  "косметика": "kosmetika",
  "парфюмерия": "parfyumeriya",
  "зоотовары": "zootovary",
  "автотовары": "avtotovary",
  "инструменты": "instrumenty",
  "посуда": "posuda",
  "мебель": "mebel",
  "текстиль": "tekstil",
  "игрушки": "igrushki",
  "спорт": "sport",
  "туризм": "turizm",
  "сад": "sad",
  "огород": "ogorod",
  "строительство": "stroitelstvo",
  "ремонт": "remont",
  "новинки": "novinki",
  "акции": "aktsii",
  "распродажа": "rasprodazha",
  "категория": "kategoriya",
  "каталог": "katalog",
};

export function slugify(text: string): string {
  const lower = text.toLowerCase().trim();

  if (wordDict[lower]) {
    return wordDict[lower];
  }

  return lower
    .replace(/[а-яё]+/g, (word) => {
      if (wordDict[word]) return wordDict[word];
      return word.replace(/[а-яё]/g, (ch) => ch in translitMap ? translitMap[ch] : ch);
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCategoryPath(
  category: { slug: string; parent?: { slug: string } | null },
): string {
  if (category.parent) {
    return `/catalog/${category.parent.slug}/${category.slug}`;
  }
  return `/catalog/${category.slug}`;
}

export function getCategoryUrl(
  category: { slug: string; parent?: { slug: string } | null },
): string {
  if (category.parent) {
    return `https://tophitt.ru/catalog/${category.parent.slug}/${category.slug}`;
  }
  return `https://tophitt.ru/catalog/${category.slug}`;
}
