import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { Check, CreditCard, Copy, MapPin, Phone, X, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ORDER_STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Order Confirmed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancel' },
];

export default function OrderView() {
  const { apiFetch, isAuthenticated, user, token, openAuthModal } = useAuthContext();
  const { reorderItems } = useCart();
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

  const togglePayment = async () => {
    if (!order?._id) return;
    const next = order.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    try {
      const res = await apiFetch(`/api/orders/${order._id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: next }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        toast.success('Payment status updated');
      } else {
        const text = await res.text().catch(() => '');
        console.error('Payment update failed', res.status, text);
        toast.error('Failed to update payment status');
      }
    } catch (e) {
      console.error('Payment update error', e);
      toast.error('Failed to update payment status: network error');
    }
  };

  const handleReorder = () => {
    if (!order?.items || order.items.length === 0) {
      toast.error('No items to reorder');
      return;
    }

    try {
      // Map order items to CartItem format
      const cartItems = (order.items || []).map((item: any, index: number) => ({
        id: item.id || item._id || `${item.name}-${index}`,
        name: item.name,
        nameHi: item.nameHi,
        price: item.price ?? item.rate ?? item.unitPrice ?? 0,
        category: item.category || 'Other',
        tier: item.tier || 'standard',
        quantity: item.quantity ?? item.qty ?? 1,
        addons: item.addons || [],
        deliveryDate: order.deliveryDate,
      }));

      // Clear existing cart and add order items
      reorderItems(cartItems);
      toast.success('Items added to cart! Ready to reorder');
      navigate('/cart');
    } catch (e) {
      console.error('Reorder error:', e);
      toast.error('Failed to process reorder');
    }
  };

  const canUpdateStatus = user?.role && ['admin', 'dba', 'delivery'].includes(user.role);

  if (!isAuthenticated)
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view this order</h2>
          <Button onClick={() => openAuthModal()}>Login</Button>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* Left: Items and details */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">Order #{String(order._id).slice(-8)}</h1>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(String(order._id))} title="Copy order id">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>Back</Button>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-3 sm:p-6 space-y-4">
              <h3 className="font-semibold text-xs sm:text-sm text-gray-600">Items ({(order.items || []).length})</h3>
              <div className="divide-y">
                {(order.items || []).map((item: any, i: number) => {
                  const unitPrice = item.price ?? item.rate ?? item.unitPrice ?? 0;
                  const quantity = item.quantity ?? item.qty ?? 1;
                  const totalPrice = unitPrice * quantity;
                  return (
                    <div key={i} className="py-3 sm:py-4 hover:bg-gray-50 rounded-md px-2">
                      <div className="font-medium text-sm sm:text-base text-gray-900 mb-2">{item.name}</div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700">
                        <div>
                          <span className="text-xs text-gray-500 block">Quantity</span>
                          <span className="font-semibold">{quantity}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Price per Unit</span>
                          <span className="font-semibold">₹{unitPrice?.toLocaleString('en-IN') ?? '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 bg-gray-50 p-2 rounded text-xs sm:text-sm">
                        <span className="text-gray-600">Item Total:</span>
                        <span className="font-semibold text-gray-900">₹{totalPrice?.toLocaleString('en-IN') ?? '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h3 className="font-semibold text-xs sm:text-sm text-gray-600 mb-2">Delivery</h3>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium break-words">{address}</div>
                    <div className="text-xs text-gray-500 mt-1">Delivery: {deliveryDate} {deliveryTime !== '—' ? deliveryTime : ''}</div>
                  </div>
                </div>
                {order.contact?.phone && (
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 mt-3">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                    <div className="text-xs sm:text-sm">{order.contact.phone}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <aside className="md:col-span-1 md:sticky md:top-24 self-start">
            <div className="bg-white border rounded-xl p-3 sm:p-6 space-y-3 sm:space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Status</div>
                  <div className="mt-1">
                    <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-xs sm:text-sm">
                      {order.status === 'confirmed' ? 'Order Confirmed' : order.status === 'delivered' ? 'Delivered' : order.status === 'cancelled' ? 'Cancelled' : (order.status || 'Pending').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs sm:text-sm text-gray-500">#{String(order._id).slice(-8)}</div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs sm:text-sm text-gray-500">Payment</div>
                <div className="mt-2 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    {order.paymentMethod === 'Online' ? (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">COD</div>
                      </div>
                    )}
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <Badge className={order.paymentStatus === 'paid' ? 'bg-emerald-600 text-white border-transparent shadow-sm' : 'bg-red-600 text-white border-transparent shadow-sm'} variant="outline">
                      {order.paymentStatus === 'paid' ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Check className="h-3 w-3" />
                          <span className="uppercase">Paid</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs">
                          <X className="h-3 w-3" />
                          <span className="uppercase">Unpaid</span>
                        </div>
                      )}
                    </Badge>
                    {canUpdateStatus && (
                      <Button size="icon" variant="ghost" onClick={togglePayment} title={order.paymentStatus === 'paid' ? 'Mark unpaid' : 'Mark paid'}>
                        {order.paymentStatus === 'paid' ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">Items total</div>
                <div className="flex justify-between font-medium mt-1 text-sm sm:text-base">₹{itemsTotal.toLocaleString('en-IN')}</div>

                <div className="flex justify-between items-center text-base sm:text-lg font-bold pt-3 border-t border-gray-200 bg-gray-50 p-2 sm:p-3 rounded-md mt-2">
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
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg text-sm font-medium"
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

              {/* Reorder button - only show when delivered */}
              {order.status === 'delivered' && (
                <div className="pt-3 border-t border-gray-100">
                  <Button
                    onClick={handleReorder}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reorder Again</span>
                  </Button>
                </div>
              )}

            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
