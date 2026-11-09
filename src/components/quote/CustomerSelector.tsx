'use client';

import { useState } from 'react';
import customersData from '@/data/seed-customers.json';
import { Building2, Search, UserPlus, Check, X } from 'lucide-react';

export interface SelectedCustomer {
  id?: string;
  ruc: string;
  businessName: string;
  address: string;
  paymentTerm: string;
  paymentCondition: string;
}

type Props = {
  selectedCustomer: SelectedCustomer;
  onSelectCustomer: (cust: SelectedCustomer) => void;
};

export function CustomerSelector({ selectedCustomer, onSelectCustomer }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newCust, setNewCust] = useState({
    ruc: '',
    businessName: '',
    address: '',
    paymentTerm: '60 DÍAS',
    paymentCondition: 'CRÉDITO',
  });

  const searchResults = searchTerm.length >= 2
    ? customersData.filter((c) =>
        c.ruc.includes(searchTerm) ||
        c.businessName.toUpperCase().includes(searchTerm.toUpperCase())
      ).slice(0, 8)
    : [];

  const handleSaveNew = () => {
    if (!newCust.ruc || !newCust.businessName) {
      alert('RUC y Razón Social son requeridos.');
      return;
    }
    onSelectCustomer({
      ruc: newCust.ruc,
      businessName: newCust.businessName,
      address: newCust.address,
      paymentTerm: newCust.paymentTerm,
      paymentCondition: newCust.paymentCondition,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="rounded-[32px] border border-[#1d4034] bg-[#143028] p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Building2 className="h-4 w-4 text-[#57cc99]" />
          <span>Cliente / Proforma Formal</span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 rounded-full bg-[#57cc99]/20 px-3 py-1 text-xs font-semibold text-[#57cc99] hover:bg-[#57cc99] hover:text-[#0b241c] transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" /> + Nuevo RUC
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#a8b5b0]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por RUC o Razón Social (ej. Heineken, Braedt, 2060...)"
          className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] pl-9 pr-4 py-2 text-xs text-white placeholder-emerald-100/20 focus:border-[#57cc99] focus:outline-none"
        />

        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-10 z-30 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-[#1d4034] bg-[#081a14] p-1 shadow-2xl">
            {searchResults.map((cust) => (
              <button
                key={cust.ruc}
                type="button"
                onClick={() => {
                  onSelectCustomer({
                    ruc: cust.ruc,
                    businessName: cust.businessName,
                    address: cust.address,
                    paymentTerm: '60 DÍAS',
                    paymentCondition: 'CRÉDITO',
                  });
                  setSearchTerm('');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#143028] transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-white">{cust.businessName}</p>
                  <p className="font-mono text-[11px] text-[#57cc99]">RUC: {cust.ruc}</p>
                </div>
                <Check className="h-4 w-4 text-[#57cc99]" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5 rounded-2xl bg-[#081a14] p-3 border border-[#1d4034]/60 text-xs">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-white truncate">{selectedCustomer.businessName || 'Sin Cliente'}</span>
          <span className="font-mono text-[#57cc99] text-[11px]">{selectedCustomer.ruc ? `RUC ${selectedCustomer.ruc}` : ''}</span>
        </div>
        <p className="text-[11px] text-[#a8b5b0] truncate">{selectedCustomer.address || 'Ingresa dirección fiscal'}</p>
        <div className="flex gap-4 pt-1 text-[10px] text-slate-400">
          <span>Condición: <strong className="text-white">{selectedCustomer.paymentCondition}</strong></span>
          <span>Plazo: <strong className="text-white">{selectedCustomer.paymentTerm}</strong></span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[36px] border border-[#1d4034] bg-[#143028] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#1d4034]">
              <h3 className="font-bold text-white text-base">Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#a8b5b0] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#57cc99]">RUC (11 Dígitos)</label>
                <input
                  type="text"
                  maxLength={11}
                  value={newCust.ruc}
                  onChange={(e) => setNewCust({ ...newCust, ruc: e.target.value })}
                  placeholder="20605524126"
                  className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-4 py-2 text-xs font-mono text-white focus:border-[#57cc99] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#57cc99]">Razón Social</label>
                <input
                  type="text"
                  value={newCust.businessName}
                  onChange={(e) => setNewCust({ ...newCust, businessName: e.target.value })}
                  placeholder="EMPRESA S.A.C."
                  className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-4 py-2 text-xs text-white focus:border-[#57cc99] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#57cc99]">Dirección Fiscal</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="Av. Industrial 123 - Lima"
                  className="w-full rounded-2xl border border-[#1d4034] bg-[#081a14] px-4 py-2 text-xs text-white focus:border-[#57cc99] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full px-5 py-2 text-xs font-semibold text-[#a8b5b0]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNew}
                className="rounded-full bg-[#57cc99] px-6 py-2 text-xs font-bold text-[#0b241c] hover:bg-[#80ed99]"
              >
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

