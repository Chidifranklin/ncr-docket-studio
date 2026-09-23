import React, { useRef } from 'react';
import {
  Upload,
  Trash2,
  Building2,
  Hash,
  Sparkles,
  MapPin,
  Phone,
  Palette,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';
import { useDocketStore } from '../../store/useDocketStore';

const POPULAR_PRIMARY_COLORS = [
  { name: 'Royal Indigo', hex: '#1A0B66' },
  { name: 'Classic Navy', hex: '#0F172A' },
  { name: 'Forest Green', hex: '#064E3B' },
  { name: 'Bordeaux Wine', hex: '#4A044E' },
  { name: 'Deep Onyx', hex: '#18181B' },
  { name: 'Refined Blue', hex: '#1E3A8A' },
];

const POPULAR_ACCENT_COLORS = [
  { name: 'Rose Pink', hex: '#D81B60' },
  { name: 'Warm Amber', hex: '#D97706' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Royal Purple', hex: '#9333EA' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Sky Blue', hex: '#0284C7' },
];

export const BrandingPanel: React.FC = () => {
  const { docket, updateDocket } = useDocketStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Client-side image compression & loading into base64 Data URI
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Max dimension 400px for crisp, lightweight print embedding
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUri = canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9);
          updateDocket({ logoDataUri: compressedDataUri });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addPhoneNumber = () => {
    const nextPhones = [...(docket.phoneNumbers || []), ''];
    updateDocket({ phoneNumbers: nextPhones });
  };

  const updatePhoneNumber = (index: number, val: string) => {
    const nextPhones = [...(docket.phoneNumbers || [])];
    nextPhones[index] = val;
    updateDocket({ phoneNumbers: nextPhones });
  };

  const removePhoneNumber = (index: number) => {
    const nextPhones = (docket.phoneNumbers || []).filter((_, i) => i !== index);
    updateDocket({ phoneNumbers: nextPhones });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Business Logo Upload */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Business Logo (Vector / High-Res)</span>
        </label>

        {docket.logoDataUri ? (
          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="w-16 h-16 bg-white rounded flex items-center justify-center p-1.5 overflow-hidden shadow-inner border border-slate-700">
              <img
                src={docket.logoDataUri}
                alt="Logo Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200">Logo Ready for Vector Print</p>
              <p className="text-[11px] text-slate-500">Auto-compressed & scaled for print</p>
              <button
                id="remove-logo-btn"
                onClick={() => updateDocket({ logoDataUri: '' })}
                className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Logo</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 rounded-lg p-4 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950 transition-all group"
          >
            <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 mx-auto mb-1.5 transition-colors" />
            <p className="text-xs font-medium text-slate-300">Click to upload brand logo</p>
            <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, or SVG up to 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* 2. Business Identity */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Business Identity</span>
        </label>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Business / Company Name *
          </label>
          <input
            id="business-name-input"
            type="text"
            value={docket.businessName}
            onChange={(e) => updateDocket({ businessName: e.target.value })}
            placeholder="e.g. MIKKY & ALAYERZ NIGERIA LIMITED"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              RC / Reg. Number
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                id="rc-number-input"
                type="text"
                value={docket.rcNumber}
                onChange={(e) => updateDocket({ rcNumber: e.target.value })}
                placeholder="e.g. RC 1849202"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Business Tagline / Subtitle
            </label>
            <div className="relative">
              <Sparkles className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                id="tagline-input"
                type="text"
                value={docket.tagline}
                onChange={(e) => updateDocket({ tagline: e.target.value })}
                placeholder="e.g. Dealers on all kinds of hair..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Address & Contact Information */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span>Locations & Contacts</span>
        </label>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Head Office Address
          </label>
          <input
            id="head-office-input"
            type="text"
            value={docket.headOfficeAddress}
            onChange={(e) => updateDocket({ headOfficeAddress: e.target.value })}
            placeholder="e.g. Suite 12, Balogun Ultra-Modern Plaza, Lagos"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Branch Office Address (Optional)
          </label>
          <input
            id="branch-office-input"
            type="text"
            value={docket.branchOfficeAddress}
            onChange={(e) => updateDocket({ branchOfficeAddress: e.target.value })}
            placeholder="e.g. Shop 4B, Main Market, Onitsha"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Phone numbers list */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-400">
              Phone Numbers
            </label>
            <button
              id="add-phone-btn"
              onClick={addPhoneNumber}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Add Phone</span>
            </button>
          </div>

          <div className="space-y-2">
            {(docket.phoneNumbers || []).map((phone, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => updatePhoneNumber(idx, e.target.value)}
                    placeholder="e.g. 0803 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => removePhoneNumber(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Brand & Stationery Color Scheme */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-4">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Stationery Ink Colors</span>
        </label>

        {/* Primary Color */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400">Primary Brand Ink</span>
            <span className="text-[11px] font-mono text-slate-300">{docket.primaryColor}</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              id="primary-color-picker"
              type="color"
              value={docket.primaryColor}
              onChange={(e) => updateDocket({ primaryColor: e.target.value })}
              className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={docket.primaryColor}
              onChange={(e) => updateDocket({ primaryColor: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_PRIMARY_COLORS.map((col) => (
              <button
                key={col.hex}
                onClick={() => updateDocket({ primaryColor: col.hex })}
                title={col.name}
                className={`w-6 h-6 rounded-md border transition-transform ${
                  docket.primaryColor.toLowerCase() === col.hex.toLowerCase()
                    ? 'border-white scale-110 shadow'
                    : 'border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: col.hex }}
              />
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400">Accent Ink / Highlight</span>
            <span className="text-[11px] font-mono text-slate-300">{docket.accentColor}</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              id="accent-color-picker"
              type="color"
              value={docket.accentColor}
              onChange={(e) => updateDocket({ accentColor: e.target.value })}
              className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={docket.accentColor}
              onChange={(e) => updateDocket({ accentColor: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_ACCENT_COLORS.map((col) => (
              <button
                key={col.hex}
                onClick={() => updateDocket({ accentColor: col.hex })}
                title={col.name}
                className={`w-6 h-6 rounded-md border transition-transform ${
                  docket.accentColor.toLowerCase() === col.hex.toLowerCase()
                    ? 'border-white scale-110 shadow'
                    : 'border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: col.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5. Commercial Stationery Features (Watermarks & Ribbon) */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Commercial Docket Features</span>
        </label>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Document Title Badge
          </label>
          <input
            type="text"
            value={docket.documentTitle || ''}
            onChange={(e) => updateDocket({ documentTitle: e.target.value })}
            placeholder="e.g. SALES INVOICE, CASH RECEIPT, WAYBILL"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Specialty Ribbon Text
          </label>
          <input
            type="text"
            value={docket.specialtyRibbon || ''}
            onChange={(e) => updateDocket({ specialtyRibbon: e.target.value })}
            placeholder="e.g. Specialised In: or Importer of:"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Product Categories / Line of Business
          </label>
          <textarea
            rows={2}
            value={docket.productsList || ''}
            onChange={(e) => updateDocket({ productsList: e.target.value })}
            placeholder="e.g. P.V.C. Pipes, Pressure Pipes, Water Collectors, Waste Pipes, Reducer..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Patronage / Courtesy Message
          </label>
          <input
            type="text"
            value={docket.thanksMessage || ''}
            onChange={(e) => updateDocket({ thanksMessage: e.target.value })}
            placeholder="e.g. Thanks For Your Patronage"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Watermark Selector */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Sheet Watermark</span>
            <div className="flex rounded-md border border-slate-800 bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => updateDocket({ watermarkType: 'none' })}
                className={`text-[10px] px-2.5 py-0.5 rounded ${
                  !docket.watermarkType || docket.watermarkType === 'none'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => updateDocket({ watermarkType: 'crest' })}
                className={`text-[10px] px-2.5 py-0.5 rounded ${
                  docket.watermarkType === 'crest'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Security Crest
              </button>
            </div>
          </div>

          {docket.watermarkType === 'crest' && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Watermark Opacity:</span>
                <span className="font-mono text-slate-200">
                  {Math.round((docket.watermarkOpacity || 0.1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.01"
                value={docket.watermarkOpacity || 0.1}
                onChange={(e) => updateDocket({ watermarkOpacity: Number(e.target.value) })}
                className="w-full accent-indigo-500 h-1.5 bg-slate-950 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
