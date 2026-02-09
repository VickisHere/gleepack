import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { Check, CreditCard, Copy, MapPin, Phone, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ORDER_STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Order Confirmed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancel' },
];

export default function OrderView() {
  const { apiFetch, isAuthenticated, user, token } = useAuthContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/orders/${id}`);
        if (!res.ok) {
          setOrder(null);
          return;
        }
        const data = await res.json();
        if (mounted) setOrder(data);
      } catch (e) {
        console.error(e);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();

    // connect socket and listen for order updates
    try {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3010`;
      const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
      socketRef.current = socket;
      socket.on('connect', () => console.debug('OrderView socket connected', socket.id));
      socket.on('order_updated', (updatedOrder: any) => {
        try {
          if (updatedOrder && updatedOrder._id && String(updatedOrder._id) === String(id)) {
            setOrder(updatedOrder);
            toast(`Order updated: ${updatedOrder.status.replace(/_/g, ' ')}`);
          }
        } catch (e) { console.warn('OrderView socket handler error', e); }
      });
      socket.on('connect_error', (err) => console.warn('socket connect_error', err));
    } catch (e) {
      console.warn('Socket connection failed', e);
    }

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [apiFetch, isAuthenticated, id, token]);

  const updateStatus = async (newStatus: string) => {
    if (!order?._id) return;
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`/api/orders/${order._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        toast.success('Status updated');
      } else {
        const text = await res.text().catch(() => '');
        let msg = 'Failed to update status';
        try {
          const json = JSON.parse(text || '{}');
          if (json && json.error) msg = json.error;
        } catch (_) {}
        console.error('Status update failed', res.status, text);
        toast.error(msg);
      }
    } catch (e) {
      console.error('Status update error', e);
      toast.error('Failed to update status: network error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const canUpdateStatus = user?.role && ['admin', 'dba', 'delivery'].includes(user.role);

  if (!isAuthenticated)
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view this order</h2>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </Layout>
    );

  if (loading)
    return (
      <Layout>
        <LoadingSpinner message="Loading order details..." />
      </Layout>
    );

  if (!order)
    return (
      <Layout>
        <div className="section-padding container-custom text-center">Order not found.</div>
      </Layout>
    );

  const paymentMode = order.paymentMethod === 'Online' ? 'Online' : 'COD';
  const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '—';
  const deliveryTime = order.deliveryTime || '—';
  const address = order.contact
    ? [
        order.contact.flatNo,
        order.contact.area,
        order.contact.district,
        order.contact.pincode ? `PIN: ${order.contact.pincode}` : '',
        order.contact.landmark ? `Landmark: ${order.contact.landmark}` : '',
      ]
        .filter(Boolean)
        .join(', ')
    : order.shippingAddress || order.address || '—';

  const itemsTotal = (order.items || []).reduce((s: number, it: any) => s + ((it.price ?? it.rate ?? 0) * (it.quantity ?? it.qty ?? 1)), 0);

  return (
    <Layout>
      <div className="section-padding container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Left: Items and details */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold">Order #{String(order._id).slice(-8)}</h1>
                <div className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(String(order._id))} title="Copy order id">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => navigate('/orders')}>Back</Button>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-6 space-y-4">
              <h3 className="font-semibold text-sm text-gray-600">Items ({(order.items || []).length})</h3>
              <div className="divide-y">
                {(order.items || []).map((item: any, i: number) => {
                  const unitPrice = item.price ?? item.rate ?? item.unitPrice ?? 0;
                  const quantity = item.quantity ?? item.qty ?? 1;
                  const totalPrice = unitPrice * quantity;
                  return (
                    <div key={i} className="py-4 hover:bg-gray-50 rounded-md px-2">
                      <div className="font-medium text-gray-900 mb-2">{item.name}</div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <div>
                          <span className="text-xs text-gray-500 block">Quantity</span>
                          <span className="font-semibold">{quantity}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Price per Unit</span>
                          <span className="font-semibold">₹{unitPrice?.toLocaleString('en-IN') ?? '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600">Item Total:</span>
                        <span className="font-semibold text-gray-900">₹{totalPrice?.toLocaleString('en-IN') ?? '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Delivery</h3>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium">{address}</div>
                    <div className="text-xs text-gray-500 mt-1">Delivery: {deliveryDate} {deliveryTime !== '—' ? deliveryTime : ''}</div>
                  </div>
                </div>
                {order.contact?.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-700 mt-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">{order.contact.phone}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <aside className="md:col-span-1 md:sticky md:top-24 self-start">
            <div className="bg-white border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="mt-1">
                    <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                      {order.status === 'confirmed' ? 'Order Confirmed' : order.status === 'delivered' ? 'Delivered' : order.status === 'cancelled' ? 'Cancelled' : (order.status || 'Pending').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">#{String(order._id).slice(-8)}</div>
              </div>

              <div className="pt-2">
                <div className="text-sm text-gray-500">Payment</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    {order.paymentMethod === 'Online' ? (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">COD</div>
                      </div>
                    )}
                  </div>

                  <div className="ml-auto">
                    <Badge className={order.paymentStatus === 'paid' ? 'bg-emerald-600 text-white border-transparent shadow-sm' : 'bg-red-600 text-white border-transparent shadow-sm'}>
                      {order.paymentStatus === 'paid' ? (
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3" />
                          <span className="uppercase">Paid</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <X className="h-3 w-3" />
                          <span className="uppercase">Unpaid</span>
                        </div>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-600">Items total</div>
                <div className="flex justify-between font-medium mt-1">₹{itemsTotal.toLocaleString('en-IN')}</div>

                <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200 bg-gray-50 p-3 rounded-md mt-2">
                  <span>Total</span>
                  <span>₹{itemsTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Status controls */}
              <div className="pt-3 border-t border-gray-100">
                {canUpdateStatus ? (
                  <select
                    value={['confirmed', 'delivered', 'cancelled'].includes(order.status) ? order.status : 'confirmed'}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm font-medium"
                    disabled={updatingStatus}
                  >
                    {ORDER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
