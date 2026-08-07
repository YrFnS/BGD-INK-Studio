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
      ar: 'دليل الستوديو — معلومات مؤكدة فقط',
    },
    title: {
      en: 'KNOW WHAT IS VERIFIED BEFORE YOU DESIGN.',
      ar: 'اعرف شنو المؤكد قبل ما تبدأ التصميم.',
    },
    description: {
      en: 'This guide separates useful preparation advice from details that still require a real garment, print shop, or business decision. Nothing here pretends the local prototype can accept an order.',
      ar: 'هذا الدليل يفرق بين نصائح التجهيز المفيدة وبين التفاصيل اللي تحتاج قطعة حقيقية أو مطبعة أو قرار من المشروع. النسخة المحلية ما تدّعي إنها تستلم طلب حقيقي.',
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
  expectations: {
    eyebrow: { en: 'Current storefront status', ar: 'حالة الواجهة الحالية' },
    title: {
      en: 'WHAT THE LOCAL PREVIEW CAN — AND CANNOT — CONFIRM',
      ar: 'شنو تگدر النسخة المحلية تأكده وشنو بعده يحتاج تحقق',
    },
    items: [
      {
        id: 'price',
        title: { en: 'Displayed prices', ar: 'الأسعار المعروضة' },
        verified: false,
        description: {
          en: 'Prices are local interface configuration. They are not a live quotation and are not checked against stock, print method, quantity, or delivery.',
          ar: 'الأسعار إعدادات محلية للواجهة، مو عرض سعر مباشر، وما مرتبطة بالمخزون أو طريقة الطباعة أو الكمية أو التوصيل.',
        },
      },
      {
        id: 'timing',
        title: { en: 'Production and delivery time', ar: 'مدة الإنتاج والتوصيل' },
        verified: false,
        description: {
          en: 'No production or delivery promise is configured yet. Timing must be confirmed after the garment, quantity, artwork, and print process are known.',
          ar: 'ماكو وعد إنتاج أو توصيل محدد حالياً. المدة لازم تتأكد بعد معرفة القطعة والكمية والتصميم وطريقة الطباعة.',
        },
      },
      {
        id: 'editor',
        title: { en: 'Editor capability', ar: 'إمكانيات المحرر' },
        verified: true,
        description: {
          en: 'The Classic T-shirt currently supports the complete local editor, front/back surfaces, quality checks, recovery, and export files.',
          ar: 'التيشيرت الكلاسيك يدعم حالياً المحرر المحلي الكامل، الأمام والخلف، فحص الجودة، الاسترجاع، وملفات التصدير.',
        },
      },
      {
        id: 'order',
        title: { en: 'Order acceptance', ar: 'استلام الطلبات' },
        verified: true,
        description: {
          en: 'The application saves a draft on this device. It does not submit, charge for, approve, or fulfil a real order.',
          ar: 'التطبيق يحفظ مسودة على هذا الجهاز. ما يرسل طلب حقيقي، وما يستلم دفع، وما يعتمد أو ينفذ الطلب.',
        },
      },
    ],
  },
  sizing: {
    eyebrow: { en: 'Size preparation', ar: 'تجهيز القياس' },
    title: { en: 'MEASURE A GARMENT — NOT YOUR BODY.', ar: 'قيس قطعة ملابس مو جسمك.' },
    description: {
      en: 'Until the exact blank and its size run are physically measured, generic chest and length numbers would be misleading. Use the workflow below to compare a garment you already like.',
      ar: 'لحد ما نقيس القطعة الحقيقية وكل قياساتها، أي أرقام عامة للصدر والطول راح تكون مضللة. استخدم الخطوات أدناه وقارن بقطعة مرتاح عليها.',
    },
    pendingTitle: { en: 'Exact garment chart pending', ar: 'جدول القياسات الحقيقي قيد التأكيد' },
    pendingDescription: {
      en: 'The final chart needs the approved garment blank, every offered size, a consistent measuring method, and an allowed manufacturing tolerance.',
      ar: 'الجدول النهائي يحتاج القطعة المعتمدة، كل القياسات المتوفرة، طريقة قياس ثابتة، ونسبة سماح للتفاوت بالتصنيع.',
    },
    steps: [
      {
        id: 'chest',
        index: '01',
        title: { en: 'Chest width', ar: 'عرض الصدر' },
        description: {
          en: 'Lay the garment flat and measure straight from armpit seam to armpit seam without stretching the fabric.',
          ar: 'افرد القطعة على سطح مستوي وقيس بخط مستقيم من خياطة الإبط إلى خياطة الإبط بدون شد القماش.',
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
          ar: 'قيس من خياطة الكتف إلى نهاية الكم. استخدم هذا القياس فقط من يكون شكل الكم معتمد للقطعة.',
        },
      },
      {
        id: 'compare',
        index: '04',
        title: { en: 'Compare like with like', ar: 'قارن قطعة بقطعة مشابهة' },
        description: {
          en: 'Compare the same garment type and fit. A classic T-shirt, oversized tee, hoodie, and vest should not share one generic chart.',
          ar: 'قارن نفس نوع وقصة القطعة. التيشيرت الكلاسيك والأوفرسايز والهودي والفيست ما يصير يشتركون بجدول عام واحد.',
        },
      },
    ] satisfies GuideMeasurementStep[],
  },
  methods: {
    eyebrow: { en: 'Printing-method reference', ar: 'مرجع طرق الطباعة' },
    title: { en: 'UNDERSTAND THE TRADE-OFFS.', ar: 'اعرف فرق كل طريقة.' },
    description: {
      en: 'These are general preparation notes, not a claim that every method is currently offered. The final process must be chosen after the garment, artwork, quantity, and supplier are confirmed.',
      ar: 'هذه ملاحظات عامة للتجهيز، مو ادعاء إن كل الطرق متوفرة حالياً. الطريقة النهائية تنحدد بعد تأكيد القطعة والتصميم والكمية والمجهز.',
    },
    referenceLabel: { en: 'Reference only', ar: 'للمعلومة فقط' },
    items: [
      {
        id: 'dtf',
        name: { en: 'DTF transfer', ar: 'طباعة DTF' },
        summary: {
          en: 'A printed film is heat-applied to the garment and can reproduce detailed, multi-colour artwork.',
          ar: 'ينطبع التصميم على فلم وبعدها ينكبس حرارياً على القطعة، ومناسب للتفاصيل والألوان المتعددة.',
        },
        bestFor: {
          en: 'Detailed artwork, gradients, smaller quantities, and varied garment colours.',
          ar: 'التصاميم التفصيلية والتدرجات والكميات القليلة وألوان قطع مختلفة.',
        },
        tradeoff: {
          en: 'The transfer creates a surface layer whose feel and durability depend on the film, ink, press settings, and care.',
          ar: 'الطباعة تصير كطبقة على السطح، وملمسها وعمرها يعتمد على الفلم والحبر وإعدادات الكبس وطريقة الغسل.',
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
          ar: 'التصاميم المتكررة والألوان الصريحة والكميات الأكبر اللي تبرر وقت التجهيز.',
        },
        tradeoff: {
          en: 'Setup increases with colour count and complexity, so it is not automatically the best choice for every small run.',
          ar: 'التجهيز يزيد كلما زادت الألوان والتعقيد، لذلك مو دائماً أفضل اختيار للكميات القليلة.',
        },
      },
      {
        id: 'embroidery',
        name: { en: 'Embroidery', ar: 'تطريز' },
        summary: {
          en: 'Thread is stitched into a compatible garment using a digitized stitch file rather than a normal print image.',
          ar: 'الخيط ينخاط داخل قطعة مناسبة باستخدام ملف غرز مخصص، مو نفس ملف صورة الطباعة الاعتيادي.',
        },
        bestFor: {
          en: 'Logos, names, badges, caps, polos, and garments that can support the stitch density.',
          ar: 'الشعارات والأسماء والشارات والكابات والبولو والقطع اللي تتحمل كثافة الغرز.',
        },
        tradeoff: {
          en: 'Very small text, fine gradients, and large solid areas may need simplification and specialist digitizing.',
          ar: 'النصوص الصغيرة جداً والتدرجات والمساحات الكبيرة ممكن تحتاج تبسيط وتجهيز احترافي لملف الغرز.',
        },
      },
    ] satisfies GuideMethod[],
  },
  preparation: {
    eyebrow: { en: 'Artwork handoff checklist', ar: 'قائمة تجهيز التصميم' },
    title: { en: 'PREPARE A DRAFT THAT CAN BE REVIEWED.', ar: 'جهز مسودة قابلة للمراجعة.' },
    items: [
      {
        en: 'Use the highest-resolution original available; avoid screenshots and repeatedly forwarded images.',
        ar: 'استخدم أعلى نسخة دقة متوفرة، وابتعد عن السكرينشوت والصور المعاد إرسالها عدة مرات.',
      },
      {
        en: 'Remove unwanted backgrounds and check transparent padding around the visible artwork.',
        ar: 'شيل الخلفية غير المطلوبة وراجع الفراغ الشفاف حول التصميم الظاهر.',
      },
      {
        en: 'Review physical width, height, effective DPI, and edge warnings inside the editor.',
        ar: 'راجع العرض والطول الحقيقي والـDPI وتنبيهات الحواف داخل المحرر.',
      },
      {
        en: 'Use clear layer names and keep front and back artwork on their correct surfaces.',
        ar: 'سمِّ الطبقات بوضوح وخلي تصميم الأمام والخلف كل واحد بجهته الصحيحة.',
      },
      {
        en: 'Export the PNG proof and JSON specification only after the draft shows its latest saved state.',
        ar: 'صدّر إثبات PNG وملف JSON فقط بعد ما تتأكد إن المسودة تعرض آخر حالة محفوظة.',
      },
    ] satisfies LocalizedText[],
  },
  policies: {
    eyebrow: { en: 'Prototype policies', ar: 'سياسات النسخة التجريبية' },
    title: { en: 'CLEAR LIMITS BUILD TRUST.', ar: 'الحدود الواضحة تبني ثقة.' },
    items: [
      {
        id: 'local-data',
        title: { en: 'Local data', ar: 'البيانات المحلية' },
        description: {
          en: 'Drafts and original artwork are stored in this browser. Clearing browser storage can permanently remove them.',
          ar: 'المسودات والتصاميم الأصلية تنحفظ بهذا المتصفح. مسح بيانات المتصفح ممكن يحذفها نهائياً.',
        },
      },
      {
        id: 'rights',
        title: { en: 'Artwork responsibility', ar: 'مسؤولية التصميم' },
        description: {
          en: 'Only prepare artwork you own or have permission to use. The local app cannot verify copyright, trademark, or customer authorization.',
          ar: 'جهز فقط تصميم تملكه أو عندك إذن تستخدمه. التطبيق المحلي ما يگدر يتحقق من حقوق النشر أو العلامة أو موافقة الزبون.',
        },
      },
      {
        id: 'colour',
        title: { en: 'Screen colour is a preview', ar: 'لون الشاشة مجرد معاينة' },
        description: {
          en: 'Display calibration, fabric colour, ink, transfer material, and lighting can all change the printed appearance.',
          ar: 'معايرة الشاشة ولون القماش والحبر ومادة النقل والإضاءة كلها ممكن تغير شكل النتيجة المطبوعة.',
        },
      },
      {
        id: 'calibration',
        title: { en: 'Physical calibration required', ar: 'القياس الحقيقي يحتاج معايرة' },
        description: {
          en: 'The current print-area values are planning values until checked against the exact garment and production equipment.',
          ar: 'قيم مساحة الطباعة الحالية للتخطيط فقط لحد ما تنفحص على القطعة الحقيقية ومعدات الإنتاج.',
        },
      },
      {
        id: 'commerce',
        title: { en: 'No commerce transaction', ar: 'ماكو معاملة بيع حالياً' },
        description: {
          en: 'The local checkout does not create a confirmed order, charge money, reserve stock, promise delivery, or establish a returns agreement.',
          ar: 'صفحة المعلومات المحلية ما تنشئ طلب مؤكد، وما تستلم مبلغ، وما تحجز مخزون، وما توعد بتوصيل أو سياسة إرجاع.',
        },
      },
    ] satisfies GuidePolicy[],
  },
  faq: {
    eyebrow: { en: 'Frequently asked questions', ar: 'أسئلة متكررة' },
    title: { en: 'THE IMPORTANT ANSWERS, UP FRONT.', ar: 'الأجوبة المهمة من البداية.' },
    items: [
      {
        id: 'real-order',
        question: { en: 'Does checkout send a real order?', ar: 'هل صفحة الطلب ترسل طلب حقيقي؟' },
        answer: {
          en: 'No. It saves a local draft summary and marks the design as submitted only inside this browser. No shop, payment service, or production team receives it.',
          ar: 'لا. هي تحفظ ملخص مسودة محلي وتعلّم التصميم كمرسل داخل هذا المتصفح فقط. ما يوصل لمحل أو دفع أو فريق إنتاج.',
        },
      },
      {
        id: 'storage',
        question: { en: 'Where is my artwork stored?', ar: 'وين ينحفظ التصميم؟' },
        answer: {
          en: 'The original file and draft metadata are stored in IndexedDB in the current browser profile. There is no cloud backup or account recovery.',
          ar: 'الملف الأصلي ومعلومات المسودة تنحفظ بـIndexedDB داخل بروفايل المتصفح الحالي. ماكو نسخة سحابية أو استرجاع بحساب.',
        },
      },
      {
        id: 'formats',
        question: { en: 'Which artwork files can I use?', ar: 'شنو صيغ الصور المقبولة؟' },
        answer: {
          en: 'The current editor accepts PNG, JPEG, and WebP files up to 5 MB, then analyzes dimensions, aspect ratio, transparency, and estimated DPI locally.',
          ar: 'المحرر الحالي يقبل PNG وJPEG وWebP لحد 5 ميغابايت، وبعدها يحلل الأبعاد والنسبة والشفافية والـDPI محلياً.',
        },
      },
      {
        id: 'sizes',
        question: { en: 'Are the garment measurements final?', ar: 'هل قياسات القطع نهائية؟' },
        answer: {
          en: 'No. The app exposes editor size labels, but exact garment measurements must come from the approved physical blank and should not be guessed.',
          ar: 'لا. التطبيق يعرض أسماء القياسات داخل المحرر، بس الأبعاد الحقيقية لازم تجي من القطعة المعتمدة وما يصير نخمنها.',
        },
      },
      {
        id: 'mobile',
        question: { en: 'Can I design on a phone?', ar: 'أگدر أصمم من الموبايل؟' },
        answer: {
          en: 'Yes. The editor has touch-specific View, Move, and Resize/Rotate modes plus adaptive rendering and a safe 2D fallback.',
          ar: 'نعم. المحرر عنده أوضاع لمس منفصلة للعرض والتحريك والتكبير/التدوير، وجودة متكيفة ومعاينة 2D احتياطية.',
        },
      },
      {
        id: 'contact',
        question: { en: 'How do I contact the business?', ar: 'شلون أتواصل ويا المشروع؟' },
        answer: {
          en: 'Official contact channels appear only after they are configured and verified. Placeholder phone numbers or dead social links are intentionally not shown.',
          ar: 'قنوات التواصل الرسمية تظهر فقط بعد ما تنضاف وتتأكد. أرقام تجريبية أو روابط ما تشتغل ما راح تنعرض.',
        },
      },
    ] satisfies GuideFaq[],
  },
  finalCta: {
    eyebrow: { en: 'Ready to prepare a local draft?', ar: 'جاهز تجهز مسودة محلية؟' },
    title: { en: 'START WITH VERIFIED GEOMETRY.', ar: 'ابدأ بموديل هندسته معتمدة.' },
    description: {
      en: 'Open the catalog and choose a garment marked 3D ready. Products waiting for genuine geometry remain visible but locked.',
      ar: 'افتح الكتالوج واختار قطعة مكتوب عليها جاهزة 3D. القطع اللي تنتظر موديل حقيقي تبقى ظاهرة بس مقفولة.',
    },
    cta: { en: 'Open the catalog', ar: 'افتح الكتالوج' },
  },
} as const;
