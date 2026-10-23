import FilterBuilder from "./FilterBuilder";
import { filterOrders } from "../lib/filterOrders";
import type { FilterGroup } from "../types/filters";
import { useMemo, useState, useRef } from "react";
import { GRID_COLUMNS } from "../types/grid";
import type { Order } from "../types/order";
import type { FilterState } from "../types/filters";

interface ParsedFilters {
  groups: FilterGroup[];
  invalid: boolean;
}

const validFields = new Set([
  "id",
  "customerName",
  "customerEmail",
  "status",
  "amount",
  "currency",
  "createdAt",
  "updatedAt",
  "region",
  "channel",
  "priority",
  "paymentMethod",
  "itemCount",
  "notes",
]);

const validOperators = new Set([
  "contains",
  "notContains",
  "equals",
  "greaterThan",
  "lessThan",
  "between",
  "before",
  "after",
  "in",
]);

function isOperatorValidForField(field: string, operator: string): boolean {
  const dateFields = ["createdAt", "updatedAt"];
  const numberFields = ["amount", "priority", "itemCount"];
  const choiceFields = [
    "status",
    "region",
    "channel",
    "currency",
    "paymentMethod",
  ];

  if (dateFields.includes(field)) {
    return ["before", "after", "between", "equals"].includes(operator);
  }

  if (numberFields.includes(field)) {
    return ["equals", "greaterThan", "lessThan", "between"].includes(operator);
  }

  if (choiceFields.includes(field)) {
    return ["equals", "in"].includes(operator);
  }

  return ["contains", "notContains", "equals"].includes(operator);
}

function validateConditionValue(condition: {
  field: string;
  operator: string;
  value: string;
  secondValue?: string;
  values?: string[];
}): boolean {
  const { field, operator, value, secondValue, values } = condition;

  if (operator === "in") {
    return Array.isArray(values) && values.length > 0;
  }

  if (operator === "between") {
    if (field === "createdAt" || field === "updatedAt") {
      return (
        !Number.isNaN(Date.parse(value)) &&
        !Number.isNaN(Date.parse(secondValue ?? ""))
      );
    }

    return (
      value.trim() !== "" &&
      secondValue?.trim() !== "" &&
      Number.isFinite(Number(value)) &&
      Number.isFinite(Number(secondValue))
    );
  }

  if (field === "createdAt" || field === "updatedAt") {
    return !Number.isNaN(Date.parse(value));
  }

  if (["amount", "priority", "itemCount"].includes(field)) {
    return value.trim() !== "" && Number.isFinite(Number(value));
  }

  return true;
}

function readFiltersFromUrl(): ParsedFilters {
  const params = new URLSearchParams(window.location.search);
  const rawFilters = params.get("filters");

  if (!rawFilters) {
    return { groups: [], invalid: false };
  }

  try {
    const parsed = JSON.parse(rawFilters) as FilterState;

    if (
      !parsed ||
      !Array.isArray(parsed.groups) ||
      !parsed.groups.every(
        (group) =>
          group &&
          typeof group.id === "string" &&
          Array.isArray(group.conditions) &&
          group.conditions.every(
            (condition) =>
              condition &&
              typeof condition.id === "string" &&
              typeof condition.field === "string" &&
              validFields.has(condition.field) &&
              typeof condition.operator === "string" &&
              validOperators.has(condition.operator) &&
              isOperatorValidForField(condition.field, condition.operator) &&
              typeof condition.value === "string" &&
              (condition.secondValue === undefined ||
                typeof condition.secondValue === "string") &&
              (condition.values === undefined ||
                (Array.isArray(condition.values) &&
                  condition.values.every(
                    (value) => typeof value === "string",
                  ))) &&
              validateConditionValue(condition),
          ),
      )
    ) {
      return { groups: [], invalid: true };
    }

    return { groups: parsed.groups, invalid: false };
  } catch {
    return { groups: [], invalid: true };
  }
}

interface OrdersGridProps {
  orders: Order[];
}

type SortDirection = "asc" | "desc";

function formatCellValue(order: Order, key: string): string {
  const value = order[key as keyof Order];

  if (value === null || value === undefined || value === "") {
    return key === "priority" ? "None" : "—";
  }

  if (key === "amount") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: order.currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  if (key === "createdAt" || key === "updatedAt") {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(Number(value));
  }

  return String(value);
}

function compareOrders(a: Order, b: Order, key: keyof Order): number {
  const aValue = a[key];
  const bValue = b[key];

  // Missing updated dates always sort last.
  if (key === "updatedAt") {
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;
  }

  if (typeof aValue === "number" && typeof bValue === "number") {
    return aValue - bValue;
  }

  const left = String(aValue ?? "").toLowerCase();
  const right = String(bValue ?? "").toLowerCase();

  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sortOrders(
  orders: Order[],
  sortKey: keyof Order,
  sortDirection: SortDirection,
): Order[] {
  return [...orders].sort((a, b) => {
    if (sortKey === "updatedAt") {
      if (a.updatedAt === null && b.updatedAt === null) return 0;
      if (a.updatedAt === null) return 1;
      if (b.updatedAt === null) return -1;
    }

    const comparison = compareOrders(a, b, sortKey);
    return sortDirection === "asc" ? comparison : -comparison;
  });
}

export default function OrdersGrid({ orders }: OrdersGridProps) {
  const validSortKeys = GRID_COLUMNS.map((column) => column.key);

  const [sortKey, setSortKey] = useState<keyof Order>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSort = params.get("sort");

    return urlSort && validSortKeys.includes(urlSort as keyof Order)
      ? (urlSort as keyof Order)
      : "createdAt";
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("direction") === "asc" ? "asc" : "desc";
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      GRID_COLUMNS.map((column) => [column.key, column.width]),
    ),
  );

  const [pinnedColumn, setPinnedColumn] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPinned = params.get("pinned");

    if (urlPinned === "none") return null;

    return urlPinned && GRID_COLUMNS.some((column) => column.key === urlPinned)
      ? urlPinned
      : "id";
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("selected");

    return new Set(selected ? selected.split(",").filter(Boolean) : []);
  });

  const [initialFilterState] = useState(readFiltersFromUrl);

  const [appliedGroups, setAppliedGroups] = useState<FilterGroup[]>(
    initialFilterState.groups,
  );

  const [invalidFiltersUrl, setInvalidFiltersUrl] = useState(
    initialFilterState.invalid,
  );

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const [focusedCell, setFocusedCell] = useState<{
    rowIndex: number;
    columnIndex: number;
  } | null>(null);

  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());

  function getCellKey(rowIndex: number, columnIndex: number) {
    return `${rowIndex}-${columnIndex}`;
  }

  const lastSelectedIndex = useRef<number | null>(null);

  function toggleRowSelection(id: string, shiftKey = false) {
    const clickedIndex = sortedOrders.findIndex((order) => order.id === id);

    if (clickedIndex === -1) return;

    const previousIndex = lastSelectedIndex.current;

    setSelectedIds((current) => {
      const next = new Set(current);

      if (shiftKey && previousIndex !== null) {
        const start = Math.min(previousIndex, clickedIndex);
        const end = Math.max(previousIndex, clickedIndex);

        for (let i = start; i <= end; i++) {
          next.add(sortedOrders[i].id);
        }
      } else {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }

      const params = new URLSearchParams(window.location.search);

      if (next.size > 0) {
        params.set("selected", Array.from(next).join(","));
      } else {
        params.delete("selected");
      }

      const query = params.toString();
      const nextUrl = query
        ? `${window.location.pathname}?${query}${window.location.hash}`
        : window.location.pathname;

      window.history.replaceState(null, "", nextUrl);

      return next;
    });

    if (!shiftKey) {
      lastSelectedIndex.current = clickedIndex;
    }
  }

  const filteredOrders = useMemo(() => {
    return filterOrders(orders, {
      groups: appliedGroups.filter((group) => group.conditions.length > 0),
    });
  }, [orders, appliedGroups]);
  const sortedOrders = sortOrders(filteredOrders, sortKey, sortDirection);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const ROW_HEIGHT = 42;
  const BUFFER_ROWS = 8;
  const VIEWPORT_HEIGHT = 500;
  const SELECTION_COLUMN_WIDTH = 56;

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS,
  );

  const visibleRowCount =
    Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + BUFFER_ROWS * 2;

  const endIndex = Math.min(sortedOrders.length, startIndex + visibleRowCount);

  const visibleOrders = sortedOrders.slice(startIndex, endIndex);

  const topSpacerHeight = startIndex * ROW_HEIGHT;

  const bottomSpacerHeight = (sortedOrders.length - endIndex) * ROW_HEIGHT;

  function handleSort(key: string) {
    const nextKey = key as keyof Order;
    const nextDirection: SortDirection =
      sortKey === key ? (sortDirection === "asc" ? "desc" : "asc") : "asc";

    setSortKey(nextKey);
    setSortDirection(nextDirection);

    const params = new URLSearchParams(window.location.search);
    params.set("sort", nextKey);
    params.set("direction", nextDirection);

    const query = params.toString();
    const nextUrl = query
      ? `${window.location.pathname}?${query}${window.location.hash}`
      : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }

  const selectedOrders = orders.filter((order) => selectedIds.has(order.id));

  function exportSelectedOrdersToCsv() {
    if (selectedOrders.length === 0) return;

    const headers = GRID_COLUMNS.map((column) => column.label);

    const escapeCsvValue = (value: string): string => {
      return `"${value.replace(/"/g, '""')}"`;
    };

    const rows = selectedOrders.map((order) =>
      GRID_COLUMNS.map((column) =>
        escapeCsvValue(formatCellValue(order, column.key)),
      ),
    );

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selected-orders.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  const totalsByCurrency = selectedOrders.reduce<Record<string, number>>(
    (totals, order) => {
      const currency = order.currency || "INR";
      totals[currency] = (totals[currency] ?? 0) + order.amount;
      return totals;
    },
    {},
  );
  return (
    <>
      {invalidFiltersUrl && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            border: "1px solid #b45309",
            borderRadius: 8,
            background: "#451a03",
            color: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>
            The filters in this URL are invalid. Default filters have been
            loaded.
          </span>

          <button
            type="button"
            onClick={() => setInvalidFiltersUrl(false)}
            aria-label="Dismiss invalid URL warning"
            style={{
              background: "transparent",
              border: 0,
              color: "inherit",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>
      )}
      <FilterBuilder
        initialGroups={appliedGroups}
        onApply={(groups) => {
          setAppliedGroups(groups);

          const params = new URLSearchParams(window.location.search);

          if (groups.some((group) => group.conditions.length > 0)) {
            params.set(
              "filters",
              JSON.stringify({
                groups: groups.filter((group) => group.conditions.length > 0),
              }),
            );
          } else {
            params.delete("filters");
          }

          const query = params.toString();
          const nextUrl = query
            ? `${window.location.pathname}?${query}${window.location.hash}`
            : window.location.pathname;

          window.history.replaceState(null, "", nextUrl);
        }}
        resultCount={filteredOrders.length}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 4px",
          color: "#d1d5db",
        }}
      >
        <span>
          {selectedIds.size.toLocaleString()} order
          {selectedIds.size === 1 ? "" : "s"} selected
        </span>

        <button
          type="button"
          onClick={exportSelectedOrdersToCsv}
          disabled={selectedIds.size === 0}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #0891b2",
            background: selectedIds.size === 0 ? "#20232b" : "#164e63",
            color: "#e5e7eb",
            cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
          }}
        >
          Export CSV ({selectedIds.size})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedIds(new Set());

            const params = new URLSearchParams(window.location.search);
            params.delete("selected");

            const query = params.toString();
            const nextUrl = query
              ? `${window.location.pathname}?${query}${window.location.hash}`
              : window.location.pathname;

            window.history.replaceState(null, "", nextUrl);
          }}
          disabled={selectedIds.size === 0}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #454b57",
            background: "#20232b",
            color: "#e5e7eb",
            cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
          }}
        >
          Clear selection
        </button>
        <span>
          {Object.entries(totalsByCurrency)
            .map(
              ([currency, total]) =>
                `Selected value (${currency}): ${new Intl.NumberFormat(
                  "en-IN",
                  {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 2,
                  },
                ).format(total)}`,
            )
            .join(" · ")}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{
          overflow: "auto",
          height: VIEWPORT_HEIGHT,
          border: "1px solid #30343b",
        }}
      >
        <table
          style={{
            width: "max-content",
            minWidth: 1800,
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  position: "sticky",
                  top: 0,
                  left: 0,
                  zIndex: 4,
                  background: "#20232b",
                  padding: "12px",
                  borderBottom: "1px solid #3b404a",
                }}
              >
                <input
                  type="checkbox"
                  aria-label="Select all visible orders"
                  checked={
                    sortedOrders.length > 0 &&
                    sortedOrders.every((order) => selectedIds.has(order.id))
                  }
                  onChange={(event) => {
                    const shouldSelect = event.target.checked;

                    setSelectedIds((current) => {
                      const next = new Set(current);

                      if (shouldSelect) {
                        sortedOrders.forEach((order) => next.add(order.id));
                      } else {
                        sortedOrders.forEach((order) => next.delete(order.id));
                      }

                      const params = new URLSearchParams(
                        window.location.search,
                      );

                      if (next.size > 0) {
                        params.set("selected", Array.from(next).join(","));
                      } else {
                        params.delete("selected");
                      }

                      const query = params.toString();
                      const nextUrl = query
                        ? `${window.location.pathname}?${query}${window.location.hash}`
                        : window.location.pathname;

                      window.history.replaceState(null, "", nextUrl);

                      return next;
                    });
                  }}
                />
              </th>

              {GRID_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  title="Click to sort"
                  style={{
                    position: "sticky",
                    top: 0,
                    left:
                      pinnedColumn === column.key
                        ? SELECTION_COLUMN_WIDTH
                        : undefined,
                    zIndex: pinnedColumn === column.key ? 3 : 1,
                    background: "#20232b",
                    color: "#e5e7eb",
                    textAlign: column.type === "number" ? "right" : "left",
                    padding: "12px",
                    minWidth: column.minWidth,
                    width: columnWidths[column.key],
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid #3b404a",
                    borderRight: "1px solid #3b404a",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ position: "relative", paddingRight: 8 }}>
                    {column.label}
                    {sortKey === column.key
                      ? sortDirection === "asc"
                        ? " ↑"
                        : " ↓"
                      : ""}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        const nextPinned =
                          pinnedColumn === column.key ? null : column.key;

                        setPinnedColumn(nextPinned);

                        const params = new URLSearchParams(
                          window.location.search,
                        );
                        params.set("pinned", nextPinned ?? "none");

                        const query = params.toString();
                        const nextUrl = query
                          ? `${window.location.pathname}?${query}${window.location.hash}`
                          : window.location.pathname;

                        window.history.replaceState(null, "", nextUrl);
                      }}
                      title={
                        pinnedColumn === column.key
                          ? "Unpin column"
                          : "Pin column"
                      }
                      style={{
                        marginLeft: 8,
                        cursor: "pointer",
                        color:
                          pinnedColumn === column.key ? "#67e8f9" : "#9ca3af",
                        background: "transparent",
                        border: 0,
                      }}
                    >
                      {pinnedColumn === column.key ? "📌" : "◇"}
                    </button>

                    <span
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        event.preventDefault();

                        const startX = event.clientX;
                        const startWidth = columnWidths[column.key];

                        const onMouseMove = (moveEvent: MouseEvent) => {
                          const nextWidth = Math.max(
                            column.minWidth,
                            startWidth + moveEvent.clientX - startX,
                          );

                          setColumnWidths((current) => ({
                            ...current,
                            [column.key]: nextWidth,
                          }));
                        };

                        const onMouseUp = () => {
                          window.removeEventListener("mousemove", onMouseMove);
                          window.removeEventListener("mouseup", onMouseUp);
                        };

                        window.addEventListener("mousemove", onMouseMove);
                        window.addEventListener("mouseup", onMouseUp);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      title="Drag to resize column"
                      style={{
                        position: "absolute",
                        top: -12,
                        right: -8,
                        width: 12,
                        height: 42,
                        cursor: "col-resize",
                        zIndex: 5,
                        borderRight: "2px solid #64748b",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={GRID_COLUMNS.length + 1}
                  style={{
                    height: 240,
                    padding: 24,
                    textAlign: "center",
                    verticalAlign: "middle",
                    color: "#9ca3af",
                  }}
                >
                  <div
                    style={{
                      color: "#f3f4f6",
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    No orders found
                  </div>
                  <div>No orders match your current filters.</div>
                  <div style={{ marginTop: 8 }}>
                    Try changing your conditions or clearing the filters.
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {topSpacerHeight > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={GRID_COLUMNS.length + 1}
                      style={{
                        height: topSpacerHeight,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}

                {visibleOrders.map((order) => (
                  <tr key={order.id} style={{ height: ROW_HEIGHT }}>
                    <td
                      style={{
                        height: ROW_HEIGHT,
                        padding: "0 12px",
                        textAlign: "center",
                        background: "#1b1e25",
                        borderBottom: "1px solid #292d35",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={(event) => {
                          const shiftKey =
                            event.nativeEvent instanceof MouseEvent
                              ? event.nativeEvent.shiftKey
                              : false;

                          toggleRowSelection(order.id, shiftKey);
                        }}
                        aria-label={`Select order ${order.id}`}
                      />
                    </td>

                    {GRID_COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        ref={(element) => {
                          const rowIndex = sortedOrders.findIndex(
                            (item) => item.id === order.id,
                          );
                          const columnIndex = GRID_COLUMNS.findIndex(
                            (item) => item.key === column.key,
                          );
                          const key = getCellKey(rowIndex, columnIndex);

                          if (element) {
                            cellRefs.current.set(key, element);
                          } else {
                            cellRefs.current.delete(key);
                          }
                        }}
                        tabIndex={
                          focusedCell?.rowIndex ===
                            startIndex + visibleOrders.indexOf(order) &&
                          focusedCell?.columnIndex ===
                            GRID_COLUMNS.findIndex(
                              (item) => item.key === column.key,
                            )
                            ? 0
                            : -1
                        }
                        onFocus={() =>
                          setFocusedCell({
                            rowIndex: sortedOrders.findIndex(
                              (item) => item.id === order.id,
                            ),
                            columnIndex: GRID_COLUMNS.findIndex(
                              (item) => item.key === column.key,
                            ),
                          })
                        }
                        onKeyDown={(event) => {
                          if (event.key === " ") {
                            event.preventDefault();
                            toggleRowSelection(order.id);
                            return;
                          }
                          if (event.key === "Enter") {
                            event.preventDefault();
                            setActiveOrder(order);
                            return;
                          }

                          if (
                            event.key !== "ArrowDown" &&
                            event.key !== "ArrowUp" &&
                            event.key !== "ArrowLeft" &&
                            event.key !== "ArrowRight"
                          ) {
                            return;
                          }

                          event.preventDefault();

                          const currentRow = sortedOrders.findIndex(
                            (item) => item.id === order.id,
                          );
                          const currentColumn = GRID_COLUMNS.findIndex(
                            (item) => item.key === column.key,
                          );

                          const nextRow = Math.max(
                            0,
                            Math.min(
                              sortedOrders.length - 1,
                              currentRow +
                                (event.key === "ArrowDown"
                                  ? 1
                                  : event.key === "ArrowUp"
                                    ? -1
                                    : 0),
                            ),
                          );

                          const nextColumn = Math.max(
                            0,
                            Math.min(
                              GRID_COLUMNS.length - 1,
                              currentColumn +
                                (event.key === "ArrowRight"
                                  ? 1
                                  : event.key === "ArrowLeft"
                                    ? -1
                                    : 0),
                            ),
                          );

                          setFocusedCell({
                            rowIndex: nextRow,
                            columnIndex: nextColumn,
                          });

                          const targetScrollTop = nextRow * ROW_HEIGHT;

                          if (scrollContainerRef.current) {
                            const container = scrollContainerRef.current;
                            const rowTop = targetScrollTop;
                            const rowBottom = rowTop + ROW_HEIGHT;

                            if (rowTop < container.scrollTop) {
                              container.scrollTop = rowTop;
                            } else if (
                              rowBottom >
                              container.scrollTop + VIEWPORT_HEIGHT
                            ) {
                              container.scrollTop = rowBottom - VIEWPORT_HEIGHT;
                            }
                          }

                          requestAnimationFrame(() => {
                            cellRefs.current
                              .get(getCellKey(nextRow, nextColumn))
                              ?.focus();
                          });
                        }}
                        title={column.key === "notes" ? order.notes : undefined}
                        style={{
                          position:
                            pinnedColumn === column.key ? "sticky" : "static",
                          left:
                            pinnedColumn === column.key
                              ? SELECTION_COLUMN_WIDTH
                              : undefined,
                          zIndex: pinnedColumn === column.key ? 2 : undefined,
                          background:
                            pinnedColumn === column.key ? "#1b1e25" : "#15171c",
                          boxSizing: "border-box",
                          height: ROW_HEIGHT,
                          padding: "0 12px",
                          color: "#d1d5db",
                          textAlign:
                            column.type === "number" ? "right" : "left",
                          borderBottom: "1px solid #292d35",
                          borderRight: "1px solid #3b404a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: columnWidths[column.key],
                          minWidth: columnWidths[column.key],
                          maxWidth: columnWidths[column.key],
                        }}
                      >
                        {formatCellValue(order, column.key)}
                      </td>
                    ))}
                  </tr>
                ))}

                {bottomSpacerHeight > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={GRID_COLUMNS.length + 1}
                      style={{
                        height: bottomSpacerHeight,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {activeOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Order details: ${activeOrder.id}`}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 420,
            maxWidth: "90vw",
            height: "100vh",
            overflowY: "auto",
            padding: 24,
            boxSizing: "border-box",
            background: "#20232b",
            color: "#e5e7eb",
            borderLeft: "1px solid #454b57",
            boxShadow: "-8px 0 24px rgba(0,0,0,0.35)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Order details</h2>
            <button
              type="button"
              onClick={() => setActiveOrder(null)}
              aria-label="Close order details"
            >
              Close
            </button>
          </div>

          <h3>{activeOrder.id}</h3>

          {GRID_COLUMNS.map((column) => (
            <div
              key={column.key}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #3b404a",
              }}
            >
              <div style={{ color: "#9ca3af", fontSize: 12 }}>
                {column.label}
              </div>
              <div style={{ overflowWrap: "anywhere", marginTop: 4 }}>
                {formatCellValue(activeOrder, column.key)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
