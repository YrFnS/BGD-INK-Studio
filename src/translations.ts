import { Language } from './types';

type TranslationKey =
  | 'hero.title'
  | 'hero.subtitle'
  | 'hero.cta'
  | 'nav.home'
  | 'nav.catalog'
  | 'nav.designs'
  | 'catalog.title'
  | 'catalog.subtitle'
  | 'catalog.startDesign'
  | 'catalog.soldOut'
  | 'catalog.modelUnavailable'
  | 'product.classic_tshirt'
  | 'product.premium_hoodie'
  | 'product.urban_vest'
  | 'product.oversized_tee'
  | 'customizer.upload'
  | 'customizer.change'
  | 'customizer.remove'
  | 'customizer.notes'
  | 'customizer.notesPlaceholder'
  | 'customizer.addToCart'
  | 'customizer.color'
  | 'customizer.size'
  | 'customizer.scale'
  | 'customizer.interact'
  | 'customizer.exitInteract'
  | 'customizer.surface'
  | 'customizer.surface.front'
  | 'customizer.surface.back'
  | 'customizer.printArea'
  | 'customizer.artworkWidth'
  | 'customizer.modelUnavailable'
  | 'checkout.title'
  | 'checkout.submit'
  | 'checkout.name'
  | 'checkout.phone'
  | 'checkout.area'
  | 'checkout.address'
  | 'checkout.summary'
  | 'checkout.total'
  | 'checkout.selectArea'
  | 'error.required'
  | 'error.phone'
  | 'error.min'
  | 'common.back'
  | 'common.price'
  | 'common.scroll'
  | 'success.title'
  | 'success.message'
  | 'success.orderId'
  | 'success.whatsapp'
  | 'success.home'
  | 'seo.home.title'
  | 'seo.home.description'
  | 'seo.catalog.title'
  | 'seo.catalog.description'
  | 'seo.designs.title'
  | 'seo.designs.description'
  | 'seo.customizer.title'
  | 'seo.customizer.description'
  | 'seo.checkout.title'
  | 'seo.checkout.description'
  | 'home.process.title'
  | 'home.process.step1.title'
  | 'home.process.step1.desc'
  | 'home.process.step2.title'
  | 'home.process.step2.desc'
  | 'home.process.step3.title'
  | 'home.process.step3.desc'
  | 'home.quality.title'
  | 'home.quality.desc'
  | 'home.marquee';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'hero.title': 'DESIGN FOR THE GARMENT',
    'hero.subtitle':
      'Prepare a local apparel design draft with model-aware placement, physical dimensions, source-quality guidance, and recoverable browser storage.',
    'hero.cta': 'OPEN THE STUDIO',
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'nav.designs': 'My Designs',
    'catalog.title': 'SELECT A VERIFIED CANVAS',
    'catalog.subtitle':
      'Every configured product remains visible, while only garments with approved matching 3D geometry can enter the editor.',
    'catalog.startDesign': 'Open editor',
    'catalog.soldOut': 'Unavailable',
    'catalog.modelUnavailable': '3D model coming soon',
    'product.classic_tshirt': 'Classic T-Shirt',
    'product.premium_hoodie': 'Premium Hoodie',
    'product.urban_vest': 'Urban Vest',
    'product.oversized_tee': 'Oversized Tee',
    'customizer.upload': 'Upload Design',
    'customizer.change': 'Change Image',
    'customizer.remove': 'Remove',
    'customizer.notes': 'Draft Notes',
    'customizer.notesPlaceholder': 'e.g. Front placement, preferred scale, production question...',
    'customizer.addToCart': 'Continue to Draft Preparation',
    'customizer.color': 'Color',
    'customizer.size': 'Size',
    'customizer.scale': 'Artwork Size',
    'customizer.interact': 'Open 3D View',
    'customizer.exitInteract': 'Lock View',
    'customizer.surface': 'Print surface',
    'customizer.surface.front': 'Front',
    'customizer.surface.back': 'Back',
    'customizer.printArea': 'Print area',
    'customizer.artworkWidth': 'Artwork width',
    'customizer.modelUnavailable':
      'This product does not have an approved matching 3D model yet. Choose a model-ready product from the catalog.',
    'checkout.title': 'DRAFT PREPARATION',
    'checkout.submit': 'SAVE LOCAL DRAFT',
    'checkout.name': 'Full Name',
    'checkout.phone': 'Phone Number (07...)',
    'checkout.area': 'Area / District',
    'checkout.address': 'Street / House / Landmark',
    'checkout.summary': 'Preparation Summary',
    'checkout.total': 'Configured Price',
    'checkout.selectArea': 'Select an area',
    'error.required': 'This field is required',
    'error.phone': 'Invalid Iraqi phone number',
    'error.min': 'Too short',
    'common.back': 'Back',
    'common.price': 'IQD',
    'common.scroll': 'Scroll',
    'success.title': 'Design Draft Saved',
    'success.message':
      'The design draft is stored on this device. It has not been sent to the studio and is not a confirmed order.',
    'success.orderId': 'Draft ID',
    'success.whatsapp': 'Send Draft via WhatsApp',
    'success.home': 'Back to Home',
    'seo.home.title': '{{brand}} | Local apparel design studio in Baghdad',
    'seo.home.description':
      'Prepare a browser-local custom apparel draft with model-aware 3D placement, physical print dimensions, image-quality guidance, and production handoff files.',
    'seo.catalog.title': 'Verified Garment Catalog | {{product}}',
    'seo.catalog.description':
      'Review locally configured garments and open only products with approved matching 3D geometry in the {{product}} editor.',
    'seo.designs.title': 'My Designs | {{product}}',
    'seo.designs.description':
      'Reopen and manage custom apparel drafts saved in this browser with {{product}}.',
    'seo.customizer.title': '3D Design Tool | {{product}}',
    'seo.customizer.description':
      'Place artwork on configured garment surfaces, review physical size and source quality, and save the draft locally.',
    'seo.checkout.title': 'Draft Preparation | {{brand}}',
    'seo.checkout.description':
      'Add recoverable contact, address, and quantity details to a browser-local apparel design draft. No real order is submitted.',
    'home.process.title': 'FROM GARMENT TO WORKING DRAFT',
    'home.process.step1.title': 'Choose Approved Geometry',
    'home.process.step1.desc':
      'Only garments with genuine configured 3D geometry can enter the editor.',
    'home.process.step2.title': 'Place and Inspect',
    'home.process.step2.desc':
      'Move, resize, rotate, and review centimeters, source pixels, and effective DPI.',
    'home.process.step3.title': 'Save or Export',
    'home.process.step3.desc':
      'Recover the draft locally or download a PNG proof and JSON specification.',
    'home.quality.title': 'MEASURE BEFORE PRODUCTION',
    'home.quality.desc':
      'The editor reports configured physical dimensions and quality guidance while clearly marking measurements that still require production confirmation.',
    'home.marquee':
      'MODEL-READY GEOMETRY • LOCAL DRAFTS • PHYSICAL DIMENSIONS • PNG + JSON HANDOFF • ',
  },
  ar: {
    'hero.title': 'صمّم للقطعة نفسها',
    'hero.subtitle':
      'جهّز مسودة تصميم محلية، رتّبها على موديل القطعة، راجع القياسات وجودة الصورة، وارجع افتحها من نفس المتصفح.',
    'hero.cta': 'افتح الستوديو',
    'nav.home': 'الرئيسية',
    'nav.catalog': 'القطع',
    'nav.designs': 'تصاميمي',
    'catalog.title': 'اختار قطعة جاهزة للمحرر',
    'catalog.subtitle':
      'كل القطع تبقى ظاهرة، بس ما يفتح بالمحرر إلا المنتج اللي عنده موديل 3D مطابق ومعتمد.',
    'catalog.startDesign': 'افتح المحرر',
    'catalog.soldOut': 'غير متوفر',
    'catalog.modelUnavailable': 'موديل 3D قيد التجهيز',
    'product.classic_tshirt': 'تيشيرت كلاسيك',
    'product.premium_hoodie': 'هودي بريميوم',
    'product.urban_vest': 'فيست حضري',
    'product.oversized_tee': 'تيشيرت أوفرسايز',
    'customizer.upload': 'ارفع التصميم',
    'customizer.change': 'غيّر الصورة',
    'customizer.remove': 'حذف',
    'customizer.notes': 'ملاحظات المسودة',
    'customizer.notesPlaceholder': 'مثلاً: مكان التصميم، الحجم المطلوب، أو ملاحظة للإنتاج...',
    'customizer.addToCart': 'كمّل تجهيز المسودة',
    'customizer.color': 'اللون',
    'customizer.size': 'القياس',
    'customizer.scale': 'حجم التصميم',
    'customizer.interact': 'شغّل معاينة 3D',
    'customizer.exitInteract': 'اقفل المعاينة',
    'customizer.surface': 'جهة الطباعة',
    'customizer.surface.front': 'الأمام',
    'customizer.surface.back': 'الخلف',
    'customizer.printArea': 'مساحة الطباعة',
    'customizer.artworkWidth': 'عرض التصميم',
    'customizer.modelUnavailable':
      'هذا المنتج ما عنده موديل 3D مطابق ومعتمد حالياً. اختار قطعة جاهزة من الكتالوج.',
    'checkout.title': 'تجهيز المسودة',
    'checkout.submit': 'احفظ المسودة محلياً',
    'checkout.name': 'الاسم الكامل',
    'checkout.phone': 'رقم الموبايل (07...)',
    'checkout.area': 'المنطقة / الحي',
    'checkout.address': 'الشارع / البيت / أقرب نقطة دالة',
    'checkout.summary': 'ملخص التجهيز',
    'checkout.total': 'السعر المحدد محلياً',
    'checkout.selectArea': 'اختار المنطقة',
    'error.required': 'هذا الحقل مطلوب',
    'error.phone': 'رقم الموبايل غير صحيح',
    'error.min': 'المعلومة قصيرة جداً',
    'common.back': 'رجوع',
    'common.price': 'د.ع',
    'common.scroll': 'تصفّح',
    'success.title': 'انحفظت مسودة التصميم',
    'success.message':
      'المسودة محفوظة على هذا الجهاز فقط. ما انرسلت للستوديو وما تعتبر طلب مؤكد.',
    'success.orderId': 'رقم المسودة',
    'success.whatsapp': 'دز المسودة على واتساب',
    'success.home': 'العودة للرئيسية',
    'seo.home.title': '{{brand}} | ستوديو محلي لتصميم الملابس في بغداد',
    'seo.home.description':
      'جهّز مسودة تصميم ملابس محلية، رتّبها على موديل 3D، راجع قياسات الطباعة وجودة الصورة، وصدّر ملفات التسليم.',
    'seo.catalog.title': 'قطع جاهزة للمحرر | {{product}}',
    'seo.catalog.description':
      'راجع القطع المحددة محلياً وافتح فقط المنتجات اللي عندها موديل 3D مطابق ومعتمد داخل محرر {{product}}.',
    'seo.designs.title': 'تصاميمي | {{product}}',
    'seo.designs.description':
      'افتح وأدر مسودات الملابس المحفوظة بهذا المتصفح باستخدام {{product}}.',
    'seo.customizer.title': 'أداة التصميم 3D | {{product}}',
    'seo.customizer.description':
      'رتّب التصميم على جهات القطعة، راجع القياس وجودة الصورة، واحفظ المسودة محلياً.',
    'seo.checkout.title': 'تجهيز المسودة | {{brand}}',
    'seo.checkout.description':
      'أضف معلومات التواصل والعنوان والكمية لمسودة محفوظة بهذا المتصفح. ما ينرسل أي طلب حقيقي.',
    'home.process.title': 'من القطعة إلى مسودة جاهزة',
    'home.process.step1.title': 'اختار موديل معتمد',
    'home.process.step1.desc': 'بس القطع اللي عندها موديل 3D حقيقي ومجهز تدخل للمحرر.',
    'home.process.step2.title': 'رتّب وراجع',
    'home.process.step2.desc': 'حرّك، كبّر، دوّر، وراجع السنتيمترات وأبعاد الصورة ودقة DPI.',
    'home.process.step3.title': 'احفظ أو صدّر',
    'home.process.step3.desc': 'ارجع افتح المسودة محلياً أو نزّل إثبات PNG وملف JSON.',
    'home.quality.title': 'قيس قبل الإنتاج',
    'home.quality.desc':
      'المحرر يعرض قياسات التخطيط وإرشادات الجودة، ويوضح بصراحة شنو بعده يحتاج تأكيد على القطعة الحقيقية.',
    'home.marquee':
      'موديلات معتمدة • مسودات محلية • قياسات واضحة • ملفات PNG + JSON • ',
  },
};
