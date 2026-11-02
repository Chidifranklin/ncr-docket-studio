import React, { useState } from 'react';
import { Type, Sparkles, Check, ChevronDown } from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';
import {
  CURATED_HEADER_FONTS,
  CURATED_BODY_FONTS,
  type FontOption,
} from '../../lib/fonts';

interface TypographyPairing {
  name: string;
  badge: string;
  headerFont: string;
  bodyFont: string;
  description: string;
}

const POPULAR_PAIRINGS: TypographyPairing[] = [
  {
    name: 'Commercial Press',
    badge: 'Industrial',
    headerFont: 'Oswald',
    bodyFont: 'Roboto',
    description: 'High-contrast merchant invoice & bold trade receipts',
  },
  {
    name: 'Luxury Crest',
    badge: 'Prestige',
    headerFont: 'Cinzel',
    bodyFont: 'Plus Jakarta Sans',
    description: 'Classical Roman luxury & royal corporate stationery',
  },
  {
    name: 'Modern Corporate',
    badge: 'Clean',
    headerFont: 'Montserrat',
    bodyFont: 'Inter',
    description: 'Precise geometric branding with ultra-sharp form grids',
  },
  {
    name: 'High-Fashion Boutique',
    badge: 'Editorial',
    headerFont: 'Playfair Display',
    bodyFont: 'Open Sans',
    description: 'High-contrast elegant serifs for salons & luxury couture',
  },
  {
    name: 'Dispatch & Depot',
    badge: 'Mechanical',
    headerFont: 'Bebas Neue',
    bodyFont: 'Space Mono',
    description: 'All-caps heavy display with typewriter receipt serials',
  },
];

export const TypographySelector: React.FC = () => {
  const { docket, updateDocket } = useDocketStore();
  const [activeTab, setActiveTab] = useState<'header' | 'body' | 'pairings'>('header');
  const [headerFilter, setHeaderFilter] = useState<string>('All');
  const [bodyFilter, setBodyFilter] = useState<string>('All');

  const currentHeaderFont = docket.headerFont || 'Cinzel';
  const currentBodyFont = docket.bodyFont || 'Plus Jakarta Sans';

  const filteredHeaderFonts = CURATED_HEADER_FONTS.filter((f) =>
    headerFilter === 'All' ? true : f.category === headerFilter
  );

  const filteredBodyFonts = CURATED_BODY_FONTS.filter((f) =>
    bodyFilter === 'All' ? true : f.category === bodyFilter
  );

  return (
    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-4">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>Google Fonts & Typography</span>
        </label>
        <span className="text-[10px] text-slate-500 font-medium">Curated Pairs</span>
      </div>

      {/* Tab Switcher: Header Font vs Body Font vs Instant Pairings */}
      <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab('header')}
          className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
            activeTab === 'header'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Header Font
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
            activeTab === 'body'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Body & Tables
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pairings')}
          className={`py-1 px-2 rounded-md font-medium transition-all flex items-center gap-1 ${
            activeTab === 'pairings'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-400 hover:text-amber-300'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Pairings</span>
        </button>
      </div>

      {/* TAB 1: HEADER FONT SELECTION */}
      {activeTab === 'header' && (
        <div className="space-y-3">
          {/* Active Preview */}
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Active Header Font:</span>
              <span className="font-semibold text-indigo-400">{currentHeaderFont}</span>
            </div>
            <div
              style={{
                fontFamily: CURATED_HEADER_FONTS.find((f) => f.id === currentHeaderFont)?.family || 'serif',
                color: docket.primaryColor,
              }}
              className="text-base sm:text-lg font-bold uppercase tracking-tight truncate py-1"
            >
              {docket.businessName || 'GODWIN NIGERIA ENTERPRISE'}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 text-[10px]">
            {['All', 'Serif', 'Sans', 'Display'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setHeaderFilter(cat)}
                className={`px-2 py-0.5 rounded-full transition-colors ${
                  headerFilter === cat
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Fonts List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {filteredHeaderFonts.map((font) => {
              const isSelected = currentHeaderFont === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => updateDocket({ headerFont: font.id })}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 text-white ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ fontFamily: font.family }}
                        className="text-sm font-bold tracking-tight text-slate-100"
                      >
                        {font.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {font.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {font.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BODY & TABLE FONT SELECTION */}
      {activeTab === 'body' && (
        <div className="space-y-3">
          {/* Active Preview */}
          <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Active Body Font:</span>
              <span className="font-semibold text-indigo-400">{currentBodyFont}</span>
            </div>
            <div
              style={{
                fontFamily: CURATED_BODY_FONTS.find((f) => f.id === currentBodyFont)?.family || 'sans-serif',
              }}
              className="text-xs text-slate-200 py-1 space-y-0.5"
            >
              <div className="font-semibold">QTY: 10 | 4" P.V.C Pressure Pipe</div>
              <div className="text-[11px] text-slate-400">Total: ₦45,000.00 • Goods received in good order</div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 text-[10px]">
            {['All', 'Sans', 'Monospace'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setBodyFilter(cat)}
                className={`px-2 py-0.5 rounded-full transition-colors ${
                  bodyFilter === cat
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Fonts List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {filteredBodyFonts.map((font) => {
              const isSelected = currentBodyFont === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => updateDocket({ bodyFont: font.id })}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 text-white ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ fontFamily: font.family }}
                        className="text-sm font-semibold tracking-normal text-slate-100"
                      >
                        {font.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {font.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {font.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CURATED ONE-TAP PAIRINGS */}
      {activeTab === 'pairings' && (
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
          {POPULAR_PAIRINGS.map((pair, idx) => {
            const isPairSelected =
              currentHeaderFont === pair.headerFont && currentBodyFont === pair.bodyFont;
            return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  updateDocket({
                    headerFont: pair.headerFont,
                    bodyFont: pair.bodyFont,
                  })
                }
                className={`w-full text-left p-3 rounded-lg border transition-all space-y-1.5 ${
                  isPairSelected
                    ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{pair.name}</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {pair.badge}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 text-[11px] text-slate-400">
                  <span className="text-indigo-400 font-medium">{pair.headerFont}</span>
                  <span className="text-slate-600">+</span>
                  <span className="text-emerald-400 font-medium">{pair.bodyFont}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {pair.description}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
