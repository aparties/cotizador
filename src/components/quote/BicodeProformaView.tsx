'use client';

import { useState } from 'react';
import { QuoteSummary } from '@/services/pricing-engine';
import { numberToLetters } from '@/utils/number-to-letters';
import { SelectedCustomer } from './CustomerSelector';
import { Printer, X, Edit3 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  summary: QuoteSummary;
  customer: SelectedCustomer;
  quoteNumber?: string;
  issueDate?: string;
  dueDate?: string;
  deliveryTime?: string;
  currency?: string;
};

export function BicodeProformaView({
  isOpen,
  onClose,
  summary,
  customer,
  quoteNumber: initialQuoteNumber = '0001-0000928',
  issueDate: initialIssueDate,
  dueDate: initialDueDate,
  deliveryTime: initialDeliveryTime = '21 DÍAS',
  currency: initialCurrency = 'DOLARES AMERICANOS',
}: Props) {
  // Inicialización de fechas
  const todayStr = initialIssueDate || new Date().toISOString().split('T')[0];
  const dueDefault = new Date();
  dueDefault.setDate(dueDefault.getDate() + 60);
  const dueStr = initialDueDate || dueDefault.toISOString().split('T')[0];

  // Estados locales editables en vivo
  const [quoteNumber, setQuoteNumber] = useState(initialQuoteNumber);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueStr);
  const [deliveryTime, setDeliveryTime] = useState(initialDeliveryTime);
  const [currency, setCurrency] = useState(initialCurrency);
  const [paymentTerm, setPaymentTerm] = useState(customer.paymentTerm || '60 DÍAS');
  const [paymentCondition, setPaymentCondition] = useState(customer.paymentCondition || 'CRÉDITO');

  if (!isOpen) return null;

  const isSoles = currency === 'SOLES';
  const currencySymbol = isSoles ? 'S/' : 'US$';
  const totalAmount = isSoles ? summary.totalFinalPen : summary.totalFinalUsd;
  const subtotalAmount = isSoles ? summary.subtotalNetPen : summary.subtotalNetUsd;
  const igvAmount = isSoles ? summary.totalIgvPen : summary.totalIgvUsd;

  // Si es CONTADO, no debe mostrar Detalle Crédito
  const isContado = paymentCondition.toUpperCase().includes('CONTADO');

  const montoEnLetras = numberToLetters(totalAmount, currency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 print:p-0 print:static print:bg-white print:block">
      
      {/* Estilos estrictos de impresión A4 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Contenedor A4 Proporcional */}
      <div className="relative max-h-[95vh] w-full max-w-[210mm] overflow-y-auto rounded-xl bg-white p-8 font-sans text-slate-800 shadow-2xl print:max-h-none print:w-[210mm] print:min-h-[297mm] print:rounded-none print:p-0 print:shadow-none">
        
        {/* Barra superior de controles (Oculta en Impresión) */}
        <div className="mb-4 flex flex-wrap items-center justify-between border-b pb-3 print:hidden gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Proforma Oficial Bicode Control</span>
            <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              <Edit3 className="h-3 w-3" /> Campos resaltados editables
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full bg-[#1b5e54] px-6 py-2 text-xs font-bold text-white hover:bg-[#144740] shadow-md transition-all"
            >
              <Printer className="h-4 w-4" /> Imprimir / Exportar a PDF (A4)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Encabezado: Logo Bicode + Recuadro RUC */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-3.5 items-start">
            <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center">
              <img
                src="/bicode-logo.png"
                alt="Logo Bicode Control"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="text-[11px] space-y-0.5 leading-tight">
              <h2 className="text-sm font-black tracking-tight text-slate-900">BICODE CONTROL E.I.R.L.</h2>
              <p className="text-slate-600">PRINCIPAL » MZA. B LOTE. 1 RES. PROYECTO</p>
              <p className="text-slate-600">MARTINETE LIMA - LIMA - LIMA</p>
              <p className="text-slate-600">E-mail: sales@bicodecontrol.com</p>
              <p className="text-slate-600">Teléfono: 995466310</p>
            </div>
          </div>

          {/* Caja Oficial de Proforma con Número Editable */}
          <div className="w-64 border border-slate-800 text-center">
            <div className="py-1 text-xs font-bold tracking-wide text-slate-900 border-b border-slate-800">
              RUC 20603355807
            </div>
            <div className="bg-[#eaf4f2] py-1.5 text-sm font-black tracking-widest text-[#1b5e54] border-b border-slate-800">
              PROFORMA
            </div>
            <div className="py-0.5 px-2">
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="w-full text-center font-mono text-sm font-bold tracking-wider text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-800 focus:border-[#1b5e54] focus:outline-none print:border-none"
              />
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Metadatos Editables */}
        <div className="mt-4 border-t border-b border-slate-300 py-2.5 text-[11px] grid grid-cols-12 gap-y-1.5 gap-x-2">
          {/* Documento */}
          <div className="col-span-8 flex items-center">
            <span className="w-24 font-bold text-slate-900">DOCUMENTO</span>
            <span className="font-mono font-medium">RUC {customer.ruc || '20605524126'}</span>
          </div>

          {/* Fecha Emisión Editable */}
          <div className="col-span-4 flex items-center">
            <span className="w-36 font-bold text-slate-900">FECHA EMISIÓN</span>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="font-mono bg-transparent border-b border-dashed border-slate-300 hover:border-slate-800 focus:outline-none print:border-none w-28 text-slate-900"
            />
          </div>

          {/* Cliente */}
          <div className="col-span-8 flex items-center">
            <span className="w-24 font-bold text-slate-900">CLIENTE</span>
            <span className="font-bold text-slate-900 uppercase truncate">{customer.businessName || 'HEINEKEN PERU S.A.C.'}</span>
          </div>

          {/* Fecha Vencimiento Editable */}
          <div className="col-span-4 flex items-center">
            <span className="w-36 font-bold text-slate-900">FECHA VENCIMIENTO</span>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="font-mono bg-transparent border-b border-dashed border-slate-300 hover:border-slate-800 focus:outline-none print:border-none w-28 text-slate-900"
            />
          </div>

          {/* Dirección */}
          <div className="col-span-8 flex items-start">
            <span className="w-24 font-bold text-slate-900 flex-shrink-0">DIRECCIÓN</span>
            <span className="text-slate-700 text-[10px] leading-tight truncate">{customer.address || 'AV. CIRCUNVALACIÓN GOLF LOS I NRO. 154 INT. 1702 - SURCO'}</span>
          </div>

          {/* Moneda Editable */}
          <div className="col-span-4 flex items-center">
            <span className="w-36 font-bold text-slate-900">MONEDA</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-slate-800 focus:outline-none print:border-none cursor-pointer"
            >
              <option value="DOLARES AMERICANOS">DOLARES AMERICANOS</option>
              <option value="SOLES">SOLES</option>
            </select>
          </div>
        </div>

        {/* Tabla Oficial de Repuestos (Cabecera Teal #24695c) */}
        <div className="mt-3">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#24695c] text-white font-bold text-[10px]">
                <th className="py-1.5 px-2 text-center w-8">Nº</th>
                <th className="py-1.5 px-2 w-20">UNIDAD</th>
                <th className="py-1.5 px-2 w-28">CÓDIGO</th>
                <th className="py-1.5 px-3">DESCRIPCIÓN</th>
                <th className="py-1.5 px-2 text-right w-14">CANT.</th>
                <th className="py-1.5 px-2 text-right w-20">V. UNIT.</th>
                <th className="py-1.5 px-2 text-right w-24">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-300">
              {summary.items.map((it, idx) => {
                const unitVal = isSoles ? it.unitSalePriceNetPen : it.unitSalePriceNetUsd;
                const totalVal = isSoles ? it.totalSalePriceWithIgvPen : it.totalSalePriceWithIgvUsd;

                return (
                  <tr key={it.id} className="text-slate-800">
                    <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2 text-slate-600 font-semibold text-[10px]">UNIDADES</td>
                    <td className="py-2 px-2 font-mono font-bold text-slate-900">{it.partNumber}</td>
                    <td className="py-2 px-3 uppercase text-slate-700 text-[10px] leading-tight">{it.description}</td>
                    <td className="py-2 px-2 text-right font-mono">{it.quantity.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono font-medium">{unitVal.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                      {totalVal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Monto en Letras */}
        <div className="mt-2.5 bg-slate-50 border-t border-b border-slate-200 py-1 px-3 text-[10px] font-bold text-slate-700 uppercase">
          {montoEnLetras}
        </div>

        {/* Totales Fiscales */}
        <div className="mt-2.5 flex justify-end">
          <div className="w-64 space-y-1 text-[11px]">
            <div className="flex justify-between py-0.5">
              <span className="font-bold text-slate-700">GRAVADO</span>
              <span className="font-mono font-bold">{currencySymbol} {subtotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-bold text-slate-700">I.G.V. 18%</span>
              <span className="font-mono font-bold">{currencySymbol} {igvAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-xs">
              <span className="font-black text-slate-900">TOTAL</span>
              <span className="font-mono font-black text-slate-900">{currencySymbol} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Bloque Comercial con Campos Editables */}
        <div className="mt-4 border-t border-slate-300 pt-3 text-[10px] space-y-1.5 text-slate-700">
          <div className="grid grid-cols-12 gap-y-1 gap-x-2 items-center">
            
            {/* Plazo de Entrega Editable */}
            <div className="col-span-3 font-bold text-slate-900">PLAZO DE ENTREGA</div>
            <div className="col-span-9 font-medium">
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full bg-transparent border-b border-dashed border-slate-300 hover:border-slate-800 focus:outline-none print:border-none text-slate-800"
              />
            </div>

            {/* Plazo de Pago Editable */}
            <div className="col-span-3 font-bold text-slate-900">PLAZO DE PAGO</div>
            <div className="col-span-9 font-medium">
              <input
                type="text"
                value={paymentTerm}
                onChange={(e) => setPaymentTerm(e.target.value)}
                className="w-full bg-transparent border-b border-dashed border-slate-300 hover:border-slate-800 focus:outline-none print:border-none text-slate-800"
              />
            </div>

            {/* Condición de Pago Editable */}
            <div className="col-span-3 font-bold text-slate-900">CONDICIÓN DE PAGO</div>
            <div className="col-span-9 font-bold text-slate-900 flex items-center gap-2">
              <input
                type="text"
                value={paymentCondition}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentCondition(val);
                  if (val.toUpperCase().includes('CONTADO') && paymentTerm.includes('DÍAS')) {
                    setPaymentTerm('CONTADO');
                  }
                }}
                className="w-full bg-transparent border-b border-dashed border-slate-300 hover:border-slate-800 focus:outline-none print:border-none text-slate-900 font-bold uppercase"
              />
            </div>

            {/* Detalle Crédito (Solo si NO es CONTADO) */}
            {!isContado && (
              <>
                <div className="col-span-3 font-bold text-slate-900 self-start pt-0.5">DETALLE CRÉDITO</div>
                <div className="col-span-9 space-y-0.5 text-[10px]">
                  <p>NÚMERO DE CUOTAS: 1</p>
                  <p className="font-bold">
                    MONTO NETO PENDIENTE DE PAGO: {currencySymbol} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p>
                    1- FECHA DE VENCIMIENTO: {dueDate} MONTO: {totalAmount.toFixed(2)} {currency.toUpperCase()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Cuentas Bancarias Oficiales Bicode Control */}
          <div className="mt-3 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">CUENTAS BANCARIAS</span>
            <div className="space-y-0.5 font-mono text-[9.5px] text-slate-600">
              <p>Cuenta Soles BCP : Cuenta Nro.: 191-97813480-0-92 CCI: 00219119781348009255</p>
              <p>Cuenta Soles Scotiabank : Cuenta Nro.: 207-0381237</p>
              <p>Cuenta Dólares Scotiabank Nro.: 207-0627772 CCI: 009-017-212070627772-54</p>
              <p>Cuenta Detracciones Soles BN Nro.: 00-048-075703</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t pt-1.5 text-center text-[9px] text-slate-400">
          Documento emitido desde www.bicodecontrol.com | Cotizador QuickQuote Industrial
        </div>
      </div>
    </div>
  );
}
