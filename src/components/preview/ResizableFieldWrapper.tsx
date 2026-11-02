import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

export interface ResizableFieldWrapperProps {
  id: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect?: () => void;
  currentWidth?: number;
  currentHeight?: number;
  widthUnit?: 'px' | '%';
  heightUnit?: 'px';
  allowWidth?: boolean;
  allowHeight?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  scale?: number; // Canvas zoom scale
  onResize: (dimensions: { width?: number; height?: number }) => void;
  onReset?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  dragDirection?: 'right' | 'left'; // direction width increases (default 'right', 'left' for right-aligned items)
}

export const ResizableFieldWrapper: React.FC<ResizableFieldWrapperProps> = ({
  id,
  label,
  isSelected,
  onSelect,
  onDeselect,
  currentWidth,
  currentHeight,
  widthUnit = 'px',
  heightUnit = 'px',
  allowWidth = true,
  allowHeight = true,
  minWidth = 30,
  maxWidth = 600,
  minHeight = 14,
  maxHeight = 300,
  scale = 1,
  onResize,
  onReset,
  children,
  className = '',
  style = {},
  dragDirection = 'right',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'width' | 'height' | 'corner' | null>(null);
  const [liveDims, setLiveDims] = useState<{ width?: number; height?: number } | null>(null);

  // Drag tracking ref
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    parentWidth: number;
  }>({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    parentWidth: 0,
  });

  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'width' | 'height' | 'corner'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const parentRect = container.parentElement?.getBoundingClientRect();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentWidth || (widthUnit === '%' && parentRect ? (rect.width / parentRect.width) * 100 : rect.width / scale),
      startHeight: currentHeight || (rect.height / scale),
      parentWidth: parentRect ? (parentRect.width / scale) : rect.width / scale,
    };

    setActiveHandle(type);
    setLiveDims({
      width: Math.round(dragRef.current.startWidth),
      height: Math.round(dragRef.current.startHeight),
    });
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = (e.clientX - dragRef.current.startX) / (scale || 1);
      const deltaY = (e.clientY - dragRef.current.startY) / (scale || 1);

      let newWidth = dragRef.current.startWidth;
      let newHeight = dragRef.current.startHeight;

      if (activeHandle === 'width' || activeHandle === 'corner') {
        const effectiveDeltaX = dragDirection === 'left' ? -deltaX : deltaX;
        if (widthUnit === '%') {
          const parentW = dragRef.current.parentWidth || 1;
          const deltaPercent = (effectiveDeltaX / parentW) * 100;
          newWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(dragRef.current.startWidth + deltaPercent)));
        } else {
          newWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(dragRef.current.startWidth + effectiveDeltaX)));
        }
      }

      if (activeHandle === 'height' || activeHandle === 'corner') {
        newHeight = Math.min(maxHeight, Math.max(minHeight, Math.round(dragRef.current.startHeight + deltaY)));
      }

      setLiveDims({
        width: newWidth,
        height: newHeight,
      });

      onResize({
        width: allowWidth ? newWidth : undefined,
        height: allowHeight ? newHeight : undefined,
      });
    };

    const handlePointerUp = () => {
      setActiveHandle(null);
      setLiveDims(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeHandle, scale, widthUnit, allowWidth, allowHeight, minWidth, maxWidth, minHeight, maxHeight, onResize, dragDirection]);

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group/resizable transition-all duration-150 ${className} ${
        isSelected
          ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white rounded-[2px] z-20'
          : isHovered
          ? 'ring-1 ring-indigo-400/60 ring-dashed rounded-[1px] cursor-pointer'
          : ''
      }`}
      style={style}
    >
      {/* Target Content */}
      {children}

      {/* Hover Tooltip Badge (when not selected) */}
      {!isSelected && isHovered && (
        <div className="absolute -top-5 left-0 z-30 pointer-events-none bg-indigo-900/90 text-indigo-100 text-[8px] font-semibold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 backdrop-blur-xs whitespace-nowrap">
          <span>{label}</span>
          <span className="text-[7px] text-indigo-300 opacity-80">(click to resize)</span>
        </div>
      )}

      {/* Selected State: Active Resize HUD & Handles */}
      {isSelected && (
        <>
          {/* Active Field Top HUD with Label, Dimensions, and Reset */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute -top-7 left-0 z-40 bg-slate-900 text-white text-[8.5px] font-semibold px-2 py-0.5 rounded-md shadow-md border border-slate-700 flex items-center gap-2 backdrop-blur-xs whitespace-nowrap pointer-events-auto select-none"
          >
            <span className="text-indigo-400 font-bold">{label}</span>
            <div className="h-2.5 w-px bg-slate-700" />
            <span className="font-mono text-slate-300">
              {liveDims?.width !== undefined
                ? `${liveDims.width}${widthUnit}`
                : currentWidth !== undefined
                ? `${Math.round(currentWidth)}${widthUnit}`
                : 'auto'}{' '}
              ×{' '}
              {liveDims?.height !== undefined
                ? `${liveDims.height}${heightUnit}`
                : currentHeight !== undefined
                ? `${Math.round(currentHeight)}${heightUnit}`
                : 'auto'}
            </span>

            {onReset && (
              <>
                <div className="h-2.5 w-px bg-slate-700" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset();
                  }}
                  title="Reset to default dimensions"
                  className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </>
            )}
          </div>

          {/* East / Width Resize Handle */}
          {allowWidth && (
            <div
              onPointerDown={(e) => handlePointerDown(e, 'width')}
              title={`Drag to resize width (${dragDirection === 'left' ? 'drag left' : 'drag right'})`}
              className={`absolute top-1/2 -translate-y-1/2 ${
                dragDirection === 'left' ? '-left-1.5' : '-right-1.5'
              } w-3 h-5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xs shadow-md border border-white cursor-ew-resize z-40 flex items-center justify-center transition-transform hover:scale-110 active:scale-125`}
            >
              <div className="w-0.5 h-2.5 bg-white/80 rounded-full" />
            </div>
          )}

          {/* South / Height Resize Handle */}
          {allowHeight && (
            <div
              onPointerDown={(e) => handlePointerDown(e, 'height')}
              title="Drag down to resize height / line spacing"
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xs shadow-md border border-white cursor-ns-resize z-40 flex items-center justify-center transition-transform hover:scale-110 active:scale-125"
            >
              <div className="h-0.5 w-2.5 bg-white/80 rounded-full" />
            </div>
          )}

          {/* South-East / Corner Resize Handle */}
          {allowWidth && allowHeight && (
            <div
              onPointerDown={(e) => handlePointerDown(e, 'corner')}
              title="Drag corner to adjust width & height simultaneously"
              className={`absolute -bottom-1.5 ${
                dragDirection === 'left' ? '-left-1.5' : '-right-1.5'
              } w-3.5 h-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xs shadow-md border-2 border-white cursor-nwse-resize z-40 transition-transform hover:scale-125 active:scale-125`}
            />
          )}
        </>
      )}
    </div>
  );
};
