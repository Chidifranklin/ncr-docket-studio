import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  FileCheck,
  Layers,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';
import { generateDocketPdf } from '../../lib/pdfGenerator';
import { getPaperDimensionsMm } from '../../lib/printDimensions';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const {
    docket,
    user,
    userProfile,
    isExporting,
    setExporting,
    exportProgress,
    setExportProgress,
    recordExportSuccess,
  } = useDocketStore();

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedPagesCount, setGeneratedPagesCount] = useState<number>(0);

  if (!isOpen) return null;

  const dimsMm = getPaperDimensionsMm(
    docket.paperSize,
    docket.customWidthMm,
    docket.customHeightMm
  );

  const totalSets = docket.isSerialized
    ? Math.max(1, (docket.endSerial - docket.startSerial + 1))
    : 1;
  const totalPages = totalSets * docket.ncrParts;

  const handleStartExport = async (overrideSinglePage = false) => {
    setExporting(true);
    setErrorMessage(null);
    setDownloadUrl(null);
    setExportProgress(0, totalPages, 'Initializing vector PDF engine...');

    try {
      const result = await generateDocketPdf({
        template: docket,
        overrideSinglePage,
        onProgress: (curr, total, msg) => {
          setExportProgress(curr, total, msg);
        },
      });

      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);
      setDownloadFileName(result.fileName);
      setGeneratedPagesCount(result.totalPages);

      // Record to Firestore & deduct credit
      await recordExportSuccess(url, result.totalPages);

      // Auto-trigger direct browser download for convenience
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setErrorMessage(err.message || 'Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const progressPercent = exportProgress.total > 0
    ? Math.round((exportProgress.current / exportProgress.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Commercial Vector PDF Export</h2>
              <p className="text-[11px] text-slate-400">Pure vector lines, text & registration marks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Pre-flight Specs Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Template:</span>
              <span className="font-semibold text-white truncate max-w-[240px]">
                {docket.templateName || 'Custom Docket'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[11px]">Paper Size</span>
                <p className="font-mono text-slate-200 font-semibold">
                  {docket.paperSize} ({dimsMm.width} × {dimsMm.height} mm)
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Bleed & Crops</span>
                <p className="font-mono text-slate-200">
                  {docket.hasBleed ? '3mm Bleed' : 'No Bleed'}, {docket.hasCropMarks ? 'Trim Marks' : 'No Crops'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Carbonless Parts</span>
                <p className="font-mono text-slate-200">
                  {docket.ncrParts}-Part ({docket.ncrParts === 1 ? 'Single' : docket.ncrParts === 2 ? 'Duplicate' : docket.ncrParts === 3 ? 'Triplicate' : 'Quadruplicate'})
                </p>
              </div>

              <div>
                <span className="text-slate-500 text-[11px]">Sequential Run</span>
                <p className="font-mono text-rose-400 font-semibold">
                  {docket.isSerialized
                    ? `${docket.serialPrefix}${docket.startSerial} → ${docket.endSerial}`
                    : 'Unnumbered Master'}
                </p>
              </div>
            </div>

            {/* Total Page Calculation Bar */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                <Layers className="w-3.5 h-3.5" />
                <span>Print Yield:</span>
              </div>
              <span className="text-sm font-bold text-white font-mono">
                {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} ({totalSets} Sets)
              </span>
            </div>
          </div>

          {/* Quality Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <p className="text-[11px] leading-relaxed">
              <strong>Print-Shop Ready:</strong> 100% Vector PDF rendered using raw PDF graphic operations. Zero pixelation, true 0.25pt hairlines, and authentic mechanical numbering fonts.
            </p>
          </div>

          {/* Progress Bar (during export) */}
          {isExporting && (
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-300 font-medium animate-pulse">
                  {exportProgress.message}
                </span>
                <span className="font-mono text-white font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-rose-500 h-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Processed in high-speed batches to guarantee vector accuracy and memory safety.
              </p>
            </div>
          )}

          {/* Success Download Card */}
          {downloadUrl && !isExporting && (
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-xs">Export Completed Successfully!</span>
              </div>
              <p className="text-xs text-slate-300">
                Generated {generatedPagesCount} vector pages for <strong>{downloadFileName}</strong>.
              </p>
              <a
                href={downloadUrl}
                download={downloadFileName}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Re-Download Vector PDF</span>
              </a>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={() => handleStartExport(true)}
            disabled={isExporting}
            className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors disabled:opacity-40"
          >
            Export Single Test Sheet
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="text-xs px-3 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              id="confirm-generate-pdf-btn"
              onClick={() => handleStartExport(false)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generate Full Run ({totalPages} Pages)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
