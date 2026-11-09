'use client';

import { useState, useMemo } from 'react';
import productsData from '@/data/seed-products.json';
import { getQuickDescription } from '@/utils/industrial-catalog';
import { Cpu } from 'lucide-react';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSelectProduct: (product: { partNumber: string; description: string; price: number }) => void;
};

export function ProductAutocomplete({ value, onChange, onSelectProduct }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(() => {
    if (!value || value.length < 2) return [];
    const term = value.toUpperCase().trim();
    return productsData
      .filter((p) => p.partNumber.toUpperCase().includes(term))
      .slice(0, 8);
  }, [value]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        placeholder="6ES7..."
        className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 font-mono font-bold text-white hover:border-[#1d4034] focus:border-[#57cc99] focus:bg-[#081a14] focus:outline-none"
      />

      {isOpen && matches.length > 0 && (
        <div className="absolute left-0 top-9 z-50 w-72 rounded-2xl border border-[#1d4034] bg-[#081a14] p-1.5 shadow-2xl backdrop-blur-md">
          <div className="px-2 py-1 text-[10px] font-semibold text-[#57cc99] uppercase border-b border-[#1d4034]/60 mb-1">
            Catálogo Bicode Control ({matches.length} sugerencias)
          </div>
          {matches.map((p) => (
            <button
              key={p.internalCode}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectProduct({
                  partNumber: p.partNumber,
                  description: getQuickDescription(p.partNumber),
                  price: p.salePrice,
                });
                setIsOpen(false);
              }}
              className="w-full rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[#143028] flex items-center justify-between"
            >
              <div>
                <p className="font-mono font-bold text-white flex items-center gap-1.5">
                  <Cpu className="h-3 w-3 text-[#57cc99]" />
                  {p.partNumber}
                </p>
                <p className="text-[10px] text-[#a8b5b0]">{p.category} · {p.brand}</p>
              </div>
              <span className="font-mono text-xs font-semibold text-[#80ed99]">
                ${p.salePrice}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

