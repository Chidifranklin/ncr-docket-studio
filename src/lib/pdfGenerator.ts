import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import type { DocketTemplateData } from '../types/docket';
import { getPrintGeometry, mmToPt } from './printDimensions';
import { getPatternLinesForPdf } from './guilloche';

// Helper to convert hex #RRGGBB to pdf-lib rgb(0..1)
function hexToPdfRgb(hex: string, defaultColor = { r: 0, g: 0, b: 0 }) {
  if (!hex || !hex.startsWith('#')) return rgb(defaultColor.r, defaultColor.g, defaultColor.b);
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(defaultColor.r, defaultColor.g, defaultColor.b);
}

// Convert base64 data URI to Uint8Array
function dataUriToUint8Array(dataUri: string): Uint8Array | null {
  try {
    const base64Index = dataUri.indexOf(';base64,');
    if (base64Index === -1) return null;
    const base64 = dataUri.substring(base64Index + 8);
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.warn('Failed to parse logo data URI:', e);
    return null;
  }
}

export interface PdfExportOptions {
  template: DocketTemplateData;
  onProgress?: (current: number, total: number, message: string) => void;
  overrideSinglePage?: boolean;
}

export async function generateDocketPdf(options: PdfExportOptions): Promise<{ blob: Blob; fileName: string; totalPages: number }> {
  const { template, onProgress, overrideSinglePage } = options;
  const pdfDoc = await PDFDocument.create();

  // Standard Fonts (High precision vector glyphs)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const fontMonoRegular = await pdfDoc.embedFont(StandardFonts.Courier);

  // Colors
  const primaryRgb = hexToPdfRgb(template.primaryColor, { r: 0.1, g: 0.05, b: 0.4 });
  const accentRgb = hexToPdfRgb(template.accentColor, { r: 0.85, g: 0.1, b: 0.4 });
  const textDark = rgb(0.1, 0.12, 0.15);
  const textMuted = rgb(0.35, 0.38, 0.42);
  const lineLight = rgb(0.75, 0.78, 0.82);

  // Logo Embedding
  let embeddedLogo: any = null;
  if (template.logoDataUri) {
    try {
      const logoBytes = dataUriToUint8Array(template.logoDataUri);
      if (logoBytes) {
        if (template.logoDataUri.includes('image/png')) {
          embeddedLogo = await pdfDoc.embedPng(logoBytes);
        } else if (template.logoDataUri.includes('image/jpeg') || template.logoDataUri.includes('image/jpg')) {
          embeddedLogo = await pdfDoc.embedJpg(logoBytes);
        }
      }
    } catch (e) {
      console.warn('Logo could not be embedded into PDF:', e);
    }
  }

  // Geometry
  const geom = getPrintGeometry(
    template.paperSize,
    template.customWidthMm,
    template.customHeightMm,
    template.hasBleed,
    template.hasCropMarks
  );

  const { totalPagePt, trimPt, slugMarginPt } = geom;

  // Determine pages to generate
  let sets: Array<{ serialStr: string; partIdx: number; partLabel: string }> = [];

  if (!template.isSerialized || overrideSinglePage) {
    // Single sheet mode or blank test page
    for (let p = 0; p < template.ncrParts; p++) {
      sets.push({
        serialStr: template.isSerialized
          ? `${template.serialPrefix}${String(template.startSerial).padStart(template.serialDigits, '0')}`
          : 'SAMPLE',
        partIdx: p,
        partLabel: template.ncrLabels[p] || (p === 0 ? 'ORIGINAL' : `COPY ${p + 1}`),
      });
    }
  } else {
    // Serialized runs
    const start = Math.max(1, template.startSerial || 1);
    const end = Math.max(start, template.endSerial || start);
    for (let s = start; s <= end; s++) {
      const serialNum = `${template.serialPrefix}${String(s).padStart(template.serialDigits, '0')}`;
      for (let p = 0; p < template.ncrParts; p++) {
        sets.push({
          serialStr: serialNum,
          partIdx: p,
          partLabel: template.ncrLabels[p] || (p === 0 ? 'ORIGINAL' : `COPY ${p + 1}`),
        });
      }
    }
  }

  const totalPages = sets.length;

  // Render pages in memory
  for (let i = 0; i < totalPages; i++) {
    const item = sets[i];
    onProgress?.(i + 1, totalPages, `Rendering Page ${i + 1} of ${totalPages} (${item.partLabel} ${item.serialStr})...`);

    // Let UI event loop breathe on large runs
    if (i % 25 === 0 && i > 0) {
      await new Promise((r) => setTimeout(r, 0));
    }

    const page = pdfDoc.addPage([totalPagePt.width, totalPagePt.height]);

    // PDF coordinate system starts at BOTTOM-LEFT (0, 0).
    // Convert Top-Left origin to PDF coordinates:
    // trim Box:
    const trimLeft = slugMarginPt;
    const trimBottom = slugMarginPt;
    const trimRight = trimLeft + trimPt.width;
    const trimTop = trimBottom + trimPt.height;

    // 1. Paper tint background if NCR copy
    const paperHex = template.ncrPaperColors?.[item.partIdx] || '#FFFFFF';
    if (paperHex !== '#FFFFFF' && paperHex !== '#ffffff') {
      const tintRgb = hexToPdfRgb(paperHex, { r: 1, g: 1, b: 1 });
      page.drawRectangle({
        x: trimLeft - (template.hasBleed ? geom.bleedPt : 0),
        y: trimBottom - (template.hasBleed ? geom.bleedPt : 0),
        width: trimPt.width + (template.hasBleed ? geom.bleedPt * 2 : 0),
        height: trimPt.height + (template.hasBleed ? geom.bleedPt * 2 : 0),
        color: tintRgb,
      });
    }

    // 2. Crop Marks & Slug Marks (Hairlines 0.25pt)
    if (template.hasCropMarks) {
      const markLength = 14; // ~5mm
      const markOffset = 3;  // offset from trim edge
      const hairline = 0.35;
      const cropColor = rgb(0.1, 0.1, 0.1);

      // Top-Left Corner
      page.drawLine({
        start: { x: trimLeft, y: trimTop + markOffset },
        end: { x: trimLeft, y: trimTop + markOffset + markLength },
        thickness: hairline,
        color: cropColor,
      });
      page.drawLine({
        start: { x: trimLeft - markOffset, y: trimTop },
        end: { x: trimLeft - markOffset - markLength, y: trimTop },
        thickness: hairline,
        color: cropColor,
      });

      // Top-Right Corner
      page.drawLine({
        start: { x: trimRight, y: trimTop + markOffset },
        end: { x: trimRight, y: trimTop + markOffset + markLength },
        thickness: hairline,
        color: cropColor,
      });
      page.drawLine({
        start: { x: trimRight + markOffset, y: trimTop },
        end: { x: trimRight + markOffset + markLength, y: trimTop },
        thickness: hairline,
        color: cropColor,
      });

      // Bottom-Left Corner
      page.drawLine({
        start: { x: trimLeft, y: trimBottom - markOffset },
        end: { x: trimLeft, y: trimBottom - markOffset - markLength },
        thickness: hairline,
        color: cropColor,
      });
      page.drawLine({
        start: { x: trimLeft - markOffset, y: trimBottom },
        end: { x: trimLeft - markOffset - markLength, y: trimBottom },
        thickness: hairline,
        color: cropColor,
      });

      // Bottom-Right Corner
      page.drawLine({
        start: { x: trimRight, y: trimBottom - markOffset },
        end: { x: trimRight, y: trimBottom - markOffset - markLength },
        thickness: hairline,
        color: cropColor,
      });
      page.drawLine({
        start: { x: trimRight + markOffset, y: trimBottom },
        end: { x: trimRight + markOffset + markLength, y: trimBottom },
        thickness: hairline,
        color: cropColor,
      });
    }

    // 3. Registration Marks (Crosshairs with concentric circle)
    if (template.hasRegistrationMarks && template.hasCropMarks) {
      const regRadius = 4.5;
      const regColor = rgb(0.1, 0.1, 0.1);
      const hairline = 0.35;
      const midX = trimLeft + trimPt.width / 2;
      const midY = trimBottom + trimPt.height / 2;

      // Top registration mark
      const topY = trimTop + 10;
      page.drawCircle({ x: midX, y: topY, size: regRadius, borderColor: regColor, borderWidth: hairline });
      page.drawLine({ start: { x: midX - 7, y: topY }, end: { x: midX + 7, y: topY }, thickness: hairline, color: regColor });
      page.drawLine({ start: { x: midX, y: topY - 7 }, end: { x: midX, y: topY + 7 }, thickness: hairline, color: regColor });

      // Bottom registration mark
      const botY = trimBottom - 10;
      page.drawCircle({ x: midX, y: botY, size: regRadius, borderColor: regColor, borderWidth: hairline });
      page.drawLine({ start: { x: midX - 7, y: botY }, end: { x: midX + 7, y: botY }, thickness: hairline, color: regColor });
      page.drawLine({ start: { x: midX, y: botY - 7 }, end: { x: midX, y: botY + 7 }, thickness: hairline, color: regColor });
    }

    // 4. Binding Gutter / Perforation Guide Line
    let effectiveContentLeft = trimLeft + 20; // safe padding
    let effectiveContentTop = trimTop - 18;
    let effectiveContentRight = trimRight - 20;
    let effectiveContentBottom = trimBottom + 18;

    if (template.hasBindingGuides) {
      const gutterPt = mmToPt(template.bindingGutterMm || 15);
      const perfColor = rgb(0.65, 0.65, 0.7);
      if (template.bindingEdge === 'top') {
        const perfY = trimTop - gutterPt;
        // Perforation dashed line
        for (let px = trimLeft + 5; px < trimRight - 5; px += 8) {
          page.drawLine({
            start: { x: px, y: perfY },
            end: { x: px + 4, y: perfY },
            thickness: 0.5,
            color: perfColor,
          });
        }
        effectiveContentTop = perfY - 14;
      } else {
        const perfX = trimLeft + gutterPt;
        for (let py = trimBottom + 5; py < trimTop - 5; py += 8) {
          page.drawLine({
            start: { x: perfX, y: py },
            end: { x: perfX, y: py + 4 },
            thickness: 0.5,
            color: perfColor,
          });
        }
        effectiveContentLeft = perfX + 14;
      }
    }

    const contentWidth = effectiveContentRight - effectiveContentLeft;

    // 5. Security Micro-Pattern (Guilloche / Lattice / Waves in Vector Lines)
    if (template.securityPattern !== 'none') {
      const gridStartY = effectiveContentBottom + 90;
      const gridHeight = effectiveContentTop - 120 - gridStartY;
      if (gridHeight > 50) {
        const lines = getPatternLinesForPdf(
          template.securityPattern,
          effectiveContentLeft,
          gridStartY,
          contentWidth,
          gridHeight
        );
        // Draw fine security vector curves at requested opacity
        const secColor = hexToPdfRgb(template.primaryColor, { r: 0.2, g: 0.1, b: 0.5 });
        // We simulate opacity by lightening with white
        const opacity = Math.min(0.4, Math.max(0.05, template.patternOpacity));
        const lightenedColor = rgb(
          1 - (1 - (template.primaryColor.startsWith('#') ? parseInt(template.primaryColor.slice(1, 3), 16) / 255 : 0.2)) * opacity,
          1 - (1 - (template.primaryColor.startsWith('#') ? parseInt(template.primaryColor.slice(3, 5), 16) / 255 : 0.1)) * opacity,
          1 - (1 - (template.primaryColor.startsWith('#') ? parseInt(template.primaryColor.slice(5, 7), 16) / 255 : 0.5)) * opacity
        );

        for (const seg of lines) {
          page.drawLine({
            start: { x: seg.x1, y: seg.y1 },
            end: { x: seg.x2, y: seg.y2 },
            thickness: 0.35,
            color: lightenedColor,
          });
        }
      }
    }

    // Watermark Crest in Center of Sheet
    if (template.watermarkType === 'crest') {
      const centerX = trimLeft + trimPt.width / 2;
      const centerY = trimBottom + trimPt.height / 2 - 10;
      const wmRadius = 70;
      const wmLightBlue = rgb(0.88, 0.92, 0.98);

      page.drawCircle({
        x: centerX,
        y: centerY,
        size: wmRadius,
        borderColor: wmLightBlue,
        borderWidth: 2,
      });

      const wmBiz = (template.businessName || 'INVOICE').toUpperCase();
      const wmBizW = fontBold.widthOfTextAtSize(wmBiz, 8);
      page.drawText(wmBiz, {
        x: Math.max(effectiveContentLeft + 10, centerX - wmBizW / 2),
        y: centerY - 30,
        size: 8,
        font: fontBold,
        color: wmLightBlue,
      });
    }

    // 6. Header Section (NCR Part Label, Serial Number, Business Logo & Title)
    let currentY = effectiveContentTop;

    // Top metadata row: NCR Part Badge (Left) and Serial Number (Right)
    // NCR Part Label badge
    const badgeText = item.partLabel.toUpperCase();
    const badgeWidth = fontBold.widthOfTextAtSize(badgeText, 8) + 12;
    page.drawRectangle({
      x: effectiveContentLeft,
      y: currentY - 14,
      width: badgeWidth,
      height: 14,
      color: rgb(0.92, 0.94, 0.97),
      borderColor: primaryRgb,
      borderWidth: 0.5,
    });
    page.drawText(badgeText, {
      x: effectiveContentLeft + 6,
      y: currentY - 10,
      size: 7.5,
      font: fontBold,
      color: primaryRgb,
    });

    // Mechanical Serial Number (High contrast red/crimson stamp)
    if (item.serialStr) {
      const serialLabel = `${item.serialStr}`;
      const serialWidth = fontMono.widthOfTextAtSize(serialLabel, 11);
      page.drawText(serialLabel, {
        x: effectiveContentRight - serialWidth,
        y: currentY - 11,
        size: 11,
        font: fontMono,
        color: rgb(0.82, 0.1, 0.15), // Stamp ink crimson
      });
    }

    currentY -= 22;

    // Business Header
    let textStartX = effectiveContentLeft;
    let availableTitleWidth = contentWidth;

    if (embeddedLogo) {
      const logoMaxH = 38;
      const logoMaxW = 60;
      const scale = Math.min(logoMaxW / embeddedLogo.width, logoMaxH / embeddedLogo.height, 1);
      const lw = embeddedLogo.width * scale;
      const lh = embeddedLogo.height * scale;

      page.drawImage(embeddedLogo, {
        x: effectiveContentLeft,
        y: currentY - lh + 6,
        width: lw,
        height: lh,
      });

      textStartX = effectiveContentLeft + lw + 12;
      availableTitleWidth = contentWidth - (lw + 12);
    }

    // Business Name (Bold, prominent)
    const bizName = (template.businessName || 'BUSINESS NAME').toUpperCase();
    const titleFontSize = bizName.length > 28 ? 12 : 14;
    page.drawText(bizName, {
      x: textStartX,
      y: currentY - 2,
      size: titleFontSize,
      font: fontBold,
      color: primaryRgb,
    });

    // RC Number (if present)
    if (template.rcNumber) {
      const rcText = `(RC: ${template.rcNumber})`;
      const bizNameW = fontBold.widthOfTextAtSize(bizName, titleFontSize);
      if (bizNameW + fontRegular.widthOfTextAtSize(rcText, 8) + 10 < availableTitleWidth) {
        page.drawText(rcText, {
          x: textStartX + bizNameW + 8,
          y: currentY - 1,
          size: 8,
          font: fontRegular,
          color: textMuted,
        });
      }
    }

    currentY -= 14;

    // Tagline
    if (template.tagline) {
      const tag = template.tagline.length > 80 ? template.tagline.substring(0, 77) + '...' : template.tagline;
      page.drawText(tag, {
        x: textStartX,
        y: currentY,
        size: 7.5,
        font: fontRegular,
        color: accentRgb,
      });
      currentY -= 12;
    }

    // Head Office & Branch Office addresses + Phones
    const addressLine = [
      template.headOfficeAddress ? `H/O: ${template.headOfficeAddress}` : '',
      template.branchOfficeAddress ? `B/O: ${template.branchOfficeAddress}` : '',
    ]
      .filter(Boolean)
      .join('  |  ');

    if (addressLine) {
      page.drawText(addressLine.length > 90 ? addressLine.substring(0, 87) + '...' : addressLine, {
        x: textStartX,
        y: currentY,
        size: 6.8,
        font: fontRegular,
        color: textDark,
      });
      currentY -= 10;
    }

    if (template.phoneNumbers && template.phoneNumbers.length > 0) {
      const phones = `Tel: ${template.phoneNumbers.join(', ')}`;
      page.drawText(phones, {
        x: textStartX,
        y: currentY,
        size: 6.8,
        font: fontBold,
        color: primaryRgb,
      });
      currentY -= 10;
    }

    // Red Specialty Ribbon (e.g. Godwin Invoice)
    if (template.specialtyRibbon) {
      const ribbonH = 12;
      const ribbonText = template.specialtyRibbon.toUpperCase();
      const ribbonW = Math.min(contentWidth, fontBold.widthOfTextAtSize(ribbonText, 6.8) + 24);
      const ribbonX = effectiveContentLeft + (contentWidth - ribbonW) / 2;
      
      page.drawRectangle({
        x: ribbonX,
        y: currentY - ribbonH + 2,
        width: ribbonW,
        height: ribbonH,
        color: accentRgb,
      });
      page.drawText(ribbonText, {
        x: ribbonX + 12,
        y: currentY - 6,
        size: 6.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      currentY -= 14;
    }

    // Products Category Banner
    if (template.productsList) {
      const prodText = template.productsList;
      const prodH = 11;
      const prodW = contentWidth;
      page.drawRectangle({
        x: effectiveContentLeft,
        y: currentY - prodH + 2,
        width: prodW,
        height: prodH,
        color: rgb(1, 0.95, 0.96),
        borderColor: rgb(1, 0.8, 0.82),
        borderWidth: 0.5,
      });
      page.drawText(prodText.length > 110 ? prodText.substring(0, 107) + '...' : prodText, {
        x: effectiveContentLeft + 4,
        y: currentY - 5.5,
        size: 5.8,
        font: fontBold,
        color: primaryRgb,
      });
      currentY -= 13;
    }

    // Document Title Badge (e.g. SALES INVOICE)
    if (template.documentTitle) {
      const titleText = template.documentTitle.toUpperCase();
      const badgeW = fontBold.widthOfTextAtSize(titleText, 8.5) + 20;
      const badgeH = 13;
      const badgeX = effectiveContentLeft + (contentWidth - badgeW) / 2;

      page.drawRectangle({
        x: badgeX,
        y: currentY - badgeH + 2,
        width: badgeW,
        height: badgeH,
        color: accentRgb,
      });
      page.drawText(titleText, {
        x: badgeX + 10,
        y: currentY - 6,
        size: 8.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      currentY -= 14;
    }

    // Hairline divider under header
    currentY -= 3;
    page.drawLine({
      start: { x: effectiveContentLeft, y: currentY },
      end: { x: effectiveContentRight, y: currentY },
      thickness: 1.2,
      color: primaryRgb,
    });
    currentY -= 2;
    page.drawLine({
      start: { x: effectiveContentLeft, y: currentY },
      end: { x: effectiveContentRight, y: currentY },
      thickness: 0.4,
      color: primaryRgb,
    });
    currentY -= 12;

    // 7. Customer & Metadata Fields
    // Row 1: M / Customer Name ................... Date: .............
    page.drawText(template.customerNameLabel || 'M:', {
      x: effectiveContentLeft,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: primaryRgb,
    });
    page.drawLine({
      start: { x: effectiveContentLeft + 18, y: currentY - 1 },
      end: { x: effectiveContentRight - 100, y: currentY - 1 },
      thickness: 0.5,
      color: lineLight,
    });

    if (template.dateFormat === 'boxes') {
      page.drawText('Date:', {
        x: effectiveContentRight - 90,
        y: currentY,
        size: 8,
        font: fontBold,
        color: textDark,
      });
      const boxW = 12;
      const boxH = 10;
      let bx = effectiveContentRight - 62;
      for (let b = 0; b < 3; b++) {
        page.drawRectangle({
          x: bx,
          y: currentY - 2,
          width: boxW,
          height: boxH,
          borderColor: primaryRgb,
          borderWidth: 0.5,
        });
        bx += boxW;
      }
    } else {
      page.drawText('Date:', {
        x: effectiveContentRight - 110,
        y: currentY,
        size: 8,
        font: fontBold,
        color: textDark,
      });
      page.drawLine({
        start: { x: effectiveContentRight - 84, y: currentY - 1 },
        end: { x: effectiveContentRight, y: currentY - 1 },
        thickness: 0.5,
        color: lineLight,
      });
    }
    currentY -= 13;

    // Row 2: Address .................................... Tel: ............
    if (template.includeCustomerAddress) {
      page.drawText('Address:', { x: effectiveContentLeft, y: currentY, size: 7.5, font: fontRegular, color: textDark });
      page.drawLine({
        start: { x: effectiveContentLeft + 38, y: currentY - 1 },
        end: { x: effectiveContentRight - (template.includeCustomerPhone ? 120 : 0), y: currentY - 1 },
        thickness: 0.5,
        color: lineLight,
      });

      if (template.includeCustomerPhone) {
        page.drawText('Tel:', { x: effectiveContentRight - 110, y: currentY, size: 7.5, font: fontRegular, color: textDark });
        page.drawLine({
          start: { x: effectiveContentRight - 90, y: currentY - 1 },
          end: { x: effectiveContentRight, y: currentY - 1 },
          thickness: 0.5,
          color: lineLight,
        });
      }
      currentY -= 12;
    }

    // Optional Payment Method Checkboxes
    if (template.includePaymentMethod) {
      const pmOptions = ['CASH', 'TRANSFER', 'POS', 'CHEQUE'];
      let pmX = effectiveContentLeft;
      page.drawText('Payment Method:', { x: pmX, y: currentY, size: 7, font: fontBold, color: textDark });
      pmX += 78;
      for (const opt of pmOptions) {
        page.drawRectangle({
          x: pmX,
          y: currentY - 1,
          width: 7,
          height: 7,
          borderColor: textDark,
          borderWidth: 0.5,
        });
        page.drawText(opt, { x: pmX + 10, y: currentY, size: 6.8, font: fontRegular, color: textDark });
        pmX += 46;
      }
      currentY -= 12;
    }

    currentY -= 4;

    // 8. The Docket Table
    // Calculate row height and table height
    const footerRequiredHeight = (template.includeAmountInWords ? 24 : 12) + (template.includeCustomerSignature || template.includeAuthorizedSignature ? 40 : 16) + 20;
    const tableAvailableHeight = currentY - (effectiveContentBottom + footerRequiredHeight);
    const rowCount = Math.max(6, Math.min(24, template.rowCount || 12));
    const headerRowHeight = 16;
    const dataRowHeight = Math.max(12, Math.min(22, (tableAvailableHeight - headerRowHeight) / rowCount));
    const tableTotalHeight = headerRowHeight + rowCount * dataRowHeight;

    const tableTop = currentY;
    const tableBottom = tableTop - tableTotalHeight;

    // Table Header Background
    page.drawRectangle({
      x: effectiveContentLeft,
      y: tableTop - headerRowHeight,
      width: contentWidth,
      height: headerRowHeight,
      color: primaryRgb,
    });

    // Outer table border
    page.drawRectangle({
      x: effectiveContentLeft,
      y: tableBottom,
      width: contentWidth,
      height: tableTotalHeight,
      borderColor: primaryRgb,
      borderWidth: 0.8,
    });

    // Compute column pixel widths and positions
    const totalPercent = template.columns.reduce((sum, c) => sum + (c.widthPercent || 25), 0) || 100;
    let colLeft = effectiveContentLeft;
    const colCoords: Array<{ left: number; width: number; label: string; align: string }> = [];

    for (let cIdx = 0; cIdx < template.columns.length; cIdx++) {
      const col = template.columns[cIdx];
      const colW = (col.widthPercent / totalPercent) * contentWidth;
      colCoords.push({
        left: colLeft,
        width: colW,
        label: col.label,
        align: col.align || 'left',
      });
      colLeft += colW;
    }

    // Draw Column Headers & Vertical column separators
    for (let cIdx = 0; cIdx < colCoords.length; cIdx++) {
      const col = colCoords[cIdx];
      const isAmountCol = col.label.toLowerCase().includes('amount');
      const isSplit = isAmountCol && template.hasAmountKoboSplit;

      // Draw vertical separator line
      if (cIdx > 0) {
        page.drawLine({
          start: { x: col.left, y: tableTop },
          end: { x: col.left, y: tableBottom },
          thickness: 0.5,
          color: primaryRgb,
        });
      }

      // If split Amount column, draw red header box
      if (isSplit) {
        page.drawRectangle({
          x: col.left,
          y: tableTop - headerRowHeight,
          width: col.width,
          height: headerRowHeight,
          color: accentRgb,
        });

        // Column label "AMOUNT"
        const lbl = col.label.toUpperCase();
        const txtW = fontBold.widthOfTextAtSize(lbl, 6.8);
        page.drawText(lbl, {
          x: col.left + (col.width - txtW) / 2,
          y: tableTop - 7.5,
          size: 6.8,
          font: fontBold,
          color: rgb(1, 1, 1),
        });

        // ₦ and K sub-headers
        const subY = tableTop - headerRowHeight + 2;
        page.drawLine({
          start: { x: col.left, y: subY + 6 },
          end: { x: col.left + col.width, y: subY + 6 },
          thickness: 0.4,
          color: rgb(1, 1, 1),
        });

        const splitX = col.left + col.width * 0.65;
        page.drawLine({
          start: { x: splitX, y: subY + 6 },
          end: { x: splitX, y: subY },
          thickness: 0.4,
          color: rgb(1, 1, 1),
        });

        page.drawText('N', {
          x: col.left + 8,
          y: subY,
          size: 5.5,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
        page.drawText('K', {
          x: splitX + 4,
          y: subY,
          size: 5.5,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      } else {
        // Standard Header Text (White on Primary color)
        const lbl = col.label.toUpperCase();
        const txtW = fontBold.widthOfTextAtSize(lbl, 7.5);
        let textX = col.left + 4;
        if (col.align === 'center') textX = col.left + (col.width - txtW) / 2;
        if (col.align === 'right') textX = col.left + col.width - txtW - 4;

        page.drawText(lbl, {
          x: Math.max(col.left + 2, textX),
          y: tableTop - headerRowHeight + 5,
          size: 7.2,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      }
    }

    // Draw Horizontal Rows & cell background for split column
    for (let r = 1; r <= rowCount; r++) {
      const rowY = tableTop - headerRowHeight - r * dataRowHeight;
      page.drawLine({
        start: { x: effectiveContentLeft, y: rowY },
        end: { x: effectiveContentRight, y: rowY },
        thickness: 0.35,
        color: lineLight,
      });

      // Split amount column pink background and hairline
      if (template.hasAmountKoboSplit) {
        const lastCol = colCoords[colCoords.length - 1];
        if (lastCol) {
          page.drawRectangle({
            x: lastCol.left + 0.5,
            y: rowY,
            width: lastCol.width - 1,
            height: dataRowHeight,
            color: rgb(1, 0.96, 0.97),
          });
          const splitX = lastCol.left + lastCol.width * 0.65;
          page.drawLine({
            start: { x: splitX, y: rowY },
            end: { x: splitX, y: rowY + dataRowHeight },
            thickness: 0.3,
            color: rgb(1, 0.85, 0.88),
          });
        }
      }
    }

    currentY = tableBottom - 6;

    // 9. Lower Section: Amount in Words, Thanks Message & Totals Box
    if (template.thanksMessage) {
      page.drawText(template.thanksMessage, {
        x: effectiveContentLeft,
        y: currentY - 9,
        size: 9,
        font: fontBold,
        color: primaryRgb,
      });
    }

    if (template.includeTotalBox) {
      const lastCol = colCoords[colCoords.length - 1];
      const totalBoxWidth = (lastCol?.width || 70) + (colCoords[colCoords.length - 2]?.width || 60);
      const totalBoxX = effectiveContentRight - totalBoxWidth;

      // Total Row Box (Red if accentColor set)
      page.drawRectangle({
        x: totalBoxX,
        y: currentY - 14,
        width: totalBoxWidth,
        height: 14,
        borderColor: accentRgb,
        borderWidth: 0.8,
      });

      page.drawRectangle({
        x: totalBoxX,
        y: currentY - 14,
        width: 50,
        height: 14,
        color: accentRgb,
      });

      page.drawText('TOTAL N', {
        x: totalBoxX + 6,
        y: currentY - 10,
        size: 7.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawLine({
        start: { x: totalBoxX + 50, y: currentY },
        end: { x: totalBoxX + 50, y: currentY - 14 },
        thickness: 0.5,
        color: accentRgb,
      });
    }

    if (template.includeAmountInWords) {
      currentY -= 18;
      page.drawText('Amount in Words:', {
        x: effectiveContentLeft,
        y: currentY,
        size: 7.5,
        font: fontBold,
        color: textDark,
      });
      page.drawLine({
        start: { x: effectiveContentLeft + 72, y: currentY - 1 },
        end: { x: effectiveContentRight, y: currentY - 1 },
        thickness: 0.5,
        color: lineLight,
      });
      currentY -= 12;
    } else {
      currentY -= 12;
    }

    // 10. Signatures & Disclaimers
    currentY -= 4;
    if (template.includeThreeSignatures) {
      const sigLineY = currentY - 14;
      const sigColW = (contentWidth - 40) / 3;

      // 1. Cashier
      page.drawLine({
        start: { x: effectiveContentLeft, y: sigLineY },
        end: { x: effectiveContentLeft + sigColW, y: sigLineY },
        thickness: 0.5,
        color: textDark,
      });
      page.drawText(template.signatoryOneTitle || "Cashier's Signature", {
        x: effectiveContentLeft + 4,
        y: sigLineY - 8,
        size: 6.8,
        font: fontRegular,
        color: textDark,
      });

      // 2. Supplier
      const midX = effectiveContentLeft + sigColW + 20;
      page.drawLine({
        start: { x: midX, y: sigLineY },
        end: { x: midX + sigColW, y: sigLineY },
        thickness: 0.5,
        color: textDark,
      });
      page.drawText(template.signatoryTwoTitle || 'Supplier Signature', {
        x: midX + 6,
        y: sigLineY - 8,
        size: 6.8,
        font: fontRegular,
        color: textDark,
      });

      // 3. For Company
      const rightX = effectiveContentRight - sigColW;
      page.drawLine({
        start: { x: rightX, y: sigLineY },
        end: { x: effectiveContentRight, y: sigLineY },
        thickness: 0.5,
        color: textDark,
      });
      page.drawText(template.signatoryThreeTitle || `For: ${template.businessName}`, {
        x: rightX + 4,
        y: sigLineY - 8,
        size: 6.8,
        font: fontBold,
        color: primaryRgb,
      });

      currentY = sigLineY - 14;
    } else if (template.includeCustomerSignature || template.includeAuthorizedSignature) {
      const sigLineY = currentY - 18;

      if (template.includeCustomerSignature) {
        page.drawLine({
          start: { x: effectiveContentLeft, y: sigLineY },
          end: { x: effectiveContentLeft + 120, y: sigLineY },
          thickness: 0.5,
          color: textDark,
        });
        page.drawText("Customer's Signature", {
          x: effectiveContentLeft + 12,
          y: sigLineY - 9,
          size: 7,
          font: fontRegular,
          color: textDark,
        });
      }

      if (template.includeAuthorizedSignature) {
        page.drawLine({
          start: { x: effectiveContentRight - 125, y: sigLineY },
          end: { x: effectiveContentRight, y: sigLineY },
          thickness: 0.5,
          color: textDark,
        });
        page.drawText('Manager / Authorized Sign.', {
          x: effectiveContentRight - 120,
          y: sigLineY - 9,
          size: 7,
          font: fontBold,
          color: primaryRgb,
        });
      }
      currentY = sigLineY - 14;
    }

    // Footer disclaimer
    if (template.footerDisclaimer) {
      const disc = template.footerDisclaimer;
      const discW = fontBold.widthOfTextAtSize(disc, 6.5);
      const discX = Math.max(effectiveContentLeft, effectiveContentLeft + (contentWidth - discW) / 2);
      page.drawText(disc, {
        x: discX,
        y: currentY - 4,
        size: 6.5,
        font: fontBold,
        color: primaryRgb,
      });
    }
  }

  // Finalize PDF
  onProgress?.(totalPages, totalPages, 'Finalizing vector PDF file...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const safeName = (template.templateName || 'docket').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `${safeName}_${template.paperSize}_${totalPages}pages.pdf`;

  return { blob, fileName, totalPages };
}
