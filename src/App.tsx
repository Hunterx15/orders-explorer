import { useEffect, useState } from "react";
import { loadOrders } from "./lib/loadOrders";
import OrdersGrid from "./components/OrdersGrid";
import type { Order } from "./types/order";

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const loadedOrders = await loadOrders();

        if (!cancelled) {
          setOrders(loadedOrders);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load orders. Please refresh the page.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "#15171c",
        color: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
          Orders Explorer
        </h1>
        <p style={{ color: "#9ca3af" }}>
          Explore and inspect your order data.
        </p>
        {!loading && !error && (
          <p style={{ color: "#9ca3af" }}>
            {orders.length.toLocaleString()} orders
          </p>
        )}
      </header>

      {loading ? (
        <p role="status" style={{ color: "#9ca3af" }}>
          Loading orders…
        </p>
      ) : error ? (
        <p role="alert" style={{ color: "#fca5a5" }}>
          {error}
        </p>
      ) : (
        <OrdersGrid orders={orders} />
      )}
    </main>
  );
}

export default App;