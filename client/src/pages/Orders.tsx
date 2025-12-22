import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { io } from 'socket.io-client';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const Orders: React.FC = () => {
  const { apiFetch, isAuthenticated, token, user } = useAuthContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!apiFetch) return;
    setLoading(true);
    apiFetch('/api/orders')
      .then(async (r) => r.ok ? await r.json() : [])
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [apiFetch, isAuthenticated]);

  // realtime updates for order changes (payment/status) coming from server
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:3000`;
      const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
      socketRef.current = socket;
      socket.on('connect', () => console.debug('orders socket connected', socket.id));
      socket.on('order_updated', (updated: any) => {
        setOrders((s) => s.map((o) => (o._id === updated._id ? updated : o)));
        setSelectedOrder((cur) => (cur && cur._id === updated._id ? updated : cur));
        
        // Show notification for customer's own orders
        if (user && (updated.userId === user.sub || updated.userEmail === user.email)) {
          const statusMessage = {
            'confirmed': '🎉 Your order has been confirmed!',
            'processing': '🔄 Your order is now being processed',
            'ready': '📦 Your order is ready for delivery!',
            'out_for_delivery': '🚚 Your order is out for delivery',
            'delivered': '✅ Your order has been delivered successfully!'
          };
          const message = statusMessage[updated.status as keyof typeof statusMessage] || `Order status updated to ${updated.status.replace('_', ' ')}`;
          toast.success(message, {
            duration: 6000,
            description: `Order #${updated._id.slice(-6)}`
          });
        }
      });
      socket.on('order_created', (created: any) => {
        // if this order belongs to current user, add it
        if (user && (created.userId === user.sub || created.userEmail === user.email)) {
          setOrders((s) => [created, ...s]);
          toast.success('🎉 New order placed successfully!', {
            duration: 5000,
            description: `Order #${created._id.slice(-6)} - ₹${created.total}`
          });
        }
      });
      socket.on('connect_error', (err: any) => console.warn('socket connect_error', err));
      return () => { socket.disconnect(); socketRef.current = null; };
    } catch (e) {
      console.warn('Socket init failed', e);
    }
  }, [isAuthenticated, token, user]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your orders</h2>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/login')}>Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Layout>
      <div className="section-padding container-custom">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-300 rounded-2xl bg-gray-50">
            <div className="text-3xl mb-4">🧾</div>
            <p className="text-lg font-semibold mb-2">You have no orders yet</p>
            <p className="text-muted-foreground mb-6">Start shopping to see your order history here.</p>
            <Button onClick={() => navigate('/')}>Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <OrderCard key={o._id || o.id} order={o} onOpen={(ord: any) => { if (window.innerWidth && window.innerWidth < 768) { navigate(`/orders/${ord._id || ord.id}`); } else { setSelectedOrder(ord); setDialogOpen(true); } }} />
            ))}
            <OrderDetailsModal order={selectedOrder} open={dialogOpen} onOpenChange={setDialogOpen} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;

const STATUS_STAGES = [
  'received',
  'confirmed',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

// Payment status helper function
const getPaymentStatus = (order: any) => {
  const payment = order.payment || order.paymentInfo || {};
  const isPaid = order.paymentStatus === 'paid' || !!order.paidAt || payment.status === 'captured' || payment.paid === true || order.status === 'delivered';
  if (isPaid) {
    return { status: 'Paid', color: 'text-green-700 bg-green-50 border-green-200' };
  }
  return { status: 'Unpaid', color: 'text-red-700 bg-red-50 border-red-200' };
};

function OrderCard({ order, onOpen }: { order: any; onOpen: (o: any) => void }) {
  return (
    <div 
      className="p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer bg-white" 
      onClick={() => onOpen(order)}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="font-semibold text-lg">
            Order: <span className="font-mono text-sm text-gray-600">#{order._id || order.id}</span>
          </div>
          <div className="text-sm text-gray-500">
            Placed: {new Date(order.createdAt).toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="text-right space-y-2 lg:text-left">
          <div className="text-xl font-bold text-gray-900">₹{order.total}</div>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {order.status?.replace(/_/g, ' ') || 'Pending'}
          </div>
          <div className="text-xs text-blue-500 hover:text-blue-600 font-medium">View details →</div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({ order, open, onOpenChange }: { order: any; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!order) return <Dialog open={false} onOpenChange={() => {}} />;
  const history = order.statusHistory || [];
  const paymentStatus = getPaymentStatus(order);

  // Fixed timeline logic
  const currentStatusIndex = STATUS_STAGES.indexOf(order.status);
  const visibleStages = order.status === 'cancelled' 
    ? STATUS_STAGES.slice(0, 2)
    : STATUS_STAGES.slice(0, currentStatusIndex + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[90vh] p-0 m-2 mx-auto">
        {/* Close Button */}
        <DialogClose asChild className="absolute top-4 right-4 z-50">
          <button className="p-2 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 hover:shadow-xl transition-all text-gray-600 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </DialogClose>

        {/* Header */}
        <div className="bg-white px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 sticky top-0 z-20">
          <DialogHeader className="text-center sm:text-left">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center justify-center sm:justify-start gap-2 mb-1">
              📋 Order #{order._id || order.id?.slice(-8)}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Order details and tracking status
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-4 sm:p-6">
          <div className="space-y-4">
            {/* Progress */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wide text-blue-900 flex items-center gap-2">
                <span className="text-lg">📊</span> Order Progress
              </h3>
              <div className="flex flex-wrap gap-3 -m-1 justify-center">
                {visibleStages.map((s, idx) => {
                  const entry = history.slice().reverse().find((h: any) => h.status === s);
                  const done = STATUS_STAGES.indexOf(order.status) > idx || (STATUS_STAGES.indexOf(order.status) === idx && order.status !== 'cancelled');
                  const isCurrent = order.status === s;
                  
                  return (
                    <div key={s} className="flex flex-col items-center p-2 flex-1 min-w-[70px]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold mb-1 shadow-md transition-all ${
                        done 
                          ? 'bg-green-500 text-white shadow-green-200' 
                          : isCurrent 
                          ? 'bg-blue-500 text-white border-4 border-blue-100 shadow-blue-200' 
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="text-xs text-center capitalize font-medium min-h-[2rem] leading-tight px-1">
                        {s.replace(/_/g, ' ').split(' ')[0]}
                      </div>
                      <div className="text-xxs text-gray-500 mt-1">
                        {entry ? new Date(entry.at).toLocaleDateString() : isCurrent && order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-sm font-semibold text-center mt-3 px-2 py-1 rounded-full bg-white border border-gray-200">
                Current: <span className="capitalize">{order.status?.replace(/_/g, ' ') || 'Pending'}</span>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="p-4 bg-amber-50 rounded-xl">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                📅 Order Timeline
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                </div>
                {(order.statusHistory || []).map((entry: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{entry.status.replace('_', ' ')}:</span>
                    <span className="font-medium">{new Date(entry.at).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  💳 Payment Details
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium">{order.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${paymentStatus.status === 'Paid' ? 'text-green-700' : 'text-red-700'}`}>
                      {paymentStatus.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-lg">₹{order.total?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                  🚚 Delivery Info
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{order.status?.replace('_', ' ') || 'Pending'}</span>
                  </div>
                  {order.deliveryInstructions && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded border-l-4 border-yellow-400">
                      <div className="text-xs font-medium text-yellow-800">Instructions:</div>
                      <div className="text-xs text-yellow-700">{order.deliveryInstructions}</div>
                    </div>
                  )}
                  {order.specialNotes && (
                    <div className="mt-2 p-2 bg-blue-100 rounded border-l-4 border-blue-400">
                      <div className="text-xs font-medium text-blue-800">Special Notes:</div>
                      <div className="text-xs text-blue-700">{order.specialNotes}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                👤 Customer Details
              </div>
              <div className="text-sm text-gray-900 space-y-2">
                <div className="font-medium">{order.contact?.name || order.userName || 'N/A'}</div>
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span>{order.contact?.email || order.userEmail || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{order.contact?.phone || order.userPhone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Complete Delivery Address */}
            <div className="p-4 bg-emerald-50 rounded-xl">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                📍 Complete Delivery Address
              </div>
              <div className="text-sm text-gray-900 space-y-1">
                {order.contact ? (
                  <>
                    <div className="font-medium">{order.contact.name}</div>
                    <div>{order.contact.flatNo && `${order.contact.flatNo}, `}{order.contact.area || ''}</div>
                    {order.contact.district && <div>{order.contact.district}</div>}
                    {order.contact.pincode && <div>PIN: {order.contact.pincode}</div>}
                    {order.contact.landmark && <div className="text-orange-700 font-medium mt-1">🏷️ Landmark: {order.contact.landmark}</div>}
                    {order.contact.addressType && <div className="text-xs text-gray-600 mt-1">Type: {order.contact.addressType}</div>}
                  </>
                ) : (
                  <div>{order.shippingAddress || order.deliveryAddress || order.address || 'Address not provided'}</div>
                )}
              </div>
            </div>

            {/* Complete Order Items */}
            <div className="p-4 bg-white border rounded-xl">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                🛒 Order Items ({(order.items || []).length})
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">₹{item.price} each</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      <div className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">₹{order.total?.toLocaleString('en-IN') || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-3 sm:px-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row w-full gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(order._id || order.id);
              }}
            >
              📋 Copy ID
            </Button>
            <DialogClose asChild>
              <Button size="sm" className="flex-1 text-xs">Close</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
