# Orders Explorer — Empty State Sketch

## Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Orders Explorer                                              │
│ Explore and inspect your order data.                        │
├─────────────────────────────────────────────────────────────┤
│ Filters                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Filter Group 1                            Conditions OR │ │
│ │ [Status ▼] [equals ▼] [unknown-value ....]               │ │
│ │ [+ Add condition]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [+ Add filter group] [Apply filters] [Clear filters]        │
│                       Applied filters                        │
│                       0 matching orders                      │
├─────────────────────────────────────────────────────────────┤
│ 0 orders selected      [Export CSV (0)]    [Clear selection] │
├─────────────────────────────────────────────────────────────┤
│ □    │ Order ID │ Customer │ Status │ Amount                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      No orders found                         │
│              No orders match your current filters.           │
│       Try changing your conditions or clearing the filters.  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Design decisions

- Keep the filter builder available so users can adjust their conditions.
- Display the zero-result count clearly.
- Replace data rows with a helpful empty-state message.
- Preserve the selection toolbar and existing grid structure.
- Provide guidance on changing or clearing filters.
