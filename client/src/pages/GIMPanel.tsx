import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  nameHi?: string;
  category: string;
  tier: string;
  price: number;
  originalPrice?: number;
  idealGuests?: string;
  description: string;
  descriptionHi?: string;
  image?: string;
  items?: any[];
  addons?: any[];
}

export default function GIMPanel() {
  const { apiFetch, token, user } = useAuthContext();

  if (!user || (user.role !== 'admin' && user.role !== 'gim')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050014] text-purple-100">
        Access denied. Admin or GIM privileges required.
      </div>
    );
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    nameHi: '',
    category: 'birthday',
    tier: 'basic',
    price: '',
    originalPrice: '',
    idealGuests: '',
    description: '',
    descriptionHi: '',
    image: ''
  });
  const [items, setItems] = useState<any[]>([
    { icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' },
    { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' },
  ]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProducts();

    // Socket for real-time updates
    try {
      const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || `${window.location.protocol}//${window.location.hostname}:3010`;
      const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
      socket.on('product_created', (product: any) => {
        setProducts((prev) => [...prev, product]);
      });
      socket.on('product_updated', (product: any) => {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
      });
      socket.on('product_deleted', (id: string) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      });
      socket.on('connect_error', (err) => console.warn('socket connect_error', err));

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket connection failed', e);
    }
  }, [apiFetch, token]);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ 
      id: '', 
      name: '', 
      nameHi: '', 
      category: 'birthday', 
      tier: 'basic', 
      price: '', 
      originalPrice: '', 
      idealGuests: '', 
      description: '', 
      descriptionHi: '', 
      image: '' 
    });
    setItems([{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
    setUploadFile(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id || '',
      name: product.name || '',
      nameHi: product.nameHi || '',
      category: product.category || 'birthday',
      tier: product.tier || 'basic',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      idealGuests: product.idealGuests || '',
      description: product.description || '',
      descriptionHi: product.descriptionHi || '',
      image: product.image || ''
    });
    setItems(product.items && Array.isArray(product.items) && product.items.length ? product.items : [{ icon: '🎈', name: 'Balloons', nameHi: '', quantity: '25 pcs' }, { icon: '🎂', name: 'Cake', nameHi: '', quantity: '1 pc' }]);
    setUploadFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await apiFetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      id: formData.id || undefined,
      name: formData.name,
      nameHi: formData.nameHi || undefined,
      category: formData.category,
      tier: formData.tier,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      idealGuests: formData.idealGuests || undefined,
      description: formData.description,
      descriptionHi: formData.descriptionHi || undefined,
      image: formData.image || undefined,
      items: items
    };

    try {
      let res;
      if (editingProduct) {
        res = await apiFetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      } else {
        res = await apiFetch('/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      }

      if (res.ok) {
        const savedProduct = await res.json();
        
        // Handle image upload if file selected
        if (uploadFile) {
          try {
            const url = await uploadImage(savedProduct.id || savedProduct._id, uploadFile);
            await apiFetch(`/api/products/${savedProduct.id || savedProduct._id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ image: url })
            });
            savedProduct.image = url;
          } catch (uploadError) {
            console.error('Image upload failed', uploadError);
            alert('Product saved but image upload failed');
          }
        }
        
        if (editingProduct) {
          setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
        } else {
          setProducts([...products, savedProduct]);
        }
        setDialogOpen(false);
      } else {
        alert('Failed to save product');
      }
    } catch (error) {
      console.error('Failed to save product', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Gleepack Inventory Manager</h1>
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          ← Back to Home
        </a>
      </div>
      <Button onClick={handleAdd} className="mb-4">
        <Plus className="mr-2 h-4 w-4" /> Add Product
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{product.description}</p>
              <p className="font-bold">Price: ${product.price}</p>
              {product.image && <img src={product.image} alt={product.name} className="w-full h-32 object-cover mt-2" />}
              <div className="flex gap-2 mt-4">
                <Button onClick={() => handleEdit(product)} size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button onClick={() => handleDelete(product.id)} size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="id">Product ID</Label>
                  <Input
                    id="id"
                    placeholder="birthday-basic"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  />
                  <div className="text-xs text-gray-500 mt-1">Unique identifier used in URLs and references. If left blank an ID will be generated.</div>
                </div>

                <div>
                  <Label htmlFor="name">Name (EN)</Label>
                  <Input
                    id="name"
                    placeholder="Birthday Basic Kit"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nameHi">Name (Hindi)</Label>
                  <Input
                    id="nameHi"
                    placeholder="जन्मदिन बेसिक किट"
                    value={formData.nameHi}
                    onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">birthday</SelectItem>
                      <SelectItem value="anniversary">anniversary</SelectItem>
                      <SelectItem value="festival">festival</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">Used for filtering on the public site.</div>
                </div>

                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">basic</SelectItem>
                      <SelectItem value="premium">premium</SelectItem>
                      <SelectItem value="platinum">platinum</SelectItem>
                      <SelectItem value="gold">gold</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">Controls badge color (Basic / Premium / Platinum).</div>
                </div>

                <div>
                  <Label htmlFor="price">Price (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="originalPrice">Original Price</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    placeholder="1299"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="idealGuests">Ideal Guests</Label>
                  <Input
                    id="idealGuests"
                    placeholder="10-15"
                    value={formData.idealGuests}
                    onChange={(e) => setFormData({ ...formData, idealGuests: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    placeholder="/images/kits/birthday-basic.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                  <div className="text-xs text-gray-500 mt-1">If provided, this image will be used in the product card. Use full or site-relative URLs. You can also upload a file below.</div>
                </div>

                <div>
                  <Label htmlFor="uploadImage">Upload Image</Label>
                  <Input
                    id="uploadImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <div className="text-xs text-gray-500 mt-1">Choose an image to upload; it will be stored under /public/images/ and the product updated automatically.</div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description (EN)</Label>
                  <Textarea
                    id="description"
                    placeholder="Short description visible on the product card"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="descriptionHi">Description (Hindi)</Label>
                  <Textarea
                    id="descriptionHi"
                    placeholder="हिंदी विवरण"
                    value={formData.descriptionHi}
                    onChange={(e) => setFormData({ ...formData, descriptionHi: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Items</Label>
                  <div className="space-y-2 mt-2">
                    {items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                        <Input
                          placeholder="🎈"
                          value={it.icon || ''}
                          onChange={(e) => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], icon: e.target.value}; return copy; })}
                        />
                        <Input
                          placeholder="Balloons"
                          value={it.name || ''}
                          onChange={(e) => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], name: e.target.value}; return copy; })}
                        />
                        <Input
                          placeholder="25 pcs"
                          value={it.quantity || ''}
                          onChange={(e) => setItems(s => { const copy = [...s]; copy[idx] = {...copy[idx], quantity: e.target.value}; return copy; })}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setItems(s => s.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setItems(s => [...s, { icon: '', name: '', nameHi: '', quantity: '' }])}
                    >
                      Add Item
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Use the inputs to edit item icon, name and quantity. Two example rows are prefilled.</div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">{editingProduct ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}