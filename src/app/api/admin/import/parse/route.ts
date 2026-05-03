import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import * as XLSX from "xlsx";

function checkAdmin(request: Request): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.role === "admin";
}

const AUTO_DETECT: Record<string, string[]> = {
  name: ["название", "наименование", "наименование товара", "товар", "name", "product"],
  category: ["категория", "category"],
  brand: ["бренд", "brand", "производитель"],
  country: ["страна произв.", "страна", "country"],
  price: ["цена", "price", "стоимость", "дистр"],
  weight: ["вес (кг)", "вес", "weight"],
  inStock: ["в наличии", "остаток", "количество", "instock", "stock", "кол-во", "наличие", "количество шт"],
  barcode: ["штрихкод", "barcode", "штрих-код", "ean"],
  code: ["код", "code", "артикул", "sku"],
  image: ["изображение", "картинка", "фото", "image"],
  volume: ["объем (м³)", "объём (м³)", "объем", "объём", "volume"],
  packSize: ["кол-во (шт) в упаковке"],
  description: ["описание", "description"],
  oldPrice: ["старая цена", "old price", "oldprice"],
  color: ["цвет", "color"],
  productType: ["тип", "type", "вид", "producttype"],
};

function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(AUTO_DETECT)) {
      if (aliases.includes(lower) && !Object.values(mapping).includes(field)) {
        mapping[header] = field;
        break;
      }
    }
  }
  return mapping;
}

function findHeaderRow(aoa: unknown[][]): number {
  // Find the row with the most non-empty cells that looks like a header
  // A header row typically has many string cells, few or no numeric cells
  let bestRow = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(20, aoa.length); i++) {
    const row = aoa[i];
    if (!row) continue;
    const nonEmpty = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== "");
    if (nonEmpty.length < 3) continue;

    // Check if cells look like headers (text, not numbers)
    const textCells = nonEmpty.filter((c) => typeof c === "string" && isNaN(Number(c)));
    const score = textCells.length;

    // Bonus: check if known header names are present
    const lower = nonEmpty.map((c) => String(c).toLowerCase().trim());
    const knownHeaders = lower.filter((l) =>
      Object.values(AUTO_DETECT).some((aliases) => aliases.includes(l))
    );
    const finalScore = score + knownHeaders.length * 5;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestRow = i;
    }
  }
  return bestRow;
}

function isDataRow(row: unknown[], minCells: number): boolean {
  if (!row) return false;
  const nonEmpty = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== "");
  return nonEmpty.length >= minCells;
}

export async function POST(request: Request) {
  if (!checkAdmin(request)) return Response.json({ error: "Нет доступа" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "Файл не выбран" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return Response.json({ error: "Поддерживаемые форматы: CSV, XLSX, XLS" }, { status: 400 });
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Read as array of arrays to find the real header row
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (aoa.length < 2) {
    return Response.json({ error: "Файл пуст или содержит слишком мало данных" }, { status: 400 });
  }

  // Find the real header row (skip promo/summary rows)
  const headerRowIdx = findHeaderRow(aoa);
  const headerRow = aoa[headerRowIdx];
  const headers: string[] = headerRow
    .map((c) => (c !== undefined && c !== null ? String(c).trim() : ""))
    .filter((h) => h !== "");

  if (headers.length < 2) {
    return Response.json({ error: "Не удалось определить заголовки колонок" }, { status: 400 });
  }

  // Build column index map
  const colIndices: number[] = [];
  for (let j = 0; j < headerRow.length; j++) {
    const val = headerRow[j];
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      colIndices.push(j);
    }
  }

  // Minimum cells to consider a row as data (at least 30% of header columns)
  const minCells = Math.max(3, Math.floor(headers.length * 0.3));

  // Find the name column index for filtering
  const nameColIdx = colIndices[headers.findIndex((h) => {
    const l = h.toLowerCase();
    return AUTO_DETECT.name.includes(l);
  })] ?? -1;

  // Find category/brand column indices for extra validation
  const catColIdx = colIndices[headers.findIndex((h) => AUTO_DETECT.category.includes(h.toLowerCase()))] ?? -1;
  const brandColIdx = colIndices[headers.findIndex((h) => AUTO_DETECT.brand.includes(h.toLowerCase()))] ?? -1;

  // Extract data rows (skip header row and any junk/section rows)
  const rows: Record<string, string>[] = [];
  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row) continue;

    // Skip rows with too few cells
    if (!isDataRow(row, minCells)) continue;

    // Skip duplicate header rows (row that matches header exactly)
    const firstCell = row[colIndices[0]];
    if (firstCell !== undefined && String(firstCell).trim() === headers[0]) continue;

    // Skip rows without a product name, or where name looks like a section/summary
    if (nameColIdx >= 0) {
      const nameVal = row[nameColIdx];
      if (!nameVal || String(nameVal).trim() === "") continue;
      const nameStr = String(nameVal).trim();
      if (nameStr === "ИТОГО УПАКОВОК:" || nameStr.startsWith("ИТОГО")) continue;
    }

    // Prefer rows that have both category and brand filled (real product data)
    const hasCat = catColIdx >= 0 && row[catColIdx] && String(row[catColIdx]).trim() !== "";
    const hasBrand = brandColIdx >= 0 && row[brandColIdx] && String(row[brandColIdx]).trim() !== "";
    if (!hasCat && !hasBrand && nameColIdx >= 0) continue;

    const obj: Record<string, string> = {};
    for (let k = 0; k < headers.length; k++) {
      const colIdx = colIndices[k];
      const val = row[colIdx];
      obj[headers[k]] = val !== undefined && val !== null ? String(val) : "";
    }
    rows.push(obj);
  }

  if (rows.length === 0) {
    return Response.json({ error: "Не найдено строк с данными" }, { status: 400 });
  }

  const autoMap = autoDetectMapping(headers);
  const sample = rows.slice(0, 3);

  return Response.json({ headers, autoMap, sample, rows, totalRows: rows.length });
}
