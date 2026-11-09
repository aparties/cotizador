# 📊 Canvas DB - QuickQuote Industrial (Bicode Control)

## 1. Visión General de la Base de Datos
- **Motor**: PostgreSQL 16+ en Neon Tech (Serverless & Pooling habilitado).
- **ORM / Acceso**: Prisma ORM / Tipado estricto con TypeScript.
- **Objetivo**: Persistencia transaccional de alta velocidad para cotizaciones industriales, catálogos de repuestos (Siemens, Allen-Bradley, etc.), cartera fiscal de clientes (RUC) y auditoría de costes de importación (Landed Cost Perú).

---

## 2. Bloques del Modelo de Datos (DB Canvas)

| Bloque | Componentes / Entidades | Reglas de Negocio & Restricciones |
| :--- | :--- | :--- |
| **Identidad Fiscal & Terceros** | `customers`, `suppliers` | • Validación de RUC a 11 dígitos numéricos.<br>• Snapshot inmutable de Razón Social y Dirección en cada proforma emitida.<br>• Soporte de plazos de pago (Contado, Crédito 21/60 días). |
| **Catálogo Técnico & Precios** | `products` | • Indexación por `partNumber` para búsquedas en <5ms.<br>• Moneda base USD/PEN con precio de referencia y costo de adquisición. |
| **Transacciones Comerciales** | `quotes` (Cabecera) | • Código correlativo único (ej. `0001-0000928`).<br>• Snapshot del Tipo de Cambio SUNAT al emitir.<br>• Inmutabilidad de totales (Gravado, IGV 18%, Total USD y PEN). |
| **Desglose de Costes & Margen** | `quote_items` (Detalle) | • Precisión monetaria en `Decimal(12, 4)`.<br>• Prorrateo de flete y gastos aduaneros por valor FOB o por unidad.<br>• Separación de Ad Valorem (coste) vs IGV/Percepción (crédito fiscal). |
| **Parámetros Financieros** | `exchange_rates` | • Registro histórico de T.C. Venta SUNAT / SBS. |

---

## 3. Patrones de Consulta Críticos (Access Patterns)

1. **Búsqueda Instantánea de Repuestos**:
   - `SELECT * FROM products WHERE part_number ILIKE '6ES7%' LIMIT 10`
   - Optimizado con índice B-Tree en `part_number`.
2. **Autocompletado de Cliente por RUC / Nombre**:
   - `SELECT * FROM customers WHERE ruc = $1 OR business_name ILIKE $2 LIMIT 8`
   - Optimizado con índice único en `ruc`.
3. **Carga Completa de Proforma para Impresión**:
   - `SELECT q.*, qi.*, c.* FROM quotes q JOIN quote_items qi ON q.id = qi.quote_id LEFT JOIN customers c ON q.customer_id = c.id WHERE q.code = $1`

---

## 4. Políticas de Integridad y Backup
- **Precisión Numérica**: Todos los campos monetarios utilizan `DECIMAL(12, 4)` para evitar errores de redondeo en prorrateos de fletes internacionales y aduanas.
- **Relaciones en Cascada**: `ON DELETE CASCADE` en `quote_items` al eliminar un borrador de cotización.
- **Neon Branching**: Uso de branches de Neon para staging y pruebas de carga sin afectar datos de producción.

