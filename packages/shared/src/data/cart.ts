// Cart, company catalogs, favourites.

import { v4 as uuid } from "uuid";

import type {
  Cart,
  CartItem,
  CompanyCatalog,
  FavouriteList,
  ID,
  PackType,
} from "../types";
import { AddToCartSchema } from "../validations";
import { store, nowISO } from "./store";

// ─── Carts ──────────────────────────────────────────────────────────────────

export async function getActiveCart(user_id: ID): Promise<Cart> {
  for (const cart of store.carts.values()) {
    if (cart.user_id === user_id && cart.status === "active") return cart;
  }
  const id = uuid();
  const cart: Cart = { id, user_id, items: [], status: "active" };
  store.carts.set(id, cart);
  return cart;
}

export async function addToCart(
  user_id: ID,
  input: { master_product_id: ID; qty: number; pack_type: PackType },
): Promise<Cart> {
  const parsed = AddToCartSchema.parse(input);
  const cart = await getActiveCart(user_id);

  const existing = cart.items.find(
    (i) => i.master_product_id === parsed.master_product_id && i.pack_type === parsed.pack_type,
  );
  if (existing) {
    existing.qty += parsed.qty;
  } else {
    const item: CartItem = {
      id: uuid(),
      cart_id: cart.id,
      master_product_id: parsed.master_product_id,
      qty: parsed.qty,
      pack_type: parsed.pack_type,
    };
    cart.items.push(item);
  }
  store.carts.set(cart.id, cart);
  return cart;
}

export async function updateCartItem(
  cart_item_id: ID,
  patch: { qty?: number; pack_type?: PackType },
): Promise<Cart> {
  for (const cart of store.carts.values()) {
    const item = cart.items.find((i) => i.id === cart_item_id);
    if (item) {
      if (patch.qty !== undefined) item.qty = patch.qty;
      if (patch.pack_type !== undefined) item.pack_type = patch.pack_type;
      store.carts.set(cart.id, cart);
      return cart;
    }
  }
  throw new Error("Cart item not found");
}

export async function removeFromCart(cart_item_id: ID): Promise<Cart> {
  for (const cart of store.carts.values()) {
    const idx = cart.items.findIndex((i) => i.id === cart_item_id);
    if (idx !== -1) {
      cart.items.splice(idx, 1);
      store.carts.set(cart.id, cart);
      return cart;
    }
  }
  throw new Error("Cart item not found");
}

export async function saveCart(cart_id: ID, name: string): Promise<Cart> {
  const cart = store.carts.get(cart_id);
  if (!cart) throw new Error("Cart not found");
  cart.status = "saved";
  cart.name = name;
  cart.expires_at = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  store.carts.set(cart_id, cart);
  return cart;
}

export async function listSavedCarts(user_id: ID): Promise<Cart[]> {
  return Array.from(store.carts.values()).filter(
    (c) => c.user_id === user_id && c.status === "saved",
  );
}

export async function resumeSavedCart(cart_id: ID): Promise<Cart> {
  const cart = store.carts.get(cart_id);
  if (!cart) throw new Error("Cart not found");
  cart.status = "active";
  store.carts.set(cart_id, cart);
  return cart;
}

// submitCartAsRFQ lives in rfq.ts to keep RFQ logic colocated.

export async function addBundleToCart(user_id: ID, bundle_id: ID): Promise<Cart> {
  const bundle = store.bundles.get(bundle_id);
  if (!bundle) throw new Error("Bundle not found");
  const cart = await getActiveCart(user_id);
  for (const bi of bundle.items) {
    const mp = store.master_products.get(bi.master_product_id);
    if (!mp) continue;
    const existing = cart.items.find(
      (i) => i.master_product_id === bi.master_product_id,
    );
    if (existing) {
      existing.qty += bi.qty;
    } else {
      cart.items.push({
        id: uuid(),
        cart_id: cart.id,
        master_product_id: bi.master_product_id,
        qty: bi.qty,
        pack_type: mp.pack_types[0] ?? "Each",
      });
    }
  }
  store.carts.set(cart.id, cart);
  return cart;
}

// ─── Company Catalogs ───────────────────────────────────────────────────────

export async function listCompanyCatalogs(company_id: ID): Promise<CompanyCatalog[]> {
  return Array.from(store.company_catalogs.values()).filter(
    (c) => c.company_id === company_id,
  );
}

export async function createCompanyCatalog(input: {
  company_id: ID;
  name: string;
  description: string;
  created_by_user_id: ID;
}): Promise<CompanyCatalog> {
  const id = uuid();
  const cat: CompanyCatalog = {
    id,
    company_id: input.company_id,
    name: input.name,
    description: input.description,
    master_product_ids: [],
    created_by_user_id: input.created_by_user_id,
  };
  store.company_catalogs.set(id, cat);
  return cat;
}

export async function addToCompanyCatalog(
  catalog_id: ID,
  master_product_id: ID,
): Promise<CompanyCatalog> {
  const cat = store.company_catalogs.get(catalog_id);
  if (!cat) throw new Error("Catalog not found");
  if (!cat.master_product_ids.includes(master_product_id)) {
    cat.master_product_ids.push(master_product_id);
  }
  store.company_catalogs.set(catalog_id, cat);
  return cat;
}

export async function removeFromCompanyCatalog(
  catalog_id: ID,
  master_product_id: ID,
): Promise<CompanyCatalog> {
  const cat = store.company_catalogs.get(catalog_id);
  if (!cat) throw new Error("Catalog not found");
  cat.master_product_ids = cat.master_product_ids.filter((id) => id !== master_product_id);
  store.company_catalogs.set(catalog_id, cat);
  return cat;
}

export async function renameCompanyCatalog(
  catalog_id: ID,
  name: string,
): Promise<CompanyCatalog> {
  const cat = store.company_catalogs.get(catalog_id);
  if (!cat) throw new Error("Catalog not found");
  cat.name = name;
  store.company_catalogs.set(catalog_id, cat);
  return cat;
}

export async function deleteCompanyCatalog(catalog_id: ID): Promise<void> {
  store.company_catalogs.delete(catalog_id);
}

// ─── Favourites ─────────────────────────────────────────────────────────────

export async function getFavourites(user_id: ID): Promise<FavouriteList> {
  const existing = store.favourites.get(user_id);
  if (existing) return existing;
  const fresh: FavouriteList = { id: uuid(), user_id, master_product_ids: [] };
  store.favourites.set(user_id, fresh);
  return fresh;
}

export async function toggleFavourite(
  user_id: ID,
  master_product_id: ID,
): Promise<FavouriteList> {
  const list = await getFavourites(user_id);
  const idx = list.master_product_ids.indexOf(master_product_id);
  if (idx === -1) {
    list.master_product_ids.push(master_product_id);
  } else {
    list.master_product_ids.splice(idx, 1);
  }
  store.favourites.set(user_id, list);
  return list;
}
