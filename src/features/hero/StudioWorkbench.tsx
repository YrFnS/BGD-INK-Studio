import React from 'react';
import { BRAND } from '@/config/brand';
import { useAppContext } from '@/contexts/AppContext';

export const StudioWorkbench: React.FC = () => {
  const { language } = useAppContext();
  const copy =
    language === 'ar'
      ? {
          draft: 'مسودة محلية',
          front: 'الأمام',
          back: 'الخلف',
          surface: 'مساحة الطباعة',
          dimensions: '٣٠ × ٣٨ سم',
          layer: 'طبقة التصميم',
          quality: 'جودة المصدر',
          qualityValue: 'جيدة',
          dpi: 'DPI تقديري',
          physicalSize: '١٢ × ٨ سم',
          saved: 'محفوظ على الجهاز',
          unverified: 'القياس غير مؤكد للإنتاج',
        }
      : {
          draft: 'Local draft',
          front: 'Front',
          back: 'Back',
          surface: 'Print surface',
          dimensions: '30 × 38 cm',
          layer: 'Artwork layer',
          quality: 'Source quality',
          qualityValue: 'Good',
          dpi: 'Estimated DPI',
          physicalSize: '12 × 8 cm',
          saved: 'Saved on device',
          unverified: 'Production size unverified',
        };

  return (
    <div className="studio-workbench relative mx-auto aspect-[4/5] w-full max-w-[620px] overflow-hidden rounded-[2rem] border border-black/10 bg-[#0b0b0b] text-white shadow-[0_40px_100px_rgba(0,0,0,0.28)] dark:border-white/10 sm:rounded-[2.75rem]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.055)_1px,transparent_1px)] bg-[size:38px_38px]" />
      <div className="absolute -end-20 -top-16 h-72 w-72 rounded-full bg-accent/35 blur-3xl" />
      <div className="absolute -bottom-24 -start-16 h-72 w-72 rounded-full bg-[#e8e1d3]/10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 font-display text-xs font-black tracking-tight">
              B/I
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                {BRAND.productName}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/90">{copy.draft} / 001</p>
            </div>
          </div>
          <div className="flex rounded-full border border-white/10 bg-black/30 p-1 text-[10px] font-black uppercase tracking-wider">
            <span className="rounded-full bg-[#eee8dd] px-3 py-1.5 text-black">{copy.front}</span>
            <span className="px-3 py-1.5 text-white/40">{copy.back}</span>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="studio-garment-drift absolute inset-x-[13%] bottom-[8%] top-[4%]">
            <svg viewBox="0 0 520 650" className="h-full w-full" aria-hidden="true">
              <defs>
                <linearGradient id="workbench-shirt" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f4f0e7" />
                  <stop offset="0.58" stopColor="#d7d0c4" />
                  <stop offset="1" stopColor="#9e978e" />
                </linearGradient>
                <filter id="workbench-shadow" x="-40%" y="-30%" width="180%" height="190%">
                  <feDropShadow dx="0" dy="25" stdDeviation="22" floodColor="#000" floodOpacity=".62" />
                </filter>
              </defs>
              <g filter="url(#workbench-shadow)">
                <path
                  d="M165 80c31-27 65-40 95-40s64 13 95 40l111 70-53 121-77-42v359H184V229l-77 42-53-121 111-70Z"
                  fill="url(#workbench-shirt)"
                  stroke="#fff"
                  strokeOpacity=".28"
                  strokeWidth="2"
                />
                <path
                  d="M208 52c5 48 22 72 52 72s47-24 52-72"
                  fill="none"
                  stroke="#7e786f"
                  strokeWidth="18"
                  strokeLinecap="round"
                />
                <rect
                  x="189"
                  y="206"
                  width="142"
                  height="184"
                  rx="5"
                  fill="#e13b2d"
                  fillOpacity=".045"
                  stroke="#e13b2d"
                  strokeWidth="2.5"
                  strokeDasharray="9 7"
                />
                <path
                  d="M200 219h28M200 219v28M320 219h-28M320 219v28M200 377h28M200 377v-28M320 377h-28M320 377v-28"
                  fill="none"
                  stroke="#e13b2d"
                  strokeWidth="4"
                />
                <g transform="translate(217 270)">
                  <rect width="86" height="60" rx="9" fill="#090909" />
                  <path d="M15 16h56v6H15zm0 13h38v6H15zm0 13h47v6H15z" fill="#eee8dd" />
                  <rect x="60" y="38" width="12" height="12" rx="2" fill="#e13b2d" />
                </g>
              </g>
            </svg>
          </div>

          <div className="absolute start-0 top-[13%] w-[43%] rounded-2xl border border-white/10 bg-black/70 p-3 shadow-2xl backdrop-blur-md sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
                {copy.layer}
              </span>
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(225,59,45,.9)]" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eee8dd]">
                <div className="h-5 w-6 rounded-sm bg-black">
                  <span className="block h-1 w-3 translate-x-1.5 translate-y-1.5 bg-accent" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">artwork-01.png</p>
                <p className="mt-1 text-[9px] text-white/40">2400 × 1600 px</p>
              </div>
            </div>
          </div>

          <div className="absolute end-0 top-[29%] w-[39%] rounded-2xl border border-white/10 bg-[#eee8dd] p-3 text-black shadow-2xl sm:p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/45">
              {copy.surface}
            </p>
            <p className="mt-2 font-mono text-sm font-black sm:text-base">{copy.dimensions}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
              <div className="h-full w-[72%] rounded-full bg-accent" />
            </div>
            <p className="mt-2 text-[9px] font-semibold text-black/50">{copy.unverified}</p>
          </div>

          <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md sm:p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
                {copy.quality}
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-xl font-black uppercase sm:text-2xl">{copy.qualityValue}</span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-black text-emerald-300">
                  01
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md sm:p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">{copy.dpi}</p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="font-mono text-xl font-black sm:text-2xl">254</span>
                <span className="text-[9px] font-bold text-white/40">{copy.physicalSize}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {copy.saved}
          </span>
          <span>3D / 2D</span>
        </div>
      </div>
    </div>
  );
};
