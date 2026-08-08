import { BRAND, type LocalizedText } from '@/config/brand';

export type StudioIconId = 'garment' | 'placement' | 'export' | 'local' | 'surface' | 'language';

export interface StorefrontProofPoint {
  id: string;
  icon: StudioIconId;
  value: LocalizedText;
  label: LocalizedText;
}

export interface StorefrontProcessStep {
  id: string;
  index: string;
  icon: StudioIconId;
  title: LocalizedText;
  description: LocalizedText;
}

export interface ProductPresentation {
  index: string;
  collectionCode: string;
  description: LocalizedText;
  readyNote: LocalizedText;
  pendingNote: LocalizedText;
}

export const STOREFRONT_CONTENT = {
  hero: {
    eyebrow: {
      en: `${BRAND.displayName} — Baghdad design studio`,
      ar: `${BRAND.displayName} — ستوديو تصميم في بغداد`,
    },
    titlePrimary: { en: 'YOUR ARTWORK.', ar: 'تصميمك.' },
    titleAccent: { en: 'BUILT FOR THE GARMENT.', ar: 'مجهّز للقطعة نفسها.' },
    description: {
      en: 'Choose a model-ready garment, place artwork on the front or back, inspect its physical size and image quality, then keep or export the draft from your device.',
      ar: 'اختار قطعة جاهزة للمحرر، رتّب التصميم على الأمام أو الخلف، راجع حجمه وجودة الصورة، وبعدها احفظ المسودة أو صدّرها من جهازك.',
    },
    primaryCta: { en: 'Open the studio', ar: 'افتح الستوديو' },
    secondaryCta: { en: 'My saved designs', ar: 'تصاميمي المحفوظة' },
    privacy: {
      en: 'No account. No remote upload. Artwork stays on this device.',
      ar: 'ما يحتاج حساب وماكو رفع للسيرفر. التصميم يبقى على جهازك.',
    },
  },
  proofPoints: [
    {
      id: 'surfaces',
      icon: 'surface',
      value: { en: 'Front + back', ar: 'أمام + خلف' },
      label: { en: 'Configured print surfaces', ar: 'جهات طباعة محددة' },
    },
    {
      id: 'recovery',
      icon: 'local',
      value: { en: 'Local recovery', ar: 'حفظ واسترجاع محلي' },
      label: { en: 'Reopen drafts in this browser', ar: 'ارجع افتح المسودة من نفس المتصفح' },
    },
    {
      id: 'handoff',
      icon: 'export',
      value: { en: 'PNG + JSON', ar: 'PNG + JSON' },
      label: { en: 'Production handoff files', ar: 'ملفات تسليم للمراجعة والإنتاج' },
    },
    {
      id: 'language',
      icon: 'language',
      value: { en: 'Arabic / English', ar: 'عربي / إنكليزي' },
      label: { en: 'RTL-aware interface', ar: 'واجهة مضبوطة لاتجاه العربي' },
    },
  ] satisfies StorefrontProofPoint[],
  process: {
    eyebrow: { en: 'A deliberate workflow', ar: 'خطوات واضحة ومقصودة' },
    title: { en: 'FROM BLANK TO WORKING DRAFT', ar: 'من القطعة إلى مسودة قابلة للمراجعة' },
    description: {
      en: 'The studio focuses on decisions you can inspect: the garment, the surface, the physical artwork size, and the quality of the source image.',
      ar: 'الستوديو يركز على أشياء تگدر تراجعها بنفسك: القطعة، جهة الطباعة، حجم التصميم، وجودة الصورة الأصلية.',
    },
    steps: [
      {
        id: 'choose',
        index: '01',
        icon: 'garment',
        title: { en: 'Choose approved geometry', ar: 'اختار موديل معتمد' },
        description: {
          en: 'Only garments with genuine configured 3D geometry can enter the editor. Unfinished models stay visibly locked.',
          ar: 'بس القطع اللي عندها موديل 3D حقيقي ومجهز تدخل للمحرر. البقية تبقى واضحة ومقفولة لحد ما تجهز.',
        },
      },
      {
        id: 'place',
        index: '02',
        icon: 'placement',
        title: { en: 'Place and inspect', ar: 'رتّب وراجع' },
        description: {
          en: 'Move, resize, rotate, switch surfaces, and review centimeters, source pixels, effective DPI, and edge warnings.',
          ar: 'حرّك، كبّر، دوّر، بدّل الجهة، وراجع السنتيمترات، أبعاد الصورة، دقة DPI، وتنبيهات الحواف.',
        },
      },
      {
        id: 'save',
        index: '03',
        icon: 'export',
        title: { en: 'Save or hand off', ar: 'احفظ أو صدّر' },
        description: {
          en: 'Recover the draft locally, download a visual proof and machine-readable specification, or continue to draft preparation.',
          ar: 'احفظ المسودة محلياً، نزّل إثبات بصري وملف مواصفات، أو كمّل تجهيز المسودة والكمية.',
        },
      },
    ] satisfies StorefrontProcessStep[],
  },
  evidence: {
    eyebrow: { en: 'Evidence before marketing', ar: 'الدليل قبل التسويق' },
    title: {
      en: 'WE SHOW WHAT IS READY — AND WHAT IS NOT.',
      ar: 'نوضح شنو جاهز وشنو بعده يحتاج شغل.',
    },
    description: {
      en: 'The storefront does not invent customer reviews, material specifications, delivery promises, or production methods that have not been confirmed.',
      ar: 'الواجهة ما تخترع تقييمات زبائن أو مواصفات خامة أو وعود توصيل أو طرق طباعة ما تم تأكيدها.',
    },
    readyTitle: { en: 'Ready now', ar: 'جاهز حالياً' },
    readyBadge: { en: 'Live', ar: 'متاح' },
    readyItems: [
      {
        en: 'Classic T-shirt 3D editor with front and back surfaces',
        ar: 'محرر 3D للتيشيرت الكلاسيك مع الأمام والخلف',
      },
      {
        en: 'Local artwork analysis, undo/redo, and draft recovery',
        ar: 'تحليل محلي للصورة، تراجع وإعادة، واسترجاع المسودات',
      },
      {
        en: 'Multi-surface PNG proof and URL-free JSON specification',
        ar: 'إثبات PNG للجهات وملف JSON بدون روابط مؤقتة',
      },
    ] satisfies LocalizedText[],
    guardrailTitle: { en: 'Deliberate guardrails', ar: 'حدود واضحة ومقصودة' },
    guardrailBadge: { en: 'Honest', ar: 'واضح' },
    guardrailItems: [
      {
        en: 'Unapproved garment models remain unavailable',
        ar: 'الموديلات غير المعتمدة تبقى غير متاحة',
      },
      {
        en: 'Physical print measurements remain marked unverified',
        ar: 'قياسات الطباعة تبقى مذكورة كغير مؤكدة',
      },
      {
        en: 'Drafts remain local and are not treated as real orders',
        ar: 'المسودات تبقى محلية وما تنحسب طلبات حقيقية',
      },
    ] satisfies LocalizedText[],
  },
  finalCta: {
    eyebrow: {
      en: 'Start with the model we can stand behind',
      ar: 'ابدأ بالموديل اللي نكدر نعتمد عليه',
    },
    title: { en: 'BUILD YOUR FIRST LOCAL DRAFT.', ar: 'جهّز أول مسودة على جهازك.' },
    description: {
      en: 'The Classic T-shirt is currently the approved model for the complete editor and production-file workflow.',
      ar: 'التيشيرت الكلاسيك هو حالياً الموديل المعتمد لكل خطوات التصميم وملفات التسليم.',
    },
    cta: { en: 'Choose the Classic T-shirt', ar: 'اختار التيشيرت الكلاسيك' },
  },
  catalog: {
    eyebrow: { en: 'Local garment configuration', ar: 'إعدادات القطع المحلية' },
    title: { en: 'SELECT A VERIFIED CANVAS', ar: 'اختار قطعة جاهزة للمحرر' },
    description: {
      en: 'Every product stays visible, but only garments with approved matching geometry can open in the 3D studio.',
      ar: 'كل القطع تبقى ظاهرة، بس ما يفتح داخل ستوديو 3D إلا المنتج اللي عنده موديل مطابق ومعتمد.',
    },
    readyLabel: { en: '3D ready', ar: 'جاهز 3D' },
    pendingLabel: { en: 'Model pending', ar: 'الموديل قيد التجهيز' },
    unavailableLabel: { en: 'Unavailable', ar: 'غير متوفر' },
    startingAt: { en: 'Starting at', ar: 'السعر المحلي يبدأ من' },
    configuredColors: { en: 'Configured colors', ar: 'الألوان المحددة' },
    localPriceNote: {
      en: 'Prices are local storefront configuration. This preview does not place or accept real orders.',
      ar: 'الأسعار إعدادات محلية للواجهة، مو عرض سعر. هذه النسخة ما ترسل ولا تستلم طلبات حقيقية.',
    },
    readyCount: { en: 'model ready for full editing', ar: 'موديل جاهز للتعديل الكامل' },
  },
} as const;

export const PRODUCT_PRESENTATION: Record<string, ProductPresentation> = {
  'tshirt-classic': {
    index: '01',
    collectionCode: 'CORE / 01',
    description: {
      en: 'The only garment currently approved for full 3D editing, front/back placement, artwork analysis, and local production exports.',
      ar: 'القطعة الوحيدة المعتمدة حالياً للتعديل الكامل 3D، ووضع التصميم أمام وخلف، وتحليل الصورة، وملفات التسليم المحلية.',
    },
    readyNote: { en: 'Complete editor available', ar: 'المحرر الكامل متاح' },
    pendingNote: { en: 'Approved model required', ar: 'يحتاج موديل معتمد' },
  },
  'tee-oversized': {
    index: '02',
    collectionCode: 'LOOSE / 02',
    description: {
      en: 'Kept in the collection direction while genuine oversized geometry and physical print surfaces are prepared.',
      ar: 'موجود ضمن المجموعة لحد ما يجهز موديل أوفرسايز حقيقي ومساحات الطباعة الخاصة بيه.',
    },
    readyNote: { en: 'Complete editor available', ar: 'المحرر الكامل متاح' },
    pendingNote: { en: 'Genuine oversized model required', ar: 'يحتاج موديل أوفرسايز حقيقي' },
  },
  'hoodie-premium': {
    index: '03',
    collectionCode: 'LAYER / 03',
    description: {
      en: 'The hoodie remains visible without borrowing T-shirt geometry. Customization unlocks after its own model is approved.',
      ar: 'الهودي يبقى ظاهر بدون استخدام شكل التيشيرت بداله. التخصيص ينفتح من يصير عنده موديل خاص ومعتمد.',
    },
    readyNote: { en: 'Complete editor available', ar: 'المحرر الكامل متاح' },
    pendingNote: { en: 'Genuine hoodie model required', ar: 'يحتاج موديل هودي حقيقي' },
  },
  'vest-urban': {
    index: '04',
    collectionCode: 'UTILITY / 04',
    description: {
      en: 'An archived collection direction. Stock and matching geometry must both be confirmed before customization can open.',
      ar: 'اتجاه محفوظ للمجموعة. لازم يتأكد التوفر والموديل المطابق قبل ما ينفتح التخصيص.',
    },
    readyNote: { en: 'Complete editor available', ar: 'المحرر الكامل متاح' },
    pendingNote: { en: 'Stock and approved model required', ar: 'يحتاج توفر وموديل معتمد' },
  },
};

export const getProductPresentation = (productId: string): ProductPresentation =>
  PRODUCT_PRESENTATION[productId] ?? {
    index: '--',
    collectionCode: 'LOCAL / --',
    description: { en: 'Local product configuration.', ar: 'إعداد محلي للمنتج.' },
    readyNote: { en: 'Editor available', ar: 'المحرر متاح' },
    pendingNote: { en: 'Approved model required', ar: 'يحتاج موديل معتمد' },
  };
