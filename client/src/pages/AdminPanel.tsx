// app/(admin)/AdminPanel.tsx  (ya jaha bhi tu use kar raha hai)

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

export default function AdminPanel() {
    const { apiFetch, token, user } = useAuthContext();

    // Only admin can access this panel
    if (user?.role !== 'admin') {
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'employees' | 'customers' | 'coupons' | 'influencers' | 'waiting-customers'>('dashboard');
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
            socket.on('order_created', (order: any) => { console.log('order_created', order); setOrders((s) => [order, ...s]); });
            socket.on('order_updated', (order: any) => { console.log('order_updated', order); setOrders((s) => s.map((o) => (o._id === order._id ? order : o))); });
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
            const ok = window.confirm('Confirm: mark this order as PAID? This action will record the admin and timestamp.');
            if (!ok) return;
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
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || o.amount || 0), 0),
        netRevenue: orders.reduce((sum, o) => sum + ((o.total || o.amount || 0) - (o.coupon?.commissionAmount || 0)), 0),
        byStatus: STATUS_STAGES.reduce(
            (acc: any, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
            {},
        ),
    };

    if (!user || (user.role !== 'admin' && user.role !== 'dba')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050014] text-purple-100">
                Please sign in as admin or DBA to view the admin panel.
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
                    Admin Dashboard
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
                    <button
                        onClick={() => { setActiveTab('customers'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'customers'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Customers
                    </button>
                    <button
                        onClick={() => { setActiveTab('coupons'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'coupons'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Coupons
                    </button>
                    <button
                        onClick={() => { setActiveTab('influencers'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'influencers'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Influencers
                    </button>
                    <button
                        onClick={() => { setActiveTab('waiting-customers'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTab === 'waiting-customers'
                                ? 'bg-purple-600 text-white'
                                : 'text-purple-200 hover:bg-purple-900/40'
                            }`}
                    >
                        Waiting Customers
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
                                 activeTab === 'employees' ? 'Employee Management' :
                                 activeTab === 'customers' ? 'Customer Management' :
                                 activeTab === 'coupons' ? 'Coupon Management' :
                                 activeTab === 'influencers' ? 'Influencer Management' :
                                 activeTab === 'waiting-customers' ? 'Waiting Customers' : 'Products'}
                            </h1>
                            <p className="text-xs text-purple-200/70">
                                Real-time orders, revenue and customer analytics.
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
                ) : activeTab === 'customers' ? (
                    <CustomersManager />
                ) : activeTab === 'coupons' ? (
                    <CouponsManager />
                ) : activeTab === 'influencers' ? (
                    <InfluencersManager />
                ) : activeTab === 'waiting-customers' ? (
                    <WaitingCustomersManager />
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
    const customerGrowth = getCustomerGrowth(orders);

    const totalRevenue = dailyRevenue.reduce((s, d) => s + d.revenue, 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRevenue = dailyRevenue.find((d) => d.date === todayStr)?.revenue || 0;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const netRevenue = orders.reduce((sum, o) => sum + ((o.total || o.amount || 0) - (o.coupon?.commissionAmount || 0)), 0);

    return (
        <div className="space-y-6">
            {/* top cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="Total Revenue" value={`₹${totalRevenue.toFixed(0)}`} />
                <StatCard label="Net Revenue" value={`₹${netRevenue.toFixed(0)}`} />
                <StatCard label="Delivered" value={deliveredCount} />
                <StatCard label="Today Revenue" value={`₹${todayRevenue.toFixed(0)}`} />
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
                {userRole === 'admin' && (
                    <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-purple-200 mb-2">
                            Revenue per Day
                        </h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyRevenue}>
                                    <XAxis dataKey="date" stroke="#a855f7" />
                                    <YAxis stroke="#a855f7" />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="#a855f7" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

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

            <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-purple-200 mb-2">
                    Customer Growth
                </h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={customerGrowth}>
                            <XAxis dataKey="date" stroke="#a855f7" />
                            <YAxis stroke="#a855f7" />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="customers"
                                stroke="#a855f7"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
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
                <StatCard label="Received" value={stats.byStatus.received || 0} />
                <StatCard label="Delivered" value={stats.byStatus.delivered || 0} />
                <StatCard label="Confirmed" value={stats.byStatus.confirmed || 0} />
            </div>

            <div className="overflow-auto border border-purple-800/40 rounded-xl bg-[#07001b]">
                <table className="min-w-full text-sm">
                    <thead className="bg-purple-900/40 text-purple-100">
                        <tr>
                            {[
                                'Order ID',
                                'Customer',
                                'Items',
                                'Total Amount',
                                'Payment',
                                'Coupon Details',
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
                                    {o.coupon ? (
                                        <div className="text-xs">
                                            <div className="font-medium text-purple-100">{o.coupon.code}</div>
                                            <div className="text-purple-300/80">
                                                {o.coupon.type === 'percentage' ? `${o.coupon.value}%` : `₹${o.coupon.value}`} off
                                            </div>
                                            <div className="text-green-400">
                                                Commission: ₹{o.coupon.commissionAmount || 0}
                                            </div>
                                            {o.coupon.influencerId && (
                                                <div className="text-blue-400">
                                                    Influencer Coupon
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-purple-300/60">No coupon</span>
                                    )}
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

function getCustomerGrowth(orders: any[]) {
    const firstOrderByUser: Record<string, string> = {};
    orders.forEach((o) => {
        const key = o.userId || o.userEmail || 'guest';
        const date = new Date(o.createdAt).toISOString().slice(0, 10);
        if (!firstOrderByUser[key] || date < firstOrderByUser[key]) {
            firstOrderByUser[key] = date;
        }
    });

    const map: Record<string, number> = {};
    Object.values(firstOrderByUser).forEach((d) => {
        map[d] = (map[d] || 0) + 1;
    });

    const sortedDates = Object.keys(map).sort();
    let cumulative = 0;
    return sortedDates.map((date) => {
        cumulative += map[date];
        return { date, customers: cumulative };
    });
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
        const res = apiFetch
            ? await apiFetch(`/api/products/${productId}/image`, { method: 'POST', body: JSON.stringify({ filename, data: dataUrl }), headers: { 'Content-Type': 'application/json' } })
            : await fetch(`/api/products/${productId}/image`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename, data: dataUrl }) });
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
                    res = apiFetch ? await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) }) : await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
                    res = apiFetch ? await apiFetch(`/api/products/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) }) : await fetch(`/api/products/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
                    const r2 = apiFetch ? await apiFetch(`/api/products/${editingId}`, { method: 'PATCH', body: JSON.stringify({ image: url }) }) : await fetch(`/api/products/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: url }) });
                    if (r2.ok) updated.image = url;
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
        const ok = window.confirm(`Delete product ${p.name} (${p.id})? This cannot be undone.`);
        if (!ok) return;
        try {
            const res = apiFetch ? await apiFetch(`/api/products/${p.id}`, { method: 'DELETE' }) : await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
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
    const [showCreateInfluencer, setShowCreateInfluencer] = useState(false);
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

    const createUser = async (role: 'dba' | 'delivery' | 'gim' | 'influencer') => {
        try {
            const endpoint = role === 'dba' ? '/api/admin/users/dba' : 
                           role === 'delivery' ? '/api/admin/users/delivery' : 
                           role === 'gim' ? '/api/admin/users/gim' :
                           '/api/admin/users/influencer';
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
                setShowCreateInfluencer(false);
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
        if (!confirm('Are you sure you want to delete this user?')) return;
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
                    {user?.role === 'admin' && (
                        <Button onClick={() => setShowCreateInfluencer(true)} className="bg-orange-600 hover:bg-orange-700">
                            Create Influencer (from Users)
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
            
            {/* Create Influencer Dialog (assign role to existing user) */}
            <Dialog open={showCreateInfluencer} onOpenChange={setShowCreateInfluencer}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Create Influencer</DialogTitle>
                        <DialogDescription className="text-purple-300/80">
                            Assign the influencer role to an existing user (they must already exist in Users). This will allow admin to configure their coupon and commission.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Email (existing user)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="user@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Name (optional)</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreateInfluencer(false)}>Cancel</Button>
                        <Button onClick={() => createUser('influencer')} className="bg-orange-600 hover:bg-orange-700">
                            Assign Influencer Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CouponsManager() {
    const { apiFetch, user } = useAuthContext();
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateCoupon, setShowCreateCoupon] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        minOrderValue: '',
        maxDiscount: '',
        usageType: 'unlimited',
        totalUsageLimit: '',
        perUserLimit: '1',
        expiryDate: '',
        active: true
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            // Load only regular coupons (not influencer-specific ones)
            const res = await apiFetch('/api/admin/coupons');
            if (res.ok) {
                const data = await res.json();
                // Filter out influencer coupons - only show regular coupons
                const regularCoupons = data.filter((coupon: any) => !coupon.influencerId);
                setCoupons(regularCoupons);
            }
        } catch (e) {
            console.error('Failed to load coupons', e);
        } finally {
            setLoading(false);
        }
    };

    const createCoupon = async () => {
        if (!formData.code || !formData.type || !formData.value || !formData.usageType) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const res = await apiFetch('/api/admin/coupons', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                loadCoupons();
                setShowCreateCoupon(false);
                setFormData({
                    code: '',
                    type: 'percentage',
                    value: '',
                    minOrderValue: '',
                    maxDiscount: '',
                    usageType: 'unlimited',
                    totalUsageLimit: '',
                    perUserLimit: '1',
                    expiryDate: '',
                    active: true
                });
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create coupon');
            }
        } catch (e) {
            console.error('Error creating coupon', e);
            alert('Failed to create coupon');
        }
    };

    const updateCouponStatus = async (couponId: string, newStatus: boolean) => {
        try {
            const res = await apiFetch(`/api/admin/coupons/${couponId}`, {
                method: 'PATCH',
                body: JSON.stringify({ active: newStatus })
            });
            if (res.ok) {
                loadCoupons();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update coupon status');
            }
        } catch (e) {
            console.error('Error updating coupon status', e);
            alert('Failed to update coupon status');
        }
    };

    const deleteCoupon = async (couponId: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const res = await apiFetch(`/api/admin/coupons/${couponId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                loadCoupons();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete coupon');
            }
        } catch (e) {
            console.error('Error deleting coupon', e);
            alert('Failed to delete coupon');
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="text-center py-8">
                <p className="text-purple-200">Access denied. Admin privileges required.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Regular Coupon Management</h2>
                <Button onClick={() => setShowCreateCoupon(true)} className="bg-purple-600 hover:bg-purple-700">
                    Create Coupon
                </Button>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                    <strong>Note:</strong> This section manages regular coupons only. Influencer-specific coupons are managed in the "Influencers" section.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-purple-200">Loading coupons...</p>
                </div>
            ) : (
                <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#07001b] border-b border-purple-700/40">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Code</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Type</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Value</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Usage</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-purple-200/70">
                                        No regular coupons found.
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon._id} className="border-b border-purple-700/20">
                                        <td className="px-4 py-3 text-sm text-white font-mono">{coupon.code}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200 capitalize">{coupon.type}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">
                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-purple-200">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                coupon.active ? 'text-green-300 bg-green-900/40' : 'text-red-300 bg-red-900/40'
                                            }`}>
                                                {coupon.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-purple-200">
                                            {coupon.usageCount || 0} / {coupon.usageType === 'unlimited' ? '∞' : coupon.totalUsageLimit || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateCouponStatus(coupon._id, !coupon.active)}
                                                    className={`text-xs px-2 py-1 ${
                                                        coupon.active 
                                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                                    }`}
                                                >
                                                    {coupon.active ? 'Deactivate' : 'Activate'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => deleteCoupon(coupon._id)}
                                                    className="text-xs"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Coupon Dialog */}
            <Dialog open={showCreateCoupon} onOpenChange={setShowCreateCoupon}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Create Regular Coupon</DialogTitle>
                        <DialogDescription className="text-purple-300/80">
                            Create a new coupon code for general use (not influencer-specific).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-purple-200 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white font-mono"
                                placeholder="SUMMER10"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Discount Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="flat">Flat Amount</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Discount Value</label>
                            <input
                                type="number"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder={formData.type === 'percentage' ? '10' : '50'}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Minimum Order Value</label>
                            <input
                                type="number"
                                value={formData.minOrderValue}
                                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Maximum Discount (Optional)</label>
                            <input
                                type="number"
                                value={formData.maxDiscount}
                                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Usage Type</label>
                            <select
                                value={formData.usageType}
                                onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                            >
                                <option value="unlimited">Unlimited</option>
                                <option value="limited">Limited</option>
                            </select>
                        </div>
                        {formData.usageType === 'limited' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-1">Total Usage Limit</label>
                                    <input
                                        type="number"
                                        value={formData.totalUsageLimit}
                                        onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                        placeholder="100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-1">Expiry Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Per User Limit</label>
                            <input
                                type="number"
                                value={formData.perUserLimit}
                                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreateCoupon(false)}>Cancel</Button>
                        <Button onClick={createCoupon} className="bg-purple-600 hover:bg-purple-700">
                            Create Coupon
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* -------------- INFLUENCERS MANAGER -------------- */

function InfluencersManager() {
    const { apiFetch, user } = useAuthContext();
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateInfluencer, setShowCreateInfluencer] = useState(false);
    const [showCreateCoupon, setShowCreateCoupon] = useState(false);
    const [selectedInfluencerForCoupon, setSelectedInfluencerForCoupon] = useState<any>(null);
    const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        couponCode: '',
        customerDiscountType: 'percentage',
        customerDiscountValue: '',
        commissionPercentage: '',
        validityType: 'unlimited',
        expiryDate: '2099-12-31T23:59',
        totalUsageLimit: '',
        perUserLimit: '1',
        showOrderAmount: false
    });
    const [couponFormData, setCouponFormData] = useState({
        couponCode: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderValue: '',
        maxDiscount: '',
        couponUsageType: 'unlimited',
        totalUsageLimit: '',
        perUserLimit: '1',
        expiryDate: '',
        status: 'active',
        commissionPercentage: ''
    });

    useEffect(() => {
        loadInfluencers();
    }, []);

    const loadInfluencers = async () => {
        try {
            // Get users with influencer role
            const res = await apiFetch('/api/admin/users?role=influencer');
            if (res.ok) {
                const users = await res.json();
                // Get influencer records
                const res2 = await apiFetch('/api/admin/influencers');
                let influencers = [];
                if (res2.ok) {
                    influencers = await res2.json();
                }
                // Merge: add hasProfile and influencerId to users, and fetch coupons
                const merged = await Promise.all(users.map(async (user: any) => {
                    const influencer = influencers.find((inf: any) => inf.userId === user._id);
                    let coupons = [];
                    if (influencer) {
                        try {
                            // Use the same endpoint as viewDashboard to get coupons
                            const dashboardRes = await apiFetch(`/api/influencer/dashboard?userId=${user._id}`);
                            if (dashboardRes.ok) {
                                const dashboardData = await dashboardRes.json();
                                coupons = dashboardData.coupons || [];
                            }
                        } catch (e) {
                            console.error('Failed to fetch dashboard for influencer', user._id, e);
                        }
                    }
                    return {
                        ...user,
                        hasProfile: !!influencer,
                        influencerId: influencer?._id,
                        coupons: coupons
                    };
                }));
                setInfluencers(merged);
            }
        } catch (e) {
            console.error('Failed to load influencers', e);
        } finally {
            setLoading(false);
        }
    };

    const makeCustomer = async (user: any) => {
        try {
            const res = await apiFetch(`/api/admin/users/${user._id}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role: 'customer' })
            });
            if (res.ok) {
                loadInfluencers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update user role');
            }
        } catch (e) {
            console.error('Error updating user role', e);
            alert('Failed to update user role');
        }
    };

    const createInfluencer = async () => {
        if (!formData.email || !formData.couponCode || !formData.customerDiscountType || !formData.customerDiscountValue || !formData.commissionPercentage) {
            alert('Please fill all required fields: email, coupon code, customer discount type, customer discount value, commission percentage');
            return;
        }
        try {
            const res = await apiFetch('/api/admin/influencers', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                loadInfluencers();
                setShowCreateInfluencer(false);
                setFormData({
                    email: '',
                    name: '',
                    couponCode: '',
                    customerDiscountType: 'percentage',
                    customerDiscountValue: '',
                    commissionPercentage: '',
                    validityType: 'unlimited',
                    expiryDate: '2099-12-31T23:59',
                    totalUsageLimit: '',
                    perUserLimit: '1',
                    showOrderAmount: false
                });
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create influencer');
            }
        } catch (e) {
            console.error('Error creating influencer', e);
            alert('Failed to create influencer');
        }
    };

    const updateInfluencer = async (id: string, updates: any) => {
        try {
            const res = await apiFetch(`/api/admin/influencers/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                loadInfluencers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update influencer');
            }
        } catch (e) {
            console.error('Error updating influencer', e);
            alert('Failed to update influencer');
        }
    };

    const createDefaultCoupon = async (user: any) => {
        const defaultData = {
            email: user.email,
            name: user.name || '',
            couponCode: user.name ? user.name.toUpperCase().replace(/\s+/g, '') + '10' : 'COUPON10',
            customerDiscountType: 'percentage',
            customerDiscountValue: '10',
            commissionPercentage: '5',
            validityType: 'unlimited',
            expiryDate: '2099-12-31T23:59',
            totalUsageLimit: '',
            perUserLimit: '1',
            showOrderAmount: false
        };
        try {
            const res = await apiFetch('/api/admin/influencers', {
                method: 'POST',
                body: JSON.stringify(defaultData)
            });
            if (res.ok) {
                loadInfluencers();
                alert('Coupon created for influencer');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create coupon');
            }
        } catch (e) {
            console.error('Error creating coupon', e);
            alert('Failed to create coupon');
        }
    };

    const setupInfluencerProfile = (user: any) => {
        setFormData({
            email: user.email,
            name: user.name || '',
            couponCode: '',
            customerDiscountType: 'percentage',
            customerDiscountValue: '',
            commissionPercentage: '',
            validityType: 'unlimited',
            expiryDate: '2099-12-31T23:59',
            totalUsageLimit: '',
            perUserLimit: '1',
            showOrderAmount: false
        });
        setShowCreateInfluencer(true);
    };

    const createCouponForInfluencer = (user: any) => {
        if (!user.influencerId) {
            alert('Influencer profile not found. Please refresh the page.');
            return;
        }
        setSelectedInfluencerForCoupon(user);
        setCouponFormData({
            couponCode: '',
            discountType: 'percentage',
            discountValue: '',
            minOrderValue: '',
            maxDiscount: '',
            couponUsageType: 'unlimited',
            totalUsageLimit: '',
            perUserLimit: '1',
            expiryDate: '',
            status: 'active',
            commissionPercentage: ''
        });
        setShowCreateCoupon(true);
    };

    const createCoupon = async () => {
        if (!selectedInfluencerForCoupon) {
            alert('No influencer selected. Please try again.');
            return;
        }
        
        if (!couponFormData.couponCode || !couponFormData.discountType || !couponFormData.discountValue || !couponFormData.couponUsageType || !couponFormData.commissionPercentage) {
            alert('Please fill all required fields including commission percentage');
            return;
        }

        // Validation
        if (couponFormData.couponUsageType === 'limited') {
            if (!couponFormData.totalUsageLimit || !couponFormData.expiryDate) {
                alert('Limited coupons require total usage limit and expiry date');
                return;
            }
        } else {
            if (couponFormData.expiryDate) {
                alert('Unlimited coupons cannot have expiry date');
                return;
            }
        }

        try {
            const res = await apiFetch(`/api/admin/influencers/${selectedInfluencerForCoupon.influencerId}/coupons`, {
                method: 'POST',
                body: JSON.stringify(couponFormData)
            });
            if (res.ok) {
                setShowCreateCoupon(false);
                setCouponFormData({
                    couponCode: '',
                    discountType: 'percentage',
                    discountValue: '',
                    minOrderValue: '',
                    maxDiscount: '',
                    couponUsageType: 'unlimited',
                    totalUsageLimit: '',
                    perUserLimit: '1',
                    expiryDate: '',
                    status: 'active',
                    commissionPercentage: ''
                });
                alert('Coupon created successfully');
                // Optionally reload influencers or update state
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create coupon');
            }
        } catch (e) {
            console.error('Error creating coupon', e);
            alert('Failed to create coupon');
        }
    };

    const viewDashboard = async (influencer: any) => {
        if (!influencer.influencerId) {
            alert('Influencer profile not found. Please refresh the page.');
            return;
        }
        
        try {
            const res = await apiFetch(`/api/admin/influencers/${influencer.influencerId}/dashboard`);
            if (res.ok) {
                const data = await res.json();
                setSelectedInfluencer(data);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to load dashboard');
                setSelectedInfluencer(null);
            }
        } catch (e) {
            console.error('Error loading dashboard', e);
            alert('Failed to load dashboard');
            setSelectedInfluencer(null);
        }
    };

    const updateCouponStatus = async (influencerId: string, couponId: string, newStatus: boolean) => {
        try {
            const res = await apiFetch(`/api/admin/influencers/${influencerId}/coupons/${couponId}`, {
                method: 'PATCH',
                body: JSON.stringify({ active: newStatus })
            });
            if (res.ok) {
                loadInfluencers(); // Refresh the data
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update coupon status');
            }
        } catch (e) {
            console.error('Error updating coupon status', e);
            alert('Failed to update coupon status');
        }
    };

    const deleteCoupon = async (influencerId: string, couponId: string) => {
        if (!confirm('Are you sure you want to delete this influencer coupon? This action cannot be undone.')) return;
        try {
            const res = await apiFetch(`/api/admin/influencers/${influencerId}/coupons/${couponId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                loadInfluencers(); // Refresh the data
                alert('Coupon deleted successfully');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete coupon');
            }
        } catch (e) {
            console.error('Error deleting coupon', e);
            alert('Failed to delete coupon');
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="text-center py-8">
                <p className="text-purple-200">Access denied. Admin privileges required.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-white">Influencer Management</h2>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-purple-200">Loading influencers...</p>
                </div>
            ) : (
                <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#07001b] border-b border-purple-700/40">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Coupons</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {influencers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-purple-200/70">
                                        No influencers found. Assign influencer role to users in Employee Management section.
                                    </td>
                                </tr>
                            ) : (
                                influencers.map((user) => (
                                    <tr key={user._id} className="border-b border-purple-700/20">
                                        <td className="px-4 py-3 text-sm text-white">{user.email}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">{user.name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">
                                            {user.coupons && user.coupons.length > 0 ? (
                                                <div className="space-y-2">
                                                    {user.coupons.map((coupon: any, index: number) => (
                                                        <div key={index} className="flex items-center justify-between gap-2 p-2 bg-[#050014] rounded">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs">{coupon.code}</span>
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                    coupon.active ? 'text-green-300 bg-green-900/40' : 'text-red-300 bg-red-900/40'
                                                                }`}>
                                                                    {coupon.active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => updateCouponStatus(user.influencerId, coupon._id, !coupon.active)}
                                                                    className={`text-xs px-2 py-1 border ${
                                                                        coupon.active 
                                                                            ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                                                                            : 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                                                    }`}
                                                                >
                                                                    {coupon.active ? 'Deactivate' : 'Activate'}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => deleteCoupon(user.influencerId, coupon._id)}
                                                                    className="text-xs px-2 py-1"
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-yellow-400">No Coupons</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {!user.hasProfile ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setupInfluencerProfile(user)}
                                                        className="bg-purple-600 hover:bg-purple-700"
                                                    >
                                                        Create Coupon
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => createCouponForInfluencer(user)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            Create Coupon
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => viewDashboard(user)}
                                                            className="text-purple-200 hover:bg-purple-900/40"
                                                        >
                                                            View
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => makeCustomer(user)}
                                                    className="ml-2"
                                                >
                                                    Make Customer
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Influencer Dialog */}
            <Dialog open={showCreateInfluencer} onOpenChange={setShowCreateInfluencer}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Setup Influencer Profile</DialogTitle>
                        <DialogDescription className="text-purple-300/80">
                            Configure coupon code, commission rates, and other settings for this influencer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="customer@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                value={formData.couponCode}
                                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white font-mono"
                                placeholder="JOHN10"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Customer Discount Type</label>
                            <select
                                value={formData.customerDiscountType}
                                onChange={(e) => setFormData({ ...formData, customerDiscountType: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                            >
                                <option value="flat">Flat Amount</option>
                                <option value="percentage">Percentage</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Customer Discount Value</label>
                            <input
                                type="number"
                                value={formData.customerDiscountValue}
                                onChange={(e) => setFormData({ ...formData, customerDiscountValue: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="10"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Commission Percentage</label>
                            <input
                                type="number"
                                value={formData.commissionPercentage}
                                onChange={(e) => setFormData({ ...formData, commissionPercentage: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="5"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Validity Type</label>
                            <select
                                value={formData.validityType}
                                onChange={(e) => {
                                    const newValidityType = e.target.value;
                                    setFormData({ 
                                        ...formData, 
                                        validityType: newValidityType,
                                        expiryDate: newValidityType === 'unlimited' ? '2099-12-31T23:59' : formData.expiryDate
                                    });
                                }}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                            >
                                <option value="unlimited">Unlimited</option>
                                <option value="limited">Limited</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Expiry Date</label>
                            <input
                                type="datetime-local"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                readOnly={formData.validityType === 'unlimited'}
                            />
                        </div>
                        {formData.validityType === 'limited' && (
                            <div>
                                <label className="block text-sm font-medium text-purple-200 mb-1">Total Usage Limit</label>
                                <input
                                    type="number"
                                    value={formData.totalUsageLimit}
                                    onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                    placeholder="1000"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Per User Limit</label>
                            <input
                                type="number"
                                value={formData.perUserLimit}
                                onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="1"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.showOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, showOrderAmount: e.target.checked })}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-purple-200">Show Order Purchase Amount to Influencer</span>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreateInfluencer(false)}>Cancel</Button>
                        <Button onClick={createInfluencer} className="bg-purple-600 hover:bg-purple-700">
                            Create Influencer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Influencer Dashboard Dialog */}
            <Dialog open={!!selectedInfluencer} onOpenChange={() => setSelectedInfluencer(null)}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50 max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Influencer Dashboard</DialogTitle>
                    </DialogHeader>
                    {selectedInfluencer && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#050014] p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white mb-2">Influencer Info</h3>
                                    <p className="text-purple-200"><strong>Name:</strong> {selectedInfluencer.user?.name || 'N/A'}</p>
                                    <p className="text-purple-200"><strong>Email:</strong> {selectedInfluencer.user?.email || 'N/A'}</p>
                                    <p className="text-purple-200"><strong>Coupon Codes:</strong></p>
                                    {selectedInfluencer.coupons && selectedInfluencer.coupons.length > 0 ? (
                                        <div className="space-y-2 mt-2">
                                            {selectedInfluencer.coupons.map((coupon: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <span className="font-mono">{coupon.code}</span>
                                                    <span className="text-sm text-purple-300">({coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`} off)</span>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        coupon.active ? 'text-green-300 bg-green-900/40' : 'text-red-300 bg-red-900/40'
                                                    }`}>
                                                        {coupon.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-purple-300">No coupons</span>
                                    )}
                                </div>
                                <div className="bg-[#050014] p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white mb-2">Earnings & Stats</h3>
                                    <p className="text-purple-200"><strong>Total Orders:</strong> {selectedInfluencer.stats?.totalOrders || 0}</p>
                                    <p className="text-purple-200"><strong>Total Commission:</strong> ₹{(selectedInfluencer.stats?.totalCommissionEarned || 0).toFixed(2)}</p>
                                    <p className="text-purple-200"><strong>Today Commission:</strong> ₹{(selectedInfluencer.stats?.todayCommission || 0).toFixed(2)}</p>
                                    <p className="text-purple-200"><strong>This Month Commission:</strong> ₹{(selectedInfluencer.stats?.thisMonthCommission || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Order-wise Details</h3>
                                <div className="bg-[#050014] rounded-lg overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#03000a] border-b border-purple-700/40">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Order ID</th>
                                                {selectedInfluencer.showOrderAmount && (
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Order Amount</th>
                                                )}
                                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Commission Earned</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Order Status</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedInfluencer.orders && selectedInfluencer.orders.length > 0 ? selectedInfluencer.orders.map((order: any) => (
                                                <tr key={order._id} className="border-b border-purple-700/20">
                                                    <td className="px-4 py-3 text-sm text-white font-mono">{order._id}</td>
                                                    {selectedInfluencer.showOrderAmount && (
                                                        <td className="px-4 py-3 text-sm text-purple-200">₹{order.total?.toFixed(2) || 'N/A'}</td>
                                                    )}
                                                    <td className="px-4 py-3 text-sm text-green-400 font-semibold">₹{order.commissionAmount?.toFixed(2) || '0.00'}</td>
                                                    <td className="px-4 py-3 text-sm text-purple-200">{order.status}</td>
                                                    <td className="px-4 py-3 text-sm text-purple-200">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={selectedInfluencer.showOrderAmount ? 5 : 4} className="px-4 py-8 text-center text-purple-200/70">
                                                        No orders found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Coupon Dialog */}
            <Dialog open={showCreateCoupon} onOpenChange={(open) => {
                setShowCreateCoupon(open);
                if (!open) {
                    setSelectedInfluencerForCoupon(null);
                }
            }}>
                <DialogContent className="bg-[#07001b] border border-purple-800/60 text-purple-50 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-purple-100">Create Coupon for {selectedInfluencerForCoupon ? (selectedInfluencerForCoupon.name || selectedInfluencerForCoupon.email) : 'Influencer'}</DialogTitle>
                        <DialogDescription className="text-purple-300/80">
                            Create a new coupon code for this influencer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-purple-200 mb-1">Coupon Usage Type</label>
                            <select
                                value={couponFormData.couponUsageType}
                                onChange={(e) => setCouponFormData({ ...couponFormData, couponUsageType: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                            >
                                <option value="unlimited">Unlimited Coupon</option>
                                <option value="limited">Limited Coupon</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                value={couponFormData.couponCode}
                                onChange={(e) => setCouponFormData({ ...couponFormData, couponCode: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white font-mono"
                                placeholder="SUMMER10"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Discount Type</label>
                            <select
                                value={couponFormData.discountType}
                                onChange={(e) => setCouponFormData({ ...couponFormData, discountType: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="flat">Flat Amount</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Discount Value</label>
                            <input
                                type="number"
                                value={couponFormData.discountValue}
                                onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder={couponFormData.discountType === 'percentage' ? '10' : '50'}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Minimum Order Value</label>
                            <input
                                type="number"
                                value={couponFormData.minOrderValue}
                                onChange={(e) => setCouponFormData({ ...couponFormData, minOrderValue: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Maximum Discount (Optional)</label>
                            <input
                                type="number"
                                value={couponFormData.maxDiscount}
                                onChange={(e) => setCouponFormData({ ...couponFormData, maxDiscount: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="500"
                            />
                        </div>
                        {couponFormData.couponUsageType === 'limited' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-1">Total Usage Limit</label>
                                    <input
                                        type="number"
                                        value={couponFormData.totalUsageLimit}
                                        onChange={(e) => setCouponFormData({ ...couponFormData, totalUsageLimit: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                        placeholder="100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-purple-200 mb-1">Expiry Date</label>
                                    <input
                                        type="datetime-local"
                                        value={couponFormData.expiryDate}
                                        onChange={(e) => setCouponFormData({ ...couponFormData, expiryDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Per User Usage Limit</label>
                            <input
                                type="number"
                                value={couponFormData.perUserLimit}
                                onChange={(e) => setCouponFormData({ ...couponFormData, perUserLimit: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Commission Percentage</label>
                            <input
                                type="number"
                                value={couponFormData.commissionPercentage}
                                onChange={(e) => setCouponFormData({ ...couponFormData, commissionPercentage: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                                placeholder="5"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-1">Status</label>
                            <select
                                value={couponFormData.status}
                                onChange={(e) => setCouponFormData({ ...couponFormData, status: e.target.value })}
                                className="w-full px-3 py-2 bg-[#050014] border border-purple-600 rounded text-white"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" className="bg-transparent border-purple-600 text-purple-200 hover:bg-purple-900/40">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button onClick={createCoupon} className="bg-purple-600 hover:bg-purple-700">
                            Create Coupon
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* -------------- CUSTOMERS MANAGER -------------- */

function CustomersManager() {
    const { apiFetch, user } = useAuthContext();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            // Fetch only customer users
            const res = await apiFetch('/api/admin/users');
            const data = await res.json();
            // Filter only customers and normalize array
            const customers = Array.isArray(data) ? data.filter((u: any) => u.role === 'customer') : [];
            setUsers(customers);
        } catch (e) {
            console.error('Could not load customers', e);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;
        try {
            const res = await apiFetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await loadUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete customer');
            }
        } catch (e) {
            console.error('Error deleting customer', e);
            alert('Failed to delete customer');
        }
    };

    // Only admin can manage customers
    if (user?.role !== 'admin') {
        return (
            <div className="text-center py-8">
                <p className="text-purple-200">Access denied. Admin privileges required.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Customer Management</h2>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-purple-200">Loading customers...</p>
                </div>
            ) : (
                <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl overflow-x-auto">
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
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white bg-orange-600">
                                            Customer
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-purple-300">
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => alert('View profile not implemented')}>
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => deleteUser(u._id)}
                                                className="text-xs"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* -------------- WAITING CUSTOMERS MANAGER -------------- */

function WaitingCustomersManager() {
    const { apiFetch } = useAuthContext();
    const [waitingCustomers, setWaitingCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWaitingCustomers();
    }, []);

    const loadWaitingCustomers = async () => {
        try {
            const res = await apiFetch('/api/waiting-customers');
            if (res.ok) {
                const data = await res.json();
                setWaitingCustomers(data);
            }
        } catch (e) {
            console.error('Failed to load waiting customers', e);
        } finally {
            setLoading(false);
        }
    };

    const deleteWaitingCustomer = async (id: string) => {
        if (!confirm('Are you sure you want to delete this waiting customer?')) return;
        try {
            const res = await apiFetch(`/api/waiting-customers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setWaitingCustomers(prev => prev.filter(c => c._id !== id));
            }
        } catch (e) {
            console.error('Failed to delete waiting customer', e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#0b021c] border border-purple-700/40 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-purple-200 mb-4">Waiting Customers</h2>
                <p className="text-purple-300/80 mb-4">
                    Customers who have requested notifications when delivery becomes available in their area.
                </p>
                
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-purple-200">Loading waiting customers...</p>
                    </div>
                ) : waitingCustomers.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-purple-200">No waiting customers yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#07001b] border-b border-purple-700/40">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Phone</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">WhatsApp</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">District</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Address</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Items</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-purple-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {waitingCustomers.map((customer) => (
                                    <tr key={customer._id} className="border-b border-purple-700/20">
                                        <td className="px-4 py-3 text-sm text-white">{customer.name}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">{customer.phone}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">{customer.whatsappNumber}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">{customer.district}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">{customer.address}</td>
                                        <td className="px-4 py-3 text-sm text-purple-200">
                                            {customer.items?.length > 0 ? 
                                                customer.items.map((item: any, i: number) => (
                                                    <div key={i} className="text-xs">{item.name} x{item.quantity}</div>
                                                )) : 
                                                'N/A'
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-sm text-purple-300">
                                            {new Date(customer.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => deleteWaitingCustomer(customer._id)}
                                                className="text-xs"
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}


