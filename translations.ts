
import { Language } from './types';

type TranslationKey =
  | 'hero.title'
  | 'hero.subtitle'
  | 'hero.cta'
  | 'nav.home'
  | 'nav.catalog'
  | 'catalog.title'
  | 'catalog.subtitle'
  | 'catalog.startDesign'
  | 'catalog.soldOut'
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
  | 'seo.customizer.title'
  | 'seo.customizer.description'
  | 'seo.checkout.title'
  | 'seo.checkout.description'
  // New Landing Page Keys
  | 'home.process.title'
  | 'home.process.step1.title'
  | 'home.process.step1.desc'
  | 'home.process.step2.title'
  | 'home.process.step2.desc'
  | 'home.process.step3.title'
  | 'home.process.step3.desc'
  | 'home.quality.title'
  | 'home.quality.desc'
  | 'home.reviews.title'
  | 'home.reviews.1'
  | 'home.reviews.2'
  | 'home.marquee';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'hero.title': 'WE PRINT YOUR VISION',
    'hero.subtitle': 'Premium custom clothing printed in Baghdad. High quality, durable prints, and fast delivery.',
    'hero.cta': 'START DESIGNING',
    'nav.home': 'Home',
    'nav.catalog': 'Catalog',
    'catalog.title': 'SELECT BASE MODEL',
    'catalog.subtitle': 'Choose a canvas for your creativity. Premium cotton blends optimized for Baghdad weather.',
    'catalog.startDesign': 'Customize',
    'catalog.soldOut': 'Sold Out',
    'product.classic_tshirt': 'Classic T-Shirt',
    'product.premium_hoodie': 'Premium Hoodie',
    'product.urban_vest': 'Urban Vest',
    'product.oversized_tee': 'Oversized Tee',
    'customizer.upload': 'Upload Design',
    'customizer.change': 'Change Image',
    'customizer.remove': 'Remove',
    'customizer.notes': 'Special Instructions',
    'customizer.notesPlaceholder': 'e.g. Print on back, make logo smaller...',
    'customizer.addToCart': 'Proceed to Checkout',
    'customizer.color': 'Color',
    'customizer.size': 'Size',
    'customizer.scale': 'Logo Size',
    'customizer.interact': 'Tap to 3D View',
    'customizer.exitInteract': 'Lock View',
    'checkout.title': 'SHIPPING DETAILS',
    'checkout.submit': 'CONFIRM ORDER',
    'checkout.name': 'Full Name',
    'checkout.phone': 'Phone Number (07...)',
    'checkout.area': 'Area / District',
    'checkout.address': 'Street / House / Landmark',
    'checkout.summary': 'Order Summary',
    'checkout.total': 'Total',
    'checkout.selectArea': 'Select an area',
    'error.required': 'This field is required',
    'error.phone': 'Invalid Iraqi phone number',
    'error.min': 'Too short',
    'common.back': 'Back',
    'common.price': 'IQD',
    'common.scroll': 'Scroll',
    'success.title': 'Order Received',
    'success.message': 'Thank you. We have received your request. Please send the details via WhatsApp to finalize the design.',
    'success.orderId': 'Order ID',
    'success.whatsapp': 'Send via WhatsApp',
    'success.home': 'Back to Home',
    'seo.home.title': 'ASHUS | Printing on clothes in Baghdad',
    'seo.home.description': 'Best custom t-shirt printing in Baghdad. High quality monochrome printing on Hoodies and T-Shirts. Fast delivery in Iraq.',
    'seo.catalog.title': 'Product Catalog | ASHUS Custom Printing',
    'seo.catalog.description': 'Choose from our premium collection of T-Shirts, Hoodies, and Vests ready for custom printing in Baghdad.',
    'seo.customizer.title': '3D Design Tool | ASHUS',
    'seo.customizer.description': 'Upload your design and visualize it on 3D clothing models. Customize size, color, and placement instantly.',
    'seo.checkout.title': 'Checkout | ASHUS',
    'seo.checkout.description': 'Complete your order for custom printed clothing in Baghdad.',

    // New Sections
    'home.process.title': 'HOW IT WORKS',
    'home.process.step1.title': 'Choose Your Gear',
    'home.process.step1.desc': 'Select from our premium heavy-weight cotton T-shirts, hoodies, or vests.',
    'home.process.step2.title': 'Upload & Visualize',
    'home.process.step2.desc': 'Upload your artwork and see exactly how it looks in 3D before ordering.',
    'home.process.step3.title': 'We Print & Ship',
    'home.process.step3.desc': 'We print in Baghdad using durable DTF tech and deliver to your door.',
    'home.quality.title': 'BUILT TO LAST',
    'home.quality.desc': 'We use 100% combed cotton that withstands the Baghdad heat. Our prints are stretch-resistant and washing-machine safe.',
    'home.reviews.title': 'TRUSTED BY BAGHDAD',
    'home.reviews.1': '"The print quality is insane. The 3D preview helped me get the logo size exactly right."',
    'home.reviews.2': '"Finally a local brand with high quality blanks. Ordered 5 hoodies for my team."',
    'home.marquee': 'PREMIUM QUALITY • MADE IN BAGHDAD • 3D VISUALIZATION • FAST DELIVERY • ',
  },
  ar: {
    'hero.title': 'اطبع خيالك',
    'hero.subtitle': 'طباعة حسب الطلب بجودة عالية في بغداد. خامات، طباعة، وتوصيل.. كلها علينا.',
    'hero.cta': 'صمم قطعتك',
    'nav.home': 'الرئيسية',
    'nav.catalog': 'الموديلات',
    'catalog.title': 'اختار الموديل',
    'catalog.subtitle': 'خامات قطنية فاخرة ومريحة، تناسب جوّنا.',
    'catalog.startDesign': 'تخصيص',
    'catalog.soldOut': 'نفذت الكمية',
    'product.classic_tshirt': 'تيشيرت كلاسيك',
    'product.premium_hoodie': 'هودي بريميوم',
    'product.urban_vest': 'سترة',
    'product.oversized_tee': 'تيشيرت اوفرسايز',
    'customizer.upload': 'ارفع تصميمك',
    'customizer.change': 'غير الصورة',
    'customizer.remove': 'حذف',
    'customizer.notes': 'ملاحظاتك',
    'customizer.notesPlaceholder': 'مثلاً: الطباعة على الظهر، تصغير اللوكو...',
    'customizer.addToCart': 'تثبيت الطلب',
    'customizer.color': 'اللون',
    'customizer.size': 'القياس',
    'customizer.scale': 'حجم اللوكو',
    'customizer.interact': 'اضغط للمعاينة 3D',
    'customizer.exitInteract': 'قفل المعاينة',
    'checkout.title': 'معلومات التوصيل',
    'checkout.submit': 'أرسل الطلب',
    'checkout.name': 'الاسم',
    'checkout.phone': 'رقم الموبايل',
    'checkout.area': 'المنطقة',
    'checkout.address': 'العنوان الكامل / اقرب نقطة دالة',
    'checkout.summary': 'ملخص الطلب',
    'checkout.total': 'الحساب الكلي',
    'checkout.selectArea': 'اختر المنطقة',
    'error.required': 'مطلوب',
    'error.phone': 'الرقم غير صحيح',
    'error.min': 'قصير جداً',
    'common.back': 'رجوع',
    'common.price': 'د.ع',
    'common.scroll': 'تصفح',
    'success.title': 'وصلنا طلبك',
    'success.message': 'عاشت ايدك. استلمنا الطلب، بس دزلنا التفاصيل واتساب حتى نبلش.',
    'success.orderId': 'رقم الطلب',
    'success.whatsapp': 'دز الطلب واتساب',
    'success.home': 'العودة',
    'seo.home.title': 'اشوز | طباعة ملابس في بغداد',
    'seo.home.description': 'أفضل طباعة تيشيرتات وهوديز في بغداد. صمم تيشيرتك بنفسك واطبعه بجودة عالية. توصيل لباب البيت.',
    'seo.catalog.title': 'الموديلات | اشوز',
    'seo.catalog.description': 'تشكيلة تيشيرتات وهوديز جاهزة للطباعة. قطن فاخر يتحمل الغسل واللبس.',
    'seo.customizer.title': 'صمم بنفسك | اشوز',
    'seo.customizer.description': 'أداة تصميم مباشر. ارفع صورتك وشوفها على التيشيرت قبل ما تطلب.',
    'seo.checkout.title': 'تأكيد الطلب | اشوز',
    'seo.checkout.description': 'كمل طلبك واستمتع بملابس مميزة.',

    // New Sections
    'home.process.title': 'شلون نشتغل؟',
    'home.process.step1.title': 'اختار القطعة',
    'home.process.step1.desc': 'موديلاتنا قطن 100%، ثقيلة ومرتبة.',
    'home.process.step2.title': 'صمم اونلاين',
    'home.process.step2.desc': 'ارفع تصميمك وشوف النتيجة كدامك.',
    'home.process.step3.title': 'طباعة وتوصيل',
    'home.process.step3.desc': 'نطبع بأحدث الأجهزة ونوصلك لباب البيت.',
    'home.quality.title': 'جودة، مو بس حجي',
    'home.quality.desc': 'الخامات قطن ممشط يتحمل جونا الحار. والطباعة؟ انسى تتقشر او يروح لونها.',
    'home.reviews.title': 'ناس جربونا',
    'home.reviews.1': '"الطباعة دقتها تخبل، والمعاينة بالموقع خلتني اعرف النتيجة قبل ما اطلب."',
    'home.reviews.2': '"خامة الهودي كلش قوية، وطباعتها نظيفة. طلبت وجبة ثانية فوراً."',
    'home.marquee': 'جودة عالية • صنع في بغداد • معاينة ثلاثية الأبعاد • توصيل سريع • ',
  }
};
