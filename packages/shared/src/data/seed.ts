// Seeds the in-memory store with the canonical fixtures listed in
// docs/build/02-shared-package.md.

import { v4 as uuid } from "uuid";

import type {
  Bundle,
  BundleItem,
  Category,
  Company,
  ID,
  MasterProduct,
  Offer,
  OfferPackPrice,
  PackType,
  ProductAdditionRequest,
  Quote,
  QuoteItem,
  RFQ,
  RFQItem,
  User,
  Margin,
} from "../types";
import { generateMasterProductCode, generateDocNumber } from "../utils/numbers";
import { store, nowISO } from "./store";

// ─── Categories ──────────────────────────────────────────────────────────────

interface SeedCategory {
  name_en: string;
  name_ar: string;
  slug: string;
  subs: { name_en: string; name_ar: string; slug: string }[];
}

const CATEGORY_TREE: SeedCategory[] = [
  {
    name_en: "Office Supplies",
    name_ar: "اللوازم المكتبية",
    slug: "office-supplies",
    subs: [
      { name_en: "Stationery", name_ar: "قرطاسية", slug: "stationery" },
      { name_en: "Filing & Storage", name_ar: "حفظ الملفات", slug: "filing-storage" },
      { name_en: "Desk Accessories", name_ar: "إكسسوارات المكتب", slug: "desk-accessories" },
    ],
  },
  {
    name_en: "IT & Electronics",
    name_ar: "تقنية المعلومات والإلكترونيات",
    slug: "it-electronics",
    subs: [
      { name_en: "Laptops", name_ar: "لابتوب", slug: "laptops" },
      { name_en: "Peripherals", name_ar: "ملحقات", slug: "peripherals" },
      { name_en: "Networking", name_ar: "شبكات", slug: "networking" },
    ],
  },
  {
    name_en: "Food & Beverages",
    name_ar: "الأطعمة والمشروبات",
    slug: "food-beverages",
    subs: [
      { name_en: "Pantry", name_ar: "مؤن", slug: "pantry" },
      { name_en: "Beverages", name_ar: "مشروبات", slug: "beverages" },
    ],
  },
  {
    name_en: "Furniture",
    name_ar: "الأثاث",
    slug: "furniture",
    subs: [
      { name_en: "Chairs", name_ar: "كراسي", slug: "chairs" },
      { name_en: "Desks", name_ar: "مكاتب", slug: "desks" },
      { name_en: "Storage", name_ar: "تخزين", slug: "storage" },
    ],
  },
  {
    name_en: "Maintenance & Facility",
    name_ar: "الصيانة والمرافق",
    slug: "maintenance-facility",
    subs: [
      { name_en: "Cleaning", name_ar: "تنظيف", slug: "cleaning" },
      { name_en: "Tools", name_ar: "أدوات", slug: "tools" },
    ],
  },
  {
    name_en: "Raw Materials",
    name_ar: "المواد الخام",
    slug: "raw-materials",
    subs: [{ name_en: "Packaging", name_ar: "تغليف", slug: "packaging" }],
  },
  {
    name_en: "Corporate Gifts",
    name_ar: "الهدايا الترويجية",
    slug: "corporate-gifts",
    subs: [{ name_en: "Branded Items", name_ar: "بنود مع شعار", slug: "branded" }],
  },
  {
    name_en: "Logistics & Fleet",
    name_ar: "الخدمات اللوجستية",
    slug: "logistics-fleet",
    subs: [{ name_en: "Vehicle Supplies", name_ar: "لوازم المركبات", slug: "vehicle-supplies" }],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function nextProductCode(): string {
  store.master_product_seq.value += 1;
  return generateMasterProductCode(store.master_product_seq.value);
}

function makeMasterProduct(args: {
  name_en: string;
  name_ar: string;
  category_id: ID;
  pack_types: PackType[];
  default_unit: string;
  admin_id: ID;
  specs?: Record<string, string>;
}): MasterProduct {
  const id = uuid();
  return {
    id,
    master_product_code: nextProductCode(),
    name_en: args.name_en,
    name_ar: args.name_ar,
    description_en: `${args.name_en} — premium grade suitable for office and corporate use.`,
    description_ar: `${args.name_ar} — درجة ممتازة مناسبة للمكاتب والاستخدام المؤسسي.`,
    category_id: args.category_id,
    specs: args.specs ?? {},
    images: [],
    pack_types: args.pack_types,
    default_unit: args.default_unit,
    status: "active",
    created_by_admin_id: args.admin_id,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
}

function makePackPricing(packs: PackType[], baseCost: number): OfferPackPrice[] {
  return packs.map((pt) => {
    const multiplier = pt === "Each" ? 1 : pt === "Box" ? 10 : 100;
    return {
      pack_type: pt,
      supplier_cost_sar: Math.round(baseCost * multiplier * 100) / 100,
      min_order_qty: pt === "Each" ? 1 : pt === "Box" ? 1 : 1,
    };
  });
}

// Bulk product name generators per category to reach the 200-product target
// across the 3 strongest categories.
function bulkNamesForCategory(catSlug: string, count: number): { en: string; ar: string }[] {
  const templates: Record<string, [string, string][]> = {
    "office-supplies": [
      ["Ballpoint Pen", "قلم حبر جاف"],
      ["Gel Pen", "قلم جل"],
      ["Highlighter", "قلم تظليل"],
      ["Sticky Notes", "ملاحظات لاصقة"],
      ["Notebook A4", "دفتر A4"],
      ["File Folder", "ملف حافظ"],
      ["Stapler", "دباسة"],
      ["Paper Clips", "مشابك ورق"],
      ["Tape Dispenser", "موزع شريط لاصق"],
      ["Whiteboard Marker", "قلم سبورة"],
      ["Eraser", "ممحاة"],
      ["Scissors", "مقص"],
      ["Glue Stick", "صمغ عصا"],
      ["Calculator", "آلة حاسبة"],
      ["Desk Organizer", "منظم مكتب"],
      ["A4 Paper Ream", "رزمة ورق A4"],
      ["Envelopes", "مظاريف"],
      ["Push Pins", "دبابيس ضغط"],
      ["Binder Clips", "مشابك تجليد"],
      ["Index Cards", "بطاقات فهرسة"],
    ],
    "it-electronics": [
      ["Wireless Mouse", "ماوس لاسلكي"],
      ["Mechanical Keyboard", "لوحة مفاتيح ميكانيكية"],
      ["USB-C Hub", "محور USB-C"],
      ["External SSD 1TB", "قرص SSD خارجي 1 تيرا"],
      ["HDMI Cable 2m", "كابل HDMI 2 متر"],
      ["Webcam HD", "كاميرا ويب HD"],
      ["Headset USB", "سماعة USB"],
      ["Laptop Stand", "حامل لابتوب"],
      ["Monitor 24in", "شاشة 24 بوصة"],
      ["Monitor 27in", "شاشة 27 بوصة"],
      ["Laptop 14in i5", "لابتوب 14 بوصة i5"],
      ["Laptop 15in i7", "لابتوب 15 بوصة i7"],
      ["Wireless Router", "راوتر لاسلكي"],
      ["Network Switch 8-port", "سويتش 8 منافذ"],
      ["Cat6 Cable 5m", "كابل Cat6 5 متر"],
      ["Power Strip", "مشترك كهربائي"],
      ["UPS 1200VA", "مزود طاقة احتياطي 1200VA"],
      ["Toner Cartridge", "خرطوشة حبر"],
      ["Printer A4", "طابعة A4"],
      ["Document Scanner", "ماسح مستندات"],
    ],
    furniture: [
      ["Executive Chair", "كرسي تنفيذي"],
      ["Task Chair", "كرسي مكتب"],
      ["Visitor Chair", "كرسي زائر"],
      ["Conference Chair", "كرسي اجتماعات"],
      ["Adjustable Desk", "مكتب قابل للتعديل"],
      ["L-Shape Desk", "مكتب على شكل L"],
      ["Reception Desk", "مكتب استقبال"],
      ["Filing Cabinet 4-Drawer", "خزانة ملفات 4 أدراج"],
      ["Bookshelf", "رف كتب"],
      ["Storage Cabinet", "خزانة تخزين"],
      ["Conference Table 8-seat", "طاولة اجتماعات 8 أشخاص"],
      ["Side Table", "طاولة جانبية"],
      ["Whiteboard 1.5m", "سبورة 1.5 متر"],
      ["Notice Board", "لوحة إعلانات"],
      ["Coat Rack", "علاقة معاطف"],
      ["Mobile Pedestal", "خزانة متحركة"],
      ["Couch 3-seat", "كنبة 3 مقاعد"],
      ["Lounge Chair", "كرسي راحة"],
      ["Bar Stool", "كرسي بار"],
      ["Standing Desk Converter", "محول مكتب وقوف"],
    ],
  };

  const list = templates[catSlug] ?? [["Item", "بند"]];
  const out: { en: string; ar: string }[] = [];
  for (let i = 0; i < count; i++) {
    const t = list[i % list.length]!;
    const variant = Math.floor(i / list.length) + 1;
    out.push({
      en: variant === 1 ? t[0] : `${t[0]} v${variant}`,
      ar: variant === 1 ? t[1] : `${t[1]} v${variant}`,
    });
  }
  return out;
}

// ─── Main seed entry point ──────────────────────────────────────────────────

export interface SeedResult {
  client_user_id: ID;
  supplier_user_id: ID;
  admin_user_id: ID;
  client_company_id: ID;
  supplier_company_id: ID;
  supplier_violet_company_id: ID;
}

export function seedAll(): SeedResult {
  // ─── Users + companies ────────────────────────────────────────────────────
  const adminId = uuid();
  const clientUserId = uuid();
  const supplierUserId = uuid();

  const clientCompanyId = uuid();
  const supplierCompanyId = uuid();
  const supplierVioletCompanyId = uuid();

  const clientCompany: Company = {
    id: clientCompanyId,
    real_name: "Tech Solutions Ltd",
    platform_alias: "Client-A8B4",
    type: "client",
    cr_number: "1010012345",
    vat_number: "300012345600003",
    status: "active",
    kyc_docs: [],
    signup_source: "client_form",
    signup_intent: "Recurring office supply procurement",
    expected_monthly_volume_sar: 50_000,
    subscription_tier: "standard",
    onboarding_completed: true,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.companies.set(clientCompanyId, clientCompany);

  const allCategoryPlaceholderIds: ID[] = []; // populated below

  const acmeCompany: Company = {
    id: supplierCompanyId,
    real_name: "Acme Supplies Ltd",
    platform_alias: "Supplier Indigo",
    type: "supplier",
    cr_number: "1010098765",
    vat_number: "300098765400003",
    status: "active",
    kyc_docs: [],
    categories_served: allCategoryPlaceholderIds, // updated after categories seeded
    signup_source: "supplier_form",
    signup_intent: "Established supplier — full catalog",
    expected_monthly_volume_sar: 500_000,
    subscription_tier: "premium",
    onboarding_completed: true,
    auto_quote_review_window: "30min",
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.companies.set(supplierCompanyId, acmeCompany);

  const violetCompany: Company = {
    id: supplierVioletCompanyId,
    real_name: "Riyadh Trading Co",
    platform_alias: "Supplier Violet",
    type: "supplier",
    cr_number: "1010054321",
    vat_number: "300054321100003",
    status: "active",
    kyc_docs: [],
    categories_served: [],
    signup_source: "supplier_form",
    signup_intent: "IT-focused supplier",
    expected_monthly_volume_sar: 200_000,
    subscription_tier: "standard",
    onboarding_completed: true,
    auto_quote_review_window: "instant",
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.companies.set(supplierVioletCompanyId, violetCompany);

  const adminUser: User = {
    id: adminId,
    email: "admin@mwrd.com",
    role: "admin",
    real_name: "Admin User",
    phone: "+966500000000",
    platform_alias: "admin",
    company_id: null,
    status: "active",
    activation_status: "activated",
    callback_notes: null,
    activation_token: null,
    language: "en",
    onboarding_completed: true,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.users.set(adminId, adminUser);
  store.passwords.set(adminId, { user_id: adminId, password: "admin123" });

  const clientUser: User = {
    id: clientUserId,
    email: "client@mwrd.com",
    role: "client",
    real_name: "John Client",
    phone: "+966500000001",
    platform_alias: "Client-A8B4",
    company_id: clientCompanyId,
    status: "active",
    activation_status: "activated",
    callback_notes: null,
    activation_token: null,
    language: "en",
    onboarding_completed: true,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.users.set(clientUserId, clientUser);
  store.passwords.set(clientUserId, { user_id: clientUserId, password: "client123" });

  const supplierUser: User = {
    id: supplierUserId,
    email: "supplier@mwrd.com",
    role: "supplier",
    real_name: "Sarah Supplier",
    phone: "+966500000002",
    platform_alias: "Supplier Indigo",
    company_id: supplierCompanyId,
    status: "active",
    activation_status: "activated",
    callback_notes: null,
    activation_token: null,
    language: "en",
    onboarding_completed: true,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.users.set(supplierUserId, supplierUser);
  store.passwords.set(supplierUserId, { user_id: supplierUserId, password: "supplier123" });

  // ─── Categories ───────────────────────────────────────────────────────────
  let sortOrder = 0;
  const topByslug = new Map<string, Category>();
  for (const cat of CATEGORY_TREE) {
    const id = uuid();
    const top: Category = {
      id,
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      slug: cat.slug,
      parent_id: null,
      icon_url: "",
      sort_order: sortOrder++,
    };
    store.categories.set(id, top);
    topByslug.set(cat.slug, top);

    let subOrder = 0;
    for (const sub of cat.subs) {
      const subId = uuid();
      store.categories.set(subId, {
        id: subId,
        name_en: sub.name_en,
        name_ar: sub.name_ar,
        slug: sub.slug,
        parent_id: id,
        icon_url: "",
        sort_order: subOrder++,
      });
    }
  }

  // Update Acme to serve all 8 top-level categories.
  acmeCompany.categories_served = Array.from(topByslug.values()).map((c) => c.id);
  store.companies.set(supplierCompanyId, acmeCompany);
  // Violet serves IT only.
  const itCat = topByslug.get("it-electronics");
  if (itCat) {
    violetCompany.categories_served = [itCat.id];
    store.companies.set(supplierVioletCompanyId, violetCompany);
  }

  // ─── Master products ──────────────────────────────────────────────────────
  // 80 in office-supplies, 70 in it-electronics, 50 in furniture = 200.
  // 5–10 each for the remaining 5 categories.
  const productSpec: { slug: string; count: number; pack_types: PackType[]; unit: string }[] = [
    { slug: "office-supplies", count: 80, pack_types: ["Each", "Box", "Carton"], unit: "piece" },
    { slug: "it-electronics", count: 70, pack_types: ["Each", "Box"], unit: "piece" },
    { slug: "furniture", count: 50, pack_types: ["Each"], unit: "piece" },
    { slug: "food-beverages", count: 8, pack_types: ["Each", "Box"], unit: "piece" },
    { slug: "maintenance-facility", count: 8, pack_types: ["Each", "Box"], unit: "piece" },
    { slug: "raw-materials", count: 6, pack_types: ["Each", "Carton"], unit: "piece" },
    { slug: "corporate-gifts", count: 8, pack_types: ["Each", "Box"], unit: "piece" },
    { slug: "logistics-fleet", count: 5, pack_types: ["Each"], unit: "piece" },
  ];

  const productsBySlug = new Map<string, MasterProduct[]>();
  for (const ps of productSpec) {
    const cat = topByslug.get(ps.slug);
    if (!cat) continue;
    const names = bulkNamesForCategory(ps.slug, ps.count);
    const list: MasterProduct[] = [];
    for (let i = 0; i < ps.count; i++) {
      const n = names[i]!;
      const mp = makeMasterProduct({
        name_en: n.en,
        name_ar: n.ar,
        category_id: cat.id,
        pack_types: ps.pack_types,
        default_unit: ps.unit,
        admin_id: adminId,
      });
      store.master_products.set(mp.id, mp);
      list.push(mp);
    }
    productsBySlug.set(ps.slug, list);
  }

  // ─── Offers ───────────────────────────────────────────────────────────────
  // Acme: ~80% of master products with auto_quote_enabled=true on most.
  // Violet: ~30% of master products with mixed auto_quote_enabled.
  const allProducts = Array.from(store.master_products.values());

  let acmeOfferCount = 0;
  let violetOfferCount = 0;

  for (const mp of allProducts) {
    // Deterministic-ish hash from product code so test runs are stable enough.
    const hash =
      mp.master_product_code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

    if (hash % 10 < 8) {
      const baseCost = 15 + (hash % 200);
      const offer: Offer = {
        id: uuid(),
        master_product_id: mp.id,
        supplier_company_id: supplierCompanyId,
        pack_type_pricing: makePackPricing(mp.pack_types, baseCost),
        default_lead_time_days: 3 + (hash % 5),
        available_quantity_estimate: 100 + (hash % 400),
        auto_quote_enabled: hash % 10 < 7, // ~88% of Acme's offers auto-on
        fulfillment_mode: hash % 4 === 0 ? "express" : "market",
        status: "active",
        approval_status: "approved",
        supplier_internal_sku: `ACM-${mp.master_product_code.slice(-5)}`,
        supplier_notes: null,
        created_at: nowISO(),
        updated_at: nowISO(),
      };
      store.offers.set(offer.id, offer);
      acmeOfferCount++;
    }

    if (hash % 10 < 3 && mp.category_id === topByslug.get("it-electronics")?.id) {
      const baseCost = 18 + (hash % 220);
      const offer: Offer = {
        id: uuid(),
        master_product_id: mp.id,
        supplier_company_id: supplierVioletCompanyId,
        pack_type_pricing: makePackPricing(mp.pack_types, baseCost),
        default_lead_time_days: 5 + (hash % 4),
        available_quantity_estimate: 50 + (hash % 200),
        auto_quote_enabled: hash % 2 === 0,
        fulfillment_mode: "market",
        status: "active",
        approval_status: "approved",
        supplier_internal_sku: `RTC-${mp.master_product_code.slice(-5)}`,
        supplier_notes: null,
        created_at: nowISO(),
        updated_at: nowISO(),
      };
      store.offers.set(offer.id, offer);
      violetOfferCount++;
    }
  }

  if (acmeOfferCount + violetOfferCount < 50) {
    throw new Error(
      `Seed produced only ${acmeOfferCount + violetOfferCount} offers; need ≥ 50`,
    );
  }

  // ─── Bundles ──────────────────────────────────────────────────────────────
  const officeProducts = productsBySlug.get("office-supplies") ?? [];
  const itProducts = productsBySlug.get("it-electronics") ?? [];
  const furnitureProducts = productsBySlug.get("furniture") ?? [];
  const maintProducts = productsBySlug.get("maintenance-facility") ?? [];
  const foodProducts = productsBySlug.get("food-beverages") ?? [];

  function makeBundle(args: {
    name_en: string;
    name_ar: string;
    slug: string;
    description: string;
    productList: MasterProduct[];
    qtys: number[];
  }): Bundle {
    const id = uuid();
    const items: BundleItem[] = args.productList.slice(0, args.qtys.length).map((mp, idx) => ({
      id: uuid(),
      bundle_id: id,
      master_product_id: mp.id,
      qty: args.qtys[idx]!,
      sort_order: idx,
    }));
    return {
      id,
      name_en: args.name_en,
      name_ar: args.name_ar,
      slug: args.slug,
      image_url: "",
      description: args.description,
      items,
    };
  }

  const bundles: Bundle[] = [
    makeBundle({
      name_en: "CEO Office Pack",
      name_ar: "حزمة مكتب المدير التنفيذي",
      slug: "ceo-office-pack",
      description: "Premium executive office essentials.",
      productList: [
        ...furnitureProducts.slice(0, 2),
        ...itProducts.slice(0, 2),
        ...officeProducts.slice(0, 1),
      ],
      qtys: [1, 1, 1, 1, 1],
    }),
    makeBundle({
      name_en: "Kitchen Essentials",
      name_ar: "أساسيات المطبخ",
      slug: "kitchen-essentials",
      description: "Stocked office kitchen.",
      productList: foodProducts.slice(0, 4),
      qtys: [10, 10, 5, 5],
    }),
    makeBundle({
      name_en: "Cleaning Pack",
      name_ar: "حزمة التنظيف",
      slug: "cleaning-pack",
      description: "Standard cleaning supplies.",
      productList: maintProducts.slice(0, 3),
      qtys: [5, 5, 2],
    }),
    makeBundle({
      name_en: "Stationery Pack",
      name_ar: "حزمة القرطاسية",
      slug: "stationery-pack",
      description: "Daily-use stationery.",
      productList: officeProducts.slice(0, 6),
      qtys: [10, 10, 5, 5, 5, 2],
    }),
    makeBundle({
      name_en: "New Office Pack",
      name_ar: "حزمة المكتب الجديد",
      slug: "new-office-pack",
      description: "Everything to set up a new office desk.",
      productList: [
        ...furnitureProducts.slice(2, 4),
        ...itProducts.slice(2, 6),
        ...officeProducts.slice(6, 8),
      ],
      qtys: [1, 1, 1, 1, 1, 1, 5, 5],
    }),
  ];
  for (const b of bundles) store.bundles.set(b.id, b);

  // ─── Margins ──────────────────────────────────────────────────────────────
  const electronicsCat = topByslug.get("it-electronics");
  const furnitureCat = topByslug.get("furniture");

  const seedMargins: Margin[] = [
    {
      id: uuid(),
      scope: "global",
      pct: 15,
      updated_by_user_id: adminId,
      updated_at: nowISO(),
    },
    ...(electronicsCat
      ? [
          {
            id: uuid(),
            scope: "category" as const,
            scope_id: electronicsCat.id,
            pct: 12,
            updated_by_user_id: adminId,
            updated_at: nowISO(),
          },
        ]
      : []),
    ...(furnitureCat
      ? [
          {
            id: uuid(),
            scope: "category" as const,
            scope_id: furnitureCat.id,
            pct: 20,
            updated_by_user_id: adminId,
            updated_at: nowISO(),
          },
        ]
      : []),
  ];
  for (const m of seedMargins) store.margins.set(m.id, m);

  // ─── RFQs ────────────────────────────────────────────────────────────────
  const productsForRFQ = officeProducts.slice(0, 3);
  const rfqStatuses: RFQ["status"][] = ["draft", "open", "quoted", "awarded"];
  const seededRFQs: RFQ[] = [];

  for (let i = 0; i < rfqStatuses.length; i++) {
    const rfqId = uuid();
    const items: RFQItem[] = productsForRFQ.map((mp, idx) => ({
      id: uuid(),
      rfq_id: rfqId,
      master_product_id: mp.id,
      free_text_name: null,
      description: mp.description_en,
      qty: 10 * (idx + 1),
      unit: mp.default_unit,
      pack_type: mp.pack_types[0] ?? "Each",
      specs_overrides: null,
    }));
    const rfq: RFQ = {
      id: rfqId,
      rfq_number: generateDocNumber("RFQ"),
      client_company_id: clientCompanyId,
      created_by_user_id: clientUserId,
      title: `Demo RFQ ${i + 1}`,
      description: "Seed RFQ for development.",
      category_id: topByslug.get("office-supplies")?.id ?? null,
      delivery_city: "Riyadh",
      delivery_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      status: rfqStatuses[i]!,
      source: "catalog",
      items,
      created_at: nowISO(),
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };
    store.rfqs.set(rfqId, rfq);
    seededRFQs.push(rfq);
  }

  // ─── Quotes (3 auto + 3 manual) ──────────────────────────────────────────
  const quotedRFQ = seededRFQs[2]; // status='quoted'
  if (quotedRFQ) {
    for (let q = 0; q < 6; q++) {
      const quoteId = uuid();
      const items: QuoteItem[] = quotedRFQ.items.map((ri) => ({
        id: uuid(),
        quote_id: quoteId,
        rfq_item_id: ri.id,
        offer_id: null,
        supplier_unit_price_sar: 25 + q * 2,
        final_unit_price_sar: (25 + q * 2) * 1.15,
        qty_available: ri.qty,
        lead_time_days: 5,
        notes: "",
        declined: false,
      }));
      const isAuto = q < 3;
      const quote: Quote = {
        id: quoteId,
        quote_number: generateDocNumber("Q"),
        rfq_id: quotedRFQ.id,
        supplier_company_id:
          q % 2 === 0 ? supplierCompanyId : supplierVioletCompanyId,
        status: "submitted_to_client",
        is_auto_generated: isAuto,
        supplier_review_window: "30min",
        supplier_reviewed_at: nowISO(),
        auto_send_at: isAuto ? nowISO() : null,
        admin_held: false,
        valid_until: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        lead_time_days: 5,
        items,
        notes: "",
        submitted_at: nowISO(),
      };
      store.quotes.set(quoteId, quote);
    }
  }

  // ─── Product Addition Requests (3 in various states) ─────────────────────
  const parStatuses: ProductAdditionRequest["status"][] = [
    "submitted",
    "under_review",
    "approved",
  ];
  for (const status of parStatuses) {
    const id = uuid();
    const par: ProductAdditionRequest = {
      id,
      requested_by_user_id: supplierUserId,
      supplier_company_id: supplierCompanyId,
      proposed_name_en: `New Product ${status}`,
      proposed_name_ar: `منتج جديد ${status}`,
      proposed_category_id: topByslug.get("office-supplies")?.id ?? "unknown",
      proposed_description: "Awaiting admin review.",
      proposed_specs: { material: "metal" },
      sample_images: [],
      reason_for_addition: "Frequent client demand",
      estimated_demand: "100 units/month",
      status,
      admin_notes: null,
      resulting_master_product_id: null,
      rejection_reason: null,
      reviewed_by_admin_id: null,
      created_at: nowISO(),
      decided_at: status === "approved" ? nowISO() : null,
    };
    store.product_addition_requests.set(id, par);
  }

  // ─── Leads in callback queue ─────────────────────────────────────────────
  for (let i = 1; i <= 5; i++) {
    const id = uuid();
    const companyId = uuid();
    store.companies.set(companyId, {
      id: companyId,
      real_name: `Lead Company ${i}`,
      platform_alias: `Client-LD0${i}`,
      type: i % 2 === 0 ? "supplier" : "client",
      cr_number: null,
      vat_number: null,
      status: "pending_kyc",
      kyc_docs: [],
      signup_source: i % 2 === 0 ? "supplier_form" : "client_form",
      signup_intent: "Need more info",
      expected_monthly_volume_sar: null,
      subscription_tier: "trial",
      onboarding_completed: false,
      created_at: nowISO(),
      updated_at: nowISO(),
    });
    store.users.set(id, {
      id,
      email: `lead${i}@example.com`,
      role: i % 2 === 0 ? "supplier" : "client",
      real_name: `Lead User ${i}`,
      phone: `+9665010000${10 + i}`,
      platform_alias: `Lead-${i}`,
      company_id: companyId,
      status: "pending_callback",
      activation_status: "awaiting_callback",
      callback_notes: null,
      activation_token: null,
      language: "en",
      onboarding_completed: false,
      created_at: nowISO(),
      updated_at: nowISO(),
    });
  }

  return {
    client_user_id: clientUserId,
    supplier_user_id: supplierUserId,
    admin_user_id: adminId,
    client_company_id: clientCompanyId,
    supplier_company_id: supplierCompanyId,
    supplier_violet_company_id: supplierVioletCompanyId,
  };
}
