import Database from "better-sqlite3";
import path from "path";
import { v4 as uuid } from "uuid";

const dbPath = path.join(process.cwd(), "dev.db");
const db = new Database(dbPath);

const SYNONYMS: [string, string][] = [
  // Энергетики
  ["энергетик", "энергетический напиток"],
  ["энергетик", "энергос"],
  ["энергетик", "энергетическая газировка"],
  ["энергетик", "energy drink"],
  ["энергетик", "energy"],
  ["monster", "монстр"],
  ["monster", "монстер"],
  ["monster energy", "монстр энерджи"],
  ["red bull", "ред булл"],
  ["red bull", "редбул"],
  ["burn", "бёрн"],
  ["burn", "берн"],
  ["tornado", "торнадо"],
  ["flash", "флеш"],
  ["adrenaline", "адреналин"],

  // Газировка
  ["газировка", "газированная вода"],
  ["газировка", "лимонад"],
  ["газировка", "газированный напиток"],
  ["кола", "cola"],
  ["кола", "пепси"],
  ["кола", "pepsi"],
  ["coca-cola", "кока-кола"],
  ["sprite", "спрайт"],
  ["fanta", "фанта"],
  ["7up", "севен ап"],

  // Снеки
  ["чипсы", "снеки"],
  ["чипсы", "chips"],
  ["чипсы", "закуска"],
  ["lays", "лейс"],
  ["lays", "лэйс"],
  ["pringles", "принглс"],
  ["doritos", "доритос"],
  ["сухарики", "сухари"],
  ["сухарики", "гренки"],
  ["орехи", "орешки"],
  ["орехи", "nuts"],
  ["семечки", "семки"],

  // Шоколад и конфеты
  ["шоколад", "шоколадка"],
  ["шоколад", "chocolate"],
  ["конфеты", "сладости"],
  ["конфеты", "candy"],
  ["mars", "марс"],
  ["snickers", "сникерс"],
  ["twix", "твикс"],
  ["bounty", "баунти"],
  ["kitkat", "кит кат"],
  ["milka", "милка"],

  // Вода и соки
  ["вода", "минеральная вода"],
  ["вода", "water"],
  ["сок", "juice"],
  ["сок", "нектар"],
  ["чай", "tea"],
  ["кофе", "coffee"],
  ["молоко", "milk"],

  // Бытовая химия
  ["порошок", "стиральный порошок"],
  ["порошок", "моющее средство"],
  ["мыло", "soap"],
  ["шампунь", "shampoo"],
  ["гель для душа", "shower gel"],
  ["средство для мытья", "моющее"],
  ["отбеливатель", "bleach"],
  ["кондиционер", "ополаскиватель"],

  // Общие
  ["напиток", "drink"],
  ["еда", "food"],
  ["продукты", "продукты питания"],
  ["жвачка", "жевательная резинка"],
  ["жвачка", "gum"],
];

console.log("Seeding search synonyms...");

const insert = db.prepare(
  "INSERT INTO SearchSynonym (id, word, synonym, createdAt) VALUES (?, ?, ?, datetime('now'))"
);
const check = db.prepare(
  "SELECT id FROM SearchSynonym WHERE word = ? AND synonym = ?"
);

let count = 0;
for (const [word, synonym] of SYNONYMS) {
  const existing = check.get(word, synonym);
  if (!existing) {
    insert.run(uuid(), word, synonym);
    count++;
  }
}

console.log(`Added ${count} new synonyms (${SYNONYMS.length - count} already existed).`);
db.close();
