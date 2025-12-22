import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CreditCard, Banknote, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';

const Checkout = () => {
  const { language, t } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    flatNo: '',
    area: '',
    landmark: '',
    addressType: 'home',
    pincode: '',
    district: '',
    date: '',
    payment: 'cod'
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [showAddressOptions, setShowAddressOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { apiFetch, token, user } = useAuthContext();

  useEffect(() => {
    if (token && user) {
      // Load saved addresses
      (async () => {
        try {
          const res = await apiFetch('/api/profile');
          if (res.ok) {
            const profile = await res.json();
            setSavedAddresses(profile.addresses || []);
            if (profile.addresses && profile.addresses.length > 0 && selectedAddress === null) {
              setSelectedAddress('0');
            }
          }
        } catch (e) {
          console.error('Failed to load addresses', e);
        }
      })();
    }
  }, [token, user, apiFetch]);

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value;
    setFormData({ ...formData, pincode: pin });
    if (pin.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data[0].Status === 'Success') {
          setFormData(prev => ({ ...prev, district: data[0].PostOffice[0].District }));
        } else {
          setFormData(prev => ({ ...prev, district: '' }));
        }
      } catch (e) {
        console.error('Failed to fetch district', e);
        setFormData(prev => ({ ...prev, district: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, district: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentAddress = selectedAddress !== null ? savedAddresses[parseInt(selectedAddress)] : formData;
    
    if (!formData.name || !formData.phone || !currentAddress.flatNo || !currentAddress.area || !formData.date) {
      toast.error(language === 'en' ? 'Please fill all required fields' : 'कृपया सभी आवश्यक फ़ील्ड भरें');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        contact: { 
          name: formData.name, 
          phone: formData.phone, 
          flatNo: currentAddress.flatNo,
          area: currentAddress.area,
          address: `${currentAddress.flatNo}, ${currentAddress.area}${currentAddress.district ? `, ${currentAddress.district}` : ''}${currentAddress.pincode ? `, ${currentAddress.pincode}` : ''}`, 
          landmark: currentAddress.landmark,
          addressType: currentAddress.addressType,
          pincode: currentAddress.pincode,
          district: currentAddress.district
        },
        items,
        total: totalPrice,
        deliveryDate: formData.date,
        payment: formData.payment,
      };

      // COD flow: create order directly
      if (formData.payment === 'cod') {
        let res;
        if (token && apiFetch) {
          res = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(orderPayload) });
        } else {
          res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.error || 'Order failed');
          setIsSubmitting(false);
          return;
        }
        const saved = await res.json();
        clearCart();
        toast.success(t('checkout.success'));
        
        // Save address if new
        if (selectedAddress === null && token) {
          const addressToSave = {
            flatNo: formData.flatNo,
            area: formData.area,
            landmark: formData.landmark,
            addressType: formData.addressType,
            pincode: formData.pincode,
            district: formData.district
          };
          const updatedAddresses = [...savedAddresses, addressToSave];
          try {
            await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ addresses: updatedAddresses }) });
            setSavedAddresses(updatedAddresses);
            setSelectedAddress(String(updatedAddresses.length - 1));
          } catch (e) {
            console.error('Failed to save address', e);
          }
        }
        
        navigate('/');
        return;
      }

      // Online payment flow: request a Razorpay order then open checkout
      // Create a Razorpay order on the server
      const rpRes = apiFetch ? await apiFetch('/api/payments/razorpay/order', { method: 'POST', body: JSON.stringify({ amount: totalPrice }) }) : await fetch('/api/payments/razorpay/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: totalPrice }) });
      if (!rpRes.ok) {
        const body = await rpRes.json().catch(() => ({}));
        toast.error(body.error || 'Payment initialization failed');
        setIsSubmitting(false);
        return;
      }
      const rp = await rpRes.json();

      // Load Razorpay script
      await new Promise<void>((resolve, reject) => {
        const id = 'razorpay-script';
        if (document.getElementById(id)) return resolve();
        const script = document.createElement('script');
        script.id = id;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay script load failed'));
        document.body.appendChild(script);
      });

      const options: any = {
        key: rp.keyId,
        amount: rp.amount,
        currency: rp.currency,
        name: 'Gleepack',
        description: 'Order payment',
        order_id: rp.orderId,
        handler: async function (response: any) {
          // verify on server and create order record
          try {
            const verifyRes = apiFetch ? await apiFetch('/api/payments/razorpay/verify', { method: 'POST', body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderPayload }) }) : await fetch('/api/payments/razorpay/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderPayload }) });
            if (!verifyRes.ok) {
              const body = await verifyRes.json().catch(() => ({}));
              toast.error(body.error || 'Payment verification failed');
              setIsSubmitting(false);
              return;
            }
            const body = await verifyRes.json();
            clearCart();
            toast.success(t('checkout.success'));
            
            // Save address if new
            if (selectedAddress === null && token) {
              const addressToSave = {
                flatNo: formData.flatNo,
                area: formData.area,
                landmark: formData.landmark,
                addressType: formData.addressType,
                pincode: formData.pincode,
                district: formData.district
              };
              const updatedAddresses = [...savedAddresses, addressToSave];
              try {
                await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ addresses: updatedAddresses }) });
                setSavedAddresses(updatedAddresses);
                setSelectedAddress(String(updatedAddresses.length - 1));
              } catch (e) {
                console.error('Failed to save address', e);
              }
            }
            
            navigate('/');
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: { name: formData.name, contact: formData.phone },
        theme: { color: '#6b21a8' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Order failed');
    } finally {
      // if online flow hasn't completed yet, keep isSubmitting until handler finishes
      if (formData.payment === 'cod') setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <h1 className="font-display text-2xl md:text-3xl 2xl:text-4xl font-bold mb-8">{t('checkout.title')}</h1>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="card-festive p-6">
                <h3 className="font-display text-lg font-semibold mb-4">
                  {language === 'en' ? 'Contact Details' : 'संपर्क विवरण'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">{language === 'en' ? 'Full Name' : 'पूरा नाम'} *</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div>
                    <Label htmlFor="phone">{language === 'en' ? 'Phone Number' : 'फ़ोन नंबर'} *</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="card-festive p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('checkout.address')}
                </h3>
                <div className="space-y-4">
                  {token && savedAddresses.length > 0 ? (
                    <>
                      {/* Current Address Display */}
                      <div className="p-4 border rounded-lg bg-secondary/10">
                        <p className="font-medium">
                          {savedAddresses[parseInt(selectedAddress || '0')].flatNo}, {savedAddresses[parseInt(selectedAddress || '0')].area}
                          {savedAddresses[parseInt(selectedAddress || '0')].district ? `, ${savedAddresses[parseInt(selectedAddress || '0')].district}` : ''}
                          {savedAddresses[parseInt(selectedAddress || '0')].pincode ? ` - ${savedAddresses[parseInt(selectedAddress || '0')].pincode}` : ''}
                        </p>
                        {savedAddresses[parseInt(selectedAddress || '0')].landmark && <p className="text-sm text-muted-foreground">{savedAddresses[parseInt(selectedAddress || '0')].landmark}</p>}
                        <p className="text-sm text-muted-foreground capitalize">{savedAddresses[parseInt(selectedAddress || '0')].addressType}</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setShowAddressOptions(!showAddressOptions)}>
                        {showAddressOptions ? (language === 'en' ? 'Cancel' : 'रद्द करें') : (language === 'en' ? 'Change Address' : 'पता बदलें')}
                      </Button>
                      {showAddressOptions && (
                        <div className="space-y-2 mt-4">
                          {savedAddresses.map((addr: any, idx: number) => (
                            <label key={idx} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-secondary/10">
                              <input
                                type="radio"
                                name="savedAddress"
                                value={idx}
                                checked={selectedAddress === String(idx)}
                                onChange={() => {
                                  setSelectedAddress(String(idx));
                                  setShowAddressOptions(false);
                                }}
                              />
                              <div>
                                <p className="font-medium">{addr.flatNo}, {addr.area}{addr.district ? `, ${addr.district}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}</p>
                                {addr.landmark && <p className="text-sm text-muted-foreground">{addr.landmark}</p>}
                                <p className="text-sm text-muted-foreground capitalize">{addr.addressType}</p>
                              </div>
                            </label>
                          ))}
                          <Button type="button" variant="outline" onClick={() => { setShowNewAddress(true); setShowAddressOptions(false); }}>
                            {language === 'en' ? 'Add New Address' : 'नया पता जोड़ें'}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="flatNo">{language === 'en' ? 'Flat/House No.' : 'फ्लैट/घर संख्या'} *</Label>
                        <Input id="flatNo" value={formData.flatNo} onChange={e => setFormData({...formData, flatNo: e.target.value})} required />
                      </div>
                      <div>
                        <Label htmlFor="area">{language === 'en' ? 'Area/Locality' : 'क्षेत्र/स्थानीयता'} *</Label>
                        <Input id="area" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required />
                      </div>
                      <div>
                        <Label htmlFor="landmark">{language === 'en' ? 'Landmark' : 'सीमाचिह्न'}</Label>
                        <Input id="landmark" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="pincode">{language === 'en' ? 'Pincode' : 'पिनकोड'} *</Label>
                        <Input id="pincode" value={formData.pincode} onChange={handlePincodeChange} required />
                      </div>
                      <div>
                        <Label htmlFor="district">{language === 'en' ? 'District' : 'जिला'}</Label>
                        <Input id="district" value={formData.district} readOnly />
                      </div>
                      <div>
                        <Label htmlFor="addressType">{language === 'en' ? 'Address Type' : 'पते का प्रकार'}</Label>
                        <select id="addressType" value={formData.addressType} onChange={e => setFormData({...formData, addressType: e.target.value})} className="p-2 border border-border rounded w-full">
                          <option value="home">{language === 'en' ? 'Home' : 'घर'}</option>
                          <option value="work">{language === 'en' ? 'Work' : 'कार्य'}</option>
                        </select>
                      </div>
                    </>
                  )}
                  {showNewAddress && (
                    <>
                      <div>
                        <Label htmlFor="flatNo">{language === 'en' ? 'Flat/House No.' : 'फ्लैट/घर संख्या'} *</Label>
                        <Input id="flatNo" value={formData.flatNo} onChange={e => setFormData({...formData, flatNo: e.target.value})} required />
                      </div>
                      <div>
                        <Label htmlFor="area">{language === 'en' ? 'Area/Locality' : 'क्षेत्र/स्थानीयता'} *</Label>
                        <Input id="area" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} required />
                      </div>
                      <div>
                        <Label htmlFor="landmark">{language === 'en' ? 'Landmark' : 'सीमाचिह्न'}</Label>
                        <Input id="landmark" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="pincode">{language === 'en' ? 'Pincode' : 'पिनकोड'} *</Label>
                        <Input id="pincode" value={formData.pincode} onChange={handlePincodeChange} required />
                      </div>
                      <div>
                        <Label htmlFor="district">{language === 'en' ? 'District' : 'जिला'}</Label>
                        <Input id="district" value={formData.district} readOnly />
                      </div>
                      <div>
                        <Label htmlFor="addressType">{language === 'en' ? 'Address Type' : 'पते का प्रकार'}</Label>
                        <select id="addressType" value={formData.addressType} onChange={e => setFormData({...formData, addressType: e.target.value})} className="p-2 border border-border rounded w-full">
                          <option value="home">{language === 'en' ? 'Home' : 'घर'}</option>
                          <option value="work">{language === 'en' ? 'Work' : 'कार्य'}</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" onClick={async () => {
                          if (!formData.flatNo || !formData.area) {
                            toast.error(language === 'en' ? 'Please fill address fields' : 'कृपया पता फ़ील्ड भरें');
                            return;
                          }
                          const addressToSave = {
                            flatNo: formData.flatNo,
                            area: formData.area,
                            landmark: formData.landmark,
                            addressType: formData.addressType,
                            pincode: formData.pincode,
                            district: formData.district
                          };
                          const updatedAddresses = [...savedAddresses, addressToSave];
                          try {
                            await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ addresses: updatedAddresses }) });
                            setSavedAddresses(updatedAddresses);
                            setSelectedAddress(String(updatedAddresses.length - 1));
                            setShowNewAddress(false);
                            setShowAddressOptions(false);
                          } catch (e) {
                            console.error('Failed to save address', e);
                          }
                        }}>
                          {language === 'en' ? 'Save & Use Address' : 'पता सेव करें और इस्तेमाल करें'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => { setShowNewAddress(false); setShowAddressOptions(true); }}>
                          {language === 'en' ? 'Cancel' : 'रद्द करें'}
                        </Button>
                      </div>
                    </>
                  )}
                  <div className="bg-secondary/20 text-sm p-3 rounded-lg">
                    📍 {language === 'en' ? 'Delivery available in your area' : 'आपके क्षेत्र में डिलीवरी उपलब्ध'}
                  </div>
                </div>
              </div>

              {/* Delivery Date */}
              <div className="card-festive p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('checkout.date')}
                </h3>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} min={new Date().toISOString().split('T')[0]} required />
              </div>

              {/* Payment */}
              <div className="card-festive p-6">
                <h3 className="font-display text-lg font-semibold mb-4">{t('checkout.payment')}</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${formData.payment === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input type="radio" name="payment" value="cod" checked={formData.payment === 'cod'} onChange={e => setFormData({...formData, payment: e.target.value})} className="sr-only" />
                    <Banknote className="h-5 w-5" />
                    <span className="font-medium">{t('checkout.cod')}</span>
                    {formData.payment === 'cod' && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${formData.payment === 'upi' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input type="radio" name="payment" value="upi" checked={formData.payment === 'upi'} onChange={e => setFormData({...formData, payment: e.target.value})} className="sr-only" />
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">{t('checkout.upi')}</span>
                    {formData.payment === 'upi' && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="card-festive p-6 sticky top-24">
                <h3 className="font-display text-lg font-semibold mb-4">
                  {language === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
                </h3>
                <div className="space-y-3 border-b border-border pb-4 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{language === 'en' ? item.name : item.nameHi} x{item.quantity}</span>
                      <span>₹{(item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                </div>
                <div className="flex justify-between text-xl font-bold mb-6">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary">₹{totalPrice}</span>
                </div>
                <Button type="submit" size="lg" className="w-full btn-festive" disabled={isSubmitting}>
                  {isSubmitting ? (language === 'en' ? 'Placing Order...' : 'ऑर्डर हो रहा है...') : t('checkout.place')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
