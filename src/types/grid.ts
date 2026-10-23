
export interface GridColumn {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  type: "text" | "number" | "date" | "status";
  pinned?: boolean;
}

export const GRID_COLUMNS: GridColumn[] = [
  { key: "id", label: "Order ID", width: 180, minWidth: 140, type: "text" },
  { key: "customerName", label: "Customer", width: 190, minWidth: 140, type: "text" },
  { key: "customerEmail", label: "Email", width: 240, minWidth: 180, type: "text" },
  { key: "status", label: "Status", width: 130, minWidth: 110, type: "status" },
  { key: "amount", label: "Amount", width: 140, minWidth: 110, type: "number" },
  { key: "currency", label: "Currency", width: 100, minWidth: 80, type: "text" },
  { key: "createdAt", label: "Created At", width: 190, minWidth: 160, type: "date" },
  { key: "updatedAt", label: "Updated At", width: 190, minWidth: 160, type: "date" },
  { key: "region", label: "Region", width: 130, minWidth: 100, type: "text" },
  { key: "channel", label: "Channel", width: 130, minWidth: 100, type: "text" },
  { key: "priority", label: "Priority", width: 110, minWidth: 90, type: "number" },
  { key: "paymentMethod", label: "Payment Method", width: 160, minWidth: 130, type: "text" },
  { key: "itemCount", label: "Items", width: 90, minWidth: 75, type: "number" },
  { key: "notes", label: "Notes", width: 260, minWidth: 180, type: "text" },
];
