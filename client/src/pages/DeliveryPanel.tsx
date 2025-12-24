import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, User, Calendar, DollarSign, ChevronDown, ChevronUp, Truck, Check, CreditCard } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';

const STATUS_STAGES = [
  'received',
  'confirmed',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
];

const DeliveryPanel = () => {
  const { apiFetch, token, user } = useAuthContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await apiFetch('/api/orders/all');
        const data = await res.json();
        if (mounted) {
          // Filter orders that are ready for delivery or out for delivery or delivered
          const deliveryOrders = data.filter((o: any) =>
            ['received', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered'].includes(o.status)
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
      const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:3010`;
      const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
      socket.on('order_updated', (order: any) => {
        setOrders((s) => s.map((o) => (o._id === order._id ? order : o)));
        // Show notification for delivery-relevant status changes
        if (['ready', 'out_for_delivery', 'delivered'].includes(order.status)) {
          const statusMessage = {
            'ready': 'New order ready for delivery!',
            'out_for_delivery': 'Order is now out for delivery',
            'delivered': 'Order has been delivered successfully'
          };
          toast.success(`Order #${order._id.slice(-6)}: ${statusMessage[order.status as keyof typeof statusMessage] || 'Status updated'}`);
        }
      });
      socket.on('order_created', (order: any) => {
        // Check if this new order is relevant for delivery
        if (['ready', 'processing', 'out_for_delivery', 'delivered'].includes(order.status)) {
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

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const refreshOrders = async () => {
    try {
      const res = await apiFetch('/api/orders/all');
      const data = await res.json();
      const deliveryOrders = data.filter((o: any) =>
        ['ready', 'processing', 'out_for_delivery', 'delivered'].includes(o.status)
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
      const res = await apiFetch(`/api/orders/${id}/payment`, {
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
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-3 py-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  ← Back to Home
                </a>
                {newOrderCount > 0 && (
                  <div className="bg-red-500 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium self-start">
                    {newOrderCount} new order{newOrderCount > 1 ? 's' : ''}
                  </div>
                )}
                <Button onClick={refreshOrders} variant="outline" size="sm" className="self-start">
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order._id);
              const totalAmount = calculateTotal(order.items);

              return (
                <div key={order._id} className="bg-white shadow rounded-lg overflow-hidden">
                  {/* Order Header */}
                  <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                    <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <Truck className="h-5 w-5 md:h-6 md:w-6 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                            Order #{order._id.slice(-6)}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 md:space-x-4">
                        <div className="flex flex-wrap items-center gap-1 md:gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                          <select 
                            className="border rounded px-2 py-1 text-xs md:text-sm" 
                            value={order.status} 
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                          >
                            {STATUS_STAGES.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                          <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.paymentStatus || 'unpaid'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePayment(order._id, order.paymentStatus)}
                            title={order.paymentStatus === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}
                            className="p-1 md:p-2"
                          >
                            {order.paymentStatus === 'paid' ? <Check className="h-3 w-3 md:h-4 md:w-4" /> : <CreditCard className="h-3 w-3 md:h-4 md:w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(order._id)}
                            className="p-1 md:p-2"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3 md:h-4 md:w-4" /> : <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      {/* Customer Info */}
                      <div className="flex items-start space-x-2 md:space-x-3">
                        <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs md:text-sm font-medium text-gray-900">Customer Details</h4>
                          <div className="text-xs md:text-sm text-gray-600 space-y-1">
                            <p className="font-medium truncate">{order.contact?.name || order.userName || 'N/A'}</p>
                            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                              <div className="flex items-center gap-1 md:gap-2">
                                <Phone className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                                <p className="truncate">{order.contact?.phone || order.userPhone || 'N/A'}</p>
                              </div>
                              {(order.contact?.phone || order.userPhone) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`tel:${order.contact?.phone || order.userPhone}`)}
                                  className="text-xs px-2 py-1 h-auto mt-1 sm:mt-0"
                                >
                                  Call
                                </Button>
                              )}
                            </div>
                            {order.contact?.email && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">@</span>
                                <p className="ml-1 truncate text-xs">{order.contact.email}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start space-x-2 md:space-x-3">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-2">
                            <h4 className="text-xs md:text-sm font-medium text-gray-900">Delivery Address</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const address = order.contact ? 
                                  `${order.contact.flatNo || ''} ${order.contact.area || ''} ${order.contact.district || ''} ${order.contact.pincode || ''}`.trim() :
                                  order.shippingAddress || order.deliveryAddress || '';
                                if (address) {
                                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                                }
                              }}
                              className="text-xs px-2 py-1 h-auto"
                            >
                              Directions
                            </Button>
                          </div>
                          <div className="text-xs md:text-sm text-gray-600 space-y-0.5">
                            {order.contact ? (
                              <>
                                <p className="font-medium truncate">{order.contact.name || 'N/A'}</p>
                                <p className="truncate">{order.contact.flatNo && `${order.contact.flatNo}, `}{order.contact.area || ''}</p>
                                {order.contact.district && <p className="truncate">{order.contact.district}</p>}
                                {order.contact.pincode && <p className="text-xs">PIN: {order.contact.pincode}</p>}
                                {order.contact.landmark && <p className="text-orange-600 font-medium text-xs truncate">Landmark: {order.contact.landmark}</p>}
                                {order.contact.addressType && <p className="text-xs text-gray-500">Type: {order.contact.addressType}</p>}
                              </>
                            ) : (
                              <p className="truncate">{order.shippingAddress || order.deliveryAddress || 'No address provided'}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment & Total */}
                      <div className="flex items-start space-x-2 md:space-x-3">
                        <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs md:text-sm font-medium text-gray-900">Payment & Total</h4>
                          <p className="text-xs md:text-sm text-gray-600 mb-1">
                            Method: <span className={`font-medium px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs ${
                              (order.paymentMethod === 'COD' || (!order.paymentMethod && order.paymentStatus !== 'paid')) 
                                ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {(order.paymentMethod === 'COD' || (!order.paymentMethod && order.paymentStatus !== 'paid')) ? '💵 COD' : '💳 Online'}
                            </span>
                          </p>
                          <p className="text-sm md:text-base font-medium text-gray-900">
                            Total: ₹{totalAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4 border-t border-gray-200">
                      <div className="space-y-3 md:space-y-4">
                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2 md:mb-3">Order Items</h4>
                          <div className="space-y-2">
                            {(order.items || []).map((item: any, i: number) => (
                              <div key={i} className="flex justify-between items-center py-2 px-2 md:px-3 bg-gray-50 rounded text-sm">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                  <p className="text-xs text-gray-500">₹{item.price} each</p>
                                </div>
                                <div className="text-right ml-2">
                                  <p className="text-xs md:text-sm text-gray-600">Qty: {item.quantity}</p>
                                  <p className="text-sm font-medium text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">Total Amount</span>
                              <span className="text-lg font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-200">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Order Timeline</h4>
                            <div className="space-y-1 text-xs md:text-sm text-gray-600">
                              <p>Created: {formatDate(order.createdAt)}</p>
                              {order.statusHistory?.map((entry: any, i: number) => (
                                <p key={i}>
                                  {entry.status.replace('_', ' ')}: {formatDate(entry.at)}
                                </p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Delivery Information</h4>
                            <div className="space-y-1 text-xs md:text-sm text-gray-600">
                              <p>Payment Status: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{order.paymentStatus || 'unpaid'}</span></p>
                              <p>Payment Method: {order.paymentMethod || 'N/A'}</p>
                              {order.contact?.landmark && <p className="truncate">Landmark: {order.contact.landmark}</p>}
                              {order.contact?.addressType && <p>Address Type: {order.contact.addressType}</p>}
                              {order.deliveryInstructions && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                  <p className="text-xs font-medium text-yellow-800">Delivery Instructions:</p>
                                  <p className="text-xs text-yellow-700 break-words">{order.deliveryInstructions}</p>
                                </div>
                              )}
                              {order.specialNotes && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                  <p className="text-xs font-medium text-blue-800">Special Notes:</p>
                                  <p className="text-xs text-blue-700 break-words">{order.specialNotes}</p>
                                </div>
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
                  <h3 className="mt-2 text-sm md:text-base font-medium text-gray-900">No deliveries</h3>
                  <p className="mt-1 text-xs md:text-sm text-gray-500">There are no orders ready for delivery.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DeliveryPanel;