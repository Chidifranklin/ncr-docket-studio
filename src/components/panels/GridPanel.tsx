import React from 'react';
import {
  Table2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Shield,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileCheck,
  Percent,
} from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';
import type { SecurityPatternType } from '../../types/docket';

const SECURITY_PATTERNS: Array<{ id: SecurityPatternType; label: string; desc: string }> = [
  { id: 'guilloche_wave', label: 'Guilloche Wave', desc: 'Harmonic sine/cos security waves' },
  { id: 'guilloche_rosette', label: 'Guilloche Rosette', desc: 'Spirograph security medallion' },
  { id: 'banknote_lattice', label: 'Banknote Lattice', desc: 'Fine banknote micro-guilloche mesh' },
  { id: 'geometric_diamond', label: 'Security Diamonds', desc: 'Precision vector diamond crosshatch' },
  { id: 'security_rings', label: 'Wavy Security Rings', desc: 'Concentric undulated ripples' },
  { id: 'none', label: 'None (Plain)', desc: 'Clean white background' },
];

export const GridPanel: React.FC = () => {
  const {
    docket,
    updateDocket,
    addColumn,
    deleteColumn,
    updateColumn,
    reorderColumn,
  } = useDocketStore();

  const totalColPercent = docket.columns.reduce((sum, c) => sum + (c.widthPercent || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Columns Management */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Table Columns Schema</span>
          </div>
          <button
            id="add-column-btn"
            onClick={addColumn}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Column</span>
          </button>
        </div>

        {/* Columns list */}
        <div className="space-y-2.5">
          {docket.columns.map((col, idx) => (
            <div
              key={col.id}
              className="bg-slate-950 p-3 rounded-lg border border-slate-800/90 space-y-2"
            >
              <div className="flex items-center gap-2">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => reorderColumn(col.id, 'up')}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30 p-0.5"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={idx === docket.columns.length - 1}
                    onClick={() => reorderColumn(col.id, 'down')}
                    className="text-slate-500 hover:text-slate-300 disabled:opacity-30 p-0.5"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Column Label */}
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) => updateColumn(col.id, { label: e.target.value.toUpperCase() })}
                  placeholder="COLUMN LABEL"
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                />

                {/* Alignment Toggles */}
                <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
                  <button
                    onClick={() => updateColumn(col.id, { align: 'left' })}
                    title="Align Left"
                    className={`p-1 rounded ${col.align === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <AlignLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => updateColumn(col.id, { align: 'center' })}
                    title="Align Center"
                    className={`p-1 rounded ${col.align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <AlignCenter className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => updateColumn(col.id, { align: 'right' })}
                    title="Align Right"
                    className={`p-1 rounded ${col.align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <AlignRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Delete Column */}
                <button
                  disabled={docket.columns.length <= 1}
                  onClick={() => deleteColumn(col.id)}
                  className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Width Slider */}
              <div className="flex items-center gap-3 pt-0.5">
                <span className="text-[10px] text-slate-400 w-16">Width %:</span>
                <input
                  type="range"
                  min="5"
                  max="70"
                  value={col.widthPercent}
                  onChange={(e) => updateColumn(col.id, { widthPercent: Number(e.target.value) })}
                  className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-300 w-10 text-right">
                  {col.widthPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total width verification */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">Total Relative Column Width:</span>
          <span
            className={`font-mono font-semibold ${
              totalColPercent === 100 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {totalColPercent}% {totalColPercent !== 100 && '(auto-balanced in print)'}
          </span>
        </div>
      </div>

      {/* 2. Row Count & Grid Spacing */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Table Rows & Ruled Height</span>
        </label>

        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Number of Ruled Rows:</span>
            <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {docket.rowCount} Rows
            </span>
          </div>
          <input
            id="row-count-slider"
            type="range"
            min="6"
            max="22"
            step="1"
            value={docket.rowCount}
            onChange={(e) => updateDocket({ rowCount: Number(e.target.value) })}
            className="w-full accent-indigo-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>6 (Compact / A6)</span>
            <span>12 (Standard A5)</span>
            <span>22 (Extended A4)</span>
          </div>
        </div>
      </div>

      {/* 3. Security Micro-Pattern & Guilloche */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Vector Security Micro-Pattern</span>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
            Anti-Counterfeit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECURITY_PATTERNS.map((p) => (
            <div
              key={p.id}
              onClick={() => updateDocket({ securityPattern: p.id })}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                docket.securityPattern === p.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <p className="text-xs font-medium">{p.label}</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Pattern Opacity */}
        {docket.securityPattern !== 'none' && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">Security Pattern Opacity:</span>
              <span className="font-mono text-slate-200">
                {Math.round(docket.patternOpacity * 100)}%
              </span>
            </div>
            <input
              id="pattern-opacity-slider"
              type="range"
              min="0.05"
              max="0.35"
              step="0.01"
              value={docket.patternOpacity}
              onChange={(e) => updateDocket({ patternOpacity: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Subtle (10-18%) recommended for maximum handwriting legibility on carbonless copy
            </p>
          </div>
        )}
      </div>

      {/* 4. Customer Header & Lower Stationery Sections */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Fields & Signatures</span>
        </label>

        <div className="space-y-2.5">
          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Include Customer Address Line</span>
            <input
              type="checkbox"
              checked={docket.includeCustomerAddress}
              onChange={(e) => updateDocket({ includeCustomerAddress: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Include Customer Phone Line</span>
            <input
              type="checkbox"
              checked={docket.includeCustomerPhone}
              onChange={(e) => updateDocket({ includeCustomerPhone: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Include Payment Checkboxes (Cash / POS / Transfer)</span>
            <input
              type="checkbox"
              checked={docket.includePaymentMethod}
              onChange={(e) => updateDocket({ includePaymentMethod: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Split Amount Column (₦ / Kobo)</span>
            <input
              type="checkbox"
              checked={docket.hasAmountKoboSplit || false}
              onChange={(e) => updateDocket({ hasAmountKoboSplit: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Date Box Format ([D][M][Y] Blocks)</span>
            <input
              type="checkbox"
              checked={docket.dateFormat === 'boxes'}
              onChange={(e) => updateDocket({ dateFormat: e.target.checked ? 'boxes' : 'line' })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Include "Amount in Words" Underline</span>
            <input
              type="checkbox"
              checked={docket.includeAmountInWords}
              onChange={(e) => updateDocket({ includeAmountInWords: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Include TOTAL Summary Box</span>
            <input
              type="checkbox"
              checked={docket.includeTotalBox}
              onChange={(e) => updateDocket({ includeTotalBox: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs cursor-pointer">
            <span className="text-slate-300">Three-Party Signatures (Cashier / Supplier / Company)</span>
            <input
              type="checkbox"
              checked={docket.includeThreeSignatures || false}
              onChange={(e) => updateDocket({ includeThreeSignatures: e.target.checked })}
              className="accent-indigo-500 rounded"
            />
          </label>

          {!docket.includeThreeSignatures && (
            <>
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-300">Include Customer Signature Area</span>
                <input
                  type="checkbox"
                  checked={docket.includeCustomerSignature}
                  onChange={(e) => updateDocket({ includeCustomerSignature: e.target.checked })}
                  className="accent-indigo-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-300">Include Authorized Manager Signature</span>
                <input
                  type="checkbox"
                  checked={docket.includeAuthorizedSignature}
                  onChange={(e) => updateDocket({ includeAuthorizedSignature: e.target.checked })}
                  className="accent-indigo-500 rounded"
                />
              </label>
            </>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Footer Legal Terms / Disclaimer Notice
          </label>
          <textarea
            rows={2}
            value={docket.footerDisclaimer}
            onChange={(e) => updateDocket({ footerDisclaimer: e.target.value })}
            placeholder="e.g. Goods sold & received in good condition are not returnable."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
