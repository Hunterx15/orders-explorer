
export type FilterField =
  | "id"
  | "customerName"
  | "customerEmail"
  | "status"
  | "amount"
  | "currency"
  | "createdAt"
  | "updatedAt"
  | "region"
  | "channel"
  | "priority"
  | "paymentMethod"
  | "itemCount"
  | "notes";

export type FilterOperator =
  | "contains"
  | "notContains"
  | "equals"
  | "greaterThan"
  | "lessThan"
  | "between"
  | "before"
  | "after"
  | "in";

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
  secondValue?: string;
  values?: string[];
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

export interface FilterState {
  groups: FilterGroup[];
}
