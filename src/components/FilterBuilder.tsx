import { useState } from "react";
import type {
  FilterCondition,
  FilterField,
  FilterGroup,
  FilterOperator,
} from "../types/filters";

interface FilterBuilderProps {
  onApply: (groups: FilterGroup[]) => void;
  resultCount: number;
  initialGroups: FilterGroup[];
}

const fields: { value: FilterField; label: string }[] = [
  { value: "id", label: "Order ID" },
  { value: "customerName", label: "Customer" },
  { value: "customerEmail", label: "Email" },
  { value: "status", label: "Status" },
  { value: "amount", label: "Amount" },
  { value: "currency", label: "Currency" },
  { value: "createdAt", label: "Created At" },
  { value: "updatedAt", label: "Updated At" },
  { value: "region", label: "Region" },
  { value: "channel", label: "Channel" },
  { value: "priority", label: "Priority" },
  { value: "paymentMethod", label: "Payment Method" },
  { value: "itemCount", label: "Items" },
  { value: "notes", label: "Notes" },
];

const operators: { value: FilterOperator; label: string }[] = [
  { value: "contains", label: "Contains" },
  { value: "notContains", label: "Does not contain" },
  { value: "equals", label: "Equals" },
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" },
  { value: "between", label: "Between" },
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "in", label: "Is one of" },
];

function getOperators(field: FilterField): {
  value: FilterOperator;
  label: string;
}[] {
  const dateFields: FilterField[] = ["createdAt", "updatedAt"];
  const numberFields: FilterField[] = ["amount", "priority", "itemCount"];
  const choiceFields: FilterField[] = [
    "status",
    "region",
    "channel",
    "currency",
    "paymentMethod",
  ];

  if (dateFields.includes(field)) {
    return operators.filter((operator) =>
      ["before", "after", "between"].includes(operator.value),
    );
  }

  if (numberFields.includes(field)) {
    return operators.filter((operator) =>
      ["equals", "greaterThan", "lessThan", "between"].includes(operator.value),
    );
  }

  if (choiceFields.includes(field)) {
    return operators.filter((operator) =>
      ["equals", "in"].includes(operator.value),
    );
  }

  return operators.filter((operator) =>
    ["contains", "notContains", "equals"].includes(operator.value),
  );
}

function createCondition(): FilterCondition {
  return {
    id: crypto.randomUUID(),
    field: "customerName",
    operator: "contains",
    value: "",
  };
}

export default function FilterBuilder({
  onApply,
  resultCount,
  initialGroups,
}: FilterBuilderProps) {
  const [groups, setGroups] = useState<FilterGroup[]>(() =>
    initialGroups.length > 0
      ? initialGroups
      : [{ id: crypto.randomUUID(), conditions: [] }],
  );

  function updateCondition(
    groupId: string,
    conditionId: string,
    changes: Partial<FilterCondition>,
  ) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...changes }
                  : condition,
              ),
            }
          : group,
      ),
    );
  }

  function removeCondition(groupId: string, conditionId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter(
                (condition) => condition.id !== conditionId,
              ),
            }
          : group,
      ),
    );
  }

  return (
    <section
      style={{
        marginBottom: 20,
        padding: 16,
        border: "1px solid #30343b",
        borderRadius: 8,
        background: "#1b1e25",
        color: "#e5e7eb",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Filters</h2>

      {groups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && (
            <p
              style={{
                color: "#fbbf24",
                fontSize: 13,
                fontWeight: 600,
                textAlign: "center",
                margin: "8px 0",
              }}
            >
              AND
            </p>
          )}

          <div
            style={{
              marginBottom: 16,
              padding: 12,
              border: "1px solid #454b57",
              borderRadius: 8,
            }}
          >
            <div style={{ marginBottom: 10, color: "#67e8f9", fontSize: 13 }}>
              Conditions in this group use OR
            </div>

            {group.conditions.map((condition) => (
              <div
                key={condition.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <select
                  aria-label="Filter field"
                  value={condition.field}
                  onChange={(event) => {
                    const field = event.target.value as FilterField;
                    const validOperators = getOperators(field);

                    updateCondition(group.id, condition.id, {
                      field,
                      operator: validOperators[0].value,
                      value: "",
                      secondValue: "",
                      values: [],
                    });
                  }}
                >
                  {fields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter operator"
                  value={condition.operator}
                  onChange={(event) =>
                    updateCondition(group.id, condition.id, {
                      operator: event.target.value as FilterOperator,
                      secondValue: "",
                      values: [],
                    })
                  }
                >
                  {getOperators(condition.field).map((operator) => (
                    <option key={operator.value} value={operator.value}>
                      {operator.label}
                    </option>
                  ))}
                </select>

                {condition.operator === "in" ? (
                  <input
                    aria-label="Filter values, comma separated"
                    value={(condition.values ?? []).join(", ")}
                    placeholder="Enter values separated by commas"
                    onChange={(event) =>
                      updateCondition(group.id, condition.id, {
                        values: event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                ) : (
                  <input
                    aria-label="Filter value"
                    value={condition.value}
                    placeholder="Enter value"
                    onChange={(event) =>
                      updateCondition(group.id, condition.id, {
                        value: event.target.value,
                      })
                    }
                  />
                )}

                {condition.operator === "between" && (
                  <input
                    aria-label="Second filter value"
                    value={condition.secondValue ?? ""}
                    placeholder="End value"
                    onChange={(event) =>
                      updateCondition(group.id, condition.id, {
                        secondValue: event.target.value,
                      })
                    }
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeCondition(group.id, condition.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setGroups((current) =>
                  current.map((item) =>
                    item.id === group.id
                      ? {
                          ...item,
                          conditions: [...item.conditions, createCondition()],
                        }
                      : item,
                  ),
                )
              }
            >
              + Add condition to group
            </button>
            <button
              onClick={() =>
                setGroups((currentGroups) =>
                  currentGroups.filter((item) => item.id !== group.id),
                )
              }
              disabled={groups.length === 1}
            >
              Remove group
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() =>
            setGroups((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                conditions: [createCondition()],
              },
            ])
          }
        >
          + Add filter group
        </button>

        <button
          type="button"
          onClick={() => {
            const invalidCondition = groups.some((group) =>
              group.conditions.some((condition) => {
                const { field, operator, value, secondValue, values } =
                  condition;

                if (operator === "in") {
                  return !values || values.length === 0;
                }

                if (operator === "between") {
                  if (field === "createdAt" || field === "updatedAt") {
                    return (
                      Number.isNaN(Date.parse(value)) ||
                      Number.isNaN(Date.parse(secondValue ?? ""))
                    );
                  }

                  return (
                    value.trim() === "" ||
                    (secondValue ?? "").trim() === "" ||
                    !Number.isFinite(Number(value)) ||
                    !Number.isFinite(Number(secondValue))
                  );
                }

                if (field === "createdAt" || field === "updatedAt") {
                  return Number.isNaN(Date.parse(value));
                }

                if (["amount", "priority", "itemCount"].includes(field)) {
                  return value.trim() === "" || !Number.isFinite(Number(value));
                }

                return false;
              }),
            );

            if (invalidCondition) {
              window.alert(
                "Please enter valid values for your filter conditions.",
              );
              return;
            }

            onApply(groups);
          }}
        >
          Apply filters
        </button>

        <button
          type="button"
          onClick={() => {
            const emptyGroup: FilterGroup = {
              id: crypto.randomUUID(),
              conditions: [],
            };

            setGroups([emptyGroup]);
            onApply([]);
          }}
        >
          Clear filters
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, marginBottom: 10 }}>Applied filters</h3>

        {groups.some((group) => group.conditions.length > 0) ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {groups.flatMap((group) =>
              group.conditions.map((condition) => {
                const fieldLabel =
                  fields.find((field) => field.value === condition.field)
                    ?.label ?? condition.field;

                const operatorLabel =
                  getOperators(condition.field).find(
                    (operator) => operator.value === condition.operator,
                  )?.label ?? condition.operator;

                const filterValue =
                  condition.operator === "in"
                    ? (condition.values ?? []).join(", ")
                    : condition.operator === "between"
                      ? `${condition.value} and ${condition.secondValue ?? ""}`
                      : condition.value;

                return (
                  <div
                    key={condition.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      border: "1px solid #3b6474",
                      borderRadius: 20,
                      background: "#20313a",
                      color: "#a5e8ff",
                      fontSize: 12,
                    }}
                  >
                    <span>
                      {fieldLabel} {operatorLabel.toLowerCase()}{" "}
                      {filterValue || "(empty)"}
                    </span>

                    <button
                      type="button"
                      aria-label={`Remove ${fieldLabel} filter`}
                      onClick={() => {
                        const updatedGroups = groups.map((item) =>
                          item.id === group.id
                            ? {
                                ...item,
                                conditions: item.conditions.filter(
                                  (entry) => entry.id !== condition.id,
                                ),
                              }
                            : item,
                        );

                        setGroups(updatedGroups);
                        onApply(updatedGroups);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#a5e8ff",
                        cursor: "pointer",
                        fontSize: 15,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              }),
            )}
          </div>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: 13 }}>No filters applied.</p>
        )}
      </div>

      <p style={{ color: "#9ca3af", fontSize: 13 }}>
        {resultCount.toLocaleString()} matching orders
      </p>
    </section>
  );
}
