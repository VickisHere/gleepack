// app/(dba)/DBADashboard.tsx

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { Check, CreditCard, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

// recharts install kar:
// npm install recharts
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const STATUS_STAGES = ['confirmed', 'delivered', 'cancelled'];

const COLORS = ['#a855f7', '#6366f1', '#22c55e', '#f97316', '#e11d48', '#0ea5e9'];

export default function DBADashboard() {
    const { apiFetch, token, user } = useAuthContext();

    const [orders, setOrders] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

        try {
            const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3010`;
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
        // Optimistic update (keep prev state)
        const prev = orders;
        setOrders((s) => s.map((o) => (o._id === id ? { ...o, status } : o)));

        try {
            const res = await apiFetch(`/api/orders/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                const updated = await res.json();
                setOrders((s) => s.map((o) => (o._id === updated._id ? updated : o)));
                toast.success('Status updated');
            } else {
                const txt = await res.text().catch(() => '');
                console.error('Status update failed', txt);
                setOrders(prev);
                toast.error('Failed to update status');
            }
        } catch (e) {
            console.error(e);
            setOrders(prev);
            toast.error('Failed to update status');
        }
    };

    const togglePayment = async (id: string, current: string | undefined) => {
        // Allow admin or dba to modify payment status
        if (!user || (user.role !== 'admin' && user.role !== 'dba')) {
            toast.error('You are not authorized to update payment status');
            return;
        }
        const next = current === 'paid' ? 'unpaid' : 'paid';
        // Confirmation required when marking as Paid
        if (next === 'paid') {
            const confirmed = window.confirm('Confirm: mark this order as PAID? This action will record the user and timestamp.');
            if (!confirmed) return;
        }

        // Optimistic update (keep a copy to revert on failure)
        const prev = orders;
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
                const txt = await res.text().catch(() => '');
                console.error('Payment update failed', txt);
                setOrders(prev); // revert
                toast.error('Failed to update payment status');
            }
        } catch (e) {
            console.error(e);
            setOrders(prev);
            toast.error('Failed to update payment status');
        }
    };

    const stats = {
        total: orders.length,
        byStatus: STATUS_STAGES.reduce(
            (acc: any, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
            {},
        ),
    };

    // Allow both DBA and Admin users to access this panel
    if (!user || (user.role !== 'dba' && user.role !== 'admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Access denied. DBA or Admin privileges required.
            </div>
        );
    }

    return (
        <Layout>
            <div className="section-padding bg-white text-gray-900 min-h-screen">
                <div className="container-custom grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Sidebar as left column */}
                    <aside className="md:col-span-3 lg:col-span-2">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold">DBA Panel</h3>
                                <button className="md:hidden p-1 rounded hover:bg-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <nav className="space-y-2">
                                <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'orders' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>Orders</button>
                                <button onClick={() => setActiveTab('products')} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'products' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>Products</button>
                            </nav>
                            <div className="mt-4">
                                <a href="/" className="inline-flex items-center justify-center px-3 py-2 bg-outline rounded text-sm">← Back to Home</a>
                            </div>
                        </div>
                    </aside>

                    {/* Main content */}
                    <main className="md:col-span-9 lg:col-span-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{activeTab === 'orders' ? 'Orders' : 'Products'}</h1>
                                <p className="text-sm text-muted-foreground">Real-time orders and operational analytics.</p>
                            </div>
                        </div>

                        {activeTab === 'orders' ? (
                            <OrdersTable
                                orders={orders}
                                stats={stats}
                                updateStatus={updateStatus}
                                togglePayment={togglePayment}
                                onViewOrder={(orderId) => navigate(`/orders/${orderId}`)}
                                userRole={user?.role}
                            />
                        ) : (
                            <ProductsManager socketRef={socketRef} />
                        )}
                    </main>
                </div>
            </div>
        </Layout>
    );
}

/* -------------- ORDERS TABLE -------------- */

function OrdersTable({
    orders,
    stats,
    updateStatus,
    togglePayment,
    onViewOrder,
    userRole,
}: any) {
    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Orders" value={stats.total} />
                {STATUS_STAGES.slice(0, 3).map((s) => (
                    <StatCard key={s} label={s} value={stats.byStatus[s] || 0} />
                ))}
            </div>

            <div className="overflow-auto border border-gray-200 rounded-xl bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            {[
                                'Order ID',
                                'Customer',
                                'Items',
                                'Total',
                                'Payment',
                                'Status',
                                'Created',
                                'Actions',
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="p-2 text-left text-xs font-semibold uppercase tracking-wide"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o: any) => (
                            <tr
                                key={o._id}
                                className="border-t border-gray-100 hover:bg-gray-50"
                            >
                                <td className="p-2 align-top text-xs break-all">{o._id}</td>

                                <td className="p-2 align-top">
                                    <div className="font-medium text-gray-900">
                                        {o.userName || o.userEmail || 'Guest'}
                                    </div>
                                    <div className="text-xs text-gray-500">{o.userEmail}</div>
                                </td>

                                <td className="p-2 align-top">
                                    {Array.isArray(o.items) ? (
                                        <ul className="list-disc pl-4 space-y-1 text-xs text-gray-700">
                                            {o.items.map((it: any, i: number) => (
                                                <li key={i}>
                                                    {it.name} x{it.quantity} — ₹{it.price}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-xs text-gray-500">No items</div>
                                    )}
                                </td>

                                <td className="p-2 align-top text-sm font-semibold text-gray-900">
                                    ₹{o.total || o.amount || 0}
                                </td>

                                <td className="p-2 align-top">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${o.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                }`}
                                        >
                                            {o.paymentStatus || 'unpaid'}
                                        </span>
                                        {(userRole === 'admin' || userRole === 'dba') && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => togglePayment(o._id, o.paymentStatus)}
                                                title={o.paymentStatus === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                                                className="text-gray-700"
                                            >
                                                {o.paymentStatus === 'paid' ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <CreditCard className="h-4 w-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </td>

                                <td className="p-2 align-top">
                                    <div className="mb-2 text-xs font-medium text-gray-900">
                                        {o.status.replace(/_/g, ' ')}
                                    </div>
                                    <select
                                        className="border border-gray-300 bg-white text-xs rounded px-2 py-1 text-gray-900"
                                        value={['confirmed', 'delivered', 'cancelled'].includes(o.status) ? o.status : 'confirmed'}
                                        onChange={(e) => updateStatus(o._id, e.target.value)}
                                    >
                                        <option value="confirmed">Order Confirmed</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancel</option>
                                    </select>
                                </td>

                                <td className="p-2 align-top text-xs text-gray-500">
                                    {new Date(o.createdAt).toLocaleString()}
                                </td>

                                <td className="p-2 align-top">
                                    <div className="flex flex-col gap-2">
                                        <details>
                                            <summary className="text-xs text-gray-700 cursor-pointer hover:text-gray-900">
                                                History
                                            </summary>
                                            <ul className="text-xs mt-2 text-gray-600 space-y-1">
                                                {(o.statusHistory || []).map((h: any, i: number) => (
                                                    <li key={i}>
                                                        {new Date(h.at).toLocaleString()} — {h.status.replace(/_/g, ' ')} by {h.by}
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs justify-start text-gray-700 hover:bg-gray-100"
                                            onClick={() => onViewOrder(o._id)}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* -------------- SMALL HELPERS -------------- */

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
        </div>
    );
}

function getDailyOrders(orders: any[]) {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
        const d = new Date(o.createdAt).toISOString().slice(0, 10);
        map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
}

function getRevenueByDay(orders: any[]) {
    const map: Record<string, number> = {};
    orders
        .filter((o) => o.paymentStatus === 'paid')
        .forEach((o) => {
            const d = new Date(o.createdAt).toISOString().slice(0, 10);
            const amount = Number(o.total || o.amount || 0);
            map[d] = (map[d] || 0) + amount;
        });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
}

function getTopKits(orders: any[], limit = 5) {
    const map: Record<string, { name: string; qty: number }> = {};
    orders.forEach((o) => {
        (o.items || []).forEach((it: any) => {
            if (!it?.name) return;
            if (!map[it.name]) map[it.name] = { name: it.name, qty: 0 };
            map[it.name].qty += Number(it.quantity || 0);
        });
    });
    return Object.values(map)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limit);
}

function getStatusDistribution(orders: any[], stages: string[]) {
    return stages.map((s) => ({
        status: s,
        value: orders.filter((o) => o.status === s).length,
    }));
}

/* -------------- PRODUCTS MANAGER (ADMIN) -------------- */

function ProductsManager({ socketRef }: { socketRef: React.MutableRefObject<import('socket.io-client').Socket | null> }) {
    const { apiFetch } = useAuthContext();
    const [products, setProducts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [form, setForm] = React.useState<any>({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' });
    const [items, setItems] = React.useState<any[]>([
        { icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' },
        { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' },
    ]);
    // Note: DBA panel does not expose add-ons UI (handled by admin panel)
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [uploadFile, setUploadFile] = React.useState<File | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/products');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setProducts(data || []);
        } catch (e) {
            console.error('Could not load products', e);
        } finally { setLoading(false); }
    };

    React.useEffect(() => { load(); }, []);

    React.useEffect(() => {
        const socket = socketRef && socketRef.current;
        if (!socket) return;
        const onCreated = (p: any) => load();
        const onUpdated = (p: any) => load();
        const onDeleted = (id: any) => load();
        socket.on('product_created', onCreated);
        socket.on('product_updated', onUpdated);
        socket.on('product_deleted', onDeleted);
        return () => {
            socket.off('product_created', onCreated);
            socket.off('product_updated', onUpdated);
            socket.off('product_deleted', onDeleted);
        };
    }, [socketRef]);

    const toBase64 = (file: File) => new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(String(reader.result));
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });

    const uploadImage = async (productId: string, file: File) => {
        const dataUrl = await toBase64(file);
        const filename = `${productId}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const res = await apiFetch(`/api/products/${productId}/image`, { method: 'POST', body: JSON.stringify({ filename, data: dataUrl }), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('Upload failed');
        const json = await res.json();
        return json.url;
    };

    const handleCreate = async () => {
            try {
                const payload = Object.assign({}, form, { items });
                console.debug('Creating product payload:', payload);
                let res;
                try {
                    res = await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
                } catch (err) {
                    console.error('Network/create request failed', err);
                    alert('Network error while creating product (see console)');
                    return;
                }
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    let errorData: any = {};
                    try { errorData = JSON.parse(text || '{}'); } catch (e) { errorData = { raw: text }; }
                    console.error('Create product failed', res.status, errorData);
                    alert(errorData.error || `Failed to create product (${res.status})`);
                    return;
                }
            const created = await res.json();
            // if file selected, upload it and update product image
            if (uploadFile) {
                try {
                    const url = await uploadImage(created.id || created._id || created.id, uploadFile);
                    await (apiFetch ? apiFetch(`/api/products/${created.id || created._id}`, { method: 'PATCH', body: JSON.stringify({ image: url }) }) : fetch(`/api/products/${created.id || created._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: url }) }));
                    created.image = url;
                } catch (e) {
                    console.error('Image upload failed', e);
                    alert('Product created but image upload failed');
                }
            }
            setProducts((s) => [created, ...s]);
            setForm({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' });
            setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
            setUploadFile(null);
            alert('Product created');
        } catch (e) {
            console.error(e);
            alert('Create failed, see console');
        }
    };

    const handleEdit = (p: any) => {
        setEditingId(p.id || p._id || null);
        setForm({
            id: p.id || p._id || '',
            name: p.name || '',
            nameHi: p.nameHi || '',
            category: p.category || 'birthday',
            tier: p.tier || 'basic',
            price: p.price || 0,
            originalPrice: p.originalPrice || 0,
            idealGuests: p.idealGuests || '',
            description: p.description || '',
            descriptionHi: p.descriptionHi || '',
            image: p.image || '',
        });
        setItems(p.items && Array.isArray(p.items) && p.items.length ? p.items : [{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
        // DBA panel intentionally does not load or edit add-ons here
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdate = async () => {
        if (!editingId) return;
            try {
                const payload = Object.assign({}, form, { items });
                console.debug('Updating product payload:', editingId, payload);
                let res;
                try {
                    res = await apiFetch(`/api/products/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
                } catch (err) {
                    console.error('Network/update request failed', err);
                    alert('Network error while updating product (see console)');
                    return;
                }
                if (!res.ok) {
                    const status = res.status;
                    const text = await res.text().catch(() => '');
                    let errorData: any = {};
                    try { errorData = JSON.parse(text || '{}'); } catch (e) { errorData = { raw: text }; }
                    console.error('Update product failed', status, errorData);

                    // If API returned 404, re-check the products list — sometimes the
                    // DB was updated but the response came back as Not found. If
                    // we see the updated product on the list, treat it as success.
                    if (status === 404) {
                        try {
                            const refresh = await apiFetch('/api/products');
                            if (refresh.ok) {
                                const list = await refresh.json();
                                const found = list.find((x: any) => (x.id || x._id) === (editingId));
                                if (found && String(found.name || '') === String(payload.name || '')) {
                                    // Apply the refreshed product and treat as success
                                    setProducts((s) => s.map((p) => (p.id === (found.id || found._id) ? found : p)));
                                    setForm({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' });
                                    setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
                                    setEditingId(null);
                                    setUploadFile(null);
                                    alert('Product updated');
                                    return;
                                }
                            }
                        } catch (e) {
                            console.error('Re-check products failed', e);
                        }
                    }

                    alert(errorData.error || `Failed to update product (${status})`);
                    return;
                }
            const updated = await res.json();
            // handle image upload
            if (uploadFile) {
                try {
                    const url = await uploadImage(updated.id || updated._id || editingId, uploadFile);
                    const imageUpdateRes = await apiFetch(`/api/products/${editingId}`, { method: 'PATCH', body: JSON.stringify({ image: url }) });
                    if (imageUpdateRes.ok) updated.image = url;
                } catch (e) {
                    console.error('Image upload failed', e);
                    alert('Product updated but image upload failed');
                }
            }
            setProducts((s) => s.map((p) => (p.id === updated.id ? updated : p)));
            setForm({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' });
            setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
            setEditingId(null);
            setUploadFile(null);
            alert('Product updated');
        } catch (e) {
            console.error(e);
            alert('Update failed, see console');
        }
    };

    const handleDelete = async (p: any) => {
        const confirmed = window.confirm(`Delete product ${p.name} (${p.id})? This cannot be undone.`);
        if (!confirmed) return;
        try {
            const res = await apiFetch(`/api/products/${p.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                alert(b.error || 'Delete failed');
                return;
            }
            setProducts((s) => s.filter((x) => x.id !== p.id));
            alert('Product deleted');
        } catch (e) {
            console.error(e);
            alert('Delete failed, see console');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{editingId ? 'Edit Product' : 'Add Product'}</h2>
                                <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-600">Product ID (optional)</label>
                                            <input placeholder="birthday-basic" value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                            <div className="text-xxs text-gray-500 mt-1">Unique identifier used in URLs and references. If left blank an ID will be generated.</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600">Name (EN)</label>
                                            <input placeholder="Birthday Basic Kit" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600">Name (Hindi) (optional)</label>
                                            <input placeholder="जन्मदिन बेसिक किट" value={form.nameHi} onChange={e => setForm({...form, nameHi: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Category</label>
                                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900">
                                                <option value="birthday">birthday</option>
                                                <option value="anniversary">anniversary</option>
                                                <option value="festival">festival</option>
                                            </select>
                                            <div className="text-xxs text-gray-500 mt-1">Used for filtering on the public site.</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Tier</label>
                                            <select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900">
                                                <option value="basic">basic</option>
                                                <option value="premium">premium</option>
                                                <option value="platinum">platinum</option>
                                            </select>
                                            <div className="text-xxs text-purple-400 mt-1">Controls badge color (Basic / Premium / Platinum).</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Price (INR)</label>
                                            <input type="number" placeholder="999" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Original Price (optional)</label>
                                            <input type="number" placeholder="1299" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: Number(e.target.value)})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Ideal Guests</label>
                                            <input placeholder="10-15" value={form.idealGuests} onChange={e => setForm({...form, idealGuests: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Image URL (optional)</label>
                                            <input placeholder="/images/kits/birthday-basic.jpg" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                            <div className="text-xxs text-gray-500 mt-1">If provided, this image will be used in the product card. Use full or site-relative URLs. You can also upload a file below.</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Upload Image (optional)</label>
                                            <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)} className="p-2 bg-white border border-gray-200 rounded w-full text-sm text-gray-900" />
                                            <div className="text-xxs text-gray-500 mt-1">Choose an image to upload; it will be stored under /public/images/ and the product updated automatically.</div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-purple-300">Description (EN)</label>
                                            <textarea placeholder="Short description visible on the product card" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-purple-300">Description (Hindi)</label>
                                            <textarea placeholder="हिंदी विवरण" value={form.descriptionHi} onChange={e => setForm({...form, descriptionHi: e.target.value})} className="p-2 bg-white border border-gray-200 rounded w-full text-gray-900" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-purple-300">Items</label>
                                            <div className="space-y-2 mt-2">
                                                {items.map((it, idx) => (
                                                    <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                                                        <input className="p-2 bg-white border border-gray-200 rounded w-full text-sm text-gray-900" value={it.icon || ''} onChange={e => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], icon: e.target.value}; return copy; })} placeholder="🎈" />
                                                        <input className="p-2 bg-white border border-gray-200 rounded w-full text-sm text-gray-900" value={it.name || ''} onChange={e => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], name: e.target.value}; return copy; })} placeholder="Balloons" />
                                                        <div className="flex gap-2">
                                                            <input className="p-2 bg-white border border-gray-200 rounded w-full text-sm text-gray-900" value={it.quantity || ''} onChange={e => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], quantity: e.target.value}; return copy; })} placeholder="25 pcs" />
                                                            <button className="text-xs text-red-400" onClick={() => setItems(s => s.filter((_, i) => i !== idx))}>Remove</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div>
                                                    <Button size="sm" onClick={() => setItems(s => [...s, { icon: '', name: '', nameHi: '', quantity: '' }])}>Add Item</Button>
                                                </div>
                                            </div>
                                            <div className="text-xxs text-gray-500 mt-1">Use the small inputs to edit item icon, name and quantity. Two example rows are prefilled.</div>
                                        </div>

                                        {/* Add-ons removed from DBA product form */}
                                </div>
                <div className="mt-3 flex gap-2">
                    {!editingId ? (
                        <Button onClick={handleCreate}>Create Product</Button>
                    ) : (
                        <>
                            <Button onClick={handleUpdate}>Update Product</Button>
                            <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' }); setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]); setUploadFile(null); }}>Cancel</Button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Existing Products</h2>
                {loading ? <div>Loading...</div> : (
                    <ul className="space-y-2 text-sm">
                        {products.map(p => (
                            <li key={p.id || p._id} className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-900">{p.name} <span className="text-xs text-gray-500">({p.id || p._id})</span></div>
                                    <div className="text-xs text-gray-500">{p.category} — ₹{p.price}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(p.id || p._id)}>Copy ID</Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>Edit</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p)}>Delete</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}


