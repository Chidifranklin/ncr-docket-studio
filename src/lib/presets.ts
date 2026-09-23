import type { DocketTemplateData } from '../types/docket';

export const DEFAULT_PRESET_MIKKY: DocketTemplateData = {
  templateName: 'Mikky & Alayerz A5 Triplicate',
  businessName: 'MIKKY & ALAYERZ NIGERIA LIMITED',
  rcNumber: '1849202',
  tagline: 'Dealers on all kinds of human hair, wigs, weaves, luxury cosmetics & general goods',
  headOfficeAddress: 'Suite 12, Balogun Ultra-Modern Plaza, Trade Fair Complex, Lagos',
  branchOfficeAddress: 'Shop 4B, Main Market, Onitsha, Anambra State',
  phoneNumbers: ['0803 456 7890', '0812 345 6789'],
  logoDataUri: '',
  primaryColor: '#1A0B66',
  accentColor: '#D81B60',

  columns: [
    { id: 'c1', label: 'QTY', widthPercent: 14, align: 'center' },
    { id: 'c2', label: 'DESCRIPTION OF GOODS', widthPercent: 50, align: 'left' },
    { id: 'c3', label: 'RATE (₦)', widthPercent: 18, align: 'right' },
    { id: 'c4', label: 'AMOUNT (₦)', widthPercent: 18, align: 'right' },
  ],
  rowCount: 12,
  footerDisclaimer: 'Goods sold & received in good condition are not returnable. No cash refund after payment.',
  customerNameLabel: 'Customer / M:',
  includeCustomerAddress: true,
  includeCustomerPhone: true,
  includePaymentMethod: true,
  includeAmountInWords: true,
  includeAuthorizedSignature: true,
  includeCustomerSignature: true,
  includeTotalBox: true,
  includeSubtotalAndBalance: false,

  securityPattern: 'guilloche_wave',
  patternOpacity: 0.18,

  paperSize: 'A5',
  customWidthMm: 148,
  customHeightMm: 210,
  hasBleed: true,
  hasCropMarks: true,
  hasRegistrationMarks: true,
  hasBindingGuides: true,
  bindingEdge: 'top',
  bindingGutterMm: 14,

  isSerialized: true,
  startSerial: 1,
  endSerial: 50,
  serialPrefix: 'No. ',
  serialDigits: 4,

  ncrParts: 3,
  ncrLabels: ['ORIGINAL (CUSTOMER COPY)', 'DUPLICATE (ACCOUNTS COPY)', 'TRIPLICATE (BOOK/STORE COPY)'],
  ncrPaperColors: ['#FFFFFF', '#FEF08A', '#FBCFE8', '#BAE6FD'],
};

export const PRESET_APEX_WAYBILL: DocketTemplateData = {
  templateName: 'Apex Auto Parts A4 Delivery Note',
  businessName: 'APEX AUTO SPARES & ENGINEERING',
  rcNumber: '2938104',
  tagline: 'Direct Importers of Heavy Duty Truck, Tractor & Generator Replacement Parts',
  headOfficeAddress: 'Plot 48 Commercial Avenue, Industrial Estate, Ikeja, Lagos',
  branchOfficeAddress: 'KM 12 Aba-Port Harcourt Expressway, Port Harcourt',
  phoneNumbers: ['0802 888 1122', '0901 333 4455'],
  logoDataUri: '',
  primaryColor: '#0F172A',
  accentColor: '#D97706',

  columns: [
    { id: 'c1', label: 'S/N', widthPercent: 10, align: 'center' },
    { id: 'c2', label: 'PART NUMBER / DESCRIPTION', widthPercent: 46, align: 'left' },
    { id: 'c3', label: 'ORDERED', widthPercent: 14, align: 'center' },
    { id: 'c4', label: 'DELIVERED', widthPercent: 14, align: 'center' },
    { id: 'c5', label: 'REMARKS', widthPercent: 16, align: 'left' },
  ],
  rowCount: 16,
  footerDisclaimer: 'Delivered in good condition. All discrepancies must be notified within 24 hours.',
  customerNameLabel: 'Consignee / Client:',
  includeCustomerAddress: true,
  includeCustomerPhone: true,
  includePaymentMethod: false,
  includeAmountInWords: false,
  includeAuthorizedSignature: true,
  includeCustomerSignature: true,
  includeTotalBox: false,
  includeSubtotalAndBalance: false,

  securityPattern: 'banknote_lattice',
  patternOpacity: 0.14,

  paperSize: 'A4',
  customWidthMm: 210,
  customHeightMm: 297,
  hasBleed: true,
  hasCropMarks: true,
  hasRegistrationMarks: true,
  hasBindingGuides: true,
  bindingEdge: 'left',
  bindingGutterMm: 16,

  isSerialized: true,
  startSerial: 101,
  endSerial: 200,
  serialPrefix: 'WB-',
  serialDigits: 5,

  ncrParts: 2,
  ncrLabels: ['ORIGINAL (CONSIGNEE)', 'DUPLICATE (GATE PASS)'],
  ncrPaperColors: ['#FFFFFF', '#FEF08A', '#FBCFE8', '#BAE6FD'],
};

export const PRESET_BOUTIQUE_RECEIPT: DocketTemplateData = {
  templateName: 'Lumière Fashion A6 Pocket Receipt',
  businessName: 'LUMIÈRE COUTURE & BOUTIQUE',
  rcNumber: '3419082',
  tagline: 'Haute Couture, Bespoke Tailoring, Luxury Accessories & Perfumery',
  headOfficeAddress: '14 Admiralty Way, Lekki Phase 1, Lagos',
  branchOfficeAddress: '',
  phoneNumbers: ['0809 555 1212'],
  logoDataUri: '',
  primaryColor: '#4A044E',
  accentColor: '#9333EA',

  columns: [
    { id: 'c1', label: 'ITEM', widthPercent: 54, align: 'left' },
    { id: 'c2', label: 'QTY', widthPercent: 18, align: 'center' },
    { id: 'c3', label: 'TOTAL', widthPercent: 28, align: 'right' },
  ],
  rowCount: 8,
  footerDisclaimer: 'Thank you for your patronage! Exchanges allowed within 48 hours with receipt.',
  customerNameLabel: 'Client:',
  includeCustomerAddress: false,
  includeCustomerPhone: true,
  includePaymentMethod: true,
  includeAmountInWords: true,
  includeAuthorizedSignature: false,
  includeCustomerSignature: true,
  includeTotalBox: true,
  includeSubtotalAndBalance: false,

  securityPattern: 'guilloche_rosette',
  patternOpacity: 0.16,

  paperSize: 'A6',
  customWidthMm: 105,
  customHeightMm: 148,
  hasBleed: true,
  hasCropMarks: true,
  hasRegistrationMarks: false,
  hasBindingGuides: false,
  bindingEdge: 'top',
  bindingGutterMm: 10,

  isSerialized: true,
  startSerial: 1,
  endSerial: 100,
  serialPrefix: 'RCP-',
  serialDigits: 4,

  ncrParts: 2,
  ncrLabels: ['ORIGINAL (CLIENT)', 'DUPLICATE (STORE)'],
  ncrPaperColors: ['#FFFFFF', '#FBCFE8', '#FEF08A', '#BAE6FD'],
};

export const GODWIN_LOGO_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 95" width="180" height="95">
  <g fill="#0B5ED7" stroke="#0B5ED7">
    <circle cx="20" cy="20" r="4.5" stroke-width="1"/>
    <circle cx="55" cy="12" r="4.5" stroke-width="1"/>
    <circle cx="90" cy="6" r="5" stroke-width="1"/>
    <circle cx="125" cy="12" r="4.5" stroke-width="1"/>
    <circle cx="160" cy="20" r="4.5" stroke-width="1"/>
    <path d="M 20 25 L 45 52 L 55 17 L 90 56 L 90 12 L 90 56 L 125 17 L 135 52 L 160 25 L 150 65 L 30 65 Z" fill="none" stroke-width="3" stroke-linejoin="round"/>
    <path d="M 55 65 L 90 35 L 125 65" fill="none" stroke-width="2.5"/>
    <path d="M 90 35 L 90 65" fill="none" stroke-width="2"/>
    <rect x="26" y="68" width="128" height="6" rx="2" stroke-width="1"/>
  </g>
  <text x="90" y="89" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="16" fill="#0B5ED7" text-anchor="middle" letter-spacing="1">GODWIN</text>
</svg>
`);

export const PRESET_GODWIN_INVOICE: DocketTemplateData = {
  templateName: 'Godwin Nigeria Enterprise - Sales Invoice',
  businessName: 'GODWIN NIGERIA ENTERPRISE',
  rcNumber: '',
  tagline: '',
  specialtyRibbon: 'Specialise in selling of all kinds of Bulding Materials Such as',
  productsList: 'Floor Tiles, Wall Tiles, Marble Tiles, Terrazo, Interlocked Tiles, Shaped Floor Tiles, Broken Tiles',
  headOfficeAddress: '605 After Crest Oil, Filling Station Opposite Nodomebe Junction Upper Sokponba Rd. B/C',
  branchOfficeAddress: '',
  phoneNumbers: ['08074569099', '08097618447', '08135624203'],
  logoDataUri: GODWIN_LOGO_DATA_URI,
  primaryColor: '#0B5ED7',
  accentColor: '#D32F2F',

  documentTitle: 'SALES INVOICE',
  titleBadgeColor: '#D32F2F',
  dateFormat: 'boxes',

  columns: [
    { id: 'c1', label: 'No. Of Cartons', widthPercent: 12, align: 'center' },
    { id: 'c2', label: 'Description of Goods', widthPercent: 44, align: 'left' },
    { id: 'c3', label: 'No. Of Sq Qty', widthPercent: 12, align: 'center' },
    { id: 'c4', label: 'Unit Price', widthPercent: 12, align: 'center' },
    { id: 'c5', label: 'Amount', widthPercent: 20, align: 'center' },
  ],
  hasAmountKoboSplit: true,
  rowCount: 16,
  footerDisclaimer: 'Recieve the above goods in good no refund of money after payment',
  thanksMessage: 'Thanks For Your Patronage',
  customerNameLabel: 'Name:',
  includeCustomerAddress: true,
  includeCustomerPhone: false,
  includePaymentMethod: false,
  includeAmountInWords: true,
  includeAuthorizedSignature: true,
  includeCustomerSignature: true,
  includeThreeSignatures: true,
  signatoryOneTitle: "Cashier's Signature",
  signatoryTwoTitle: 'Supplier Signature',
  signatoryThreeTitle: 'For: GODWIN NIGERIA ENTERPRISE',
  includeTotalBox: true,
  includeSubtotalAndBalance: false,

  securityPattern: 'none',
  watermarkType: 'crest',
  watermarkOpacity: 0.1,
  patternOpacity: 0.1,

  paperSize: 'A5',
  customWidthMm: 148,
  customHeightMm: 210,
  hasBleed: true,
  hasCropMarks: true,
  hasRegistrationMarks: true,
  hasBindingGuides: true,
  bindingEdge: 'top',
  bindingGutterMm: 12,

  isSerialized: true,
  startSerial: 1,
  endSerial: 50,
  serialPrefix: 'No. ',
  serialDigits: 4,

  ncrParts: 2,
  ncrLabels: ['ORIGINAL (CUSTOMER)', 'DUPLICATE (OFFICE)'],
  ncrPaperColors: ['#FFFFFF', '#FEF08A', '#FBCFE8', '#BAE6FD'],
};

export const ALL_PRESETS: DocketTemplateData[] = [
  PRESET_GODWIN_INVOICE,
  DEFAULT_PRESET_MIKKY,
  PRESET_APEX_WAYBILL,
  PRESET_BOUTIQUE_RECEIPT,
];
