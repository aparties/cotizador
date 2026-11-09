const fs = require('fs');

function parseSharedStrings(xmlPath) {
  if (!fs.existsSync(xmlPath)) return [];
  const content = fs.readFileSync(xmlPath, 'utf8');
  const strings = [];
  const regex = /<si>(?:(?!<\/si>).)*?<\/si>/gs;
  const matches = content.match(regex) || [];
  for (const m of matches) {
    const tMatches = m.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
    const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
    strings.push(text);
  }
  return strings;
}

function parseSheet(sheetPath, sharedStrings) {
  const content = fs.readFileSync(sheetPath, 'utf8');
  const rows = [];
  const rowMatches = content.match(/<row[^>]*>(.*?)<\/row>/gs) || [];
  for (const r of rowMatches) {
    const rowNumMatch = r.match(/r="(\d+)"/);
    const rowNum = rowNumMatch ? parseInt(rowNumMatch[1]) : rows.length + 1;
    const cells = [];
    const cellMatches = r.match(/<c\b[^>]*>(.*?)<\/c>|<c\b[^>]*\/>/gs) || [];
    for (const c of cellMatches) {
      const typeMatch = c.match(/t="([^"]+)"/);
      const isString = typeMatch && typeMatch[1] === 's';
      const valMatch = c.match(/<v>(.*?)<\/v>/);
      let val = valMatch ? valMatch[1] : '';
      if (isString && val !== '') {
        const idx = parseInt(val);
        val = sharedStrings[idx] !== undefined ? sharedStrings[idx] : val;
      }
      cells.push(val);
    }
    rows.push({ rowNum, cells });
  }
  return rows;
}

// 1. Process Customers (Reporte 17)
const ss17 = parseSharedStrings('temp_17/xl/sharedStrings.xml');
const rows17 = parseSheet('temp_17/xl/worksheets/sheet1.xml', ss17);
const customers = [];
// Row 1 is Title, Row 2 is Header
for (let i = 2; i < rows17.length; i++) {
  const c = rows17[i].cells;
  if (!c || c.length < 3) continue;
  const docType = c[0] || 'RUC';
  const ruc = (c[1] || '').trim();
  const businessName = (c[2] || '').trim();
  const email = c[3] === '-' ? '' : (c[3] || '').trim();
  const phone = c[4] === '-' ? '' : (c[4] || '').trim();
  const address = c[5] === '-' ? '' : (c[5] || '').trim();
  const obs = c[6] === '-' ? '' : (c[6] || '').trim();

  if (ruc && businessName) {
    customers.push({
      docType,
      ruc,
      businessName,
      email,
      phone,
      address,
      observations: obs,
    });
  }
}

// 2. Process Products (Reporte 18)
const ss18 = parseSharedStrings('temp_18/xl/sharedStrings.xml');
const rows18 = parseSheet('temp_18/xl/worksheets/sheet1.xml', ss18);
const products = [];
// Row 1 is Title, Row 2 is Header
for (let i = 2; i < rows18.length; i++) {
  const c = rows18[i].cells;
  if (!c || c.length < 2) continue;
  const internalCode = (c[0] || '').trim();
  const partNumber = (c[1] || '').trim();
  const category = (c[2] || 'REPUESTOS').trim();
  const brand = (c[3] || '').trim();
  const barcode = (c[4] || '').trim();
  const unit = (c[5] || 'UNIDADES').trim();
  const sunatCode = (c[6] || '').trim();
  const currency = (c[7] || 'USD').trim();
  const salePrice = parseFloat(c[8]) || 0;
  const purchaseCost = parseFloat(c[9]) || 0;

  if (partNumber) {
    products.push({
      internalCode,
      partNumber,
      category,
      brand: brand || (partNumber.startsWith('6ES7') ? 'SIEMENS' : (partNumber.startsWith('1756') ? 'ALLEN BRADLEY' : 'GENÉRICO')),
      unit,
      currency,
      salePrice,
      purchaseCost,
    });
  }
}

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/seed-customers.json', JSON.stringify(customers, null, 2));
fs.writeFileSync('src/data/seed-products.json', JSON.stringify(products, null, 2));

console.log(`Exported ${customers.length} customers to src/data/seed-customers.json`);
console.log(`Exported ${products.length} products to src/data/seed-products.json`);

