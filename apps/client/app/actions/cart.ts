"use server";

import { revalidatePath } from "next/cache";

import { data } from "@mwrd/shared";
import type { PackType } from "@mwrd/shared";

import { getViewer } from "@/lib/viewer";

export async function addToCartAction(input: {
  master_product_id: string;
  qty: number;
  pack_type: PackType;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await getViewer();
    await data.addToCart(user.id, input);
    revalidatePath("/cart");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Add failed" };
  }
}

export async function removeFromCartAction(
  cart_item_id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await data.removeFromCart(cart_item_id);
    revalidatePath("/cart");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Remove failed" };
  }
}

export async function updateCartItemAction(
  cart_item_id: string,
  patch: { qty?: number; pack_type?: PackType },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await data.updateCartItem(cart_item_id, patch);
    revalidatePath("/cart");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function saveCartAction(
  cart_id: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await data.saveCart(cart_id, name);
    revalidatePath("/cart");
    revalidatePath("/cart/saved");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function resumeCartAction(cart_id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await data.resumeSavedCart(cart_id);
    revalidatePath("/cart");
    revalidatePath("/cart/saved");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Resume failed" };
  }
}

export async function addBundleToCartAction(
  bundle_id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await getViewer();
    await data.addBundleToCart(user.id, bundle_id);
    revalidatePath("/cart");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Add bundle failed" };
  }
}

export async function toggleFavouriteAction(
  master_product_id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await getViewer();
    await data.toggleFavourite(user.id, master_product_id);
    revalidatePath("/favourites");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Toggle failed" };
  }
}
