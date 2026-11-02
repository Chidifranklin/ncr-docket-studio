export type PaperSize = 'A4' | 'A5' | 'A6' | 'CUSTOM';

export interface ColumnSchema {
  id: string;
  label: string;
  widthPercent: number;
  align: 'left' | 'center' | 'right';
}

export type SecurityPatternType = 
  | 'guilloche_wave' 
  | 'guilloche_rosette' 
  | 'banknote_lattice' 
  | 'geometric_diamond' 
  | 'security_rings'
  | 'none';

export interface FormFieldDimensions {
  // Customer & Meta fields
  customerNameWidthPercent?: number; // percentage of row width (e.g. 40-90%)
  customerNameHeight?: number; // px (e.g. 12-32px)
  dateFieldWidth?: number; // px (e.g. 70-180px)
  dateFieldHeight?: number; // px (e.g. 14-32px)
  addressFieldHeight?: number; // px (e.g. 12-36px)
  phoneFieldWidth?: number; // px (e.g. 60-150px)

  // Table
  tableRowHeight?: number; // px (e.g. 16-40px, default 20px)

  // Totals & Words
  totalBoxWidth?: number; // px (e.g. 100-240px, default 140px)
  totalBoxHeight?: number; // px (e.g. 18-45px, default 24px)
  amountInWordsHeight?: number; // px (e.g. 12-36px, default 16px)

  // Signatures
  signatureBlockWidth?: number; // px (e.g. 80-200px, default 120px)
  signatureBlockHeight?: number; // px (e.g. 20-65px, default 32px)

  // Header / Branding
  logoWidth?: number; // px (e.g. 32-96px, default 48px)
  logoHeight?: number; // px (e.g. 32-96px, default 48px)
}

export interface DocketTemplateData {
  id?: string;
  templateName: string;
  
  // Branding & Business Info
  businessName: string;
  rcNumber: string;
  tagline: string;
  headOfficeAddress: string;
  branchOfficeAddress: string;
  phoneNumbers: string[];
  logoDataUri: string; // base64 / url
  primaryColor: string;
  accentColor: string;

  // Typography
  headerFont?: string; // e.g. 'Cinzel', 'Playfair Display', 'Montserrat', 'Oswald', 'Bebas Neue'
  bodyFont?: string; // e.g. 'Plus Jakarta Sans', 'Inter', 'Roboto', 'Open Sans', 'Space Mono'

  // Layout & Table
  columns: ColumnSchema[];
  rowCount: number;
  footerDisclaimer: string;
  customerNameLabel: string;
  includeCustomerAddress: boolean;
  includeCustomerPhone: boolean;
  includePaymentMethod: boolean;
  includeAmountInWords: boolean;
  includeAuthorizedSignature: boolean;
  includeCustomerSignature: boolean;
  includeTotalBox: boolean;
  includeSubtotalAndBalance: boolean;

  // Custom Form Field Dimensions (Interactive resizing)
  fieldDimensions?: FormFieldDimensions;

  // Security Micro-Pattern
  securityPattern: SecurityPatternType;
  patternOpacity: number; // 0.05 - 0.40
  watermarkType?: 'none' | 'logo' | 'crest';
  watermarkOpacity?: number;

  // Extended Commercial Stationery Formatting (e.g. Godwin Invoice preset)
  documentTitle?: string; // e.g. "SALES INVOICE"
  titleBadgeColor?: string; // e.g. "#D32F2F"
  specialtyRibbon?: string; // e.g. "Specialise in selling of all kinds of Bulding Materials Such as"
  productsList?: string; // bulleted/comma list of materials
  dateFormat?: 'line' | 'boxes'; // standard line vs [ ][ ][ ] box grid
  thanksMessage?: string; // e.g. "Thanks For Your Patronage"
  signatoryOneTitle?: string; // e.g. "Cashier's Signature"
  signatoryTwoTitle?: string; // e.g. "Supplier Signature"
  signatoryThreeTitle?: string; // e.g. "For: GODWIN NIGERIA ENTERPRISE"
  includeThreeSignatures?: boolean;
  hasAmountKoboSplit?: boolean; // Amount column divided into ₦ and K with tint

  // Print Geometry & Dimensions
  paperSize: PaperSize;
  customWidthMm: number;
  customHeightMm: number;
  hasBleed: boolean; // 3mm standard bleed
  hasCropMarks: boolean; // L-shaped crop marks
  hasRegistrationMarks: boolean; // CMYK registration targets
  hasBindingGuides: boolean; // Perforation / staple gutter
  bindingEdge: 'top' | 'left';
  bindingGutterMm: number; // e.g. 15mm

  // Serialization & NCR Runs
  isSerialized: boolean;
  startSerial: number;
  endSerial: number;
  serialPrefix: string;
  serialDigits: number; // e.g. 4 -> "0001", 6 -> "000001"
  
  // NCR Configurations (1-part, 2-part, 3-part, 4-part)
  ncrParts: number; // 1, 2, 3, 4
  ncrLabels: string[]; // ['ORIGINAL', 'DUPLICATE', 'TRIPLICATE', 'QUADRUPLICATE']
  ncrPaperColors: string[]; // ['#FFFFFF', '#FEF08A', '#FBCFE8', '#BAE6FD']
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  credits: number;
}

export interface ExportJobRecord {
  id: string;
  userId?: string;
  templateId?: string;
  templateName: string;
  paperSize: string;
  totalPageCount: number;
  isSerialized: boolean;
  startSerial?: number;
  endSerial?: number;
  ncrParts: number;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  createdAt: string;
  fileSize?: string;
}
