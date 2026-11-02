export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'Serif' | 'Sans' | 'Display' | 'Monospace';
  description: string;
  pdfStandardFont: 'Helvetica' | 'TimesRoman' | 'Courier';
}

export const CURATED_HEADER_FONTS: FontOption[] = [
  {
    id: 'Cinzel',
    name: 'Cinzel',
    family: "'Cinzel', serif",
    category: 'Serif',
    description: 'Classical Roman proportions & luxury stationery styling',
    pdfStandardFont: 'TimesRoman',
  },
  {
    id: 'Playfair Display',
    name: 'Playfair Display',
    family: "'Playfair Display', Georgia, serif",
    category: 'Serif',
    description: 'High-contrast editorial serif, prestigious commercial firm billing',
    pdfStandardFont: 'TimesRoman',
  },
  {
    id: 'Montserrat',
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'Sans',
    description: 'Crisp geometric corporate branding with punchy visibility',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Oswald',
    name: 'Oswald',
    family: "'Oswald', sans-serif",
    category: 'Display',
    description: 'Condensed industrial stamp & bold commercial press banner',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Bebas Neue',
    name: 'Bebas Neue',
    family: "'Bebas Neue', cursive, sans-serif",
    category: 'Display',
    description: 'Impactful all-caps display for high-volume commercial dockets',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Merriweather',
    name: 'Merriweather',
    family: "'Merriweather', Georgia, serif",
    category: 'Serif',
    description: 'Sturdy traditional merchant ledger serif with warm tone',
    pdfStandardFont: 'TimesRoman',
  },
  {
    id: 'Cormorant Garamond',
    name: 'Cormorant Garamond',
    family: "'Cormorant Garamond', Garamond, serif",
    category: 'Serif',
    description: 'Royal crest & legal firm stationery serif',
    pdfStandardFont: 'TimesRoman',
  },
  {
    id: 'Inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    category: 'Sans',
    description: 'Ultra-refined contemporary sans with clinical precision',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Space Grotesk',
    name: 'Space Grotesk',
    family: "'Space Grotesk', sans-serif",
    category: 'Display',
    description: 'Modern technical and engineering firm typography',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Syne',
    name: 'Syne',
    family: "'Syne', sans-serif",
    category: 'Display',
    description: 'Avant-garde architectural typeface for modern brand identity',
    pdfStandardFont: 'Helvetica',
  },
];

export const CURATED_BODY_FONTS: FontOption[] = [
  {
    id: 'Plus Jakarta Sans',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'Sans',
    description: 'Modern geometric grotesque, highly readable in form grids',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    category: 'Sans',
    description: 'Crisp sans-serif engineered for small tabular row labels',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Roboto',
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    category: 'Sans',
    description: 'Clean, neutral mechanical rhythm suitable for commercial dockets',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Open Sans',
    name: 'Open Sans',
    family: "'Open Sans', sans-serif",
    category: 'Sans',
    description: 'Friendly open humanist proportions with supreme legibility',
    pdfStandardFont: 'Helvetica',
  },
  {
    id: 'Space Mono',
    name: 'Space Mono',
    family: "'Space Mono', monospace",
    category: 'Monospace',
    description: 'Mechanical docket receipt & warehouse dispatch serial look',
    pdfStandardFont: 'Courier',
  },
  {
    id: 'Courier Prime',
    name: 'Courier Prime',
    family: "'Courier Prime', monospace",
    category: 'Monospace',
    description: 'Traditional typewriter & dot-matrix carbon copy imprint',
    pdfStandardFont: 'Courier',
  },
  {
    id: 'PT Sans',
    name: 'PT Sans',
    family: "'PT Sans', sans-serif",
    category: 'Sans',
    description: 'Classic formal administrative and customs docket feel',
    pdfStandardFont: 'Helvetica',
  },
];

export function getHeaderFontFamily(fontId?: string): string {
  const match = CURATED_HEADER_FONTS.find((f) => f.id === fontId);
  return match ? match.family : "'Cinzel', serif";
}

export function getBodyFontFamily(fontId?: string): string {
  const match = CURATED_BODY_FONTS.find((f) => f.id === fontId);
  return match ? match.family : "'Plus Jakarta Sans', sans-serif";
}

export function getFontPdfMapping(fontId?: string): 'Helvetica' | 'TimesRoman' | 'Courier' {
  const all = [...CURATED_HEADER_FONTS, ...CURATED_BODY_FONTS];
  const match = all.find((f) => f.id === fontId);
  return match ? match.pdfStandardFont : 'Helvetica';
}
