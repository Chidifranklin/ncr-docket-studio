import React, { useEffect } from 'react';
import {
  FolderOpen,
  History,
  Trash2,
  Calendar,
  CheckCircle2,
  FileText,
  RefreshCw,
  LogIn,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';

export const SavedTemplatesPanel: React.FC = () => {
  const {
    user,
    savedTemplates,
    exportHistory,
    isLoadingTemplates,
    loadTemplate,
    deleteSavedTemplate,
    refreshSavedTemplates,
    refreshExportHistory,
    signInGoogle,
  } = useDocketStore();

  useEffect(() => {
    if (user) {
      refreshSavedTemplates();
      refreshExportHistory();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="bg-slate-900/90 rounded-xl p-6 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FolderOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Firestore Cloud Persistence</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Sign in with your Google account to save custom docket templates, access saved layouts, and review print run histories.
          </p>
        </div>
        <button
          onClick={signInGoogle}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Saved Templates */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Saved Cloud Templates</span>
          </div>
          <button
            onClick={() => refreshSavedTemplates()}
            disabled={isLoadingTemplates}
            title="Refresh templates"
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {savedTemplates.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg">
            <FileText className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">No saved templates in your cloud library yet.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Click "Save" in the top bar to store your active docket layout.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800/90 hover:border-slate-700 flex items-center justify-between gap-3 group transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {tpl.templateName || 'Untitled Template'}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {tpl.paperSize}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {tpl.businessName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {tpl.ncrParts}-Part NCR • {tpl.columns?.length || 4} Columns • {tpl.rowCount} Rows
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => loadTemplate(tpl)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium"
                  >
                    <span>Load</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => tpl.id && deleteSavedTemplate(tpl.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-900"
                    title="Delete Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Export History */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Export History</span>
          </div>
          <button
            onClick={() => refreshExportHistory()}
            title="Refresh history"
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {exportHistory.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-800 rounded-lg">
            <p className="text-xs text-slate-500">No export jobs recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {exportHistory.map((job) => (
              <div
                key={job.id}
                className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-medium text-slate-200">{job.templateName}</p>
                  <p className="text-[10px] text-slate-400">
                    {job.totalPageCount} Pages ({job.paperSize}) • {job.ncrParts}-Part
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Success</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
