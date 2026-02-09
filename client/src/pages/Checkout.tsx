import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CreditCard, Banknote, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';

const Checkout = () => {
  const { language, t } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { apiFetch, token, user, isAuthenticated } = useAuthContext();

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
    time: '',
    payment: 'cod'
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [showAddressOptions, setShowAddressOptions] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(totalPrice);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Require authentication for checkout
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error(language === 'en' ? 'Please login to place an order' : 'ऑर्डर देने के लिए कृपया लॉगिन करें');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate, language]);

  // Redirect if no items
  useEffect(() => {
    if (items.length === 0) {
      navigate('/kits');
      return;
    }
  }, [items, navigate]);

  useEffect(() => {
    setFinalTotal(totalPrice - discount);
  }, [totalPrice, discount]);

  useEffect(() => {
    if (token && user) {
      // Load saved addresses
      (async () => {
        try {
          const res = await apiFetch('/api/profile');
          if (res.ok) {
            const profile = await res.json();
            const addrs = profile.addresses || [];
            setSavedAddresses(addrs);
            // Prefill name/phone from profile if available
            setFormData(prev => ({
              ...prev,
              name: prev.name || profile.name || profile.fullName || '',
              phone: prev.phone || profile.phone || profile.mobile || ''
            }));

            // Prefer an existing Saharsa address if present
            if (addrs.length > 0 && selectedAddress === null) {
              const saharsaIdx = addrs.findIndex((a: any) => (a.district || '').toLowerCase() === 'saharsa');
              if (saharsaIdx !== -1) setSelectedAddress(String(saharsaIdx));
              else setSelectedAddress('0');
            }
          }
        } catch (e) {
          console.error('Failed to load addresses', e);
        }
      })();
    }
  }, [token, user, apiFetch]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await apiFetch('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode, orderValue: totalPrice })
      });
      if (res.ok) {
        const data = await res.json();
        setAppliedCoupon(data.coupon);
        setDiscount(data.discount);
        toast.success('Coupon applied successfully!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Invalid coupon');
      }
    } catch (e) {
      console.error('Failed to apply coupon', e);
      toast.error('Failed to apply coupon');
    }
  };

  const handleDeleteAddress = async (indexToDelete: number) => {
    try {
      const updatedAddresses = savedAddresses.filter((_, idx) => idx !== indexToDelete);
      console.log('Deleting address at index:', indexToDelete, 'Remaining:', updatedAddresses);
      
      const response = await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ addresses: updatedAddresses }) });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Backend error:', error);
        toast.error(error.error || (language === 'en' ? 'Failed to delete address' : 'पता हटाने में विफल'));
        return;
      }
      
      const result = await response.json();
      console.log('Backend response after delete:', result);
      
      setSavedAddresses(result.addresses || updatedAddresses);
      
      // If deleted address was selected, select first remaining address or clear
      if (selectedAddress === String(indexToDelete)) {
        if (result.addresses && result.addresses.length > 0) {
          setSelectedAddress('0');
        } else {
          setSelectedAddress(null);
          setShowNewAddress(false);
          setShowAddressOptions(false);
        }
      } else if (parseInt(selectedAddress || '0') > indexToDelete) {
        // Adjust index if a previous address was deleted
        setSelectedAddress(String(parseInt(selectedAddress || '0') - 1));
      }
      
      toast.success(language === 'en' ? 'Address deleted successfully' : 'पता सफलतापूर्वक हटा दिया गया');
    } catch (e) {
      console.error('Failed to delete address:', e);
      toast.error(language === 'en' ? 'Failed to delete address' : 'पता हटाने में विफल');
    }
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value;
    setFormData({ ...formData, pincode: pin });
    if (pin.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === 'Success') {
          const district = data[0].PostOffice[0].District || '';
          setFormData(prev => ({ ...prev, district }));
          toast.success(language === 'en' ? `District found: ${district}` : `जिला मिला: ${district}`);
        } else {
          console.warn('Postal API: Invalid pincode or district not found');
          toast.warning(language === 'en' ? 'Could not find district for this pincode. Please enter manually.' : 'इस पिनकोड के लिए जिला नहीं मिला। कृपया मैन्युअली दर्ज करें।');
          setFormData(prev => ({ ...prev, district: '' }));
        }
      } catch (e) {
        console.error('Failed to fetch district from postal API', e);
        toast.warning(language === 'en' ? 'Could not verify pincode. Please enter district manually.' : 'पिनकोड सत्यापित नहीं हो सके। कृपया जिला मैन्युअली दर्ज करें।');
        setFormData(prev => ({ ...prev, district: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, district: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentAddress = selectedAddress !== null ? savedAddresses[parseInt(selectedAddress)] : formData;
    
    if (!formData.name || !formData.phone || !currentAddress?.flatNo || !currentAddress?.area || !currentAddress?.pincode || !currentAddress?.district || !formData.date || !formData.time) {
      toast.error(language === 'en' ? 'Please fill all required fields including pincode and district' : 'कृपया पिनकोड और जिला सहित सभी आवश्यक फ़ील्ड भरें');
      return;
    }

    // Check if booking is at least 20 minutes before event time
    const eventDateTime = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();
    const timeDiff = eventDateTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff < 20) {
      toast.error(language === 'en' ? 'Bookings must be made at least 20 minutes before the event time' : 'बुकिंग को इवेंट समय से कम से कम 20 मिनट पहले करना होगा');
      return;
    }

    // Check if district is Saharsa
    const district = currentAddress?.district || formData.district || '';
    if (district.toLowerCase() !== 'saharsa') {
      // Don't allow order, but don't show dialog - waiting list is shown below
      toast.error(language === 'en' ? 'Delivery not available in your area. Please join the waiting list below.' : 'आपके क्षेत्र में डिलीवरी उपलब्ध नहीं है। कृपया नीचे दी गई वेटिंग लिस्ट में शामिल हों।');
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
        total: finalTotal,
        totalAmount: totalPrice,
        discount: discount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        coupon: appliedCoupon ? { code: appliedCoupon.code, discount: discount } : null,
        deliveryDate: formData.date,
        deliveryTime: formData.time,
        payment: formData.payment,
      };

      // COD flow: create order directly
      if (formData.payment === 'cod') {
        const res = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(orderPayload) });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast.error(body.error || 'Order failed');
          setIsSubmitting(false);
          return;
        }
        const saved = await res.json();
        clearCart();
        toast.success(t('checkout.success'));
        
        // Apply coupon if used
        if (appliedCoupon) {
          try {
            await apiFetch('/api/coupons/apply', {
              method: 'POST',
              body: JSON.stringify({ code: appliedCoupon.code, orderId: saved._id, discount: discount })
            });
          } catch (e) {
            console.error('Failed to apply coupon usage', e);
          }
        }
        
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
      const rpRes = await apiFetch('/api/payments/razorpay/order', { method: 'POST', body: JSON.stringify({ amount: totalPrice }) });
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
            const verifyRes = await apiFetch('/api/payments/razorpay/verify', { method: 'POST', body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderPayload }) });
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

  const handleWaitingSubmit = async () => {
    const addressData = selectedAddress !== null ? savedAddresses[parseInt(selectedAddress)] : formData;
    const district = addressData?.district || formData.district || '';

    if (!district) {
      toast.error(language === 'en' ? 'Please enter your district first' : 'कृपया पहले अपना जिला दर्ज करें');
      return;
    }

    if (!whatsappNumber.trim()) {
      toast.error(language === 'en' ? 'Please enter WhatsApp number' : 'कृपया व्हाट्सएप नंबर दर्ज करें');
      return;
    }

    try {
      const res = await apiFetch('/api/waiting-customers', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name || 'Anonymous',
          phone: formData.phone || '',
          whatsappNumber: whatsappNumber,
          district: district,
          address: `${addressData?.flatNo || formData.flatNo || ''}, ${addressData?.area || formData.area || ''}${addressData?.landmark ? ', ' + addressData.landmark : ''}`.trim() || '',
          items: items
        })
      });
      if (res.ok) {
        toast.success(language === 'en' ? 'Thank you! We will notify you when delivery becomes available in your area.' : 'धन्यवाद! आपके क्षेत्र में डिलीवरी उपलब्ध होने पर हम आपको सूचित करेंगे।');
        clearCart();
        navigate('/');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to submit');
      }
    } catch (e) {
      console.error('Failed to submit waiting customer', e);
      toast.error('Failed to submit');
    }
  };

  const isFormValid = () => {
    const currentAddress = selectedAddress !== null ? savedAddresses[parseInt(selectedAddress)] : formData;
    const district = currentAddress?.district || formData.district || '';
    
    // Check if all required fields are filled
    const hasRequiredFields = formData.name &&
      formData.phone &&
      currentAddress?.flatNo &&
      currentAddress?.area &&
      formData.date &&
      formData.time;
    
    console.log('Form validation:', {
      name: !!formData.name,
      phone: !!formData.phone,
      flatNo: !!currentAddress?.flatNo,
      area: !!currentAddress?.area,
      date: !!formData.date,
      time: !!formData.time,
      hasRequiredFields
    });
    
    return hasRequiredFields;
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
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={formData.phone} 
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 10) {
                          setFormData({...formData, phone: value});
                        }
                      }} 
                      required 
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
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
                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/10">
                              <label className="flex items-center space-x-2 cursor-pointer">
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
                                <div className="ml-2">
                                  <p className="font-medium">{addr.flatNo}, {addr.area}{addr.district ? `, ${addr.district}` : ''}{addr.pincode ? ` - ${addr.pincode}` : ''}</p>
                                  {addr.landmark && <p className="text-sm text-muted-foreground">{addr.landmark}</p>}
                                  <p className="text-sm text-muted-foreground capitalize">{addr.addressType}</p>
                                </div>
                              </label>
                              <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => {
                                  // Load address into form for editing
                                  setFormData(prev => ({
                                    ...prev,
                                    flatNo: addr.flatNo || '',
                                    area: addr.area || '',
                                    landmark: addr.landmark || '',
                                    addressType: addr.addressType || 'home',
                                    pincode: addr.pincode || '',
                                    district: addr.district || ''
                                  }));
                                  setEditingIndex(idx);
                                  setShowNewAddress(true);
                                  setShowAddressOptions(false);
                                }}>
                                  {language === 'en' ? 'Edit' : 'संपादित करें'}
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setDeleteConfirmation(idx)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
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
                        <Label htmlFor="district">{language === 'en' ? 'District' : 'जिला'} *</Label>
                        <Input id="district" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder={language === 'en' ? 'Auto-filled or enter manually' : 'स्वचालित या मैनुअली दर्ज करें'} />
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
                        <Label htmlFor="district">{language === 'en' ? 'District' : 'जिला'} *</Label>
                        <Input id="district" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder={language === 'en' ? 'Auto-filled or enter manually' : 'स्वचालित या मैनुअली दर्ज करें'} />
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
                          if (!formData.flatNo || !formData.area || !formData.pincode || !formData.district) {
                            toast.error(language === 'en' ? 'Please fill all address fields (pincode is required to fetch district)' : 'कृपया सभी पता फ़ील्ड भरें (जिला प्राप्त करने के लिए पिनकोड आवश्यक है)');
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
                          try {
                            let updatedAddresses: any[] = [];
                            if (editingIndex !== null && typeof editingIndex === 'number') {
                              updatedAddresses = savedAddresses.map((a: any, i: number) => i === editingIndex ? addressToSave : a);
                            } else {
                              updatedAddresses = [...savedAddresses, addressToSave];
                            }
                            await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ addresses: updatedAddresses }) });
                            setSavedAddresses(updatedAddresses);
                            if (editingIndex !== null && typeof editingIndex === 'number') {
                              setSelectedAddress(String(editingIndex));
                            } else {
                              setSelectedAddress(String(updatedAddresses.length - 1));
                            }
                            setShowNewAddress(false);
                            setShowAddressOptions(false);
                            setEditingIndex(null);
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
                    {(() => {
                      // Check if we have a saved address selected
                      const hasSavedAddress = selectedAddress !== null && savedAddresses.length > 0;
                      const currentAddress = hasSavedAddress ? savedAddresses[parseInt(selectedAddress)] : formData;
                      
                      // Get district: if saved address, use only its district; if not saved, check form input
                      const district = hasSavedAddress ? (currentAddress?.district || '') : (formData.district || '');
                      
                      // Show "Please enter area" only if no saved address AND no form-entered district
                      if (!district) {
                        return language === 'en' ? 'Please enter your delivery area' : 'कृपया अपना डिलीवरी क्षेत्र दर्ज करें';
                      }
                      
                      // If they have a district (saved or entered), check if it's Saharsa
                      if (district.toLowerCase() === 'saharsa') {
                        return language === 'en' ? 'Delivery available in your area!' : 'आपके क्षेत्र में डिलीवरी उपलब्ध!';
                      } else {
                        return language === 'en' ? 'Available soon, stay tuned!' : 'जल्द ही उपलब्ध, बने रहें!';
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Delivery Date & Time */}
              <div className="card-festive p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {language === 'en' ? 'Event Date & Time' : 'इवेंट तारीख और समय'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium">{language === 'en' ? 'Date' : 'तारीख'} *</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      min={new Date().toISOString().split('T')[0]} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium">{language === 'en' ? 'Time' : 'समय'} *</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={formData.time} 
                      onChange={e => setFormData({...formData, time: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {language === 'en' ? 'Bookings must be made at least 20 minutes before the event time' : 'बुकिंग को इवेंट समय से कम से कम 20 मिनट पहले करना होगा'}
                </p>
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
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹{((item.price || 0) + ((item.addons || []).reduce((s, a) => s + (a.price || 0), 0))) * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  {/* Coupon Section */}
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={language === 'en' ? 'Enter coupon code' : 'कूपन कोड दर्ज करें'}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button type="button" onClick={applyCoupon} variant="outline" size="sm">
                        {language === 'en' ? 'Apply' : 'लागू करें'}
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <div className="text-sm text-green-600 mt-1">
                        {appliedCoupon.name} applied! Saved ₹{discount}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold">
                    <span>{t('cart.total')}</span>
                    <span className="text-primary">₹{finalTotal}</span>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full btn-festive" disabled={isSubmitting || !isFormValid()}>
                  {isSubmitting ? (language === 'en' ? 'Placing Order...' : 'ऑर्डर हो रहा है...') : t('checkout.place')}
                </Button>

                {/* Waiting List Section - shown when district is filled but not Saharsa */}
                {(() => {
                  const currentAddress = selectedAddress !== null ? savedAddresses[parseInt(selectedAddress)] : formData;
                  const district = currentAddress?.district || formData.district || '';
                  if (district && district.toLowerCase() !== 'saharsa') {
                    return (
                      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h3 className="font-semibold text-orange-800 mb-2">
                          {language === 'en' ? '🚀 Join Waiting List' : '🚀 वेटिंग लिस्ट में शामिल हों'}
                        </h3>
                        <p className="text-sm text-orange-700 mb-4">
                          {language === 'en' 
                            ? 'Delivery is currently available in select areas. Join our waiting list and we\'ll notify you when we expand to your area!' 
                            : 'वर्तमान में डिलीवरी चुनिंदा क्षेत्रों में उपलब्ध है। हमारी वेटिंग लिस्ट में शामिल हों और जब हम आपके क्षेत्र में विस्तार करेंगे तो हम आपको सूचित करेंगे!'
                          }
                        </p>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="waiting-whatsapp" className="text-sm font-medium">
                              {language === 'en' ? 'WhatsApp Number' : 'व्हाट्सएप नंबर'} *
                            </Label>
                            <Input 
                              id="waiting-whatsapp" 
                              type="tel" 
                              value={whatsappNumber} 
                              onChange={e => {
                                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                if (value.length <= 10) {
                                  setWhatsappNumber(value);
                                }
                              }} 
                              placeholder={language === 'en' ? 'Enter your WhatsApp number' : 'अपना व्हाट्सएप नंबर दर्ज करें'}
                              className="mt-1"
                              maxLength={10}
                              pattern="[0-9]{10}"
                            />
                          </div>
                          <Button 
                            onClick={handleWaitingSubmit} 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            disabled={!whatsappNumber.trim()}
                          >
                            {language === 'en' ? 'Join Waiting List' : 'वेटिंग लिस्ट में शामिल हों'}
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Delete Address Confirmation Modal */}
      <AlertDialog open={deleteConfirmation !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Delete Address' : 'पता हटाएं'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? 'Are you sure you want to delete this address? This action cannot be undone.' 
                : 'क्या आप निश्चित हैं कि आप इस पते को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel onClick={() => setDeleteConfirmation(null)}>
              {language === 'en' ? 'Cancel' : 'रद्द करें'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteConfirmation !== null) {
                  handleDeleteAddress(deleteConfirmation);
                  setDeleteConfirmation(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'en' ? 'Delete' : 'हटाएं'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Checkout;