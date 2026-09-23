import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Download,
  Save,
  FolderOpen,
  Sparkles,
  User as UserIcon,
  LogOut,
  Coins,
  ChevronDown,
  Check,
  ShieldCheck,
  RotateCcw,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useDocketStore } from '../store/useDocketStore';
import { ALL_PRESETS } from '../lib/presets';

interface NavbarProps {
  onOpenPresets: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPresets, onOpenExport }) => {
  const {
    docket,
    updateDocket,
    user,
    userProfile,
    authLoading,
    signInGoogle,
    signInGuest,
    signOut,
    saveCurrentTemplate,
    saveStatusMessage,
    resetToDefault,
    setActiveTab,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocketStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  // Calculate total pages for export badge
  const totalPages = docket.isSerialized
    ? Math.max(1, (docket.endSerial - docket.startSerial + 1)) * docket.ncrParts
    : docket.ncrParts;

  return (
    <header className="h-15 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Left: Brand & Template Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center shadow-md shadow-indigo-900/30">
            <Printer className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white font-cinzel">
                DocketForge
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO PRINT
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Template Name Input */}
        <div className="relative group hidden sm:flex items-center">
          <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            id="template-name-input"
            type="text"
            value={docket.templateName}
            onChange={(e) => updateDocket({ templateName: e.target.value })}
            placeholder="Template Name..."
            className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 font-medium w-48 lg:w-64 focus:outline-none transition-all"
          />
        </div>

        {/* Presets Button */}
        <button
          id="open-presets-btn"
          onClick={onOpenPresets}
          className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Samples & Presets</span>
        </button>

        {/* Undo / Redo Control Group */}
        <div className="flex items-center bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
          <button
            id="undo-btn"
            onClick={undo}
            disabled={!canUndo}
            title={canUndo ? "Undo change (Ctrl+Z / Cmd+Z)" : "Nothing to undo"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              canUndo
                ? "text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer"
                : "text-slate-600 cursor-not-allowed opacity-40"
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Undo</span>
          </button>
          <div className="h-3.5 w-px bg-slate-800" />
          <button
            id="redo-btn"
            onClick={redo}
            disabled={!canRedo}
            title={canRedo ? "Redo change (Ctrl+Y / Cmd+Shift+Z)" : "Nothing to redo"}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              canRedo
                ? "text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer"
                : "text-slate-600 cursor-not-allowed opacity-40"
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Redo</span>
          </button>
        </div>

        {/* Reset Button */}
        <button
          id="reset-template-btn"
          onClick={resetToDefault}
          title="Reset to Default Preset"
          className="hidden lg:flex items-center gap-1 text-xs px-2 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Actions, Credits & User */}
      <div className="flex items-center gap-2.5">
        {/* Save Status Toast Indicator */}
        {saveStatusMessage && (
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded animate-pulse hidden md:inline">
            {saveStatusMessage}
          </span>
        )}

        {/* Save Button */}
        <button
          id="save-template-btn"
          onClick={saveCurrentTemplate}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Credits Indicator */}
        <div
          title="Print Run Credits"
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-950/80 border border-amber-500/30 text-amber-300 font-medium"
        >
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{userProfile?.credits ?? 50}</span>
          <span className="text-[10px] text-amber-400/70 hidden lg:inline">credits</span>
        </div>

        {/* User / Auth Menu */}
        <div className="relative">
          {user ? (
            <button
              id="user-profile-menu-btn"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 text-xs px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <span className="max-w-[100px] truncate text-slate-300 hidden md:inline">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                id="google-signin-btn"
                onClick={signInGoogle}
                disabled={authLoading}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Sign In</span>
              </button>

              <button
                id="guest-signin-btn"
                onClick={signInGuest}
                disabled={authLoading}
                title="Use Guest Session"
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1"
              >
                Guest
              </button>
            </div>
          )}

          {/* User dropdown */}
          {isUserMenuOpen && user && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-800 shadow-xl py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">{user.displayName || 'Printer Master'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Plan: {userProfile?.tier || 'PRO'}</span>
                  <span>{userProfile?.credits || 50} credits</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('saved');
                  setIsUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>My Saved Templates & Jobs</span>
              </button>

              <button
                onClick={() => {
                  signOut();
                  setIsUserMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Export Button */}
        <button
          id="open-export-modal-btn"
          onClick={onOpenExport}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Vector PDF</span>
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
            {totalPages}p
          </span>
        </button>
      </div>
    </header>
  );
};
