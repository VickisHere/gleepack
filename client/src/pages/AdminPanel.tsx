// AdminPanel.tsx - Product Management Only
// Keeps only product management functionality - all other admin features removed

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import DBADashboard from './DBADashboard';
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
import { Menu, X } from 'lucide-react';

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

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        try {
            const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:3000`;
            const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
            socketRef.current = socket;
            socket.on('connect', () => console.debug('socket connected', socket.id));
            socket.on('connect_error', (err) => console.warn('socket connect_error', err));
        } catch (e) {
            console.warn('Socket connection failed', e);
        }

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [token]);

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050014] text-purple-100">
                Please sign in as admin to view the admin panel.
            </div>
        );
    }

    // Render the DBA dashboard for admin so admin has same UI and functionality
    return <DBADashboard />;
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
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        load();
    }, []);

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
        const res = await apiFetch(`/api/products/${productId}/image`, {
            method: 'POST',
            body: JSON.stringify({ filename, data: dataUrl }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Upload failed');
        const json = await res.json();
        return json.url;
    };

    const handleCreate = async () => {
        try {
            const payload = Object.assign({}, form, { items, addons });
            console.debug('Creating product payload:', payload);
            const res = await apiFetch('/api/products', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                let errorData: any = {};
                try {
                    errorData = JSON.parse(text || '{}');
                } catch (e) {
                    errorData = { raw: text };
                }
                console.error('Create product failed', res.status, errorData);
                alert(errorData.error || `Failed to create product (${res.status})`);
                return;
            }
            const created = await res.json();
            // if file selected, upload it and update product image
            if (uploadFile) {
                try {
                    const url = await uploadImage(created.id || created._id, uploadFile);
                    await apiFetch(`/api/products/${created.id || created._id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ image: url })
                    });
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
            const res = await apiFetch(`/api/products/${editingId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const status = res.status;
                const text = await res.text().catch(() => '');
                let errorData: any = {};
                try { errorData = JSON.parse(text || '{}'); } catch (e) { errorData = { raw: text }; }
                console.error('Update product failed', status, errorData);

                if (status === 404) {
                    try {
                        const refresh = await apiFetch('/api/products');
                        if (refresh.ok) {
                            const list = await refresh.json();
                            const found = list.find((x: any) => (x.id || x._id) === (editingId));
                            if (found && String(found.name || '') === String(payload.name || '')) {
                                setProducts((s) => s.map((p) => (p.id === (found.id || found._id) ? found : p)));
                                setForm({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' });
                                setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
                                setAddons([{ id: 'extra-cake', icon: '🍰', name: 'Extra Cake', nameHi: 'अतिरिक्त केक', price: 200 }, { id: 'photo-frame', icon: '🖼️', name: 'Photo Frame', nameHi: 'फोटो फ्रेम', price: 150 }, { id: 'candle-set', icon: '🕯️', name: 'Candle Set', nameHi: 'मोमबत्ती सेट', price: 100 }]);
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
                    const r2 = await apiFetch(`/api/products/${editingId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ image: url })
                    });
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
                            <Button variant="ghost" onClick={() => {
                                setEditingId(null);
                                setForm({ id: '', name: '', nameHi: '', category: 'birthday', tier: 'basic', price: 0, originalPrice: 0, idealGuests: '', description: '', descriptionHi: '', image: '' });
                                setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
                                setAddons([{ id: 'extra-cake', icon: '🍰', name: 'Extra Cake', nameHi: 'अतिरिक्त केक', price: 200 }, { id: 'photo-frame', icon: '🖼️', name: 'Photo Frame', nameHi: 'फोटो फ्रेम', price: 150 }, { id: 'candle-set', icon: '🕯️', name: 'Candle Set', nameHi: 'मोमबत्ती सेट', price: 100 }]);
                                setUploadFile(null);
                            }}>Cancel</Button>
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


