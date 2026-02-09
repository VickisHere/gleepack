import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNetworkRequest } from '@/hooks/useNetworkRequest';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { LoadingSpinner, NetworkError, ConnectionError } from '@/components/ui/loading-states';
import { RotateCcw } from 'lucide-react';

const Orders: React.FC = () => {
  const { apiFetch, isAuthenticated, token, user, openAuthModal } = useAuthContext();
  const { reorderItems } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const socketRef = useRef<any | null>(null);
  const navigate = useNavigate();
  const { isLoading, error, errorType, executeRequest, clearError } = useNetworkRequest();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    executeRequest(
      async () => {
        const response = await apiFetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
        } else {
          setOrders([]);
        }
      },
      {
        onError: () => setOrders([])
      }
    );
  }, [apiFetch, isAuthenticated, executeRequest]);

  // realtime updates for order changes
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3010`;
      const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
      socketRef.current = socket;
      socket.on('connect', () => console.debug('orders socket connected', socket.id));
      socket.on('order_updated', (updated: any) => {
        setOrders((s) => s.map((o) => (o._id === updated._id ? updated : o)));
        if (user && (updated.userId === user.id || updated.userEmail === user.email)) {
          const msg = updated.status === 'confirmed' ? 'Order confirmed!' : updated.status === 'delivered' ? 'Order delivered!' : updated.status === 'cancelled' ? 'Order cancelled' : `Status: ${updated.status}`;
          toast.success(msg, { description: `Order #${updated._id?.slice(-6)}` });
        }
      });
      socket.on('order_created', (created: any) => {
        if (user && (created.userId === user.id || created.userEmail === user.email)) {
          setOrders((s) => [created, ...s]);
          toast.success('Order placed!', { description: `#${created._id?.slice(-6)} — ₹${created.total}` });
        }
      });
      socket.on('connect_error', (err: any) => console.warn('socket connect_error', err));
      return () => { socket.disconnect(); socketRef.current = null; };
    } catch (e) {
      console.warn('Socket init failed', e);
    }
  }, [isAuthenticated, token, user]);

  const handleReorder = (order: any) => {
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

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your orders</h2>
          <div className="flex justify-center">
            <Button onClick={() => openAuthModal()}>Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="section-padding container-custom">
        <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner message="Fetching your orders..." />
          </div>
        ) : error ? (
          <div className="py-12">
            {errorType === 'network' && <NetworkError onRetry={() => window.location.reload()} />}
            {errorType === 'connection' && <ConnectionError onRetry={() => window.location.reload()} />}
            {errorType === 'server' && (
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-lg font-semibold mb-2">Unable to load orders</p>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            )}
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
              <OrderCard
                key={o._id || o.id}
                order={o}
                onOpen={() => navigate(`/orders/${o._id || o.id}`)}
                onReorder={() => handleReorder(o)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;

function OrderCard({ order, onOpen, onReorder }: { order: any; onOpen: () => void; onReorder: () => void }) {
  const itemNames = (order.items || []).map((i: any) => i.name).filter(Boolean);
  const namesText = itemNames.length > 2
    ? `${itemNames.slice(0, 2).join(', ')} +${itemNames.length - 2} more`
    : itemNames.join(', ') || 'Items';

  const handleReorderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReorder();
  };

  const isDelivered = order.status === 'delivered';

  return (
    <div
      className="p-4 sm:p-6 border border-gray-200 rounded-xl hover:border-gray-300 transition-all cursor-pointer bg-white"
      onClick={onOpen}
    >
      {/* Mobile view */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{namesText}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900">₹{order.total}</div>
        </div>
        
        <div className="flex items-center gap-2 justify-between">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {order.status === 'confirmed' ? 'Confirmed' : order.status === 'delivered' ? 'Delivered' : order.status === 'cancelled' ? 'Cancelled' : (order.status || 'Pending').replace(/_/g, ' ')}
          </span>
          <span className="text-blue-600 text-xs font-medium">View →</span>
        </div>

        {isDelivered && (
          <Button
            onClick={handleReorderClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-base transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Reorder Again</span>
          </Button>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate">{namesText}</div>
          <div className="text-sm text-gray-500 mt-1">
            Ordered: {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-shrink-0">
          <div className="text-lg font-bold text-gray-900">₹{order.total}</div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {order.status === 'confirmed' ? 'Confirmed' : order.status === 'delivered' ? 'Delivered' : order.status === 'cancelled' ? 'Cancelled' : (order.status || 'Pending').replace(/_/g, ' ')}
          </span>
          {isDelivered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReorderClick}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reorder</span>
            </Button>
          )}
          <span className="text-blue-600 text-sm font-medium">View details →</span>
        </div>
      </div>
    </div>
  );
}
