import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, User, Calendar, DollarSign, ChevronDown, ChevronUp, Truck, Check, CreditCard } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import ConfirmModal from "@/components/common/ConfirmModal";

const STATUS_STAGES = [
  'confirmed',
  'delivered',
  'cancelled'
];

const DeliveryPanel = () => {
  const { apiFetch, token, user } = useAuthContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch('/api/orders/all');
        const data = await res.json();
        if (mounted) {
          // Filter orders that are ready for delivery or out for delivery or delivered
          const deliveryOrders = data.filter((o: any) =>
            ['confirmed', 'delivered'].includes(o.status)
          );
          setOrders(deliveryOrders);
        }
      } catch (e) {
        console.error('Could not load orders', e);
        toast.error('Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    // Socket for real-time updates
    try {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3010`;
      const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
      socket.on('order_updated', (order: any) => {
        setOrders((s) => s.map((o) => (o._id === order._id ? order : o)));
        // Show notification for delivery-relevant status changes
        if (['confirmed', 'delivered'].includes(order.status)) {
          const statusMessage = {
            'confirmed': 'Order confirmed',
            'delivered': 'Order has been delivered successfully'
          };
          toast.success(`Order #${order._id.slice(-6)}: ${statusMessage[order.status as keyof typeof statusMessage] || 'Status updated'}`);
        }
      });
      socket.on('order_created', (order: any) => {
        // Check if this new order is relevant for delivery
        if (['confirmed', 'delivered'].includes(order.status)) {
          setOrders((s) => [...s, order]);
          setNewOrderCount(prev => prev + 1);
          toast.info(`🚚 New delivery order! Order #${order._id.slice(-6)}`, {
            duration: 5000,
          });
        }
      });
      socket.on('connect_error', (err) => console.warn('socket connect_error', err));

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket connection failed', e);
    }

    return () => {
      mounted = false;
    };
  }, [apiFetch, token]);

  // Reset new order count when orders are loaded
  useEffect(() => {
    if (!loading && orders.length > 0) {
      setNewOrderCount(0);
    }
  }, [loading, orders.length]);


  const refreshOrders = async () => {
    try {
      const res = await apiFetch('/api/orders/all');
      const data = await res.json();
      const deliveryOrders = data.filter((o: any) =>
        ['confirmed', 'delivered'].includes(o.status)
      );
      setOrders(deliveryOrders);
      toast.success('Orders refreshed');
    } catch (e) {
      console.error('Could not refresh orders', e);
      toast.error('Failed to refresh orders');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = (items: any[]) => {
    return items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  };

  const updateStatus = async (id: string, status: string) => {
    // Optimistic update
    setOrders((s) => s.map((o) => (o._id === id ? { ...o, status } : o)));

    try {
      const res = await apiFetch(`/api/orders/${id}/delivery-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((s) => s.map((o) => (o._id === updated._id ? updated : o)));
        toast.success(`Order status updated to ${status.replace('_', ' ')}`);
      } else {
        console.error('Status update failed', await res.text());
        toast.error('Failed to update order status');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update order status');
    }
  };

  const togglePayment = async (id: string, current: string | undefined) => {
    const next = current === 'paid' ? 'unpaid' : 'paid';

    // Optimistic update
    setOrders((s) => s.map((o) => (o._id === id ? { ...o, paymentStatus: next } : o)));

    try {
      // Delivery users should call the delivery-specific payment endpoint
      const res = await apiFetch(`/api/orders/${id}/payment-delivery`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus: next }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((s) => s.map((o) => (o._id === updated._id ? updated : o)));
        toast.success(`Payment status updated to ${next}`);
      } else {
        console.error('Payment update failed', await res.text());
        toast.error('Failed to update payment status');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update payment status');
    }
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleConfirmStatusChange = () => {
    if (orderToUpdate) {
      updateStatus(orderToUpdate.id, orderToUpdate.status);
      setIsConfirmModalOpen(false);
      setOrderToUpdate(null);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Please log in to access delivery panel.</p>
        </div>
      </Layout>
    );
  }

  // Check if user has delivery or admin role
  const hasAccess = (user as any).role === 'delivery' || (user as any).role === 'admin';
  if (!hasAccess) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-4">Access Denied</p>
            <p>You need delivery or admin role to access this panel.</p>
            <p className="text-sm text-gray-600 mt-2">Current user: {user.email} (Role: {(user as any).role || 'none'})</p>
        </div>
      </div>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title="Confirm Status Change"
        message={`Are you sure you want to change the order status to \"${orderToUpdate?.status.replace(/_/g, ' ') || ''}\"?`}
        confirmText="Yes, change status"
        isDestructive={false}
      />
    </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading deliveries...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 md:mb-8">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Delivery Panel</h1>
                <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Manage and track your deliveries in real-time</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2">
                <a
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                >
                  ← Back to Home
                </a>
                {newOrderCount > 0 && (
                  <div className="w-full sm:w-auto bg-red-500 text-white px-3 py-2 rounded-full text-xs md:text-sm font-medium text-center">
                    {newOrderCount} new order{newOrderCount > 1 ? 's' : ''}
                  </div>
                )}
                <Button onClick={refreshOrders} variant="outline" size="sm" className="w-full sm:w-auto">
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {orders.map((order) => {
              const totalAmount = calculateTotal(order.items);
              const isExpanded = expandedOrders.has(order._id);

              return (
                <div key={order._id}>
                  {/* Compact Card Row - Always Visible */}
                  <div
                    onClick={() => toggleExpanded(order._id)}
                    className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      {/* Left: Order ID */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-medium text-gray-900">
                          Order #{order._id.slice(-6)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      {/* Middle: Price, Status, Payment */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base md:text-lg font-semibold text-gray-900">
                          ₹{totalAmount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {(order.status || '').replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.paymentStatus || 'unpaid'}
                        </span>
                      </div>

                      {/* Right: Actions + Expand Icon */}
                      <div className="flex items-center gap-2">
                        {(order.contact?.phone || order.userPhone) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${order.contact?.phone || order.userPhone}`);
                            }}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="text-gray-400">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details - Address Only */}
                  {isExpanded && (
                    <div className="bg-blue-50 border border-blue-200 border-t-0 rounded-b-lg p-4 md:p-6">
                      <div className="space-y-4">
                        {/* Status Control */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            Update Status:
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            {STATUS_STAGES.map((s) => {
                              const active = order.status === s;
                              return (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (active) return;
                                    setOrderToUpdate({ id: order._id, status: s });
                                    setIsConfirmModalOpen(true);
                                  }}
                                  className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors focus:outline-none ${
                                    active
                                      ? 'bg-blue-600 text-white border border-blue-700'
                                      : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  {s.replace(/_/g, ' ')}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Payment Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            Payment Status:
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePayment(order._id, order.paymentStatus)}
                              className="text-xs px-3 py-1 h-auto"
                            >
                              {order.paymentStatus === 'paid' ? <Check className="h-4 w-4 mr-1" /> : <CreditCard className="h-4 w-4 mr-1" />}
                              Mark as {order.paymentStatus === 'paid' ? 'unpaid' : 'paid'}
                            </Button>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="border-t border-blue-200 pt-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Delivery Address
                              </h4>
                              <div className="text-sm text-gray-700 space-y-1">
                                {order.contact ? (
                                  <>
                                    <p className="font-medium">{order.contact.name || 'N/A'}</p>
                                    <p>
                                      {order.contact.flatNo && `${order.contact.flatNo}, `}
                                      {order.contact.area || ''}
                                    </p>
                                    {order.contact.district && <p>{order.contact.district}</p>}
                                    {order.contact.pincode && <p>PIN: {order.contact.pincode}</p>}
                                    {order.contact.landmark && (
                                      <p className="text-orange-600 font-medium">
                                        Landmark: {order.contact.landmark}
                                      </p>
                                    )}
                                    {order.contact.addressType && (
                                      <p className="text-xs text-gray-500">
                                        {order.contact.addressType}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p>{order.shippingAddress || order.deliveryAddress || 'No address provided'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const address = order.contact
                                ? `${order.contact.flatNo || ''} ${order.contact.area || ''} ${order.contact.district || ''} ${order.contact.pincode || ''}`.trim()
                                : order.shippingAddress || order.deliveryAddress || '';
                              if (address) {
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                                  '_blank'
                                );
                              }
                            }}
                            className="mt-3 text-xs"
                          >
                            📍 Open in Maps
                          </Button>
                        </div>

                        {/* Customer Contact */}
                        <div className="border-t border-blue-200 pt-4">
                          <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">
                                Customer Contact
                              </h4>
                              <p className="text-sm text-gray-700 font-medium">
                                {order.contact?.name || order.userName || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                📞 {order.contact?.phone || order.userPhone || 'N/A'}
                              </p>
                              {order.contact?.email && (
                                <p className="text-sm text-gray-600">
                                  ✉️ {order.contact.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {orders.length === 0 && (
              <div className="bg-white shadow rounded-lg p-6 md:p-12">
                <div className="text-center">
                  <Truck className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm md:text-base font-medium text-gray-900">
                    No deliveries
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-gray-500">
                    There are no orders ready for delivery.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title="Confirm Status Change"
        message={`Are you sure you want to change the order status to \"${orderToUpdate?.status.replace(/_/g, ' ') || ''}\"?`}
        confirmText="Yes, change status"
        isDestructive={false}
      />
    </Layout>
  );
};

export default DeliveryPanel;
