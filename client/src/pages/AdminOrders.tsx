import React, { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, CreditCard } from 'lucide-react';

const STATUS_STAGES = [
  'received',
  'confirmed',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export default function AdminOrders() {
  const { apiFetch, token, user } = useAuthContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await apiFetch('/api/orders/all');
        const data = await res.json();
        if (mounted) setOrders(data || []);
      } catch (e) {
        console.error('Could not load orders', e);
      }
    }
    load();

    // connect socket.io to backend (port 3000) and listen for order events
    try {
      const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:3000`;
      const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
      socketRef.current = socket;
      socket.on('connect', () => console.debug('socket connected', socket.id));
      socket.on('order_created', (order: any) => setOrders((s) => [order, ...s]));
      socket.on('order_updated', (order: any) => setOrders((s) => s.map((o) => (o._id === order._id ? order : o))));
      socket.on('connect_error', (err) => console.warn('socket connect_error', err));
    } catch (e) {
      console.warn('Socket connection failed', e);
    }

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [apiFetch, token]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((s) => s.map((o) => (o._id === updated._id ? updated : o)));
      } else {
        console.error('Status update failed', await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePayment = async (id: string, current: string | undefined) => {
    const next = current === 'paid' ? 'unpaid' : 'paid';
    try {
      const res = await apiFetch(`/api/orders/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: next }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((s) => s.map((o) => (o._id === updated._id ? updated : o)));
      } else {
        console.error('Payment update failed', await res.text());
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user || user === null) return <div className="p-4">Please sign in as admin to view orders.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Orders</h1>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Order ID</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Items</th>
              <th className="p-2">Total</th>
              <th className="p-2">Coupon</th>
              <th className="p-2">Payment</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-t">
                <td className="p-2 align-top">{o._id}</td>
                <td className="p-2 align-top">
                  <div className="font-medium">{o.userName || o.userEmail || 'Guest'}</div>
                  <div className="text-xs text-gray-600">{o.userEmail}</div>
                </td>
                <td className="p-2 align-top">
                  {Array.isArray(o.items) ? (
                    <ul className="list-disc pl-4">
                      {o.items.map((it: any, i: number) => (
                        <li key={i}>{it.name} x{it.quantity} — ${it.price}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-600">No items</div>
                  )}
                </td>
                <td className="p-2 align-top">${o.total || o.amount || 0}</td>
                <td className="p-2 align-top">
                  {o.coupon ? (
                    <div>
                      <div className="font-medium">{o.coupon.code}</div>
                      <div className="text-xs text-gray-600">Discount: ${o.coupon.discountAmount}</div>
                    </div>
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </td>
                <td className="p-2 align-top">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      o.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {o.paymentStatus || 'unpaid'}
                    </span>
                    <div className={`text-xs px-2 py-1 rounded border ${
                      (o.paymentMethod === 'COD' || (!o.paymentMethod && o.paymentStatus !== 'paid')) 
                        ? 'bg-orange-50 text-orange-700 border-orange-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {(o.paymentMethod === 'COD' || (!o.paymentMethod && o.paymentStatus !== 'paid')) ? 'COD' : 'Online'}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => togglePayment(o._id, o.paymentStatus)} title={o.paymentStatus === 'paid' ? 'Mark unpaid' : 'Mark paid'}>
                      {o.paymentStatus === 'paid' ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
                <td className="p-2 align-top">
                  <div className="mb-2">{o.status}</div>
                  <select className="border rounded px-2 py-1" value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}>
                    {STATUS_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="p-2 align-top">{new Date(o.createdAt).toLocaleString()}</td>
                <td className="p-2 align-top">
                  <div className="flex flex-col gap-2">
                    <details>
                      <summary className="text-sm text-blue-600 cursor-pointer">History</summary>
                      <ul className="text-xs mt-2">
                        {(o.statusHistory || []).map((h: any, i: number) => (
                          <li key={i}>{new Date(h.at).toLocaleString()} — {h.status} by {h.by}</li>
                        ))}
                      </ul>
                    </details>
                    <Button size="sm" variant="ghost" onClick={() => { setSelected(o); setOpen(true); }}>View Details</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Customer and payment information</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="mt-4 space-y-3 text-sm">
              <div><strong>Order ID:</strong> {selected._id}</div>
              <div><strong>Customer:</strong> {selected.userName || 'Guest'} ({selected.userEmail})</div>
              <div><strong>Contact:</strong> {selected.userPhone || 'N/A'}</div>
              <div><strong>Address:</strong> {selected.shippingAddress || selected.address || 'N/A'}</div>
              <div><strong>Payment Method:</strong> {selected.paymentMethod || selected.payment?.method || 'N/A'}</div>
              <div><strong>Payment Details:</strong>
                <pre className="text-xs bg-muted p-2 rounded mt-1">{JSON.stringify(selected.payment || selected.paymentInfo || {}, null, 2)}</pre>
              </div>
              <div><strong>Items:</strong>
                <ul className="list-disc pl-6">
                  {(selected.items || []).map((it: any, i: number) => (
                    <li key={i}>{it.name} x{it.quantity} — ${it.price}</li>
                  ))}
                </ul>
              </div>
              <div><strong>Coupon:</strong>
                {selected.coupon ? (
                  <div className="mt-1">
                    <div>Code: {selected.coupon.code}</div>
                    <div>Type: {selected.coupon.type} ({selected.coupon.value}{selected.coupon.type === 'percentage' ? '%' : '$'})</div>
                    <div>Discount: ${selected.coupon.discountAmount}</div>
                    {selected.coupon.commissionAmount > 0 && <div>Commission: ${selected.coupon.commissionAmount}</div>}
                  </div>
                ) : (
                  'None'
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
