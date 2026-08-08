import type { LocalizedText } from '@/config/brand';

export interface GuideMeasurementStep {
  id: string;
  index: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface GuideMethod {
  id: string;
  name: LocalizedText;
  summary: LocalizedText;
  bestFor: LocalizedText;
  tradeoff: LocalizedText;
}

export interface GuidePolicy {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface GuideFaq {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export const STUDIO_GUIDE_CONTENT = {
  hero: {
    eyebrow: {
      en: 'Studio guide — verified information only',
      ar: 'دليل الستوديو — بس المعلومات المؤكدة',
    },
    title: {
      en: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.',
      ar: 'اعرف شنو المؤكد قبل لا تبدأ التصميم.',
    },
    description: {
      en: 'This guide separates useful preparation advice from details that still require a real garment, print shop, or business decision. Nothing here pretends the local prototype can accept an order.',
      ar: 'هذا الدليل يفرّق بين نصائح التجهيز المفيدة وبين التفاصيل اللي بعدها تحتاج قطعة حقيقية أو مطبعة أو قرار من المشروع. النسخة المحلية ما تدّعي إنها تستلم طلب حقيقي.',
    },
    primaryCta: {
      en: 'Browse model-ready garments',
      ar: 'شوف القطع الجاهزة للمحرر',
    },
    secondaryCta: {
      en: 'Open my saved designs',
      ar: 'افتح تصاميمي المحفوظة',
    },
  },
  navigation: {
    label: { en: 'Guide sections', ar: 'أقسام الدليل' },
    items: [
      { id: 'status', href: '#status', label: { en: 'Current status', ar: 'الحالة الحالية' } },
      { id: 'sizing', href: '#sizing', label: { en: 'Sizing', ar: 'القياسات' } },
      { id: 'methods', href: '#methods', label: { en: 'Print methods', ar: 'طرق الطباعة' } },
      {
        id: 'preparation',
        href: '#preparation',
        label: { en: 'Artwork prep', ar: 'تجهيز التصميم' },
      },
      { id: 'policies', href: '#policies', label: { en: 'Prototype limits', ar: 'حدود النسخة' } },
      { id: 'faq', href: '#faq', label: { en: 'FAQ', ar: 'الأسئلة' } },
    ],
  },
  expectations: {
    eyebrow: { en: 'Current storefront status', ar: 'حالة الواجهة الحالية' },
    title: {
      en: 'WHAT THE LOCAL PREVIEW CAN — AND CANNOT — CONFIRM',
      ar: 'شنو تگدر المعاينة المحلية تأكده، وشنو بعده يحتاج تحقق؟',
    },
    items: [
      {
        id: 'price',
        title: { en: 'Displayed prices', ar: 'الأسعار المعروضة' },
        verified: false,
        description: {
          en: 'Prices are local interface configuration. They are not a live quotation and are not checked against stock, print method, quantity, or delivery.',
          ar: 'الأسعار إعدادات محلية داخل الواجهة، مو عرض سعر مباشر، وما مرتبطة بالمخزون أو طريقة الطباعة أو الكمية أو التوصيل.',
        },
      },
      {
        id: 'timing',
        title: { en: 'Production and delivery time', ar: 'مدة الإنتاج والتوصيل' },
        verified: false,
        description: {
          en: 'No production or delivery promise is configured yet. Timing must be confirmed after the garment, quantity, artwork, and print process are known.',
          ar: 'ماكو مدة إنتاج أو توصيل مؤكدة حالياً. الوقت ينحسب بعد ما تتحدد القطعة والكمية والتصميم وطريقة الطباعة.',
        },
      },
      {
        id: 'editor',
        title: { en: 'Editor capability', ar: 'إمكانيات المحرر' },
        verified: true,
        description: {
          en: 'The Classic T-shirt currently supports the complete local editor, front/back surfaces, quality checks, recovery, and export files.',
          ar: 'التيشيرت الكلاسيك هو المنتج الوحيد الجاهز حالياً للمحرر الكامل، مع الأمام والخلف، فحص الجودة، الاسترجاع، وملفات التصدير.',
        },
      },
      {
        id: 'order',
        title: { en: 'Draft transmission', ar: 'إرسال المسودة' },
        verified: true,
        description: {
          en: 'The application saves a draft on this device. It does not transmit, charge for, approve, or fulfil a real order.',
          ar: 'التطبيق يحفظ مسودة على جهازك فقط. ما يرسلها للستوديو، وما يستلم دفع، وما يعتمد أو ينفذ طلب حقيقي.',
        },
      },
    ],
  },
  sizing: {
    eyebrow: { en: 'Size preparation', ar: 'تجهيز القياس' },
    title: { en: 'MEASURE A GARMENT — NOT YOUR BODY.', ar: 'قيس قطعة ملابس، مو جسمك.' },
    description: {
      en: 'Until the exact blank and its size run are physically measured, generic chest and length numbers would be misleading. Use the workflow below to compare a garment you already like.',
      ar: 'لحد ما نقيس القطعة المعتمدة فعلياً بكل المقاسات، أي أرقام عامة للصدر والطول راح تكون مضللة. استخدم الخطوات أدناه وقارن بقطعة مرتاح على قياسها.',
    },
    pendingTitle: {
      en: 'Exact garment chart pending',
      ar: 'جدول القياسات الحقيقي بعده قيد التأكيد',
    },
    pendingDescription: {
      en: 'The final chart needs the approved garment blank, every offered size, a consistent measuring method, and an allowed manufacturing tolerance.',
      ar: 'الجدول النهائي يحتاج القطعة المعتمدة، كل المقاسات اللي راح تنعرض، طريقة قياس ثابتة، ونسبة سماح واضحة لاختلاف التصنيع.',
    },
    steps: [
      {
        id: 'chest',
        index: '01',
        title: { en: 'Chest width', ar: 'عرض الصدر' },
        description: {
          en: 'Lay the garment flat and measure straight from armpit seam to armpit seam without stretching the fabric.',
          ar: 'افرد القطعة على سطح مستوي وقيس بخط مستقيم من خياطة إبط إلى خياطة الإبط الثاني، بدون ما تشد القماش.',
        },
      },
      {
        id: 'length',
        index: '02',
        title: { en: 'Body length', ar: 'طول القطعة' },
        description: {
          en: 'Measure from the highest shoulder point beside the collar down to the bottom hem.',
          ar: 'قيس من أعلى نقطة بالكتف يم الياقة إلى نهاية الحاشية السفلية.',
        },
      },
      {
        id: 'sleeve',
        index: '03',
        title: { en: 'Sleeve reference', ar: 'قياس الكم' },
        description: {
          en: 'Measure from the shoulder seam to the sleeve edge. Use this only when the product has an approved sleeve shape.',
          ar: 'قيس من خياطة الكتف إلى نهاية الكم. اعتمد هذا القياس فقط من يكون شكل كم المنتج الحقيقي محدد ومعتمد.',
        },
      },
      {
        id: 'compare',
        index: '04',
        title: { en: 'Compare like with like', ar: 'قارن نفس نوع وقصّة القطعة' },
        description: {
          en: 'Compare the same garment type and fit. A classic T-shirt, oversized tee, hoodie, and vest should not share one generic chart.',
          ar: 'قارن قطعة من نفس النوع والقصّة. التيشيرت الكلاسيك والأوفرسايز والهودي والفيست ما يصير يشتركون بجدول عام واحد.',
        },
      },
    ] satisfies GuideMeasurementStep[],
  },
  methods: {
    eyebrow: { en: 'Printing-method reference', ar: 'مرجع طرق الطباعة' },
    title: { en: 'UNDERSTAND THE TRADE-OFFS.', ar: 'اعرف مزايا وحدود كل طريقة.' },
    description: {
      en: 'These are general preparation notes, not a claim that every method is currently offered. The final process must be chosen after the garment, artwork, quantity, and supplier are confirmed.',
      ar: 'هذه معلومات عامة للتجهيز، مو ادعاء إن كل الطرق متوفرة حالياً. الطريقة النهائية تنحدد بعد تأكيد القطعة والتصميم والكمية والمجهّز.',
    },
    referenceLabel: { en: 'Reference only', ar: 'مرجع عام' },
    items: [
      {
        id: 'dtf',
        name: { en: 'DTF transfer', ar: 'طباعة DTF' },
        summary: {
          en: 'A printed film is heat-applied to the garment and can reproduce detailed, multi-colour artwork.',
          ar: 'ينطبع التصميم على فيلم خاص، وبعدها ينكبس حرارياً على القطعة. الطريقة تگدر تنقل تفاصيل وألوان متعددة.',
        },
        bestFor: {
          en: 'Detailed artwork, gradients, smaller quantities, and varied garment colours.',
          ar: 'التصاميم التفصيلية، التدرجات، الكميات القليلة، وألوان القطع المختلفة.',
        },
        tradeoff: {
          en: 'The transfer creates a surface layer whose feel and durability depend on the film, ink, press settings, and care.',
          ar: 'تبقى طبقة محسوسة على سطح القماش، وملمسها وعمرها يعتمد على الفيلم والحبر وإعدادات الكبس وطريقة العناية.',
        },
      },
      {
        id: 'screen',
        name: { en: 'Screen printing', ar: 'طباعة سلك سكرين' },
        summary: {
          en: 'Ink is pushed through prepared screens, normally with one screen for each colour or effect.',
          ar: 'الحبر يمر من خلال شبلونات مجهزة، وغالباً كل لون أو تأثير يحتاج شبلون خاص.',
        },
        bestFor: {
          en: 'Repeated designs, stronger spot colours, and larger quantities where setup is justified.',
          ar: 'التصاميم المتكررة، الألوان الصريحة، والكميات الأكبر اللي تبرر وقت وكلفة التجهيز.',
        },
        tradeoff: {
          en: 'Setup increases with colour count and complexity, so it is not automatically the best choice for every small run.',
          ar: 'التجهيز يزيد كلما زادت الألوان والتفاصيل، لذلك مو دائماً أفضل خيار للكميات القليلة.',
        },
      },
      {
        id: 'embroidery',
        name: { en: 'Embroidery', ar: 'التطريز' },
        summary: {
          en: 'Thread is stitched into a compatible garment using a digitized stitch file rather than a normal print image.',
          ar: 'الخيط ينخاط داخل قطعة مناسبة باستخدام ملف تطريز رقمي، مو نفس ملف الصورة الاعتيادي المستخدم للطباعة.',
        },
        bestFor: {
          en: 'Logos, names, badges, caps, polos, and garments that can support the stitch density.',
          ar: 'الشعارات، الأسماء، الشارات، الكابات، البولو، والقطع اللي تتحمل كثافة الغرز.',
        },
        tradeoff: {
          en: 'Very small text, fine gradients, and large solid areas may need simplification and specialist digitizing.',
          ar: 'النصوص الصغيرة جداً، التدرجات الناعمة، والمساحات الكبيرة ممكن تحتاج تبسيط وتجهيز احترافي لملف الغرز.',
        },
      },
    ] satisfies GuideMethod[],
  },
  preparation: {
    eyebrow: { en: 'Artwork handoff checklist', ar: 'قائمة تجهيز التصميم' },
    title: { en: 'PREPARE A DRAFT THAT CAN BE REVIEWED.', ar: 'جهّز مسودة واضحة وسهلة للمراجعة.' },
    items: [
      {
        en: 'Use the highest-resolution original available; avoid screenshots and repeatedly forwarded images.',
        ar: 'استخدم أعلى نسخة دقة متوفرة، وابتعد عن السكرينشوت والصور اللي انضغطت أو انرسلت أكثر من مرة.',
      },
      {
        en: 'Remove unwanted backgrounds and check transparent padding around the visible artwork.',
        ar: 'شيل الخلفية غير المطلوبة، وراجع إذا أكو فراغ شفاف كبير حول التصميم الظاهر.',
      },
      {
        en: 'Review physical width, height, effective DPI, and edge warnings inside the editor.',
        ar: 'راجع العرض والارتفاع بالسنتيمتر، ودقة DPI الفعلية، وتنبيهات الحواف داخل المحرر.',
      },
      {
        en: 'Use clear layer names and keep front and back artwork on their correct surfaces.',
        ar: 'سمِّ الطبقات بوضوح، وخلي تصميم الأمام والخلف كل واحد بجهته الصحيحة.',
      },
      {
        en: 'Export the PNG proof and JSON specification only after the draft shows its latest saved state.',
        ar: 'صدّر إثبات PNG وملف JSON بس بعد ما تتأكد إن المسودة تعرض آخر حالة محفوظة.',
      },
    ] satisfies LocalizedText[],
  },
  policies: {
    eyebrow: { en: 'Prototype policies', ar: 'حدود النسخة الحالية' },
    title: { en: 'CLEAR LIMITS BUILD TRUST.', ar: 'الحدود الواضحة تبني ثقة أكبر.' },
    items: [
      {
        id: 'local-data',
        title: { en: 'Local data', ar: 'الحفظ المحلي' },
        description: {
          en: 'Drafts and original artwork are stored in this browser. Clearing browser storage can permanently remove them.',
          ar: 'المسودات وملفات التصميم الأصلية تنحفظ بهذا المتصفح. مسح بيانات الموقع ممكن يحذفها نهائياً.',
        },
      },
      {
        id: 'rights',
        title: { en: 'Artwork responsibility', ar: 'حقوق استخدام التصميم' },
        description: {
          en: 'Only prepare artwork you own or have permission to use. The local app cannot verify copyright, trademark, or customer authorization.',
          ar: 'جهّز بس تصميم تملكه أو عندك إذن تستخدمه. التطبيق المحلي ما يگدر يتحقق من حقوق النشر أو العلامات التجارية أو موافقة صاحب التصميم.',
        },
      },
      {
        id: 'colour',
        title: { en: 'Screen colour is a preview', ar: 'لون الشاشة مجرد معاينة' },
        description: {
          en: 'Display calibration, fabric colour, ink, transfer material, and lighting can all change the printed appearance.',
          ar: 'معايرة الشاشة، لون القماش، الحبر، مادة النقل، والإضاءة كلها ممكن تغيّر شكل النتيجة المطبوعة.',
        },
      },
      {
        id: 'calibration',
        title: { en: 'Physical calibration required', ar: 'القياسات تحتاج معايرة فعلية' },
        description: {
          en: 'The current print-area values are planning values until checked against the exact garment and production equipment.',
          ar: 'قيم مساحة الطباعة الحالية للتخطيط فقط، لحد ما تنفحص على نفس القطعة الحقيقية ومعدات الإنتاج.',
        },
      },
      {
        id: 'commerce',
        title: { en: 'No commerce transaction', ar: 'ماكو معاملة بيع حالياً' },
        description: {
          en: 'The local preparation screen does not create a confirmed order, charge money, reserve stock, promise delivery, or establish a returns agreement.',
          ar: 'صفحة تجهيز المسودة ما تنشئ طلب مؤكد، وما تستلم مبلغ، وما تحجز مخزون، وما توعد بتوصيل أو تفعّل سياسة إرجاع.',
        },
      },
    ] satisfies GuidePolicy[],
  },
  faq: {
    eyebrow: { en: 'Frequently asked questions', ar: 'الأسئلة المتكررة' },
    title: { en: 'THE IMPORTANT ANSWERS, UP FRONT.', ar: 'الأجوبة المهمة من البداية.' },
    items: [
      {
        id: 'real-order',
        question: {
          en: 'Does saving the draft send a real order?',
          ar: 'هل حفظ المسودة يرسل طلب حقيقي؟',
        },
        answer: {
          en: 'No. It saves a local receipt and marks the design as prepared locally only inside this browser. No studio, payment service, or production team receives it.',
          ar: 'لا. ينحفظ إيصال محلي، وينعلّم التصميم كمجهّز محلياً داخل هذا المتصفح فقط. ما يوصل للستوديو أو خدمة دفع أو فريق إنتاج.',
        },
      },
      {
        id: 'storage',
        question: { en: 'Where is my artwork stored?', ar: 'وين تنحفظ ملفات التصميم؟' },
        answer: {
          en: 'The original file and draft metadata are stored in IndexedDB in the current browser profile. There is no cloud backup or account recovery.',
          ar: 'الملف الأصلي ومعلومات المسودة تنحفظ داخل IndexedDB بملف المستخدم الحالي للمتصفح. ماكو نسخة سحابية أو استرجاع عن طريق حساب.',
        },
      },
      {
        id: 'formats',
        question: { en: 'Which artwork files can I use?', ar: 'شنو صيغ الصور المقبولة؟' },
        answer: {
          en: 'The current editor accepts PNG, JPEG, and WebP files up to 5 MB, then analyzes dimensions, aspect ratio, transparency, and estimated DPI locally.',
          ar: 'المحرر يقبل ملفات PNG وJPEG وWebP لحد 5 MB، وبعدها يحلل الأبعاد ونسبة الصورة والشفافية ودقة DPI محلياً.',
        },
      },
      {
        id: 'sizes',
        question: { en: 'Are the garment measurements final?', ar: 'هل قياسات القطع نهائية؟' },
        answer: {
          en: 'No. The app exposes editor size labels, but exact garment measurements must come from the approved physical blank and should not be guessed.',
          ar: 'لا. التطبيق يعرض أسماء المقاسات داخل المحرر، بس أبعاد القطعة الحقيقية لازم تجي من المنتج المعتمد وما يصير نخمنها.',
        },
      },
      {
        id: 'mobile',
        question: { en: 'Can I design on a phone?', ar: 'أگدر أصمم من الموبايل؟' },
        answer: {
          en: 'Yes. The editor has touch-specific View, Move, and Resize/Rotate modes plus adaptive rendering and a safe 2D fallback.',
          ar: 'إي. المحرر عنده أوضاع لمس منفصلة للمعاينة والتحريك وتغيير الحجم والتدوير، ويا جودة متكيفة ومعاينة 2D احتياطية.',
        },
      },
      {
        id: 'contact',
        question: { en: 'How do I contact the business?', ar: 'شلون أتواصل ويا المشروع؟' },
        answer: {
          en: 'Official contact channels appear only after they are configured and verified. Placeholder phone numbers or dead social links are intentionally not shown.',
          ar: 'قنوات التواصل الرسمية تظهر بس بعد ما تنضاف وتتأكد. أرقام تجريبية أو روابط ما تشتغل ما راح تنعرض.',
        },
      },
    ] satisfies GuideFaq[],
  },
  finalCta: {
    eyebrow: { en: 'Ready to prepare a local draft?', ar: 'جاهز تجهّز مسودة محلية؟' },
    title: { en: 'START WITH VERIFIED GEOMETRY.', ar: 'ابدأ بالموديل اللي نكدر نعتمد عليه.' },
    description: {
      en: 'Open the catalog and choose a garment marked 3D ready. Products waiting for genuine geometry remain visible but locked.',
      ar: 'افتح الكتالوج واختار قطعة مذكور عليها جاهزة 3D. المنتجات اللي بعدها تنتظر موديل حقيقي تبقى ظاهرة بس مقفولة.',
    },
    cta: { en: 'Open the catalog', ar: 'افتح الكتالوج' },
  },
} as const;
