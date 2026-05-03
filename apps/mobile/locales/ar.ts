import type { TranslationKey } from "./en";

const ar: Record<TranslationKey, string | ((...args: never[]) => string)> = {
  // Auth
  sign_in: "تسجيل الدخول",
  sign_out: "تسجيل الخروج",
  register: "التسجيل",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  full_name: "الاسم الكامل",
  company_name: "اسم الشركة",
  phone: "الهاتف",
  role: "أنا",
  role_client: "عميل (مشترٍ)",
  role_supplier: "مورّد",
  activation_token: "رمز التفعيل",
  activate_account: "تفعيل الحساب",
  no_account: "ليس لديك حساب؟ سجّل",
  have_account: "لديك حساب؟ سجّل دخولك",
  activate_link: "لديك رمز تفعيل؟ فعّل",
  signing_in: "جارٍ تسجيل الدخول…",
  registering: "جارٍ التسجيل…",
  activating: "جارٍ التفعيل…",
  registration_pending: "التسجيل قيد الانتظار",
  registration_pending_desc:
    "حسابك قيد المراجعة. بعد التحقق ستتلقى رابط التفعيل.",

  // Nav
  catalog: "الكتالوج",
  basket: "السلة",
  rfqs: "طلباتي",
  orders: "الطلبات",
  account: "الحساب",

  // Catalog
  all_categories: "جميع الفئات",
  search_products: "ابحث عن منتجات…",
  add_to_basket: "أضف إلى السلة",
  added: "تمت الإضافة!",
  pack_type: "نوع التعبئة",
  qty: "الكمية",
  specs: "المواصفات",
  no_products: "لم يتم العثور على منتجات.",
  category: "الفئة",

  // Basket
  your_basket: "سلتك",
  basket_empty: "سلتك فارغة.",
  browse_catalog: "تصفح الكتالوج",
  submit_rfq: "إرسال كطلب عرض",
  submitting: "جارٍ الإرسال…",
  delivery_city: "مدينة التسليم",
  delivery_date: "تاريخ التسليم",
  rfq_title: "عنوان الطلب",
  rfq_submitted: "تم إرسال الطلب!",
  rfq_submitted_desc: "سنطابقك مع الموردين وسنُعلمك عند وصول عروض الأسعار.",
  items_count: (n: number) => `${n} منتج${n !== 1 ? "ات" : ""}`,
  remove: "حذف",

  // RFQs
  my_rfqs: "طلباتي",
  no_rfqs: "لا توجد طلبات بعد.",
  rfq_detail: "تفاصيل الطلب",
  quotes: "العروض",
  no_quotes: "لم تصل عروض بعد.",
  accept_quote: "قبول",
  accepting: "جارٍ القبول…",
  quote_accepted: "تم قبول العرض",
  compare_quotes: "مقارنة العروض",
  unit_price: "سعر الوحدة",
  total: "الإجمالي",
  vat: "ضريبة القيمة المضافة (15٪)",
  grand_total: "الإجمالي الكلي",
  supplier: "المورد",
  status: "الحالة",
  expires: "ينتهي",
  delivery: "التسليم",
  submitted: "مُرسَل",

  // Orders
  my_orders: "طلباتي",
  no_orders: "لا توجد طلبات بعد.",
  order_detail: "تفاصيل الطلب",
  po_number: "رقم أمر الشراء",
  order_status: "حالة الطلب",
  items: "البنود",
  timeline: "الجدول الزمني",

  // Account
  my_account: "حسابي",
  language: "اللغة",
  english: "English",
  arabic: "عربي",
  role_label: "الدور",
  company: "الشركة",
  version: "الإصدار",

  // Statuses
  open: "مفتوح",
  draft_auto: "مسودة تلقائية",
  draft_manual: "مسودة يدوية",
  submitted_to_client: "مُقدَّم",
  pending_admin_review: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "غير مقبول",
  awaiting_approval: "بانتظار الموافقة",
  confirmed: "مؤكد",
  in_progress: "قيد التنفيذ",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  active: "نشط",
  suspended: "موقوف",
  pending_kyc: "بانتظار التحقق",

  // Errors
  required: "هذا الحقل مطلوب",
  invalid_email: "أدخل بريدًا إلكترونيًا صحيحًا",
  invalid_phone: "أدخل هاتفًا صحيحًا (+9665xxxxxxxx)",
  save_failed: "فشل الحفظ",
  load_failed: "فشل تحميل البيانات",
};

export default ar;
