import type { Order } from "../types/order";
import type {
  FilterCondition,
  FilterGroup,
  FilterState,
} from "../types/filters";

function matchesCondition(order: Order, condition: FilterCondition): boolean {
  const rawValue = order[condition.field];
  const value = condition.value.trim();

  if (condition.field === "updatedAt" && rawValue === null) {
    return false;
  }

  if (condition.field === "priority" && rawValue === null) {
    return condition.operator === "equals" && value.toLowerCase() === "none";
  }

  if (rawValue === null || rawValue === undefined) {
    return false;
  }

  if (
    condition.operator === "contains" ||
    condition.operator === "notContains"
  ) {
    const actual = String(rawValue).toLowerCase();
    const expected = value.toLowerCase();

    return condition.operator === "contains"
      ? actual.includes(expected)
      : !actual.includes(expected);
  }

  if (condition.operator === "in") {
    const selectedValues = (condition.values ?? []).map((value) =>
      value.trim().toLowerCase(),
    );

    return selectedValues.includes(String(rawValue).trim().toLowerCase());
  }

  if (condition.field === "createdAt" || condition.field === "updatedAt") {
    const actual = Number(rawValue);
    const expected = Date.parse(value);

    if (!Number.isFinite(expected)) return false;

    if (condition.operator === "before") return actual < expected;
    if (condition.operator === "after") return actual > expected;

    if (condition.operator === "between") {
      const second = Date.parse(condition.secondValue ?? "");
      return (
        Number.isFinite(second) &&
        actual >= Math.min(expected, second) &&
        actual <= Math.max(expected, second)
      );
    }

    return condition.operator === "equals" && actual === expected;
  }

  if (typeof rawValue === "number") {
    const expected = Number(value);
    if (!Number.isFinite(expected)) return false;

    if (condition.operator === "equals") return rawValue === expected;
    if (condition.operator === "greaterThan") return rawValue > expected;
    if (condition.operator === "lessThan") return rawValue < expected;

    if (condition.operator === "between") {
      const second = Number(condition.secondValue);
      return (
        Number.isFinite(second) &&
        rawValue >= Math.min(expected, second) &&
        rawValue <= Math.max(expected, second)
      );
    }

    return false;
  }

  const actual = String(rawValue).toLowerCase();
  const expected = value.toLowerCase();

  if (condition.operator === "equals") return actual === expected;

  return false;
}

function matchesGroup(order: Order, group: FilterGroup): boolean {
  return (
    group.conditions.length === 0 ||
    group.conditions.some((condition) => matchesCondition(order, condition))
  );
}

export function filterOrders(orders: Order[], filters: FilterState): Order[] {
  if (filters.groups.length === 0) return orders;

  return orders.filter((order) =>
    filters.groups.every((group) => matchesGroup(order, group)),
  );
}
