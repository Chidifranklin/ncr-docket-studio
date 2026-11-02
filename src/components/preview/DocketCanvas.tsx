import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Printer,
  Eye,
  ShieldCheck,
  Check,
  Undo2,
  Redo2,
  MoveHorizontal,
  MousePointerClick,
  RotateCcw,
} from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';
import { getPaperDimensionsMm } from '../../lib/printDimensions';
import {
  generateHarmonicGuillocheWavePaths,
  generateGuillocheRosettePath,
  generateSecurityWavyRings,
} from '../../lib/guilloche';
import { getHeaderFontFamily, getBodyFontFamily } from '../../lib/fonts';
import { ResizableFieldWrapper } from './ResizableFieldWrapper';

export const DocketCanvas: React.FC = () => {
  const {
    docket,
    updateDocket,
    zoomLevel,
    setZoomLevel,
    autoFitZoom,
    setAutoFitZoom,
    activePartIndex,
    setActivePartIndex,
    activeSetNumber,
    setActiveSetNumber,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocketStore();

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [resizeModeActive, setResizeModeActive] = useState<boolean>(true);

  // Column divider drag state
  const [draggingColIndex, setDraggingColIndex] = useState<number | null>(null);
  const [liveColPct, setLiveColPct] = useState<{ leftPct: number; rightPct: number } | null>(null);
  const colDragRef = useRef<{
    colIndex: number;
    startX: number;
    tableWidth: number;
    startLeftPct: number;
    startRightPct: number;
  } | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  // Table row height drag state
  const [isDraggingRowHeight, setIsDraggingRowHeight] = useState(false);
  const [liveRowHeight, setLiveRowHeight] = useState<number | null>(null);
  const rowDragRef = useRef<{
    startY: number;
    startRowHeight: number;
  } | null>(null);

  const headerFontFamily = useMemo(() => getHeaderFontFamily(docket.headerFont), [docket.headerFont]);
  const bodyFontFamily = useMemo(() => getBodyFontFamily(docket.bodyFont), [docket.bodyFont]);

  // Paper dimensions
  const dimsMm = useMemo(() => {
    return getPaperDimensionsMm(
      docket.paperSize,
      docket.customWidthMm,
      docket.customHeightMm
    );
  }, [docket.paperSize, docket.customWidthMm, docket.customHeightMm]);

  // Aspect ratio calculation
  const aspectRatio = dimsMm.width / dimsMm.height;

  // Base canvas dimension in virtual CSS mm:
  // We use standard A5 (148mm) or scale proportionally so height is ~210mm
  const canvasWidthMm = dimsMm.width;
  const canvasHeightMm = dimsMm.height;

  // Serial Number computation for preview
  const currentSerialNum = docket.isSerialized
    ? docket.startSerial + (activeSetNumber - 1)
    : 1;

  const serialString = docket.isSerialized
    ? `${docket.serialPrefix}${String(currentSerialNum).padStart(docket.serialDigits, '0')}`
    : 'SAMPLE';

  // Active NCR copy label and paper tint
  const activePartLabel = docket.ncrLabels[activePartIndex] || (activePartIndex === 0 ? 'ORIGINAL' : `COPY ${activePartIndex + 1}`);
  const paperBgColor = docket.ncrPaperColors?.[activePartIndex] || '#FFFFFF';

  // Total sets in serialized run
  const totalSets = docket.isSerialized
    ? Math.max(1, (docket.endSerial - docket.startSerial + 1))
    : 1;
  const totalPages = totalSets * docket.ncrParts;
  const currentPageOverall = (activeSetNumber - 1) * docket.ncrParts + (activePartIndex + 1);

  // Guilloche paths for current dimensions
  const guillocheWaves = useMemo(() => {
    if (docket.securityPattern === 'guilloche_wave') {
      return generateHarmonicGuillocheWavePaths(dimsMm.width * 3.78, dimsMm.height * 2, 7);
    }
    return [];
  }, [docket.securityPattern, dimsMm.width, dimsMm.height]);

  const rosettePath = useMemo(() => {
    if (docket.securityPattern === 'guilloche_rosette') {
      return generateGuillocheRosettePath(180, 200, 75, 25, 45, 16);
    }
    return '';
  }, [docket.securityPattern]);

  const wavyRings = useMemo(() => {
    if (docket.securityPattern === 'security_rings') {
      return generateSecurityWavyRings(180, 200, 6);
    }
    return [];
  }, [docket.securityPattern]);

  // Zoom scaling factor
  const scale = zoomLevel / 100;

  // Deselect on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFieldId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Column divider drag handler
  const handleColDividerDragStart = (e: React.PointerEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const tableWidthPx = tableRect.width / (scale || 1);

    const leftCol = docket.columns[colIndex];
    const rightCol = docket.columns[colIndex + 1];
    if (!leftCol || !rightCol) return;

    colDragRef.current = {
      colIndex,
      startX: e.clientX,
      tableWidth: tableWidthPx,
      startLeftPct: leftCol.widthPercent,
      startRightPct: rightCol.widthPercent,
    };

    setDraggingColIndex(colIndex);
    setLiveColPct({ leftPct: leftCol.widthPercent, rightPct: rightCol.widthPercent });
  };

  useEffect(() => {
    if (draggingColIndex === null) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!colDragRef.current) return;
      const { colIndex, startX, tableWidth, startLeftPct, startRightPct } = colDragRef.current;
      const deltaX = (e.clientX - startX) / (scale || 1);
      const deltaPct = Math.round((deltaX / tableWidth) * 100);

      const minPct = 5;
      const maxDeltaLeft = startRightPct - minPct;
      const minDeltaLeft = -(startLeftPct - minPct);
      const clampedDelta = Math.min(maxDeltaLeft, Math.max(minDeltaLeft, deltaPct));

      const newLeftPct = startLeftPct + clampedDelta;
      const newRightPct = startRightPct - clampedDelta;

      setLiveColPct({ leftPct: newLeftPct, rightPct: newRightPct });

      const newColumns = docket.columns.map((c, idx) => {
        if (idx === colIndex) return { ...c, widthPercent: newLeftPct };
        if (idx === colIndex + 1) return { ...c, widthPercent: newRightPct };
        return c;
      });

      updateDocket({ columns: newColumns });
    };

    const handlePointerUp = () => {
      setDraggingColIndex(null);
      setLiveColPct(null);
      colDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingColIndex, scale, docket.columns, updateDocket]);

  // Table Row Height drag handler
  const handleRowHeightDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    rowDragRef.current = {
      startY: e.clientY,
      startRowHeight: docket.fieldDimensions?.tableRowHeight || 20,
    };

    setIsDraggingRowHeight(true);
    setLiveRowHeight(docket.fieldDimensions?.tableRowHeight || 20);
  };

  useEffect(() => {
    if (!isDraggingRowHeight) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!rowDragRef.current) return;
      const { startY, startRowHeight } = rowDragRef.current;
      const deltaY = (e.clientY - startY) / (scale || 1);
      const deltaPerRow = Math.round(deltaY / Math.max(1, (docket.rowCount || 12) * 0.4));
      const newHeight = Math.min(42, Math.max(15, startRowHeight + deltaPerRow));

      setLiveRowHeight(newHeight);
      updateDocket({
        fieldDimensions: {
          ...docket.fieldDimensions,
          tableRowHeight: newHeight,
        },
      });
    };

    const handlePointerUp = () => {
      setIsDraggingRowHeight(false);
      setLiveRowHeight(null);
      rowDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingRowHeight, scale, docket.rowCount, docket.fieldDimensions, updateDocket]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative select-none">
      {/* Top Preview Canvas Toolbar */}
      <div className="h-10 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between z-20 text-xs">
        {/* Left: Dimension & Mode indicator */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-300 font-semibold">
            {docket.paperSize} ({dimsMm.width} × {dimsMm.height} mm)
          </span>
          <div className="h-3 w-px bg-slate-700 hidden sm:block" />
          <span className="text-slate-400 hidden sm:inline">
            {docket.hasBleed ? '+3mm Bleed' : 'Trim Only'}
          </span>
          {docket.hasCropMarks && (
            <span className="text-indigo-400 hidden md:inline">• Crop Marks Active</span>
          )}
        </div>

        {/* Right: History controls & Zoom controls */}
        <div className="flex items-center gap-3">
          {/* Interactive Resize Mode Toggle */}
          <button
            id="toggle-field-resize-mode-btn"
            type="button"
            onClick={() => {
              setResizeModeActive(!resizeModeActive);
              if (resizeModeActive) setSelectedFieldId(null);
            }}
            title={resizeModeActive ? "Interactive field resizing is ON - click fields to drag handles" : "Turn ON interactive field resizing"}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all ${
              resizeModeActive
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <MoveHorizontal className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Resize Handles</span>
            <span className={`w-1.5 h-1.5 rounded-full ${resizeModeActive ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
          </button>

          {/* Canvas Undo/Redo quick actions */}
          <div className="flex items-center bg-slate-950/80 rounded border border-slate-800 p-0.5">
            <button
              id="canvas-undo-btn"
              onClick={undo}
              disabled={!canUndo}
              title={canUndo ? "Undo change (Ctrl+Z / Cmd+Z)" : "Nothing to undo"}
              className={`p-1 rounded transition-colors ${
                canUndo
                  ? "text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                  : "text-slate-600 cursor-not-allowed opacity-35"
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-px bg-slate-800" />
            <button
              id="canvas-redo-btn"
              onClick={redo}
              disabled={!canRedo}
              title={canRedo ? "Redo change (Ctrl+Y / Cmd+Shift+Z)" : "Nothing to redo"}
              className={`p-1 rounded transition-colors ${
                canRedo
                  ? "text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                  : "text-slate-600 cursor-not-allowed opacity-35"
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoomLevel(Math.max(40, zoomLevel - 15))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono text-[11px] text-slate-300">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white rounded hover:bg-slate-800 ml-1 border border-slate-700 font-mono"
              title="Reset to 100%"
            >
              1:1
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-radial from-slate-900/60 to-slate-950">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative transition-all"
        >
          {/* Bleed Guide & Crop Mark Region */}
          <div
            className={`relative p-8 transition-colors ${
              docket.hasCropMarks || docket.hasBleed
                ? 'border border-dashed border-slate-700/60'
                : ''
            }`}
          >
            {/* L-Shaped Corner Crop Marks (Hairlines) */}
            {docket.hasCropMarks && (
              <>
                {/* Top-Left */}
                <div className="absolute top-2 left-6 w-5 h-px bg-slate-400" />
                <div className="absolute top-6 left-2 w-px h-5 bg-slate-400" />

                {/* Top-Right */}
                <div className="absolute top-2 right-6 w-5 h-px bg-slate-400" />
                <div className="absolute top-6 right-2 w-px h-5 bg-slate-400" />

                {/* Bottom-Left */}
                <div className="absolute bottom-2 left-6 w-5 h-px bg-slate-400" />
                <div className="absolute bottom-6 left-2 w-px h-5 bg-slate-400" />

                {/* Bottom-Right */}
                <div className="absolute bottom-2 right-6 w-5 h-px bg-slate-400" />
                <div className="absolute bottom-6 right-2 w-px h-5 bg-slate-400" />
              </>
            )}

            {/* Registration Crosshairs */}
            {docket.hasRegistrationMarks && (
              <>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full border border-slate-400 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400 -translate-y-1/2" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400 -translate-x-1/2" />
                  </div>
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full border border-slate-400 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400 -translate-y-1/2" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400 -translate-x-1/2" />
                  </div>
                </div>
              </>
            )}

            {/* THE PRINT SHEET (Scaled to aspect ratio) */}
            <div
              id="docket-live-sheet"
              style={{
                width: `${dimsMm.width * 2.8}px`,
                minHeight: `${dimsMm.height * 2.8}px`,
                backgroundColor: paperBgColor,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              }}
              className="relative p-5 sm:p-6 text-slate-900 rounded-[1px] transition-colors duration-200 overflow-hidden flex flex-col justify-between"
            >
              {/* 3mm Bleed Guideline (Visual indication) */}
              {docket.hasBleed && (
                <div className="absolute inset-1 border border-rose-500/20 pointer-events-none" />
              )}

              {/* Binding Perforation Guideline */}
              {docket.hasBindingGuides && (
                <div
                  className={`absolute pointer-events-none border-dashed border-slate-400/60 z-10 ${
                    docket.bindingEdge === 'top'
                      ? 'top-8 left-0 right-0 border-b-2'
                      : 'left-8 top-0 bottom-0 border-r-2'
                  }`}
                >
                  <span className="absolute top-1 left-3 text-[8px] font-mono text-slate-400 uppercase tracking-widest opacity-60">
                    PERFORATION / STAPLE GUTTER
                  </span>
                </div>
              )}

              {/* Security Micro-Pattern Background (Vector SVG) */}
              {docket.securityPattern !== 'none' && (
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                  style={{ opacity: docket.patternOpacity }}
                >
                  <svg
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="diamond-pattern"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 10 0 L 20 10 L 10 20 L 0 10 Z"
                          fill="none"
                          stroke={docket.primaryColor}
                          strokeWidth="0.5"
                        />
                      </pattern>
                      <pattern
                        id="lattice-pattern"
                        width="16"
                        height="16"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 0 0 L 16 16 M 16 0 L 0 16"
                          fill="none"
                          stroke={docket.primaryColor}
                          strokeWidth="0.4"
                        />
                      </pattern>
                    </defs>

                    {docket.securityPattern === 'geometric_diamond' && (
                      <rect width="100%" height="100%" fill="url(#diamond-pattern)" />
                    )}

                    {docket.securityPattern === 'banknote_lattice' && (
                      <rect width="100%" height="100%" fill="url(#lattice-pattern)" />
                    )}

                    {docket.securityPattern === 'guilloche_wave' &&
                      guillocheWaves.map((pathD, i) => (
                        <path
                          key={i}
                          d={pathD}
                          fill="none"
                          stroke={docket.primaryColor}
                          strokeWidth="0.6"
                        />
                      ))}

                    {docket.securityPattern === 'guilloche_rosette' && rosettePath && (
                      <path
                        d={rosettePath}
                        fill="none"
                        stroke={docket.primaryColor}
                        strokeWidth="0.6"
                      />
                    )}

                    {docket.securityPattern === 'security_rings' &&
                      wavyRings.map((pathD, i) => (
                        <path
                          key={i}
                          d={pathD}
                          fill="none"
                          stroke={docket.primaryColor}
                          strokeWidth="0.6"
                        />
                      ))}
                  </svg>
                </div>
              )}

              {/* Watermark Crest / Logo in Center */}
              {docket.watermarkType === 'crest' && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
                  style={{ opacity: docket.watermarkOpacity || 0.09 }}
                >
                  <div
                    className="w-56 h-56 rounded-full border-4 border-dashed flex flex-col items-center justify-center p-4 text-center select-none"
                    style={{ borderColor: docket.primaryColor }}
                  >
                    <svg
                      viewBox="0 0 180 95"
                      className="w-24 h-auto"
                      fill={docket.primaryColor}
                      stroke={docket.primaryColor}
                    >
                      <circle cx="20" cy="20" r="4.5" strokeWidth="1" />
                      <circle cx="55" cy="12" r="4.5" strokeWidth="1" />
                      <circle cx="90" cy="6" r="5" strokeWidth="1" />
                      <circle cx="125" cy="12" r="4.5" strokeWidth="1" />
                      <circle cx="160" cy="20" r="4.5" strokeWidth="1" />
                      <path
                        d="M 20 25 L 45 52 L 55 17 L 90 56 L 90 12 L 90 56 L 125 17 L 135 52 L 160 25 L 150 65 L 30 65 Z"
                        fill="none"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <path d="M 55 65 L 90 35 L 125 65" fill="none" strokeWidth="2.5" />
                      <path d="M 90 35 L 90 65" fill="none" strokeWidth="2" />
                      <rect x="26" y="68" width="128" height="6" rx="2" strokeWidth="1" />
                    </svg>
                    <span
                      className="font-extrabold text-[10px] uppercase tracking-wider mt-2 line-clamp-2"
                      style={{ color: docket.primaryColor, fontFamily: headerFontFamily }}
                    >
                      {docket.businessName}
                    </span>
                  </div>
                </div>
              )}

              {/* SHEET CONTENT CONTAINER */}
              <div
                style={{ fontFamily: bodyFontFamily }}
                className={`relative z-10 flex flex-col justify-between h-full ${
                  docket.hasBindingGuides
                    ? docket.bindingEdge === 'top'
                      ? 'pt-6'
                      : 'pl-6'
                    : ''
                }`}
              >
                {/* 1. Header Row (NCR Part Tag & Mechanical Serial Number) */}
                <div>
                  <div className="flex items-center justify-between pb-2">
                    {/* NCR Part Label Badge */}
                    <span
                      style={{
                        borderColor: docket.primaryColor,
                        color: docket.primaryColor,
                        fontFamily: headerFontFamily,
                      }}
                      className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border bg-white/70 shadow-xs"
                    >
                      {activePartLabel}
                    </span>

                    {/* Mechanical Serial Number */}
                    <span className="font-mono-num font-bold text-xs tracking-wider text-rose-600 bg-white/80 px-2 py-0.5 rounded border border-rose-200 shadow-xs">
                      {serialString}
                    </span>
                  </div>

                  {/* Business Branding */}
                  <div className="flex items-start gap-3 pt-1">
                    {docket.logoDataUri && (
                      resizeModeActive ? (
                        <ResizableFieldWrapper
                          id="logo"
                          label="Business Logo"
                          isSelected={selectedFieldId === 'logo'}
                          onSelect={() => setSelectedFieldId('logo')}
                          currentWidth={docket.fieldDimensions?.logoWidth || 48}
                          currentHeight={docket.fieldDimensions?.logoHeight || 48}
                          minWidth={28}
                          maxWidth={110}
                          minHeight={28}
                          maxHeight={110}
                          scale={scale}
                          onResize={({ width, height }) => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                logoWidth: width,
                                logoHeight: height,
                              },
                            });
                          }}
                          onReset={() => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                logoWidth: 48,
                                logoHeight: 48,
                              },
                            });
                          }}
                        >
                          <div
                            style={{
                              width: `${docket.fieldDimensions?.logoWidth || 48}px`,
                              height: `${docket.fieldDimensions?.logoHeight || 48}px`,
                            }}
                            className="flex-shrink-0 flex items-center justify-center p-0.5"
                          >
                            <img
                              src={docket.logoDataUri}
                              alt="Logo"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </ResizableFieldWrapper>
                      ) : (
                        <div
                          style={{
                            width: `${docket.fieldDimensions?.logoWidth || 48}px`,
                            height: `${docket.fieldDimensions?.logoHeight || 48}px`,
                          }}
                          className="flex-shrink-0 flex items-center justify-center p-0.5"
                        >
                          <img
                            src={docket.logoDataUri}
                            alt="Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <h1
                          style={{ color: docket.primaryColor, fontFamily: headerFontFamily }}
                          className="font-extrabold text-sm sm:text-base leading-tight tracking-tight uppercase"
                        >
                          {docket.businessName || 'YOUR BUSINESS NAME'}
                        </h1>
                        {docket.rcNumber && (
                          <span className="text-[9px] text-slate-500 font-medium">
                            (RC: {docket.rcNumber})
                          </span>
                        )}
                      </div>

                      {docket.tagline && (
                        <p
                          style={{ color: docket.accentColor }}
                          className="text-[9px] font-semibold tracking-tight italic mt-0.5"
                        >
                          {docket.tagline}
                        </p>
                      )}

                      <div className="text-[8px] text-slate-700 leading-tight mt-1 space-y-0.5">
                        {(docket.headOfficeAddress || docket.branchOfficeAddress) && (
                          <p>
                            {docket.headOfficeAddress && <span>H/O: {docket.headOfficeAddress}</span>}
                            {docket.headOfficeAddress && docket.branchOfficeAddress && ' | '}
                            {docket.branchOfficeAddress && <span>B/O: {docket.branchOfficeAddress}</span>}
                          </p>
                        )}
                        {docket.phoneNumbers && docket.phoneNumbers.length > 0 && (
                          <p className="font-semibold" style={{ color: docket.primaryColor }}>
                            Tel: {docket.phoneNumbers.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Red Specialty Ribbon & Product Categories (if configured) */}
                  {docket.specialtyRibbon && (
                    <div className="mt-1.5 flex justify-center">
                      <div
                        className="text-white text-[8px] sm:text-[8.5px] font-extrabold italic px-4 py-0.5 shadow-xs uppercase tracking-tight text-center"
                        style={{
                          backgroundColor: docket.accentColor || '#D32F2F',
                          transform: 'skewX(-7deg)',
                          fontFamily: headerFontFamily,
                        }}
                      >
                        <span style={{ transform: 'skewX(7deg)', display: 'inline-block' }}>
                          {docket.specialtyRibbon}
                        </span>
                      </div>
                    </div>
                  )}

                  {docket.productsList && (
                    <div
                      className="mt-1 px-2 py-0.5 text-center text-[7px] sm:text-[7.5px] font-bold tracking-tight rounded-[1px] border"
                      style={{
                        backgroundColor: '#FFF1F2',
                        borderColor: '#FECDD3',
                        color: docket.primaryColor,
                      }}
                    >
                      {docket.productsList}
                    </div>
                  )}

                  {/* Document Title Badge (e.g. SALES INVOICE) */}
                  {docket.documentTitle && (
                    <div className="flex justify-center mt-1.5 mb-0.5">
                      <div
                        className="text-white font-extrabold text-[9.5px] tracking-widest uppercase px-4 py-0.5 rounded-[2px] shadow-xs"
                        style={{
                          backgroundColor: docket.titleBadgeColor || docket.accentColor || '#D32F2F',
                          fontFamily: headerFontFamily,
                        }}
                      >
                        {docket.documentTitle}
                      </div>
                    </div>
                  )}

                  {/* Double Hairline Divider */}
                  <div className="pt-1.5 pb-1.5">
                    <div
                      style={{ backgroundColor: docket.primaryColor }}
                      className="h-[1.5px] w-full"
                    />
                    <div
                      style={{ backgroundColor: docket.primaryColor }}
                      className="h-[0.5px] w-full mt-[1.5px]"
                    />
                  </div>

                  {/* Customer Information Lines */}
                  <div className="space-y-1.5 text-[9px] pt-0.5">
                    <div className="flex items-end justify-between gap-2">
                      {/* Customer Name Line */}
                      {resizeModeActive ? (
                        <ResizableFieldWrapper
                          id="customer_name"
                          label="Customer Name Line"
                          isSelected={selectedFieldId === 'customer_name'}
                          onSelect={() => setSelectedFieldId('customer_name')}
                          currentWidth={docket.fieldDimensions?.customerNameWidthPercent || 65}
                          currentHeight={docket.fieldDimensions?.customerNameHeight || 14}
                          widthUnit="%"
                          minWidth={35}
                          maxWidth={90}
                          minHeight={10}
                          maxHeight={32}
                          scale={scale}
                          onResize={({ width, height }) => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                customerNameWidthPercent: width,
                                customerNameHeight: height,
                              },
                            });
                          }}
                          onReset={() => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                customerNameWidthPercent: 65,
                                customerNameHeight: 14,
                              },
                            });
                          }}
                          className="flex items-end gap-2"
                          style={{
                            width: `${docket.fieldDimensions?.customerNameWidthPercent || 65}%`,
                          }}
                        >
                          <span className="font-bold text-slate-800 flex-shrink-0">
                            {docket.customerNameLabel || 'M:'}
                          </span>
                          <div
                            style={{
                              height: `${docket.fieldDimensions?.customerNameHeight || 14}px`,
                            }}
                            className="flex-1 border-b border-dotted border-slate-400"
                          />
                        </ResizableFieldWrapper>
                      ) : (
                        <div
                          style={{
                            width: `${docket.fieldDimensions?.customerNameWidthPercent || 65}%`,
                          }}
                          className="flex items-end gap-2"
                        >
                          <span className="font-bold text-slate-800 flex-shrink-0">
                            {docket.customerNameLabel || 'M:'}
                          </span>
                          <div
                            style={{
                              height: `${docket.fieldDimensions?.customerNameHeight || 14}px`,
                            }}
                            className="flex-1 border-b border-dotted border-slate-400"
                          />
                        </div>
                      )}

                      {/* Date format: boxes vs line */}
                      {resizeModeActive ? (
                        <ResizableFieldWrapper
                          id="date_field"
                          label="Date Field"
                          isSelected={selectedFieldId === 'date_field'}
                          onSelect={() => setSelectedFieldId('date_field')}
                          currentWidth={docket.fieldDimensions?.dateFieldWidth || (docket.dateFormat === 'boxes' ? 84 : 96)}
                          currentHeight={docket.fieldDimensions?.dateFieldHeight || 16}
                          dragDirection="left"
                          minWidth={60}
                          maxWidth={160}
                          minHeight={12}
                          maxHeight={28}
                          scale={scale}
                          onResize={({ width, height }) => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                dateFieldWidth: width,
                                dateFieldHeight: height,
                              },
                            });
                          }}
                          onReset={() => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                dateFieldWidth: docket.dateFormat === 'boxes' ? 84 : 96,
                                dateFieldHeight: 16,
                              },
                            });
                          }}
                          className="flex items-center gap-1.5 flex-shrink-0"
                          style={{
                            width: `${docket.fieldDimensions?.dateFieldWidth || (docket.dateFormat === 'boxes' ? 84 : 96)}px`,
                          }}
                        >
                          <span className="font-bold text-slate-800 text-[8.5px] flex-shrink-0">Date:</span>
                          {docket.dateFormat === 'boxes' ? (
                            <div
                              style={{
                                height: `${docket.fieldDimensions?.dateFieldHeight || 16}px`,
                              }}
                              className="flex-1 flex border border-slate-500 rounded-[1px] bg-white text-[7.5px] font-mono leading-none items-stretch"
                            >
                              <div className="flex-1 border-r border-slate-400 flex items-center justify-center text-slate-400">D</div>
                              <div className="flex-1 border-r border-slate-400 flex items-center justify-center text-slate-400">M</div>
                              <div className="flex-1 flex items-center justify-center text-slate-400">Y</div>
                            </div>
                          ) : (
                            <div
                              style={{
                                height: `${docket.fieldDimensions?.dateFieldHeight || 16}px`,
                              }}
                              className="flex-1 border-b border-dotted border-slate-400"
                            />
                          )}
                        </ResizableFieldWrapper>
                      ) : (
                        <div
                          style={{
                            width: `${docket.fieldDimensions?.dateFieldWidth || (docket.dateFormat === 'boxes' ? 84 : 96)}px`,
                          }}
                          className="flex items-center gap-1.5 flex-shrink-0"
                        >
                          <span className="font-bold text-slate-800 text-[8.5px] flex-shrink-0">Date:</span>
                          {docket.dateFormat === 'boxes' ? (
                            <div
                              style={{
                                height: `${docket.fieldDimensions?.dateFieldHeight || 16}px`,
                              }}
                              className="flex-1 flex border border-slate-500 rounded-[1px] bg-white text-[7.5px] font-mono leading-none items-stretch"
                            >
                              <div className="flex-1 border-r border-slate-400 flex items-center justify-center text-slate-400">D</div>
                              <div className="flex-1 border-r border-slate-400 flex items-center justify-center text-slate-400">M</div>
                              <div className="flex-1 flex items-center justify-center text-slate-400">Y</div>
                            </div>
                          ) : (
                            <div
                              style={{
                                height: `${docket.fieldDimensions?.dateFieldHeight || 16}px`,
                              }}
                              className="flex-1 border-b border-dotted border-slate-400"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {docket.includeCustomerAddress && (
                      <div className="flex items-end justify-between gap-2">
                        {resizeModeActive ? (
                          <ResizableFieldWrapper
                            id="address_field"
                            label="Customer Address Line"
                            isSelected={selectedFieldId === 'address_field'}
                            onSelect={() => setSelectedFieldId('address_field')}
                            currentHeight={docket.fieldDimensions?.addressFieldHeight || 14}
                            allowWidth={false}
                            allowHeight={true}
                            minHeight={10}
                            maxHeight={36}
                            scale={scale}
                            onResize={({ height }) => {
                              updateDocket({
                                fieldDimensions: {
                                  ...docket.fieldDimensions,
                                  addressFieldHeight: height,
                                },
                              });
                            }}
                            onReset={() => {
                              updateDocket({
                                fieldDimensions: {
                                  ...docket.fieldDimensions,
                                  addressFieldHeight: 14,
                                },
                              });
                            }}
                            className="flex-1 flex items-end gap-2"
                          >
                            <span className="text-slate-700 font-medium flex-shrink-0">Address:</span>
                            <div
                              style={{
                                height: `${docket.fieldDimensions?.addressFieldHeight || 14}px`,
                              }}
                              className="flex-1 border-b border-dotted border-slate-400"
                            />
                          </ResizableFieldWrapper>
                        ) : (
                          <div className="flex-1 flex items-end gap-2">
                            <span className="text-slate-700 font-medium flex-shrink-0">Address:</span>
                            <div
                              style={{
                                height: `${docket.fieldDimensions?.addressFieldHeight || 14}px`,
                              }}
                              className="flex-1 border-b border-dotted border-slate-400"
                            />
                          </div>
                        )}

                        {docket.includeCustomerPhone && (
                          resizeModeActive ? (
                            <ResizableFieldWrapper
                              id="phone_field"
                              label="Phone Line"
                              isSelected={selectedFieldId === 'phone_field'}
                              onSelect={() => setSelectedFieldId('phone_field')}
                              currentWidth={docket.fieldDimensions?.phoneFieldWidth || 96}
                              dragDirection="left"
                              allowWidth={true}
                              allowHeight={false}
                              minWidth={55}
                              maxWidth={160}
                              scale={scale}
                              onResize={({ width }) => {
                                updateDocket({
                                  fieldDimensions: {
                                    ...docket.fieldDimensions,
                                    phoneFieldWidth: width,
                                  },
                                });
                              }}
                              onReset={() => {
                                updateDocket({
                                  fieldDimensions: {
                                    ...docket.fieldDimensions,
                                    phoneFieldWidth: 96,
                                  },
                                });
                              }}
                              className="flex items-end gap-1 flex-shrink-0 ml-2"
                              style={{
                                width: `${docket.fieldDimensions?.phoneFieldWidth || 96}px`,
                              }}
                            >
                              <span className="text-slate-700 font-medium flex-shrink-0">Tel:</span>
                              <div
                                style={{
                                  height: `${docket.fieldDimensions?.addressFieldHeight || 14}px`,
                                }}
                                className="flex-1 border-b border-dotted border-slate-400"
                              />
                            </ResizableFieldWrapper>
                          ) : (
                            <div
                              style={{
                                width: `${docket.fieldDimensions?.phoneFieldWidth || 96}px`,
                              }}
                              className="flex items-end gap-1 flex-shrink-0 ml-2"
                            >
                              <span className="text-slate-700 font-medium flex-shrink-0">Tel:</span>
                              <div
                                style={{
                                  height: `${docket.fieldDimensions?.addressFieldHeight || 14}px`,
                                }}
                                className="flex-1 border-b border-dotted border-slate-400"
                              />
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Payment Mode */}
                    {docket.includePaymentMethod && (
                      <div className="flex items-center gap-4 pt-1 text-[8px] font-semibold text-slate-800">
                        <span>Payment:</span>
                        {['CASH', 'TRANSFER', 'POS', 'CHEQUE'].map((mode) => (
                          <div key={mode} className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 border border-slate-600 rounded-[1px]" />
                            <span>{mode}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Main Ruled Docket Table */}
                <div className="my-2 flex-1">
                  <div
                    ref={tableRef}
                    style={{ borderColor: docket.primaryColor }}
                    className="border border-collapse rounded-[1px] overflow-hidden bg-white/40 shadow-xs relative"
                  >
                    {/* Active Column Divider Drag Guide Line */}
                    {draggingColIndex !== null && liveColPct && (
                      <div
                        className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center"
                        style={{
                          left: `${docket.columns.slice(0, draggingColIndex + 1).reduce((acc, c) => acc + c.widthPercent, 0)}%`,
                        }}
                      >
                        <div className="w-0.5 h-full bg-indigo-500 shadow-md" />
                        <div className="absolute top-1 bg-slate-900 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded shadow-lg border border-indigo-400 whitespace-nowrap -translate-x-1/2">
                          {docket.columns[draggingColIndex].label}: {liveColPct.leftPct}% | {docket.columns[draggingColIndex + 1].label}: {liveColPct.rightPct}%
                        </div>
                      </div>
                    )}

                    {/* Header Row */}
                    <div
                      style={{ backgroundColor: docket.primaryColor, fontFamily: headerFontFamily }}
                      className="flex text-white font-bold text-[8.5px] tracking-wider uppercase py-1 relative select-none"
                    >
                      {docket.columns.map((col, idx) => {
                        const isAmountCol = col.label.toLowerCase().includes('amount');
                        const isSplit = isAmountCol && docket.hasAmountKoboSplit;

                        return (
                          <div
                            key={col.id}
                            style={{
                              width: `${col.widthPercent}%`,
                              textAlign: isSplit ? 'center' : col.align,
                              backgroundColor: isSplit ? (docket.accentColor || '#D32F2F') : undefined,
                            }}
                            className={`px-1 relative group/colheader ${
                              idx > 0 ? 'border-l border-white/30' : ''
                            }`}
                          >
                            {isSplit ? (
                              <div>
                                <div>{col.label}</div>
                                <div className="flex border-t border-white/40 text-[7.5px] mt-0.5 pt-0.5">
                                  <div className="w-2/3 border-r border-white/40">₦</div>
                                  <div className="w-1/3">K</div>
                                </div>
                              </div>
                            ) : (
                              col.label
                            )}

                            {/* Column divider drag handle between col and col + 1 */}
                            {resizeModeActive && idx < docket.columns.length - 1 && (
                              <div
                                onPointerDown={(e) => handleColDividerDragStart(e, idx)}
                                onClick={(e) => e.stopPropagation()}
                                title={`Drag to resize border between "${col.label}" and "${docket.columns[idx + 1].label}"`}
                                className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize z-30 flex items-center justify-center group/divider hover:bg-indigo-500/30 transition-colors"
                              >
                                <div className="w-1 h-3.5 bg-white/70 group-hover/divider:bg-indigo-300 rounded-full shadow-xs transition-all" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Data Rows */}
                    <div className="divide-y divide-slate-300">
                      {Array.from({ length: docket.rowCount }).map((_, rIdx) => (
                        <div
                          key={rIdx}
                          style={{
                            height: `${docket.fieldDimensions?.tableRowHeight || 20}px`,
                          }}
                          className="flex items-center"
                        >
                          {docket.columns.map((col, cIdx) => {
                            const isAmountCol = col.label.toLowerCase().includes('amount');
                            const isSplit = isAmountCol && docket.hasAmountKoboSplit;

                            return (
                              <div
                                key={col.id}
                                style={{
                                  width: `${col.widthPercent}%`,
                                  textAlign: col.align,
                                }}
                                className={`h-full px-1 flex items-center ${
                                  cIdx > 0 ? 'border-l border-slate-300' : ''
                                } ${isSplit ? 'bg-rose-50/70' : ''}`}
                              >
                                {isSplit && (
                                  <div className="w-full h-full flex items-center">
                                    <div className="w-2/3 h-full border-r border-rose-200" />
                                    <div className="w-1/3 h-full" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Interactive Row Height Drag Handle */}
                    {resizeModeActive && (
                      <div
                        onPointerDown={handleRowHeightDragStart}
                        title="Click & drag down to adjust table row height (more handwriting space)"
                        className="h-2.5 w-full bg-slate-100 hover:bg-indigo-100/90 border-t border-slate-300 cursor-row-resize flex items-center justify-center group/rowgrip transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5 opacity-70 group-hover/rowgrip:opacity-100 transition-opacity">
                          <div className="w-8 h-1 bg-slate-400 group-hover/rowgrip:bg-indigo-500 rounded-full" />
                          <span className="text-[7.5px] font-mono text-slate-500 group-hover/rowgrip:text-indigo-600 font-semibold hidden group-hover/rowgrip:inline">
                            Row: {docket.fieldDimensions?.tableRowHeight || 20}px ↕
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Lower Section (Totals, Words, Signatures, Disclaimer) */}
                <div className="space-y-1.5 pt-1">
                  {/* Totals & Thanks Row */}
                  <div className="flex items-center justify-between gap-3 text-[9px]">
                    {docket.thanksMessage ? (
                      <span
                        className="italic font-bold text-[10.5px]"
                        style={{ color: docket.primaryColor, fontFamily: 'Georgia, serif' }}
                      >
                        {docket.thanksMessage}
                      </span>
                    ) : (
                      <div />
                    )}

                    {docket.includeTotalBox && (
                      resizeModeActive ? (
                        <ResizableFieldWrapper
                          id="total_box"
                          label="Total ₦ Box"
                          isSelected={selectedFieldId === 'total_box'}
                          onSelect={() => setSelectedFieldId('total_box')}
                          currentWidth={docket.fieldDimensions?.totalBoxWidth || 135}
                          currentHeight={docket.fieldDimensions?.totalBoxHeight || 24}
                          dragDirection="left"
                          minWidth={95}
                          maxWidth={240}
                          minHeight={18}
                          maxHeight={48}
                          scale={scale}
                          onResize={({ width, height }) => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                totalBoxWidth: width,
                                totalBoxHeight: height,
                              },
                            });
                          }}
                          onReset={() => {
                            updateDocket({
                              fieldDimensions: {
                                ...docket.fieldDimensions,
                                totalBoxWidth: 135,
                                totalBoxHeight: 24,
                              },
                            });
                          }}
                        >
                          <div
                            style={{
                              borderColor: docket.accentColor || docket.primaryColor,
                              width: `${docket.fieldDimensions?.totalBoxWidth || 135}px`,
                              height: `${docket.fieldDimensions?.totalBoxHeight || 24}px`,
                            }}
                            className="flex border font-bold rounded-[1px] overflow-hidden text-[9px]"
                          >
                            <span
                              style={{
                                backgroundColor: docket.accentColor || docket.primaryColor,
                                color: '#FFFFFF',
                              }}
                              className="px-2.5 flex items-center justify-center border-r font-extrabold flex-shrink-0"
                            >
                              TOTAL ₦
                            </span>
                            <span className="flex-1 bg-white/70 px-2 flex items-center justify-end font-mono" />
                          </div>
                        </ResizableFieldWrapper>
                      ) : (
                        <div
                          style={{
                            borderColor: docket.accentColor || docket.primaryColor,
                            width: `${docket.fieldDimensions?.totalBoxWidth || 135}px`,
                            height: `${docket.fieldDimensions?.totalBoxHeight || 24}px`,
                          }}
                          className="flex border font-bold rounded-[1px] overflow-hidden text-[9px] min-w-[130px]"
                        >
                          <span
                            style={{
                              backgroundColor: docket.accentColor || docket.primaryColor,
                              color: '#FFFFFF',
                            }}
                            className="px-2.5 flex items-center justify-center border-r font-extrabold flex-shrink-0"
                          >
                            TOTAL ₦
                          </span>
                          <span className="flex-1 bg-white/70 px-2 flex items-center justify-end font-mono" />
                        </div>
                      )
                    )}
                  </div>

                  {/* Amount in Words */}
                  {docket.includeAmountInWords && (
                    resizeModeActive ? (
                      <ResizableFieldWrapper
                        id="amount_in_words"
                        label="Amount in Words Line"
                        isSelected={selectedFieldId === 'amount_in_words'}
                        onSelect={() => setSelectedFieldId('amount_in_words')}
                        currentHeight={docket.fieldDimensions?.amountInWordsHeight || 14}
                        allowWidth={false}
                        allowHeight={true}
                        minHeight={10}
                        maxHeight={36}
                        scale={scale}
                        onResize={({ height }) => {
                          updateDocket({
                            fieldDimensions: {
                              ...docket.fieldDimensions,
                              amountInWordsHeight: height,
                            },
                          });
                        }}
                        onReset={() => {
                          updateDocket({
                            fieldDimensions: {
                              ...docket.fieldDimensions,
                              amountInWordsHeight: 14,
                            },
                          });
                        }}
                        className="flex items-end gap-1.5 text-[9px]"
                      >
                        <span className="font-bold text-slate-800 text-[8.5px] flex-shrink-0">
                          Amount in words:
                        </span>
                        <div
                          style={{
                            height: `${docket.fieldDimensions?.amountInWordsHeight || 14}px`,
                          }}
                          className="flex-1 border-b border-dotted border-slate-400"
                        />
                      </ResizableFieldWrapper>
                    ) : (
                      <div className="flex items-end gap-1.5 text-[9px]">
                        <span className="font-bold text-slate-800 text-[8.5px] flex-shrink-0">
                          Amount in words:
                        </span>
                        <div
                          style={{
                            height: `${docket.fieldDimensions?.amountInWordsHeight || 14}px`,
                          }}
                          className="flex-1 border-b border-dotted border-slate-400"
                        />
                      </div>
                    )
                  )}

                  {/* Signatures */}
                  {resizeModeActive ? (
                    <ResizableFieldWrapper
                      id="signature_blocks"
                      label="Signatures Block"
                      isSelected={selectedFieldId === 'signature_blocks'}
                      onSelect={() => setSelectedFieldId('signature_blocks')}
                      currentWidth={docket.fieldDimensions?.signatureBlockWidth || (docket.includeThreeSignatures ? 110 : 130)}
                      currentHeight={docket.fieldDimensions?.signatureBlockHeight || 30}
                      allowWidth={true}
                      allowHeight={true}
                      minWidth={75}
                      maxWidth={190}
                      minHeight={18}
                      maxHeight={65}
                      scale={scale}
                      onResize={({ width, height }) => {
                        updateDocket({
                          fieldDimensions: {
                            ...docket.fieldDimensions,
                            signatureBlockWidth: width,
                            signatureBlockHeight: height,
                          },
                        });
                      }}
                      onReset={() => {
                        updateDocket({
                          fieldDimensions: {
                            ...docket.fieldDimensions,
                            signatureBlockWidth: docket.includeThreeSignatures ? 110 : 130,
                            signatureBlockHeight: 30,
                          },
                        });
                      }}
                      className="w-full pt-1"
                    >
                      {docket.includeThreeSignatures ? (
                        <div className="flex items-end justify-between text-[7.5px] text-slate-700 w-full">
                          <div
                            style={{ width: `${docket.fieldDimensions?.signatureBlockWidth || 110}px` }}
                            className="text-center"
                          >
                            <div
                              style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                              className="flex items-end justify-center"
                            >
                              <div className="border-b border-slate-500 w-full mb-1" />
                            </div>
                            <span>{docket.signatoryOneTitle || "Cashier's Signature"}</span>
                          </div>
                          <div
                            style={{ width: `${docket.fieldDimensions?.signatureBlockWidth || 110}px` }}
                            className="text-center"
                          >
                            <div
                              style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                              className="flex items-end justify-center"
                            >
                              <div className="border-b border-slate-500 w-full mb-1" />
                            </div>
                            <span>{docket.signatoryTwoTitle || 'Supplier Signature'}</span>
                          </div>
                          <div
                            style={{ width: `${Math.round((docket.fieldDimensions?.signatureBlockWidth || 110) * 1.25)}px` }}
                            className="text-center"
                          >
                            <div
                              style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                              className="flex items-end justify-center"
                            >
                              <div className="border-b border-slate-500 w-full mb-1" />
                            </div>
                            <span className="font-bold" style={{ color: docket.primaryColor }}>
                              {docket.signatoryThreeTitle || `For: ${docket.businessName}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        (docket.includeCustomerSignature || docket.includeAuthorizedSignature) && (
                          <div className="flex items-end justify-between text-[8px] text-slate-700 w-full">
                            {docket.includeCustomerSignature ? (
                              <div
                                style={{ width: `${docket.fieldDimensions?.signatureBlockWidth || 130}px` }}
                                className="text-center"
                              >
                                <div
                                  style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                                  className="flex items-end justify-center"
                                >
                                  <div className="border-b border-slate-600 w-full mb-1" />
                                </div>
                                <span>Customer's Signature</span>
                              </div>
                            ) : (
                              <div />
                            )}

                            {docket.includeAuthorizedSignature && (
                              <div
                                style={{ width: `${Math.round((docket.fieldDimensions?.signatureBlockWidth || 130) * 1.15)}px` }}
                                className="text-center"
                              >
                                <div
                                  style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                                  className="flex items-end justify-center"
                                >
                                  <div className="border-b border-slate-600 w-full mb-1" />
                                </div>
                                <span className="font-bold" style={{ color: docket.primaryColor }}>
                                  Manager / Authorized Sign.
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </ResizableFieldWrapper>
                  ) : (
                    docket.includeThreeSignatures ? (
                      <div className="flex items-end justify-between pt-2 pb-0.5 text-[7.5px] text-slate-700">
                        <div
                          style={{ width: `${docket.fieldDimensions?.signatureBlockWidth || 110}px` }}
                          className="text-center"
                        >
                          <div
                            style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                            className="flex items-end justify-center"
                          >
                            <div className="border-b border-slate-500 w-full mb-1" />
                          </div>
                          <span>{docket.signatoryOneTitle || "Cashier's Signature"}</span>
                        </div>
                        <div
                          style={{ width: `${docket.fieldDimensions?.signatureBlockWidth || 110}px` }}
                          className="text-center"
                        >
                          <div
                            style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                            className="flex items-end justify-center"
                          >
                            <div className="border-b border-slate-500 w-full mb-1" />
                          </div>
                          <span>{docket.signatoryTwoTitle || 'Supplier Signature'}</span>
                        </div>
                        <div
                          style={{ width: `${Math.round((docket.fieldDimensions?.signatureBlockWidth || 110) * 1.25)}px` }}
                          className="text-center"
                        >
                          <div
                            style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                            className="flex items-end justify-center"
                          >
                            <div className="border-b border-slate-500 w-full mb-1" />
                          </div>
                          <span className="font-bold" style={{ color: docket.primaryColor }}>
                            {docket.signatoryThreeTitle || `For: ${docket.businessName}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      (docket.includeCustomerSignature || docket.includeAuthorizedSignature) && (
                        <div className="flex items-end justify-between pt-2 pb-0.5 text-[8px] text-slate-700">
                          {docket.includeCustomerSignature ? (
                            <div
                              style={{ width: `${docket.fieldDimensions?.signatureBlockWidth || 130}px` }}
                              className="text-center"
                            >
                              <div
                                style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                                className="flex items-end justify-center"
                              >
                                <div className="border-b border-slate-600 w-full mb-1" />
                              </div>
                              <span>Customer's Signature</span>
                            </div>
                          ) : (
                            <div />
                          )}

                          {docket.includeAuthorizedSignature && (
                            <div
                              style={{ width: `${Math.round((docket.fieldDimensions?.signatureBlockWidth || 130) * 1.15)}px` }}
                              className="text-center"
                            >
                              <div
                                style={{ height: `${docket.fieldDimensions?.signatureBlockHeight || 30}px` }}
                                className="flex items-end justify-center"
                              >
                                <div className="border-b border-slate-600 w-full mb-1" />
                              </div>
                              <span className="font-bold" style={{ color: docket.primaryColor }}>
                                Manager / Authorized Sign.
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    )
                  )}

                  {/* Footer Disclaimer */}
                  {docket.footerDisclaimer && (
                    <p
                      className="text-[7.5px] text-center font-bold tracking-tight pt-1 border-t border-slate-200"
                      style={{ color: docket.primaryColor }}
                    >
                      {docket.footerDisclaimer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Active Field Selection Bar */}
      {selectedFieldId && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-indigo-500/60 text-white rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 font-semibold">
              Selected: {formatFieldName(selectedFieldId)}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            Drag the blue circular handles to resize width & height
          </span>
          <button
            onClick={() => setSelectedFieldId(null)}
            className="text-[11px] text-slate-300 hover:text-white px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Done (Esc)
          </button>
        </div>
      )}

      {/* Bottom Page / NCR Part Switcher Toolbar */}
      <div className="h-12 border-t border-slate-800 bg-slate-900/95 px-4 flex items-center justify-between z-20">
        {/* Left: NCR Part Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">
            NCR Sheet:
          </span>
          {Array.from({ length: docket.ncrParts }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActivePartIndex(idx)}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activePartIndex === idx
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-slate-500 shadow-inner"
                style={{ backgroundColor: docket.ncrPaperColors?.[idx] || '#FFFFFF' }}
              />
              <span className="whitespace-nowrap">
                Part {idx + 1}: {docket.ncrLabels[idx]?.split(' ')[0] || `COPY ${idx + 1}`}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Serialized Set Navigator */}
        {docket.isSerialized && totalSets > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden md:inline">
              Set {activeSetNumber} of {totalSets}
            </span>
            <div className="flex items-center bg-slate-800 rounded-md border border-slate-700">
              <button
                disabled={activeSetNumber <= 1}
                onClick={() => setActiveSetNumber(Math.max(1, activeSetNumber - 1))}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                title="Previous Set"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-mono font-bold text-rose-400">
                {serialString}
              </span>
              <button
                disabled={activeSetNumber >= totalSets}
                onClick={() => setActiveSetNumber(Math.min(totalSets, activeSetNumber + 1))}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                title="Next Set"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-mono">
            Page {currentPageOverall} of {totalPages}
          </div>
        )}
      </div>
    </div>
  );
};

function formatFieldName(id: string): string {
  switch (id) {
    case 'logo':
      return 'Business Logo';
    case 'customer_name':
      return 'Customer Name Line';
    case 'date_field':
      return 'Date Field';
    case 'address_field':
      return 'Customer Address Line';
    case 'phone_field':
      return 'Telephone Field';
    case 'total_box':
      return 'Total ₦ Box';
    case 'amount_in_words':
      return 'Amount in Words Line';
    case 'signature_blocks':
      return 'Signatures Block';
    default:
      return id;
  }
}
