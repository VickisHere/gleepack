// app/(dba)/DBADashboard.tsx

"use client";

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
import { Check, CreditCard, Menu, X } from 'lucide-react';

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

const STATUS_STAGES = [
    'received',
    'confirmed',
    'processing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled',
];

const COLORS = ['#a855f7', '#6366f1', '#22c55e', '#f97316', '#e11d48', '#0ea5e9'];

export default function DBADashboard() {
    const { apiFetch, token, user } = useAuthContext();

    // Only dba can access this panel
    if (user?.role !== 'dba') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You do not have permission to access this page.</p>
                </div>
            </div>
        );
    }
    const [orders, setOrders] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'employees'>('dashboard');
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
            const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:3010`;
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
        // Optimistic update
        setOrders((s) => s.map((o) => (o._id === id ? { ...o, status } : o)));

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
        // Only admin can modify payment status
        if (user?.role !== 'admin') {
            alert('Only administrators can modify payment status');
            return;
        }
        const next = current === 'paid' ? 'unpaid' : 'paid';
        // Confirmation required when marking as Paid
        if (next === 'paid') {
            const confirmed = window.confirm('Confirm: mark this order as PAID? This action will record the admin and timestamp.');
            if (!confirmed) return;
        }

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
            } else {
                console.error('Payment update failed', await res.text());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const stats = {
        total: orders.length,
        byStatus: STATUS_STAGES.reduce(
            (acc: any, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
            {},
        ),
    };

    if (!user || user.role !== 'dba') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050014] text-purple-100">
                Access denied. DBA privileges required.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050014] text-white flex">
            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:relative z-50 md:z-auto inset-y-0 left-0 w-60 flex-col border-r border-purple-800/30 bg-[#07001b] transform md:transform-none -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : ''}`}>
                <div className="px-4 py-4 text-xl font-bold text-purple-300 flex items-center justify-between">
                    DBA Panel
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="md:hidden p-1 rounded hover:bg-purple-900/40"
                    >
                        <X size={20} />
                    </button>
                </div>
                <nav className="mt-4 space-y-1 px-2">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'dashboard'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'orders'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Orders
                    </button>
                    <button
                        onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'products'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Products
                    </button>
                    <button
                        onClick={() => { setActiveTab('employees'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'employees'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Employees
                    </button>
                </nav>

                {/* Back to Home Button */}
                <div className="mt-8 px-2">
                    <a
                        href="/"
                        className="w-full flex items-center justify-center px-3 py-3 rounded-lg text-sm bg-purple-700 text-white hover:bg-purple-600 transition-colors"
                    >
                        ← Back to Home
                    </a>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 px-4 md:px-8 py-6">
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded hover:bg-purple-900/40"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {activeTab === 'dashboard' ? 'Dashboard Overview' :
                                 activeTab === 'orders' ? 'Orders' :
                                 activeTab === 'employees' ? 'Employee Management' : 'Products'}
                            </h1>
                            <p className="text-xs text-purple-200/70">
                                Real-time orders and operational analytics.
                            </p>
                        </div>
                    </div>
                </header>

                {activeTab === 'dashboard' ? (
                    <DashboardOverview orders={orders} userRole={user?.role} />
                ) : activeTab === 'orders' ? (
                    <OrdersTable
                        orders={orders}
                        stats={stats}
                        updateStatus={updateStatus}
                        togglePayment={togglePayment}
                        setSelected={setSelected}
                        setOpen={setOpen}
                        userRole={user?.role}
                    />
                ) : activeTab === 'employees' ? (
                    <EmployeesManager />
                ) : (
                    <ProductsManager socketRef={socketRef} />
                )}

                {/* Order details dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50">
                        <DialogHeader>
                            <DialogTitle className="text-purple-100">Order Details</DialogTitle>
                            <DialogDescription className="text-purple-300/80">
                                Customer and payment information
                            </DialogDescription>
                        </DialogHeader>
                        {selected ? (
                            <div className="mt-4 space-y-3 text-sm">
                                <div>
                                    <strong>Order ID:</strong> {selected._id}
                                </div>
                                <div>
                                    <strong>Customer:</strong> {selected.contact?.name || selected.userName || 'Guest'}
                                </div>
                                <div>
                                    <strong>Phone:</strong> {selected.contact?.phone || selected.userPhone || 'N/A'}
                                </div>
                                <div>
                                    <strong>Address:</strong>{' '}
                                    {selected.contact ? `${selected.contact.flatNo || ''}, ${selected.contact.area || ''}${selected.contact.landmark ? ', ' + selected.contact.landmark : ''} (${selected.contact.addressType || 'home'})` : selected.shippingAddress || selected.address || 'N/A'}
                                </div>
                                <div>
                                    <strong>Payment Method:</strong>{' '}
                                    {selected.paymentMethod || selected.payment?.method || 'N/A'}
                                </div>
                                <div>
                                    <strong>Payment Details:</strong>
                                    <pre className="text-xs bg-[#050014] text-purple-100 p-2 rounded mt-1 overflow-auto max-h-52">
                                        {JSON.stringify(
                                            selected.payment || selected.paymentInfo || {},
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                                <div>
                                    <strong>Items:</strong>
                                    <ul className="list-disc pl-6 mt-1">
                                        {(selected.items || []).map((it: any, i: number) => (
                                            <li key={i}>
                                                {it.name} x{it.quantity} — ₹{it.price}
                                            </li>
                                        ))}
                                    </ul>
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
            </main>
        </div>
    );
}

/* -------------- DASHBOARD OVERVIEW (GRAPHS) -------------- */

function DashboardOverview({ orders, userRole }: { orders: any[], userRole?: string }) {
    const dailyOrders = getDailyOrders(orders);
    const dailyRevenue = getRevenueByDay(orders);
    const topKits = getTopKits(orders);
    const statusDist = getStatusDistribution(orders, STATUS_STAGES);

    const totalRevenue = dailyRevenue.reduce((s, d) => s + d.revenue, 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRevenue = dailyRevenue.find((d) => d.date === todayStr)?.revenue || 0;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

    return (
        <div className="space-y-6">
            {/* top cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="Total Orders" value={orders.length} />
                <StatCard label="Delivered" value={deliveredCount} />
            </div>

            {/* charts */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="col-span-2 bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-purple-200 mb-2">Orders per Day</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyOrders}>
                                <XAxis dataKey="date" stroke="#a855f7" />
                                <YAxis stroke="#a855f7" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-purple-200 mb-2">
                        Status Breakdown
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDist}
                                    dataKey="value"
                                    nameKey="status"
                                    outerRadius={80}
                                    label
                                >
                                    {statusDist.map((_, idx) => (
                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-purple-200 mb-2">Top Kits</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topKits}>
                                <XAxis dataKey="name" stroke="#a855f7" />
                                <YAxis stroke="#a855f7" />
                                <Tooltip />
                                <Bar dataKey="qty" fill="#a855f7" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}

/* -------------- ORDERS TABLE -------------- */

function OrdersTable({
    orders,
    stats,
    updateStatus,
    togglePayment,
    setSelected,
    setOpen,
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

            <div className="overflow-auto border border-purple-800/40 rounded-xl bg-[#07001b]">
                <table className="min-w-full text-sm">
                    <thead className="bg-purple-900/40 text-purple-100">
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
                                className="border-t border-purple-800/40 hover:bg-purple-900/20"
                            >
                                <td className="p-2 align-top text-xs break-all">{o._id}</td>

                                <td className="p-2 align-top">
                                    <div className="font-medium text-purple-100">
                                        {o.userName || o.userEmail || 'Guest'}
                                    </div>
                                    <div className="text-xs text-purple-300/80">{o.userEmail}</div>
                                </td>

                                <td className="p-2 align-top">
                                    {Array.isArray(o.items) ? (
                                        <ul className="list-disc pl-4 space-y-1 text-xs text-purple-100/90">
                                            {o.items.map((it: any, i: number) => (
                                                <li key={i}>
                                                    {it.name} x{it.quantity} — ₹{it.price}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-xs text-purple-300/80">No items</div>
                                    )}
                                </td>

                                <td className="p-2 align-top text-sm font-semibold text-purple-100">
                                    ₹{o.total || o.amount || 0}
                                </td>

                                <td className="p-2 align-top">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${o.paymentStatus === 'paid'
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                                                    : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/40'
                                                }`}
                                        >
                                            {o.paymentStatus || 'unpaid'}
                                        </span>
                                        {userRole === 'admin' && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => togglePayment(o._id, o.paymentStatus)}
                                                title={o.paymentStatus === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                                                className="text-purple-300"
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
                                    <div className="mb-2 text-xs font-medium text-purple-100">
                                        {o.status}
                                    </div>
                                    <select
                                        className="border border-purple-700 bg-[#050014] text-xs rounded px-2 py-1 text-purple-100"
                                        value={o.status}
                                        onChange={(e) => updateStatus(o._id, e.target.value)}
                                    >
                                        {STATUS_STAGES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                <td className="p-2 align-top text-xs text-purple-300/80">
                                    {new Date(o.createdAt).toLocaleString()}
                                </td>

                                <td className="p-2 align-top">
                                    <div className="flex flex-col gap-2">
                                        <details>
                                            <summary className="text-xs text-purple-300 cursor-pointer hover:text-purple-100">
                                                History
                                            </summary>
                                            <ul className="text-xs mt-2 text-purple-200 space-y-1">
                                                {(o.statusHistory || []).map((h: any, i: number) => (
                                                    <li key={i}>
                                                        {new Date(h.at).toLocaleString()} — {h.status} by {h.by}
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs justify-start text-purple-100 hover:bg-purple-900/50"
                                            onClick={() => {
                                                setSelected(o);
                                                setOpen(true);
                                            }}
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
        <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
            <div className="text-xs uppercase tracking-wide text-purple-300/80">
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
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
    type Addon = { id: string; icon: string; name: string; nameHi: string; price: number };
    const [addons, setAddons] = React.useState<Addon[]>([
        { id: 'extra-cake', icon: '🍰', name: 'Extra Cake', nameHi: 'अतिरिक्त केक', price: 200 },
        { id: 'photo-frame', icon: '🖼️', name: 'Photo Frame', nameHi: 'फोटो फ्रेम', price: 150 },
        { id: 'candle-set', icon: '🕯️', name: 'Candle Set', nameHi: 'मोमबत्ती सेट', price: 100 },
    ]);
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
                const payload = Object.assign({}, form, { items, addons });
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
            setAddons([{ id: 'extra-cake', icon: '🍰', name: 'Extra Cake', nameHi: 'अतिरिक्त केक', price: 200 }, { id: 'photo-frame', icon: '🖼️', name: 'Photo Frame', nameHi: 'फोटो फ्रेम', price: 150 }, { id: 'candle-set', icon: '🕯️', name: 'Candle Set', nameHi: 'मोमबत्ती सेट', price: 100 }]);
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
        setAddons(p.addons && Array.isArray(p.addons) && p.addons.length ? p.addons : [{ id: 'extra-cake', icon: '🍰', name: 'Extra Cake', nameHi: 'अतिरिक्त केक', price: 200 }, { id: 'photo-frame', icon: '🖼️', name: 'Photo Frame', nameHi: 'फोटो फ्रेम', price: 150 }, { id: 'candle-set', icon: '🕯️', name: 'Candle Set', nameHi: 'मोमबत्ती सेट', price: 100 }]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdate = async () => {
        if (!editingId) return;
            try {
                const payload = Object.assign({}, form, { items, addons });
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
                    const text = await res.text().catch(() => '');
                    let errorData: any = {};
                    try { errorData = JSON.parse(text || '{}'); } catch (e) { errorData = { raw: text }; }
                    console.error('Update product failed', res.status, errorData);
                    alert(errorData.error || `Failed to update product (${res.status})`);
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
            setAddons([{ id: 'extra-cake', icon: '🍰', name: 'Extra Cake', nameHi: 'अतिरिक्त केक', price: 200 }, { id: 'photo-frame', icon: '🖼️', name: 'Photo Frame', nameHi: 'फोटो फ्रेम', price: 150 }, { id: 'candle-set', icon: '🕯️', name: 'Candle Set', nameHi: 'मोमबत्ती सेट', price: 100 }]);
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
            <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-purple-200 mb-3">{editingId ? 'Edit Product' : 'Add Product'}</h2>
                                <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-purple-300">Product ID (optional)</label>
                                            <input placeholder="birthday-basic" value={form.id} onChange={e => setForm({...form, id: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                            <div className="text-xxs text-purple-400 mt-1">Unique identifier used in URLs and references. If left blank an ID will be generated.</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Name (EN)</label>
                                            <input placeholder="Birthday Basic Kit" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Name (Hindi) (optional)</label>
                                            <input placeholder="जन्मदिन बेसिक किट" value={form.nameHi} onChange={e => setForm({...form, nameHi: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Category</label>
                                            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full">
                                                <option value="birthday">birthday</option>
                                                <option value="anniversary">anniversary</option>
                                                <option value="festival">festival</option>
                                            </select>
                                            <div className="text-xxs text-purple-400 mt-1">Used for filtering on the public site.</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Tier</label>
                                            <select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full">
                                                <option value="basic">basic</option>
                                                <option value="premium">premium</option>
                                                <option value="platinum">platinum</option>
                                            </select>
                                            <div className="text-xxs text-purple-400 mt-1">Controls badge color (Basic / Premium / Platinum).</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Price (INR)</label>
                                            <input type="number" placeholder="999" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Original Price (optional)</label>
                                            <input type="number" placeholder="1299" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: Number(e.target.value)})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Ideal Guests</label>
                                            <input placeholder="10-15" value={form.idealGuests} onChange={e => setForm({...form, idealGuests: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Image URL (optional)</label>
                                            <input placeholder="/images/kits/birthday-basic.jpg" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                            <div className="text-xxs text-purple-400 mt-1">If provided, this image will be used in the product card. Use full or site-relative URLs. You can also upload a file below.</div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-purple-300">Upload Image (optional)</label>
                                            <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" />
                                            <div className="text-xxs text-purple-400 mt-1">Choose an image to upload; it will be stored under /public/images/ and the product updated automatically.</div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-purple-300">Description (EN)</label>
                                            <textarea placeholder="Short description visible on the product card" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-purple-300">Description (Hindi)</label>
                                            <textarea placeholder="हिंदी विवरण" value={form.descriptionHi} onChange={e => setForm({...form, descriptionHi: e.target.value})} className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-purple-300">Items</label>
                                            <div className="space-y-2 mt-2">
                                                {items.map((it, idx) => (
                                                    <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                                                        <input className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={it.icon || ''} onChange={e => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], icon: e.target.value}; return copy; })} placeholder="🎈" />
                                                        <input className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={it.name || ''} onChange={e => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], name: e.target.value}; return copy; })} placeholder="Balloons" />
                                                        <div className="flex gap-2">
                                                            <input className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={it.quantity || ''} onChange={e => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], quantity: e.target.value}; return copy; })} placeholder="25 pcs" />
                                                            <button className="text-xs text-red-400" onClick={() => setItems(s => s.filter((_, i) => i !== idx))}>Remove</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div>
                                                    <Button size="sm" onClick={() => setItems(s => [...s, { icon: '', name: '', nameHi: '', quantity: '' }])}>Add Item</Button>
                                                </div>
                                            </div>
                                            <div className="text-xxs text-purple-400 mt-1">Use the small inputs to edit item icon, name and quantity. Two example rows are prefilled.</div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-xs text-purple-300">Add-ons</label>
                                            <div className="space-y-2 mt-2">
                                                {addons.map((ad, idx) => (
                                                    <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                                                        <input className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={ad.id || ''} onChange={e => setAddons(s => { const copy = [...s]; copy[idx] = {...copy[idx], id: e.target.value}; return copy; })} placeholder="extra-cake" />
                                                        <input className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={ad.icon || ''} onChange={e => setAddons(s => { const copy = [...s]; copy[idx] = {...copy[idx], icon: e.target.value}; return copy; })} placeholder="🍰" />
                                                        <input className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={ad.name || ''} onChange={e => setAddons(s => { const copy = [...s]; copy[idx] = {...copy[idx], name: e.target.value}; return copy; })} placeholder="Extra Cake" />
                                                        <input className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={ad.nameHi || ''} onChange={e => setAddons(s => { const copy = [...s]; copy[idx] = {...copy[idx], nameHi: e.target.value}; return copy; })} placeholder="अतिरिक्त केक" />
                                                        <div className="flex gap-2">
                                                            <input type="number" className="p-2 bg-[#050014] border border-purple-700/40 rounded w-full text-sm" value={ad.price || 0} onChange={e => setAddons(s => { const copy = [...s]; copy[idx] = {...copy[idx], price: Number(e.target.value)}; return copy; })} placeholder="200" />
                                                            <button className="text-xs text-red-400" onClick={() => setAddons(s => s.filter((_, i) => i !== idx))}>Remove</button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div>
                                                    <Button size="sm" onClick={() => setAddons(s => [...s, { id: '', icon: '', name: '', nameHi: '', price: 0 }])}>Add Add-on</Button>
                                                </div>
                                            </div>
                                            <div className="text-xxs text-purple-400 mt-1">Add optional add-ons that customers can select. ID should be unique, price in INR.</div>
                                        </div>
                                </div>
                <div className="mt-3 flex gap-2">
                    {!editingId ? (
                        <Button onClick={handleCreate}>Create Product</Button>
                    ) : (
                        <>
                            <Button onClick={handleUpdate}>Update Product</Button>
                            <Button variant="ghost" onClick={() => { setEditingId(null); setForm({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' }); setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]); setAddons([{ id: 'extra-cake', icon: '🍰', name: 'Extra Cake', nameHi: 'अतिरिक्त केक', price: 200 }, { id: 'photo-frame', icon: '🖼️', name: 'Photo Frame', nameHi: 'फोटो फ्रेम', price: 150 }, { id: 'candle-set', icon: '🕯️', name: 'Candle Set', nameHi: 'मोमबत्ती सेट', price: 100 }]); setUploadFile(null); }}>Cancel</Button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-purple-200 mb-3">Existing Products</h2>
                {loading ? <div>Loading...</div> : (
                    <ul className="space-y-2 text-sm">
                        {products.map(p => (
                            <li key={p.id || p._id} className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.name} <span className="text-xs text-muted-foreground">({p.id || p._id})</span></div>
                                    <div className="text-xs text-purple-300/80">{p.category} — ₹{p.price}</div>
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

/* -------------- EMPLOYEES MANAGER -------------- */

function EmployeesManager() {
    const { apiFetch, user } = useAuthContext();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDBA, setShowCreateDBA] = useState(false);
    const [showCreateDelivery, setShowCreateDelivery] = useState(false);
    const [showCreateGIM, setShowCreateGIM] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            // DBA should only fetch employee list; admins fetch full users
            const endpoint = user?.role === 'dba' ? '/api/admin/users/employees' : '/api/admin/users';
            const res = await apiFetch(endpoint);
            const data = await res.json();
            // normalize array and filter to employees (exclude influencers — they are managed separately)
            setUsers(Array.isArray(data) ? data.filter(u => u.role === 'dba' || u.role === 'delivery' || u.role === 'gim') : []);
        } catch (e) {
            console.error('Could not load users', e);
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (role: 'dba' | 'delivery' | 'gim') => {
        try {
            const endpoint = role === 'dba' ? '/api/admin/users/dba' :
                           role === 'delivery' ? '/api/admin/users/delivery' :
                           '/api/admin/users/gim';
            const res = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                await loadUsers();
                setFormData({ name: '', email: '' });
                setShowCreateDBA(false);
                setShowCreateDelivery(false);
                setShowCreateGIM(false);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create user');
            }
        } catch (e) {
            console.error('Error creating user', e);
            alert('Failed to create user');
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            const res = await apiFetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                await loadUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update user role');
            }
        } catch (e) {
            console.error('Error updating user role', e);
            alert('Failed to update user role');
        }
    };

    const deleteUser = async (userId: string) => {
        const confirmed = confirm('Are you sure you want to delete this user?');
        if (!confirmed) return;
        try {
            const res = await apiFetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await loadUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete user');
            }
        } catch (e) {
            console.error('Error deleting user', e);
            alert('Failed to delete user');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-600';
            case 'dba': return 'bg-blue-600';
            case 'delivery': return 'bg-green-600';
            case 'gim': return 'bg-purple-600';
            case 'influencer': return 'bg-orange-600';
            default: return 'bg-gray-600';
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'admin': return 'Admin';
            case 'dba': return 'DBA';
            case 'delivery': return 'GDM';
            case 'gim': return 'GIM';
            case 'influencer': return 'Influencer';
            default: return role;
        }
    };

    // Admin: full user management. DBA: limited to creating delivery boys only.
    if (user?.role !== 'admin' && user?.role !== 'dba') {
        return (
            <div className="text-center py-8">
                <p className="text-purple-200">Access denied. Admin or DBA privileges required.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">User Management</h2>
                <div className="flex gap-2">
                    {user?.role === 'admin' && (
                        <Button onClick={() => setShowCreateDBA(true)} className="bg-blue-600 hover:bg-blue-700">
                            Create DBA
                        </Button>
                    )}
                    {user?.role === 'admin' && (
                        <Button onClick={() => setShowCreateGIM(true)} className="bg-purple-600 hover:bg-purple-700">
                            Create GIM
                        </Button>
                    )}
                    {(user?.role === 'admin' || user?.role === 'dba') && (
                        <Button onClick={() => setShowCreateDelivery(true)} className="bg-green-600 hover:bg-green-700">
                            Create GDM
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-purple-200">Loading users...</p>
                </div>
            ) : (
                <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl overflow-x-auto">
                    {/* If DBA, show only delivery creation summary instead of full table */}
                    {user?.role === 'admin' ? (
                        <table className="w-full">
                        <thead className="bg-[#07001b] border-b border-purple-700/40">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Role</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Created</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} className="border-b border-purple-700/20">
                                    <td className="px-4 py-3 text-sm text-white">{u.name || u.email || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-purple-200">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(u.role)}`}>
                                            {getRoleDisplayName(u.role)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-purple-300">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            {u.role !== 'admin' && (
                                                <>
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => updateUserRole(u._id, e.target.value)}
                                                        className="text-xs bg-[#050014] border border-purple-600 text-white rounded px-2 py-1"
                                                    >
                                                        <option value="customer">Customer</option>
                                                        <option value="delivery">GDM</option>
                                                        <option value="dba">DBA</option>
                                                        <option value="gim">GIM</option>
                                                    </select>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => deleteUser(u._id)}
                                                        className="text-xs"
                                                    >
                                                        Delete
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-[#07001b] border-b border-purple-700/40">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Email</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Role</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id || u.id} className="border-b border-purple-700/20">
                                        <td className="px-4 py-3 text-sm text-white">{u.name || u.email || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(u.role)}`}>
                                                {getRoleDisplayName(u.role)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {/* DBA can create delivery boys; cannot change other roles or delete admin */}
                                                {u.role !== 'admin' && (
                                                    <Button size="sm" variant="ghost" onClick={() => alert('View profile not implemented')}>
                                                        View
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Create DBA Dialog */}
            <Dialog open={showCreateDBA} onOpenChange={setShowCreateDBA}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Create DBA Account</DialogTitle>
                        <DialogDescription className="text-purple-300/80">
                            Create a new DBA (Sub-Admin) account with full operational access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="Enter email address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreateDBA(false)}>Cancel</Button>
                        <Button onClick={() => createUser('dba')} className="bg-blue-600 hover:bg-blue-700">
                            Create DBA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create GIM Dialog */}
            <Dialog open={showCreateGIM} onOpenChange={setShowCreateGIM}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Create GIM Account</DialogTitle>
                        <DialogDescription className="text-purple-300/80">
                            Create a new Gleepack Inventory Manager account for product management.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="Enter email address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreateGIM(false)}>Cancel</Button>
                        <Button onClick={() => createUser('gim')} className="bg-purple-600 hover:bg-purple-700">
                            Create GIM
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Delivery Boy Dialog */}
            <Dialog open={showCreateDelivery} onOpenChange={setShowCreateDelivery}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Create GDM Account</DialogTitle>
                        <DialogDescription className="text-purple-300/80">
                            Create a new GDM account for order assignments.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="Enter email address"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreateDelivery(false)}>Cancel</Button>
                        <Button onClick={() => createUser('delivery')} className="bg-green-600 hover:bg-green-700">
                            Create GDM
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
