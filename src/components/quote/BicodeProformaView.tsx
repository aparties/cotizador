'use client';

import { QuoteSummary } from '@/services/pricing-engine';
import { numberToLetters } from '@/utils/number-to-letters';
import { SelectedCustomer } from './CustomerSelector';
import { Printer, X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  summary: QuoteSummary;
  customer: SelectedCustomer;
  quoteNumber?: string;
  issueDate?: string;
  dueDate?: string;
  deliveryTime?: string;
};

export function BicodeProformaView({
  isOpen,
  onClose,
  summary,
  customer,
  quoteNumber = '0001-0000928',
  issueDate = '2026-11-02',
  dueDate = '2027-01-02',
  deliveryTime = '21 DÍAS',
}: Props) {
  if (!isOpen) return null;

  const montoEnLetras = numberToLetters(summary.totalFinalUsd, 'DOLARES AMERICANOS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 print:p-0">
      <div className="relative max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-10 font-sans text-slate-800 shadow-2xl print:max-h-none print:w-full print:rounded-none print:p-8">
        
        <div className="mb-6 flex items-center justify-between border-b pb-4 print:hidden">
          <span className="font-bold text-slate-900 text-sm">Vista Previa Proforma - Bicode Control</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full bg-[#1b5e54] px-6 py-2 text-xs font-bold text-white hover:bg-[#144740] shadow-md"
            >
              <Printer className="h-4 w-4" /> Imprimir / Guardar como PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Encabezado: Logo Bicode + Recuadro RUC */}
        <div className="flex justify-between items-start gap-6">
          <div className="flex gap-4 items-start">
            <div className="h-20 w-20 flex-shrink-0 border-2 border-slate-900 rounded-full flex flex-col items-center justify-center p-1 text-center font-black">
              <span className="text-[10px] tracking-widest text-slate-900 leading-none">BICODE</span>
              <span className="text-base text-red-600 font-bold">H</span>
              <span className="text-[9px] tracking-wider text-slate-800 leading-none">CONTROL</span>
            </div>

            <div className="text-xs space-y-0.5">
              <h2 className="text-base font-black tracking-tight text-slate-900">BICODE CONTROL</h2>
              <p className="text-slate-600 text-[11px]">PRINCIPAL » MZA. B LOTE. 1 RES. PROYECTO</p>
              <p className="text-slate-600 text-[11px]">MARTINETE LIMA - LIMA - LIMA</p>
              <p className="text-slate-600 text-[11px]">E-mail: sales@bicodecontrol.com</p>
              <p className="text-slate-600 text-[11px]">Teléfono: 995466310</p>
            </div>
          </div>

          <div className="w-72 border border-slate-800 text-center">
            <div className="py-1 text-sm font-bold tracking-wide text-slate-900 border-b border-slate-800">
              RUC 20603355807
            </div>
            <div className="bg-[#eaf4f2] py-2 text-base font-black tracking-widest text-[#1b5e54] border-b border-slate-800">
              PROFORMA
            </div>
            <div className="py-1 text-sm font-bold tracking-wider font-mono text-slate-900">
              {quoteNumber}
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Fechas */}
        <div className="mt-6 border-t border-b border-slate-300 py-3 text-xs grid grid-cols-12 gap-y-1.5 gap-x-2">
          <div className="col-span-8 flex">
            <span className="w-24 font-bold text-slate-900">DOCUMENTO</span>
            <span className="font-mono font-medium">RUC {customer.ruc || '20605524126'}</span>
          </div>
          <div className="col-span-4 flex">
            <span className="w-36 font-bold text-slate-900">FECHA EMISIÓN</span>
            <span className="font-mono">{issueDate}</span>
          </div>

          <div className="col-span-8 flex">
            <span className="w-24 font-bold text-slate-900">CLIENTE</span>
            <span className="font-bold text-slate-900 uppercase">{customer.businessName || 'HEINEKEN PERU S.A.C.'}</span>
          </div>
          <div className="col-span-4 flex">
            <span className="w-36 font-bold text-slate-900">FECHA VENCIMIENTO</span>
            <span className="font-mono">{dueDate}</span>
          </div>

          <div className="col-span-8 flex">
            <span className="w-24 font-bold text-slate-900">DIRECCIÓN</span>
            <span className="text-slate-700 text-[11px] leading-tight">{customer.address || 'AV. CIRCUNVALACIÓN GOLF LOS I NRO. 154 INT. 1702 - LIMA LIMA SANTIAGO DE SURCO'}</span>
          </div>
          <div className="col-span-4 flex">
            <span className="w-36 font-bold text-slate-900">MONEDA</span>
            <span className="font-bold text-slate-900">DOLARES AMERICANOS</span>
          </div>
        </div>

        {/* Tabla Oficial de Repuestos (Cabecera Teal #24695c) */}
        <div className="mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#24695c] text-white font-bold text-[11px]">
                <th className="py-2 px-2 text-center w-8">Nº</th>
                <th className="py-2 px-2 w-24">UNIDAD</th>
                <th className="py-2 px-2 w-28">CÓDIGO</th>
                <th className="py-2 px-3">DESCRIPCIÓN</th>
                <th className="py-2 px-2 text-right w-16">CANT.</th>
                <th className="py-2 px-2 text-right w-24">V. UNIT.</th>
                <th className="py-2 px-2 text-right w-24">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-300">
              {summary.items.map((it, idx) => (
                <tr key={it.id} className="text-slate-800">
                  <td className="py-2.5 px-2 text-center">{idx + 1}</td>
                  <td className="py-2.5 px-2 text-slate-600 font-semibold">UNIDADES</td>
                  <td className="py-2.5 px-2 font-mono font-bold text-slate-900">{it.partNumber}</td>
                  <td className="py-2.5 px-3 uppercase text-slate-700">{it.description}</td>
                  <td className="py-2.5 px-2 text-right font-mono">{it.quantity.toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-medium">{it.unitSalePriceNetUsd.toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                    {it.totalSalePriceWithIgvUsd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monto en Letras */}
        <div className="mt-3 bg-slate-50 border-t border-b border-slate-200 py-1.5 px-3 text-[11px] font-bold text-slate-700 uppercase">
          {montoEnLetras}
        </div>

        {/* Totales Fiscales */}
        <div className="mt-3 flex justify-end">
          <div className="w-72 space-y-1 text-xs">
            <div className="flex justify-between py-0.5">
              <span className="font-bold text-slate-700">GRAVADO</span>
              <span className="font-mono font-bold">US$ {summary.subtotalNetUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-bold text-slate-700">I.G.V. 18%</span>
              <span className="font-mono font-bold">US$ {summary.totalIgvUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-sm">
              <span className="font-black text-slate-900">TOTAL</span>
              <span className="font-mono font-black text-slate-900">US$ {summary.totalFinalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Bloque Comercial & Cuentas Bancarias */}
        <div className="mt-6 border-t border-slate-300 pt-4 text-[11px] space-y-2 text-slate-700">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3 font-bold text-slate-900">PLAZO DE ENTREGA</div>
            <div className="col-span-9 font-medium">{deliveryTime}</div>

            <div className="col-span-3 font-bold text-slate-900">PLAZO DE PAGO</div>
            <div className="col-span-9 font-medium">{customer.paymentTerm || '60 DÍAS'}</div>

            <div className="col-span-3 font-bold text-slate-900">CONDICIÓN DE PAGO</div>
            <div className="col-span-9 font-bold text-slate-900">{customer.paymentCondition || 'CRÉDITO'}</div>

            <div className="col-span-3 font-bold text-slate-900">DETALLE CRÉDITO</div>
            <div className="col-span-9 space-y-0.5">
              <p>NÚMERO DE CUOTAS: 1</p>
              <p className="font-bold">MONTO NETO PENDIENTE DE PAGO: US$ {summary.totalFinalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p>1- FECHA DE VENCIMIENTO: {dueDate} MONTO: {summary.totalFinalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} DOLARES AMERICANOS</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">CUENTAS BANCARIAS</span>
            <div className="space-y-0.5 font-mono text-[10px] text-slate-600">
              <p>Cuenta Soles BCP : Cuenta Nro.: 191-97813480-0-92 CCI: 00219119781348009255</p>
              <p>Cuenta Soles Scotiabank : Cuenta Nro.: 207-0381237</p>
              <p>Cuenta Dólares Scotiabank Nro.: 207-0627772 CCI: 009-017-212070627772-54</p>
              <p>Cuenta Detracciones Soles BN Nro.: 00-048-075703</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-2 text-center text-[10px] text-slate-400">
          Documento emitido desde www.bicodecontrol.com | Cotizador QuickQuote Industrial
        </div>
      </div>
    </div>
  );
}

