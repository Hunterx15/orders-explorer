
import type { Order, RawOrder } from "../types/order";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function parseDate(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value * 1000; // Epoch seconds to milliseconds
  }

  // DD/MM/YYYY format
  const dayMonthYear = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear;
    return Date.UTC(Number(year), Number(month) - 1, Number(day));
  }

  // ISO without timezone: treat as UTC
  const isoWithoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

  const normalizedValue = isoWithoutTimezone.test(value)
    ? `${value}Z`
    : value;

  const timestamp = Date.parse(normalizedValue);

  return Number.isNaN(timestamp) ? null : timestamp;
}

export function normalizeOrder(raw: RawOrder): Order {
  const rawAmount = Number(raw.amount);

  const amount =
    raw.schemaVersion === 1 ? rawAmount / 100 : rawAmount;

  return {
    id: raw.id,
    schemaVersion: raw.schemaVersion,

    customerName: (
      raw.customerName ?? raw.customer_name ?? ""
    ).trim(),

    customerEmail: (raw.customerEmail ?? "").trim(),

    status: normalizeText(raw.status),
    amount,
    currency: raw.currency.trim(),

    createdAt: parseDate(raw.createdAt) ?? 0,
    updatedAt: parseDate(raw.updatedAt),

    region: normalizeText(raw.region),
    channel: normalizeText(raw.channel),

    priority: raw.priority ?? null,

    paymentMethod: normalizeText(raw.paymentMethod),
    itemCount: raw.itemCount,
    notes: raw.notes ?? "",
  };
}

export function normalizeOrders(rawOrders: RawOrder[]): Order[] {
  const ordersById = new Map<string, Order>();

  for (const raw of rawOrders) {
    const order = normalizeOrder(raw);
    const existing = ordersById.get(order.id);

    if (!existing) {
      ordersById.set(order.id, order);
      continue;
    }

    // A record with an updatedAt takes precedence over one without it.
    if (existing.updatedAt === null && order.updatedAt !== null) {
      ordersById.set(order.id, order);
      continue;
    }

    if (
      existing.updatedAt !== null &&
      order.updatedAt !== null &&
      order.updatedAt >= existing.updatedAt
    ) {
      ordersById.set(order.id, order);
      continue;
    }

    if (existing.updatedAt === null && order.updatedAt === null) {
      // Later occurrence in the file wins.
      ordersById.set(order.id, order);
    }
  }

  return Array.from(ordersById.values());
}
