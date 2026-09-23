import type { PaperSize } from '../types/docket';

export const MM_TO_PT = 72 / 25.4; // 2.834645669

export interface DimensionsMm {
  width: number;
  height: number;
}

export interface DimensionsPt {
  width: number;
  height: number;
}

export function getPaperDimensionsMm(
  paperSize: PaperSize,
  customWidth?: number,
  customHeight?: number
): DimensionsMm {
  switch (paperSize) {
    case 'A4':
      return { width: 210, height: 297 };
    case 'A5':
      return { width: 148, height: 210 };
    case 'A6':
      return { width: 105, height: 148 };
    case 'CUSTOM':
      return {
        width: Math.max(50, customWidth || 148),
        height: Math.max(50, customHeight || 210),
      };
    default:
      return { width: 148, height: 210 };
  }
}

export function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

export function ptToMm(pt: number): number {
  return pt / MM_TO_PT;
}

/**
 * Calculates page geometry for both web canvas and PDF export.
 * If bleed or crop marks are enabled, extra slug/margin is added around the trim box.
 */
export function getPrintGeometry(
  paperSize: PaperSize,
  customW: number,
  customH: number,
  hasBleed: boolean,
  hasCropMarks: boolean
) {
  const trimMm = getPaperDimensionsMm(paperSize, customW, customH);
  const trimPt = {
    width: mmToPt(trimMm.width),
    height: mmToPt(trimMm.height),
  };

  const bleedMm = hasBleed ? 3 : 0;
  const bleedPt = mmToPt(bleedMm);

  // Extra margin around bleed box for crop marks and registration marks
  const slugMarginMm = hasCropMarks ? 8 : (hasBleed ? 3 : 0);
  const slugMarginPt = mmToPt(slugMarginMm);

  const totalPageMm = {
    width: trimMm.width + slugMarginMm * 2,
    height: trimMm.height + slugMarginMm * 2,
  };

  const totalPagePt = {
    width: trimPt.width + slugMarginPt * 2,
    height: trimPt.height + slugMarginPt * 2,
  };

  const trimBoxOriginPt = {
    x: slugMarginPt,
    y: slugMarginPt,
  };

  const bleedBoxOriginPt = {
    x: slugMarginPt - bleedPt,
    y: slugMarginPt - bleedPt,
  };

  return {
    trimMm,
    trimPt,
    bleedMm,
    bleedPt,
    slugMarginMm,
    slugMarginPt,
    totalPageMm,
    totalPagePt,
    trimBoxOriginPt,
    bleedBoxOriginPt,
  };
}
