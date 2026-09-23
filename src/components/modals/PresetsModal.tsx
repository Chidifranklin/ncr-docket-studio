import React from 'react';
import { X, Sparkles, Check, ArrowRight, Layers, FileText } from 'lucide-react';
import { ALL_PRESETS } from '../../lib/presets';
import { useDocketStore } from '../../store/useDocketStore';
import type { DocketTemplateData } from '../../types/docket';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({ isOpen, onClose }) => {
  const { loadTemplate } = useDocketStore();

  if (!isOpen) return null;

  const handleSelectPreset = (preset: DocketTemplateData) => {
    loadTemplate(preset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Commercial Docket Stationery Presets</h2>
              <p className="text-[11px] text-slate-400">
                Instantly load calibrated templates for receipts, sales dockets, and waybills
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presets Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          {ALL_PRESETS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              className="bg-slate-950 rounded-xl p-4 border border-slate-800 hover:border-indigo-500/80 hover:bg-slate-900/90 transition-all cursor-pointer flex flex-col justify-between group space-y-3 relative"
            >
              {idx === 0 && (
                <div className="absolute -top-2.5 right-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  New Sample Preset
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{ backgroundColor: `${preset.primaryColor}25`, color: preset.accentColor }}
                    className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-current"
                  >
                    {preset.paperSize} • {preset.ncrParts}-Part
                  </span>
                  <div className="flex gap-1">
                    {preset.ncrPaperColors?.slice(0, preset.ncrParts).map((c, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-slate-600 shadow-xs"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                  {preset.businessName}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {preset.tagline || preset.templateName}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-500">
                  <p>• {preset.columns.length} Table Columns {preset.hasAmountKoboSplit ? '(₦/Kobo Split)' : ''}</p>
                  <p>• {preset.rowCount} Ruled Rows</p>
                  <p>• Format: {preset.documentTitle || preset.templateName}</p>
                </div>
              </div>

              <button className="w-full py-1.5 px-3 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors">
                <span>Apply Template</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 text-right">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
