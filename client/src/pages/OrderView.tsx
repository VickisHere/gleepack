import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STATUS_STAGES = [
  'received',
  'confirmed',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const getPaymentStatus = (order: any) => {
  const payment = order.payment || order.paymentInfo || {};
  const isPaid = order.paymentStatus === 'paid' || !!order.paidAt || payment.status === 'captured' || payment.paid === true || order.status === 'delivered';
  if (isPaid) return { status: 'Paid', color: 'text-green-700 bg-green-50 border-green-200' };
  return { status: 'Unpaid', color: 'text-red-700 bg-red-50 border-red-200' };
};

export default function OrderView() {
  const { apiFetch, isAuthenticated } = useAuthContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/orders');
        if (!res.ok) { setOrder(null); return; }
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((o: any) => (o._id === id || o.id === id)) : null;
        setOrder(found || null);
      } catch (e) {
        console.error(e);
        setOrder(null);
      } finally { setLoading(false); }
    })();
  }, [apiFetch, isAuthenticated, id]);

  if (!isAuthenticated) return (
    <Layout>
      <div className="section-padding container-custom text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to view this order</h2>
        <div className="flex justify-center">
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </div>
    </Layout>
  );

  if (loading) return (
    <Layout>
      <div className="section-padding container-custom text-center">Loading...</div>
    </Layout>
  );

  if (!order) return (
    <Layout>
      <div className="section-padding container-custom text-center">Order not found.</div>
    </Layout>
  );

  const history = order.statusHistory || [];
  const paymentStatus = getPaymentStatus(order);

  return (
    <Layout>
      <div className="section-padding container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Order #{order._id || order.id}</h1>
            <Button variant="ghost" onClick={() => navigate('/orders')}>Back</Button>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border">
              <h3 className="font-semibold mb-3">Order Progress</h3>
              <div className="flex flex-wrap gap-3 -m-1">
                {STATUS_STAGES.map((s, idx) => {
                  const entry = history.slice().reverse().find((h: any) => h.status === s);
                  const done = STATUS_STAGES.indexOf(order.status) > idx || (STATUS_STAGES.indexOf(order.status) === idx && order.status !== 'cancelled');
                  const isCurrent = order.status === s;
                  return (
                    <div key={s} className="flex flex-col items-center p-2 min-w-[80px]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${done ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {idx + 1}
                      </div>
                      <div className="text-xs text-center capitalize">{s.replace(/_/g, ' ').split(' ')[0]}</div>
                      <div className="text-xxs text-gray-500 mt-1">{entry ? new Date(entry.at).toLocaleDateString() : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Details */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  👤 Customer Details
                </h4>
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
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  📍 Complete Delivery Address
                </h4>
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
            </div>

            {/* Complete Order Items */}
            <div className="p-4 bg-white rounded-xl border">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🛒 Order Items ({(order.items || []).length})
              </h4>
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

            {/* Order Timeline & Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  📅 Order Timeline
                </h4>
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

              <div className="p-4 bg-purple-50 rounded-xl">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  🚚 Delivery & Payment Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{order.status?.replace('_', ' ') || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment:</span>
                    <span className={`font-medium px-2 py-1 rounded text-sm ${
                      (order.paymentMethod === 'COD' || (!order.paymentMethod && order.paymentStatus !== 'paid')) 
                        ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {(order.paymentMethod === 'COD' || (!order.paymentMethod && order.paymentStatus !== 'paid')) ? '💵 COD' : '💳 Online'}
                    </span>
                  </div>
                  {order.deliveryInstructions && (
                    <div className="mt-2 p-2 bg-yellow-100 rounded border-l-4 border-yellow-400">
                      <div className="text-xs font-medium text-yellow-800">Delivery Instructions:</div>
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
