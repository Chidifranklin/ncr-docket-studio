import React, { useEffect, useState } from 'react';
import {
  Building2,
  Table2,
  Scissors,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { BrandingPanel } from './components/panels/BrandingPanel';
import { GridPanel } from './components/panels/GridPanel';
import { PrintPanel } from './components/panels/PrintPanel';
import { SavedTemplatesPanel } from './components/panels/SavedTemplatesPanel';
import { DocketCanvas } from './components/preview/DocketCanvas';
import { ExportModal } from './components/modals/ExportModal';
import { PresetsModal } from './components/modals/PresetsModal';
import { useDocketStore, type LeftPanelTab } from './store/useDocketStore';

export default function App() {
  const {
    activeTab,
    setActiveTab,
    isExportModalOpen,
    setExportModalOpen,
    initAuthListener,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocketStore();

  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(true);

  // Initialize Firebase auth observer on component mount
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  // Global Undo / Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (!modifier) return;

      const target = e.target as HTMLElement | null;
      const isTextInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Redo: (Ctrl/Cmd + Y) OR (Ctrl/Cmd + Shift + Z)
      if (
        (!e.shiftKey && e.key.toLowerCase() === 'y') ||
        (e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
        return;
      }

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (!e.shiftKey && e.key.toLowerCase() === 'z') {
        // If focused in a text input, prioritize native input undo
        if (isTextInput) return;

        if (canUndo) {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const navTabs: Array<{ id: LeftPanelTab; label: string; icon: React.ReactNode }> = [
    { id: 'branding', label: 'Branding', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'grid', label: 'Grid & Layout', icon: <Table2 className="w-3.5 h-3.5" /> },
    { id: 'print', label: 'Print & Run', icon: <Scissors className="w-3.5 h-3.5" /> },
    { id: 'saved', label: 'Saved Library', icon: <FolderOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
      />

      {/* Main Workspace Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Controls Configuration Panel */}
        <aside
          className={`w-full md:w-[420px] lg:w-[460px] flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-20 transition-all duration-200 ${
            isMobilePanelOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Panel Tab Navigation Bar */}
          <div className="flex border-b border-slate-800 bg-slate-900/90 p-1 gap-1 select-none">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Panel Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'branding' && <BrandingPanel />}
            {activeTab === 'grid' && <GridPanel />}
            {activeTab === 'print' && <PrintPanel />}
            {activeTab === 'saved' && <SavedTemplatesPanel />}
          </div>
        </aside>

        {/* Mobile Toggle Bar */}
        <div className="md:hidden absolute bottom-4 left-4 z-30">
          <button
            onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
            className="p-3 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Interactive Preview Canvas */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <DocketCanvas />
        </main>
      </div>

      {/* Export Pipeline Dialog */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* Pre-flight Presets Dialog */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
      />
    </div>
  );
}
