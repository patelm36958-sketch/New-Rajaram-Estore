const KEY = "village-grocery-guest-cart";

export function readGuestCart() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function clearGuestCart() {
  localStorage.removeItem(KEY);
}

/** @param {{ productId: string, quantity: number }[]} items */
export function upsertGuestItem(productId, quantity) {
  const items = readGuestCart().filter((i) => i.productId !== productId);
  if (quantity > 0) items.push({ productId, quantity });
  writeGuestCart(items);
  return items;
}
