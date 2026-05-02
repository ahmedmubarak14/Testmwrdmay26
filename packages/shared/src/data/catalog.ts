// Master catalog: categories, master products, bundles.
// CLAUDE.md: master catalog rule — admin creates MasterProducts; suppliers do not.
// Quote-only client experience — no prices anywhere on these reads.

import { v4 as uuid } from "uuid";

import type { Bundle, Category, ID, MasterProduct } from "../types";
import {
  CreateCategorySchema,
  CreateMasterProductSchema,
} from "../validations";
import { generateMasterProductCode } from "../utils/numbers";
import { store, nowISO } from "./store";

export interface ListMasterProductsParams {
  category_id?: ID;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

const PAGE_SIZE = 25;

// ─── Categories ─────────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  return Array.from(store.categories.values()).sort((a, b) => a.sort_order - b.sort_order);
}

export async function createCategory(input: Omit<Category, "id">): Promise<Category> {
  const parsed = CreateCategorySchema.parse(input);
  const id = uuid();
  const cat: Category = { ...parsed, id, parent_id: parsed.parent_id ?? null };
  store.categories.set(id, cat);
  return cat;
}

export async function updateCategory(
  id: ID,
  patch: Partial<Omit<Category, "id">>,
): Promise<Category> {
  const existing = store.categories.get(id);
  if (!existing) throw new Error("Category not found");
  const updated: Category = { ...existing, ...patch };
  store.categories.set(id, updated);
  return updated;
}

// ─── Master products ────────────────────────────────────────────────────────

export async function listMasterProducts(
  params: ListMasterProductsParams,
): Promise<PaginatedResult<MasterProduct>> {
  let items = Array.from(store.master_products.values()).filter(
    (p) => p.status === "active",
  );

  if (params.category_id) {
    const cat = store.categories.get(params.category_id);
    if (cat && cat.parent_id === null) {
      // Top-level: include products in any descendant category.
      const descendantIds = new Set<ID>([cat.id]);
      for (const c of store.categories.values()) {
        if (c.parent_id === cat.id) descendantIds.add(c.id);
      }
      items = items.filter((p) => descendantIds.has(p.category_id));
    } else {
      items = items.filter((p) => p.category_id === params.category_id);
    }
  }

  if (params.search) {
    const needle = params.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name_en.toLowerCase().includes(needle) ||
        p.name_ar.toLowerCase().includes(needle) ||
        p.master_product_code.toLowerCase().includes(needle),
    );
  }

  const total = items.length;
  const page = params.page ?? 1;
  const page_size = Math.min(params.page_size ?? PAGE_SIZE, PAGE_SIZE);
  const start = (page - 1) * page_size;
  return {
    items: items.slice(start, start + page_size),
    total,
    page,
    page_size,
  };
}

export async function getMasterProduct(id: ID): Promise<MasterProduct | null> {
  return store.master_products.get(id) ?? null;
}

export async function createMasterProduct(
  input: Omit<MasterProduct, "id" | "master_product_code" | "created_at" | "updated_at">,
): Promise<MasterProduct> {
  const parsed = CreateMasterProductSchema.parse(input);
  const id = uuid();
  store.master_product_seq.value += 1;
  const mp: MasterProduct = {
    ...parsed,
    id,
    master_product_code: generateMasterProductCode(store.master_product_seq.value),
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.master_products.set(id, mp);
  return mp;
}

export async function updateMasterProduct(
  id: ID,
  patch: Partial<Omit<MasterProduct, "id" | "master_product_code">>,
): Promise<MasterProduct> {
  const existing = store.master_products.get(id);
  if (!existing) throw new Error("Master product not found");
  const updated: MasterProduct = { ...existing, ...patch, updated_at: nowISO() };
  store.master_products.set(id, updated);
  return updated;
}

export async function deprecateMasterProduct(id: ID): Promise<MasterProduct> {
  return updateMasterProduct(id, { status: "deprecated" });
}

// ─── Bundles ────────────────────────────────────────────────────────────────

export async function listBundles(): Promise<Bundle[]> {
  return Array.from(store.bundles.values());
}

export async function getBundle(id: ID): Promise<Bundle | null> {
  return store.bundles.get(id) ?? null;
}
