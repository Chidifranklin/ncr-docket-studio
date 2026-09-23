import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type {
  DocketTemplateData,
  ColumnSchema,
  UserProfile,
  ExportJobRecord,
} from '../types/docket';
import { DEFAULT_PRESET_MIKKY } from '../lib/presets';
import {
  auth,
  loginWithGoogle,
  loginAsGuest,
  logoutUser,
  syncUserProfile,
  saveTemplateToFirestore,
  fetchUserTemplates,
  deleteTemplateFromFirestore,
  fetchExportHistory,
  logExportJob,
  deductCredit,
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type LeftPanelTab = 'branding' | 'grid' | 'print' | 'saved';

const MAX_HISTORY_LIMIT = 35;
let lastPushTime = 0;

function cloneDocket(docket: DocketTemplateData): DocketTemplateData {
  return JSON.parse(JSON.stringify(docket));
}

interface DocketStoreState {
  // Active Template
  docket: DocketTemplateData;
  activeTab: LeftPanelTab;
  zoomLevel: number; // 50, 75, 100, 125, or fit (e.g. 90)
  autoFitZoom: boolean;
  activePartIndex: number; // for multi-part NCR preview (0 = original, 1 = duplicate, etc)
  activeSetNumber: number; // for serialized run preview (e.g. set 1, set 2...)

  // History State for Undo / Redo
  past: DocketTemplateData[];
  future: DocketTemplateData[];
  canUndo: boolean;
  canRedo: boolean;

  // Auth & Profile
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;

  // Cloud Persistence
  savedTemplates: DocketTemplateData[];
  exportHistory: ExportJobRecord[];
  isLoadingTemplates: boolean;
  saveStatusMessage: string | null;

  // Export Pipeline
  isExportModalOpen: boolean;
  isExporting: boolean;
  exportProgress: {
    current: number;
    total: number;
    message: string;
  };
  lastExportedBlobUrl: string | null;

  // Actions
  setActiveTab: (tab: LeftPanelTab) => void;
  setZoomLevel: (zoom: number) => void;
  setAutoFitZoom: (fit: boolean) => void;
  setActivePartIndex: (idx: number) => void;
  setActiveSetNumber: (num: number) => void;
  updateDocket: (partial: Partial<DocketTemplateData>, forceHistory?: boolean) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Column schema operations
  addColumn: () => void;
  deleteColumn: (id: string) => void;
  updateColumn: (id: string, partial: Partial<ColumnSchema>) => void;
  reorderColumn: (id: string, direction: 'up' | 'down') => void;

  // Templates & Presets
  loadTemplate: (template: DocketTemplateData) => void;
  resetToDefault: () => void;
  saveCurrentTemplate: () => Promise<void>;
  deleteSavedTemplate: (id: string) => Promise<void>;
  refreshSavedTemplates: () => Promise<void>;
  refreshExportHistory: () => Promise<void>;

  // Auth actions
  initAuthListener: () => () => void;
  signInGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;

  // Export dialog
  setExportModalOpen: (open: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (current: number, total: number, message: string) => void;
  recordExportSuccess: (blobUrl: string, totalPages: number) => Promise<void>;
}

export const useDocketStore = create<DocketStoreState>((set, get) => ({
  docket: { ...DEFAULT_PRESET_MIKKY },
  activeTab: 'branding',
  zoomLevel: 100,
  autoFitZoom: true,
  activePartIndex: 0,
  activeSetNumber: 1,

  // History State Initialization
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  user: null,
  userProfile: null,
  authLoading: true,

  savedTemplates: [],
  exportHistory: [],
  isLoadingTemplates: false,
  saveStatusMessage: null,

  isExportModalOpen: false,
  isExporting: false,
  exportProgress: { current: 0, total: 1, message: '' },
  lastExportedBlobUrl: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom, autoFitZoom: false }),
  setAutoFitZoom: (fit) => set({ autoFitZoom: fit }),
  setActivePartIndex: (idx) => set({ activePartIndex: idx }),
  setActiveSetNumber: (num) => set({ activeSetNumber: num }),

  updateDocket: (partial, forceHistory = false) => {
    const current = get().docket;
    const now = Date.now();

    // Check if anything in partial actually changes the docket
    let isDifferent = false;
    for (const key of Object.keys(partial) as (keyof DocketTemplateData)[]) {
      if (JSON.stringify(partial[key]) !== JSON.stringify(current[key])) {
        isDifferent = true;
        break;
      }
    }
    if (!isDifferent) return;

    set((state) => {
      let newPast = state.past;
      // Capture snapshot if forced or if beyond debounce interval or first change
      if (forceHistory || now - lastPushTime > 600 || state.past.length === 0) {
        newPast = [...state.past, cloneDocket(state.docket)];
        if (newPast.length > MAX_HISTORY_LIMIT) {
          newPast.shift();
        }
        lastPushTime = now;
      }

      return {
        docket: { ...state.docket, ...partial },
        past: newPast,
        future: [], // fresh modification clears redo buffer
        canUndo: newPast.length > 0,
        canRedo: false,
      };
    });
  },

  undo: () => {
    const { past, future, docket } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const newFuture = [cloneDocket(docket), ...future];

    lastPushTime = 0; // reset debounce tracker
    set({
      docket: cloneDocket(previous),
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { past, future, docket } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past, cloneDocket(docket)];
    if (newPast.length > MAX_HISTORY_LIMIT) {
      newPast.shift();
    }

    lastPushTime = 0;
    set({
      docket: cloneDocket(next),
      past: newPast,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
  },

  clearHistory: () => {
    set({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },

  addColumn: () =>
    set((state) => {
      const newPast = [...state.past, cloneDocket(state.docket)];
      if (newPast.length > MAX_HISTORY_LIMIT) newPast.shift();
      lastPushTime = Date.now();

      const newId = `col_${Date.now()}`;
      const newCol: ColumnSchema = {
        id: newId,
        label: 'NEW COL',
        widthPercent: 15,
        align: 'left',
      };
      return {
        docket: {
          ...state.docket,
          columns: [...state.docket.columns, newCol],
        },
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  deleteColumn: (id) =>
    set((state) => {
      if (state.docket.columns.length <= 1) return state;
      const newPast = [...state.past, cloneDocket(state.docket)];
      if (newPast.length > MAX_HISTORY_LIMIT) newPast.shift();
      lastPushTime = Date.now();

      return {
        docket: {
          ...state.docket,
          columns: state.docket.columns.filter((c) => c.id !== id),
        },
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  updateColumn: (id, partial) =>
    set((state) => {
      const now = Date.now();
      let newPast = state.past;
      if (now - lastPushTime > 600 || state.past.length === 0) {
        newPast = [...state.past, cloneDocket(state.docket)];
        if (newPast.length > MAX_HISTORY_LIMIT) newPast.shift();
        lastPushTime = now;
      }
      return {
        docket: {
          ...state.docket,
          columns: state.docket.columns.map((col) =>
            col.id === id ? { ...col, ...partial } : col
          ),
        },
        past: newPast,
        future: [],
        canUndo: newPast.length > 0,
        canRedo: false,
      };
    }),

  reorderColumn: (id, direction) =>
    set((state) => {
      const cols = [...state.docket.columns];
      const idx = cols.findIndex((c) => c.id === id);
      if (idx === -1) return state;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= cols.length) return state;

      const newPast = [...state.past, cloneDocket(state.docket)];
      if (newPast.length > MAX_HISTORY_LIMIT) newPast.shift();
      lastPushTime = Date.now();

      const temp = cols[idx];
      cols[idx] = cols[targetIdx];
      cols[targetIdx] = temp;
      return {
        docket: { ...state.docket, columns: cols },
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  loadTemplate: (template) =>
    set((state) => {
      const newPast = [...state.past, cloneDocket(state.docket)];
      if (newPast.length > MAX_HISTORY_LIMIT) newPast.shift();
      lastPushTime = Date.now();

      return {
        docket: cloneDocket(template),
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
        activePartIndex: 0,
        activeSetNumber: 1,
      };
    }),

  resetToDefault: () =>
    set((state) => {
      const newPast = [...state.past, cloneDocket(state.docket)];
      if (newPast.length > MAX_HISTORY_LIMIT) newPast.shift();
      lastPushTime = Date.now();

      return {
        docket: cloneDocket(DEFAULT_PRESET_MIKKY),
        past: newPast,
        future: [],
        canUndo: true,
        canRedo: false,
        activePartIndex: 0,
        activeSetNumber: 1,
      };
    }),

  saveCurrentTemplate: async () => {
    const { user, docket, refreshSavedTemplates } = get();
    if (!user) {
      set({ saveStatusMessage: 'Please sign in to save your templates.' });
      setTimeout(() => set({ saveStatusMessage: null }), 3000);
      return;
    }

    try {
      set({ saveStatusMessage: 'Saving template to cloud...' });
      const savedId = await saveTemplateToFirestore(user.uid, docket);
      set((state) => ({
        docket: { ...state.docket, id: savedId },
        saveStatusMessage: 'Template saved successfully!',
      }));
      await refreshSavedTemplates();
      setTimeout(() => set({ saveStatusMessage: null }), 3000);
    } catch (err: any) {
      console.error('Save failed:', err);
      set({ saveStatusMessage: 'Error saving template: ' + (err.message || 'Check connection') });
      setTimeout(() => set({ saveStatusMessage: null }), 4000);
    }
  },

  deleteSavedTemplate: async (templateId) => {
    const { user, refreshSavedTemplates } = get();
    if (!user) return;
    try {
      await deleteTemplateFromFirestore(user.uid, templateId);
      await refreshSavedTemplates();
    } catch (err) {
      console.error('Delete template failed:', err);
    }
  },

  refreshSavedTemplates: async () => {
    const { user } = get();
    if (!user) {
      set({ savedTemplates: [] });
      return;
    }
    set({ isLoadingTemplates: true });
    try {
      const list = await fetchUserTemplates(user.uid);
      set({ savedTemplates: list, isLoadingTemplates: false });
    } catch (e) {
      set({ isLoadingTemplates: false });
    }
  },

  refreshExportHistory: async () => {
    const { user } = get();
    if (!user) {
      set({ exportHistory: [] });
      return;
    }
    try {
      const history = await fetchExportHistory(user.uid);
      set({ exportHistory: history });
    } catch (e) {
      console.error('Fetch export history error:', e);
    }
  },

  initAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          set({ user: currentUser, userProfile: profile, authLoading: false });
          get().refreshSavedTemplates();
          get().refreshExportHistory();
        } catch (e) {
          console.error('Sync profile failed on state change:', e);
          set({ user: currentUser, authLoading: false });
        }
      } else {
        set({ user: null, userProfile: null, authLoading: false, savedTemplates: [] });
      }
    });
    return unsubscribe;
  },

  signInGoogle: async () => {
    set({ authLoading: true });
    try {
      const user = await loginWithGoogle();
      const profile = await syncUserProfile(user);
      set({ user, userProfile: profile, authLoading: false });
      get().refreshSavedTemplates();
      get().refreshExportHistory();
    } catch (e) {
      console.error('Sign-in error:', e);
      set({ authLoading: false });
    }
  },

  signInGuest: async () => {
    set({ authLoading: true });
    try {
      const user = await loginAsGuest();
      const profile = await syncUserProfile(user);
      set({ user, userProfile: profile, authLoading: false });
      get().refreshSavedTemplates();
      get().refreshExportHistory();
    } catch (e) {
      console.error('Guest sign-in error:', e);
      set({ authLoading: false });
    }
  },

  signOut: async () => {
    await logoutUser();
    set({ user: null, userProfile: null, savedTemplates: [], exportHistory: [] });
  },

  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (current, total, message) =>
    set({ exportProgress: { current, total, message } }),

  recordExportSuccess: async (blobUrl, totalPages) => {
    const { user, docket, refreshExportHistory } = get();
    set({ lastExportedBlobUrl: blobUrl });

    if (user) {
      try {
        await logExportJob(user.uid, {
          userId: user.uid,
          templateId: docket.id || 'current',
          templateName: docket.templateName || 'Custom Docket',
          paperSize: docket.paperSize,
          totalPageCount: totalPages,
          isSerialized: docket.isSerialized,
          startSerial: docket.isSerialized ? docket.startSerial : undefined,
          endSerial: docket.isSerialized ? docket.endSerial : undefined,
          ncrParts: docket.ncrParts,
          status: 'COMPLETED',
        });
        const remainingCredits = await deductCredit(user.uid, 1);
        set((state) => ({
          userProfile: state.userProfile ? { ...state.userProfile, credits: remainingCredits } : null,
        }));
        await refreshExportHistory();
      } catch (e) {
        console.warn('Logging export failed:', e);
      }
    }
  },
}));
