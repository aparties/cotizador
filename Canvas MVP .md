# 🚀 Canvas MVP - QuickQuote Industrial (Bicode Control)

## 1. Problema
- **Cotizaciones lentas**: El cálculo manual de costes de importación (FOB, Flete prorrateado, Seguro SUNAT 0.75%, Ad Valorem, Desaduanaje) demora entre 20 a 45 minutos por cotización.
- **Pérdida de margen**: Errores al mezclar costos con y sin IGV, o aplicar markups inconsistentes a clientes de lote vs cliente final.
- **Formato dispar de proformas**: Generar documentos sin el estándar fiscal exigido por clientes corporativos en Perú (RUC, dirección, cuentas CCI, detalle de crédito).

---

## 2. Segmento de Clientes
- **Empresas Industriales y Mineras en Perú** (ej. Heineken, Braedt, Las Bambas, etc.).
- **Distribuidores e Integradores de Automatización** (compras por lote con márgenes reducidos).
- **Ventas Internas / Gerencia de Bicode Control** (requieren visibilidad instantánea del margen bruto y cash flow aduanero).

---

## 3. Propuesta de Valor Única (UVP)
> *"Cotiza repuestos industriales importados o locales en menos de 60 segundos con cálculo exacto de Landed Cost Perú, márgenes comerciales dinámicos y emisión inmediata de la proforma oficial de Bicode Control."*

---

## 4. Solución (Alcance del MVP)
1. **Quick Input / Paste Mode**: Parser regex que procesa listas crudas de WhatsApp, PDF o correos y extrae Código, Cantidad y Costo FOB.
2. **Motor de Pricing en Tiempo Real**: Prorrateo de flete y gastos, cálculo de arancel SUNAT (0%, 6%, 11%) y toggle entre Markup y Gross Margin.
3. **Catálogo Integrado**: 994 productos industriales y 55 clientes precargados con autocompletado en <5ms.
4. **Proforma Formal Oficial**: Generador de proformas idéntico al PDF de Bicode Control (KeyFácil) con número correlativo, tabla teal, montos en letras y cuentas bancarias BCP/Scotiabank/BN.
5. **Barra Fija de KPIs**: Visibilidad en todo momento de Inversión (Landed), Venta Neta USD/PEN, Utilidad $ y %, y esquema 60/40 de pago.

---

## 5. Canales y Flujos Clave
- **Web App Responsive** optimizada para Desktop en oficina y tablets en almacén/planta.
- **Exportación A4 / Impresión Limpia** sin elementos de interfaz para envío directo a compras.

---

## 6. Métricas de Éxito (KPIs del MVP)
- **Tiempo por cotización**: Reducción de 30 min a <2 min.
- **Margen de error en cálculo de aranceles**: 0%.
- **Adopción interna**: 100% de proformas emitidas con el diseño unificado de Bicode Control.

