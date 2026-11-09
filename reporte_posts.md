# 📝 Reporte de Desarrollo y Estado del Proyecto - QuickQuote Industrial

## 1. Ficha del Proyecto
- **Proyecto**: QuickQuote Industrial (Bicode Control S.A.C.)
- **Versión**: 1.0.0 (MVP)
- **Stack**: Next.js 14 (App Router, Client Components prioritarios), TypeScript, Tailwind CSS, Lucide React, Neon PostgreSQL con Prisma.
- **Identidad Visual**: Skiz-Inspired (`#0b241c`, `#143028`, `#081a14`, `#57cc99`, `#80ed99`, `#1d4034`).

---

## 2. Métricas y Datos Reales Incorporados

| Componente de Datos | Fuente | Registros Extraídos | Estado |
| :--- | :--- | :---: | :--- |
| **Cartera de Clientes** | `reporte (17).xlsx` | 55 clientes | ✅ Normalizado en `src/data/seed-customers.json` con RUC y dirección fiscal completa |
| **Catálogo de Repuestos**| `reporte (18).xlsx` | 994 repuestos | ✅ Normalizado en `src/data/seed-products.json` con códigos Siemens, Allen-Bradley y precios USD/PEN |
| **Plantilla Proforma Oficial**| `20603355807-PF-0001-928.pdf` | Formato KeyFácil | ✅ Recreado en `BicodeProformaView.tsx` con logo, tabla teal `#24695c`, letras y 4 cuentas CCI |

---

## 3. Módulos Implementados

### 3.1 Motor Financiero & Landed Cost (`pricing-engine.ts`)
- Cálculo automático de Seguro SUNAT tabla (0.75% CFR).
- Ad Valorem configurable por ítem (0%, 6%, 11%).
- Prorrateo exacto por valor FOB o por unidad física.
- Estrategias dinámicas: Markup sobre costo vs Margen sobre venta.
- Desglose de impuestos SUNAT (IGV 18% y Percepción 3.5%).

### 3.2 Parser Regex Multipatrón (`quote-parser.ts`)
- Procesamiento en caliente de cadenas industriales del tipo `6ES7545-5DA00-0AB0---1pcs --- $297.3/ea`.
- Detección de cantidades con multiplicadores (`x 2`, `qty: 3`, `2 pcs`).
- Detección de moneda y condición técnica (`USADO`, `REFURBISHED`, `NUEVO`).

### 3.3 UI / UX Reactiva
- **Autocompletado de repuestos en <5ms** sobre los 994 productos del catálogo.
- **Selector de clientes con búsqueda predictiva** por RUC o Razón Social (ej. *Heineken, Braedt, Abastos Peruanos*).
- **Barra flotante inferior de KPIs**: Inversión Landed, Venta Neta, Utilidad $ y %, y esquema 60/40 de anticipo y saldo.
- **Vista A4 para Impresión**: Formato idéntico al PDF oficial de Bicode Control.

---

## 4. Estructura de Documentación del Repositorio

- `Canvas DB.md`: Modelo canvas y patrones de acceso de la base de datos.
- `Canvas MVP .md`: Lean Canvas del producto y métricas de éxito.
- `content_guidelines.md`: Normas tributarias peruanas y convenciones técnicas.
- `DB Mermaid.md`: Diagramas de flujo y arquitectura en Mermaid.
- `DB.md`: Diccionario de datos y especificación de tablas PostgreSQL.
- `E-R Mermaid.md`: Diagrama Entidad-Relación formal.
- `standard.md`: Estándares de desarrollo Senior Next.js / TypeScript.
- `ui.md`: Sistema de diseño Skiz-Inspired (Bicode Control).

