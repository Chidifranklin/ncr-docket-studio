import React, { useMemo } from 'react';
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
} from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';
import { getPaperDimensionsMm } from '../../lib/printDimensions';
import {
  generateHarmonicGuillocheWavePaths,
  generateGuillocheRosettePath,
  generateSecurityWavyRings,
} from '../../lib/guilloche';

export const DocketCanvas: React.FC = () => {
  const {
    docket,
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
                      style={{ color: docket.primaryColor }}
                    >
                      {docket.businessName}
                    </span>
                  </div>
                </div>
              )}

              {/* SHEET CONTENT CONTAINER */}
              <div
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
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={docket.logoDataUri}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <h1
                          style={{ color: docket.primaryColor }}
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
                        style={{ backgroundColor: docket.titleBadgeColor || docket.accentColor || '#D32F2F' }}
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
                  <div className="space-y-1 text-[9px] pt-0.5">
                    <div className="flex items-end gap-2">
                      <span className="font-bold text-slate-800">{docket.customerNameLabel || 'M:'}</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 h-3" />
                      
                      {/* Date format: boxes vs line */}
                      {docket.dateFormat === 'boxes' ? (
                        <div className="flex items-center gap-1.5 pl-2 flex-shrink-0">
                          <span className="font-bold text-slate-800 text-[8.5px]">Date:</span>
                          <div className="flex border border-slate-500 rounded-[1px] bg-white text-[7.5px] font-mono leading-none">
                            <div className="w-4 h-3.5 border-r border-slate-400 flex items-center justify-center text-slate-400">D</div>
                            <div className="w-4 h-3.5 border-r border-slate-400 flex items-center justify-center text-slate-400">M</div>
                            <div className="w-6 h-3.5 flex items-center justify-center text-slate-400">Y</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-slate-800 ml-2">Date:</span>
                          <div className="w-24 border-b border-dotted border-slate-400 h-3" />
                        </>
                      )}
                    </div>

                    {docket.includeCustomerAddress && (
                      <div className="flex items-end gap-2">
                        <span className="text-slate-700 font-medium">Address:</span>
                        <div className="flex-1 border-b border-dotted border-slate-400 h-3" />
                        {docket.includeCustomerPhone && (
                          <>
                            <span className="text-slate-700 font-medium ml-2">Tel:</span>
                            <div className="w-24 border-b border-dotted border-slate-400 h-3" />
                          </>
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
                    style={{ borderColor: docket.primaryColor }}
                    className="border border-collapse rounded-[1px] overflow-hidden bg-white/40 shadow-xs"
                  >
                    {/* Header Row */}
                    <div
                      style={{ backgroundColor: docket.primaryColor }}
                      className="flex text-white font-bold text-[8.5px] tracking-wider uppercase py-1"
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
                            className={`px-1 ${
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
                          </div>
                        );
                      })}
                    </div>

                    {/* Data Rows */}
                    <div className="divide-y divide-slate-300">
                      {Array.from({ length: docket.rowCount }).map((_, rIdx) => (
                        <div key={rIdx} className="flex h-5 items-center">
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
                      <div
                        style={{ borderColor: docket.accentColor || docket.primaryColor }}
                        className="flex border font-bold rounded-[1px] overflow-hidden text-[9px] min-w-[130px]"
                      >
                        <span
                          style={{
                            backgroundColor: docket.accentColor || docket.primaryColor,
                            color: '#FFFFFF',
                          }}
                          className="px-2.5 py-0.5 border-r font-extrabold"
                        >
                          TOTAL ₦
                        </span>
                        <span className="flex-1 bg-white/70 px-2 py-0.5 text-right font-mono" />
                      </div>
                    )}
                  </div>

                  {/* Amount in Words */}
                  {docket.includeAmountInWords && (
                    <div className="flex items-end gap-1.5 text-[9px]">
                      <span className="font-bold text-slate-800 text-[8.5px]">Amount in words:</span>
                      <div className="flex-1 border-b border-dotted border-slate-400 h-3" />
                    </div>
                  )}

                  {/* Signatures */}
                  {docket.includeThreeSignatures ? (
                    <div className="flex items-end justify-between pt-2 pb-0.5 text-[7.5px] text-slate-700">
                      <div className="text-center w-28">
                        <div className="border-b border-slate-500 mb-1" />
                        <span>{docket.signatoryOneTitle || "Cashier's Signature"}</span>
                      </div>
                      <div className="text-center w-28">
                        <div className="border-b border-slate-500 mb-1" />
                        <span>{docket.signatoryTwoTitle || 'Supplier Signature'}</span>
                      </div>
                      <div className="text-center w-36">
                        <div className="border-b border-slate-500 mb-1" />
                        <span className="font-bold" style={{ color: docket.primaryColor }}>
                          {docket.signatoryThreeTitle || `For: ${docket.businessName}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    (docket.includeCustomerSignature || docket.includeAuthorizedSignature) && (
                      <div className="flex items-end justify-between pt-2 pb-0.5 text-[8px] text-slate-700">
                        {docket.includeCustomerSignature ? (
                          <div className="text-center w-32">
                            <div className="border-b border-slate-600 mb-1" />
                            <span>Customer's Signature</span>
                          </div>
                        ) : (
                          <div />
                        )}

                        {docket.includeAuthorizedSignature && (
                          <div className="text-center w-36">
                            <div className="border-b border-slate-600 mb-1" />
                            <span className="font-bold" style={{ color: docket.primaryColor }}>
                              Manager / Authorized Sign.
                            </span>
                          </div>
                        )}
                      </div>
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
