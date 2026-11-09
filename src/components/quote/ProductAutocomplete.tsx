'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import productsData from '@/data/seed-products.json';
import { getQuickDescription } from '@/utils/industrial-catalog';
import {
  searchProductsAndHistory,
  AutocompleteProductMatch,
} from '@/services/quote-actions';
import { Cpu, Database, History, Loader2 } from 'lucide-react';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSelectProduct: (product: { partNumber: string; description: string; price: number }) => void;
};

export function ProductAutocomplete({ value, onChange, onSelectProduct }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [dbMatches, setDbMatches] = useState<AutocompleteProductMatch[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Coincidencias instantáneas del catálogo local (0ms)
  const localMatches = useMemo(() => {
    if (!value || value.length < 2) return [];
    const term = value.toUpperCase().trim();
    return productsData
      .filter((p) => p.partNumber.toUpperCase().includes(term))
      .slice(0, 6)
      .map((p) => ({
        partNumber: p.partNumber,
        description: getQuickDescription(p.partNumber),
        price: p.salePrice || p.purchaseCost || 0,
        source: 'CATALOGO' as const,
        brand: p.brand,
        category: p.category,
      }));
  }, [value]);

  // 2. Búsqueda en la Base de Datos Neon y Cotizaciones Previas (Debounced 200ms)
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setDbMatches([]);
      setIsSearchingDb(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    setIsSearchingDb(true);
    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchProductsAndHistory(value);
        setDbMatches(results);
      } catch (err) {
        console.warn('Error fetching DB matches:', err);
      } finally {
        setIsSearchingDb(false);
      }
    }, 200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  // 3. Fusión y Deduplicación de resultados (Prioridad: DB Neon > Historial > Catálogo Local)
  const mergedMatches = useMemo(() => {
    const seen = new Set<string>();
    const list: AutocompleteProductMatch[] = [];

    // Primero los de la DB y el Historial
    for (const item of dbMatches) {
      const up = item.partNumber.toUpperCase();
      if (!seen.has(up)) {
        seen.add(up);
        list.push(item);
      }
    }

    // Luego los del catálogo local para asegurar respuesta instantánea
    for (const item of localMatches) {
      const up = item.partNumber.toUpperCase();
      if (!seen.has(up) && list.length < 10) {
        seen.add(up);
        list.push(item);
      }
    }

    return list.slice(0, 8);
  }, [dbMatches, localMatches]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 250)}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        placeholder="6ES7..."
        className="w-full rounded-xl border border-transparent bg-transparent px-2 py-1 font-mono font-bold text-white hover:border-[#1d4034] focus:border-[#57cc99] focus:bg-[#081a14] focus:outline-none"
      />

      {isOpen && (mergedMatches.length > 0 || isSearchingDb) && (
        <div className="absolute left-0 top-9 z-50 w-96 rounded-2xl border border-[#1d4034] bg-[#081a14] p-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-[#57cc99] uppercase border-b border-[#1d4034]/60 mb-1">
            <span>Catálogo Bicode & DB Neon ({mergedMatches.length})</span>
            {isSearchingDb && (
              <span className="flex items-center gap-1 text-[9px] text-[#80ed99] lowercase">
                <Loader2 className="h-3 w-3 animate-spin" /> buscando en DB...
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {mergedMatches.map((p) => {
              const isDb = p.source === 'DB';
              const isHistory = p.source === 'HISTORIAL';

              return (
                <button
                  key={`${p.source}-${p.partNumber}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectProduct({
                      partNumber: p.partNumber,
                      description: p.description,
                      price: p.price,
                    });
                    setIsOpen(false);
                  }}
                  className="w-full rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[#143028] flex items-center justify-between gap-2 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {isDb ? (
                        <Database className="h-3 w-3 text-[#57cc99] flex-shrink-0" />
                      ) : isHistory ? (
                        <History className="h-3 w-3 text-amber-400 flex-shrink-0" />
                      ) : (
                        <Cpu className="h-3 w-3 text-[#a8b5b0] flex-shrink-0" />
                      )}
                      <p className="font-mono font-bold text-white truncate">
                        {p.partNumber}
                      </p>
                      <span
                        className={`text-[8.5px] font-semibold px-1.5 py-0.2 rounded ${
                          isDb
                            ? 'bg-[#57cc99]/20 text-[#57cc99]'
                            : isHistory
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-slate-700/50 text-slate-300'
                        }`}
                      >
                        {isDb ? 'DB Neon' : isHistory ? 'Cotizado' : 'Catálogo'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#a8b5b0] truncate mt-0.5 leading-tight">
                      {p.description}
                    </p>
                  </div>

                  {p.price > 0 && (
                    <div className="text-right flex-shrink-0 font-mono text-xs font-semibold text-[#80ed99]">
                      ${p.price.toFixed(2)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
