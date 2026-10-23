import type { RawOrder } from "../types/order";
import { normalizeOrders } from "./normalizeOrders";

export async function loadOrders(): Promise<ReturnType<typeof normalizeOrders>> {
  const response = await fetch("/data/orders.json");

  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }

  const rawOrders = (await response.json()) as RawOrder[];
  return normalizeOrders(rawOrders);
}