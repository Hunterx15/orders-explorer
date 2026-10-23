
export interface RawOrder {
  id: string;
  schemaVersion: 1 | 2;

  customerName?: string;
  customer_name?: string;
  customerEmail: string;

  status: string;
  amount: number | string;
  currency: string;

  createdAt: string | number;
  updatedAt?: string | null;

  region: string;
  channel: string;
  priority?: number;

  paymentMethod: string;
  itemCount: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  schemaVersion: 1 | 2;

  customerName: string;
  customerEmail: string;

  status: string;
  amount: number;
  currency: string;

  createdAt: number;
  updatedAt: number | null;

  region: string;
  channel: string;
  priority: number | null;

  paymentMethod: string;
  itemCount: number;
  notes: string;
}