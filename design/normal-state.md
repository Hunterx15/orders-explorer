# Orders Explorer — Normal State Sketch

## Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Orders Explorer                                              │
│ Explore and inspect your order data.        50,000 orders    │
├─────────────────────────────────────────────────────────────┤
│ Filters                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Filter Group 1                            Conditions OR │ │
│ │ [Field ▼] [Operator ▼] [Value ........] [Remove]         │ │
│ │ [+ Add condition]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [+ Add filter group] [Apply filters] [Clear filters]        │
│                       Applied filters                        │
│                       50,000 matching orders                 │
├─────────────────────────────────────────────────────────────┤
│ 0 orders selected      [Export CSV (0)]    [Clear selection] │
├──────┬──────────────┬────────────┬───────────┬───────────────┤
│ □    │ Order ID     │ Customer   │ Status    │ Amount        │
├──────┼──────────────┼────────────┼───────────┼───────────────┤
│ □    │ ORD-0001     │ Customer A │ shipped   │ ₹1,200.00     │
│ □    │ ORD-0002     │ Customer B │ pending   │ ₹850.00       │
│ □    │ ORD-0003     │ Customer C │ delivered │ ₹2,400.00     │
│ ...  │ ...          │ ...        │ ...       │ ...           │
└──────┴──────────────┴────────────┴───────────┴───────────────┘
```

## Design decisions

- Dark interface with clear text contrast and subtle borders.
- Filter groups separate condition-building controls from applied results.
- The grid uses a sticky header and a visible selection column.
- Column headers support sorting, resizing, and pinning.
- Numeric values are right-aligned; long text is truncated in cells.
- Selection controls and CSV export remain visible above the grid.
- The grid renders a virtualized window of the dataset.
