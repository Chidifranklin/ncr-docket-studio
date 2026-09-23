import React from 'react';
import {
  Maximize2,
  Scissors,
  Layers,
  Hash,
  Copy,
  Info,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';
import type { PaperSize } from '../../types/docket';

const PAPER_SIZES: Array<{ id: PaperSize; name: string; dims: string; desc: string }> = [
  { id: 'A5', name: 'A5 Standard', dims: '148 × 210 mm', desc: 'Standard commercial sales docket & receipts' },
  { id: 'A4', name: 'A4 Large', dims: '210 × 297 mm', desc: 'Waybills, delivery notes & purchase orders' },
  { id: 'A6', name: 'A6 Pocket', dims: '105 × 148 mm', desc: 'Compact retail & boutique counter slips' },
  { id: 'CUSTOM', name: 'Custom mm', dims: 'Variable', desc: 'Custom press or continuous stationery size' },
];

const NCR_OPTIONS = [
  {
    parts: 1,
    title: '1-Part (Single Sheet)',
    desc: 'White standalone blank or numbered sheet',
    defaultLabels: ['ORIGINAL'],
    defaultColors: ['#FFFFFF'],
  },
  {
    parts: 2,
    title: '2-Part (Duplicate)',
    desc: 'White (Original) + Canary Yellow (Copy)',
    defaultLabels: ['ORIGINAL (CUSTOMER)', 'DUPLICATE (OFFICE)'],
    defaultColors: ['#FFFFFF', '#FEF08A'],
  },
  {
    parts: 3,
    title: '3-Part (Triplicate)',
    desc: 'White (Original) + Canary Yellow + Pink',
    defaultLabels: ['ORIGINAL (CUSTOMER)', 'DUPLICATE (ACCOUNTS)', 'TRIPLICATE (BOOK/STORE)'],
    defaultColors: ['#FFFFFF', '#FEF08A', '#FBCFE8'],
  },
  {
    parts: 4,
    title: '4-Part (Quadruplicate)',
    desc: 'White + Yellow + Pink + Blue',
    defaultLabels: ['ORIGINAL (CUSTOMER)', 'DUPLICATE (ACCOUNTS)', 'TRIPLICATE (SECURITY)', 'QUADRUPLICATE (STORE)'],
    defaultColors: ['#FFFFFF', '#FEF08A', '#FBCFE8', '#BAE6FD'],
  },
];

export const PrintPanel: React.FC = () => {
  const { docket, updateDocket } = useDocketStore();

  const handlePaperSizeChange = (size: PaperSize) => {
    updateDocket({ paperSize: size });
  };

  const handleNcrSelection = (option: typeof NCR_OPTIONS[0]) => {
    updateDocket({
      ncrParts: option.parts,
      ncrLabels: option.defaultLabels,
      ncrPaperColors: option.defaultColors,
    });
  };

  const updateNcrLabel = (index: number, label: string) => {
    const nextLabels = [...docket.ncrLabels];
    nextLabels[index] = label;
    updateDocket({ ncrLabels: nextLabels });
  };

  const totalSets = docket.isSerialized
    ? Math.max(1, (docket.endSerial - docket.startSerial + 1))
    : 1;
  const totalPages = totalSets * docket.ncrParts;

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Paper Size & Geometry */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Paper Dimensions & Standard Sizes</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PAPER_SIZES.map((ps) => (
            <div
              key={ps.id}
              onClick={() => handlePaperSizeChange(ps.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                docket.paperSize === ps.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{ps.name}</span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  {ps.dims}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{ps.desc}</p>
            </div>
          ))}
        </div>

        {/* Custom dimensions if chosen */}
        {docket.paperSize === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Width (mm)</label>
              <input
                type="number"
                min="50"
                max="500"
                value={docket.customWidthMm}
                onChange={(e) => updateDocket({ customWidthMm: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Height (mm)</label>
              <input
                type="number"
                min="50"
                max="700"
                value={docket.customHeightMm}
                onChange={(e) => updateDocket({ customHeightMm: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Print-Shop Geometry (Bleed, Trim Marks & Gutter) */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Scissors className="w-3.5 h-3.5 text-indigo-400" />
          <span>Commercial Press Marks & Bleed</span>
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-200">3mm Bleed Margin</p>
              <p className="text-[10px] text-slate-500">Commercial 3mm outer boundary beyond live cut area</p>
            </div>
            <input
              type="checkbox"
              checked={docket.hasBleed}
              onChange={(e) => updateDocket({ hasBleed: e.target.checked })}
              className="accent-indigo-500 h-4 w-4 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-200">L-Shaped Corner Crop Marks</p>
              <p className="text-[10px] text-slate-500">Exact 0.25pt hairlines guiding guillotine trimmer</p>
            </div>
            <input
              type="checkbox"
              checked={docket.hasCropMarks}
              onChange={(e) => updateDocket({ hasCropMarks: e.target.checked })}
              className="accent-indigo-500 h-4 w-4 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-200">Registration Crosshairs</p>
              <p className="text-[10px] text-slate-500">Target marks for offset printing plate alignment</p>
            </div>
            <input
              type="checkbox"
              checked={docket.hasRegistrationMarks}
              onChange={(e) => updateDocket({ hasRegistrationMarks: e.target.checked })}
              className="accent-indigo-500 h-4 w-4 rounded"
            />
          </div>

          {/* Binding & Perforation Gutter */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-200">Binding Gutter / Perforation Line</p>
                <p className="text-[10px] text-slate-500">Perforated tear-off margin for bookbinding</p>
              </div>
              <input
                type="checkbox"
                checked={docket.hasBindingGuides}
                onChange={(e) => updateDocket({ hasBindingGuides: e.target.checked })}
                className="accent-indigo-500 h-4 w-4 rounded"
              />
            </div>

            {docket.hasBindingGuides && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Binding Edge</label>
                  <select
                    value={docket.bindingEdge}
                    onChange={(e) => updateDocket({ bindingEdge: e.target.value as 'top' | 'left' })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="top">Top Edge (Standard Receipt Book)</option>
                    <option value="left">Left Edge (Side-Stitch / Spiral)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Gutter Width (mm)</label>
                  <input
                    type="number"
                    min="8"
                    max="35"
                    value={docket.bindingGutterMm}
                    onChange={(e) => updateDocket({ bindingGutterMm: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Run Mode & Mechanical Serialization */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Hash className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sequential Numbering & Print Run</span>
        </label>

        {/* Run Mode Radio */}
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={() => updateDocket({ isSerialized: false })}
            className={`p-3 rounded-lg border cursor-pointer text-center ${
              !docket.isSerialized
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            <p className="text-xs font-bold">Single Blank Sheet</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Unnumbered master print</p>
          </div>

          <div
            onClick={() => updateDocket({ isSerialized: true })}
            className={`p-3 rounded-lg border cursor-pointer text-center ${
              docket.isSerialized
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            <p className="text-xs font-bold">Serialized Print Run</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sequential numbering</p>
          </div>
        </div>

        {/* Serial Configuration */}
        {docket.isSerialized && (
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Start Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={docket.startSerial}
                  onChange={(e) => updateDocket({ startSerial: Math.max(1, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  End Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={docket.endSerial}
                  onChange={(e) => updateDocket({ endSerial: Math.max(1, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Prefix (Optional)
                </label>
                <input
                  type="text"
                  value={docket.serialPrefix}
                  onChange={(e) => updateDocket({ serialPrefix: e.target.value })}
                  placeholder="e.g. No. "
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Digit Padding
                </label>
                <select
                  value={docket.serialDigits}
                  onChange={(e) => updateDocket({ serialDigits: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                >
                  <option value={4}>4 Digits (0001)</option>
                  <option value={5}>5 Digits (00001)</option>
                  <option value={6}>6 Digits (000001)</option>
                </select>
              </div>
            </div>

            {/* Serial preview sample */}
            <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded border border-slate-800 text-xs">
              <span className="text-slate-400">Sample Stamp:</span>
              <span className="font-mono font-bold text-rose-500">
                {docket.serialPrefix}
                {String(docket.startSerial).padStart(docket.serialDigits, '0')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Carbonless Copy (NCR) Configurations */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Carbonless Copy (NCR) Configuration</span>
        </label>

        {/* 1, 2, 3, 4 parts selector */}
        <div className="grid grid-cols-2 gap-2">
          {NCR_OPTIONS.map((opt) => (
            <div
              key={opt.parts}
              onClick={() => handleNcrSelection(opt)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                docket.ncrParts === opt.parts
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{opt.title}</span>
                <div className="flex gap-1">
                  {opt.defaultColors.map((c, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</p>
            </div>
          ))}
        </div>

        {/* Custom NCR Labels */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-[11px] font-medium text-slate-400">
            Copy Labels for Each Part:
          </label>
          {Array.from({ length: docket.ncrParts }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-slate-600 flex-shrink-0"
                style={{ backgroundColor: docket.ncrPaperColors?.[idx] || '#FFFFFF' }}
              />
              <span className="text-[10px] font-mono text-slate-400 w-12">
                Part {idx + 1}:
              </span>
              <input
                type="text"
                value={docket.ncrLabels[idx] || ''}
                onChange={(e) => updateNcrLabel(idx, e.target.value.toUpperCase())}
                placeholder={`PART ${idx + 1} LABEL`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>

        {/* Total Page Count Calculation Summary */}
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] text-indigo-200 font-medium">Job Yield Calculation</p>
            <p className="text-[10px] text-indigo-300/70 font-mono">
              {totalSets} {totalSets === 1 ? 'Set' : 'Sets'} × {docket.ncrParts} {docket.ncrParts === 1 ? 'Part' : 'Parts'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white font-mono">{totalPages}</span>
            <span className="text-[10px] text-indigo-300 ml-1">Total Pages</span>
          </div>
        </div>
      </div>
    </div>
  );
};
