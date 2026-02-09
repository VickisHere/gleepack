import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { toast } from 'sonner';
import { Mail, User as UserIcon, LogOut, ShoppingBag } from 'lucide-react';

const Profile = () => {
  const { apiFetch, user, logout, isAuthenticated, openAuthModal } = useAuthContext();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<{ 
    id?: string; 
    email?: string; 
    name?: string;
    phone?: string;
    addresses?: any[];
  } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    
    setLoading(true);
    Promise.all([
      apiFetch('/api/profile').then(r => r.json()),
      apiFetch('/api/orders').then(r => r.json())
    ])
      .then(([profileData, ordersData]) => {
        setProfile(profileData);
        setOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
      })
      .catch(() => {
        setProfile(null);
        toast.error(language === 'en' ? 'Failed to load profile' : 'प्रोफ़ाइल लोड करने में विफल');
      })
      .finally(() => setLoading(false));
  }, [apiFetch, isAuthenticated, navigate, language]);

  const handleSave = async () => {
    if (!apiFetch || !profile) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/profile', { 
        method: 'PUT', 
        body: JSON.stringify({ 
          name: profile.name,
          phone: profile.phone 
        }) 
      });
      const data = await res.json();
      // Merge response with existing profile to preserve all fields
      setProfile(prev => prev ? { ...prev, ...data } : data);
      toast.success(language === 'en' ? 'Profile updated successfully!' : 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!');
    } catch (err) {
      console.error(err);
      toast.error(language === 'en' ? 'Failed to update profile' : 'प्रोफ़ाइल अपडेट करने में विफल');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success(language === 'en' ? 'Logged out successfully' : 'सफलतापूर्वक लॉग आउट हो गए');
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">{language === 'en' ? 'Please log in to view your profile' : 'प्रोफ़ाइल देखने के लिए कृपया लॉगिन करें'}</h2>
          <Button onClick={() => openAuthModal()}>
            {language === 'en' ? 'Go to Login' : 'लॉगिन पर जाएं'}
          </Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message={language === 'en' ? 'Loading profile...' : 'प्रोफ़ाइल लोड हो रही है...'} />
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="section-padding container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">{language === 'en' ? 'Unable to load profile' : 'प्रोफ़ाइल लोड करने में असमर्थ'}</h2>
          <Button onClick={() => navigate('/')}>
            {language === 'en' ? 'Go Home' : 'होम पर जाएं'}
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-custom max-w-6xl">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
            {language === 'en' ? 'My Profile' : 'मेरी प्रोफ़ाइल'}
          </h1>

          {/* Left & Right: User Info & Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* LEFT: User Information */}
            <div className="space-y-6">
              <div className="p-6 md:p-8 border border-border rounded-xl bg-card">
                <h2 className="font-display text-xl md:text-2xl font-semibold mb-6">
                  {language === 'en' ? 'Account Information' : 'खाता जानकारी'}
                </h2>

                <div className="space-y-6">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4" />
                      {language === 'en' ? 'Email Address' : 'ईमेल पता'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'en' ? 'Email cannot be changed' : 'ईमेल नहीं बदला जा सकता'}
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <UserIcon className="h-4 w-4" />
                      {language === 'en' ? 'Full Name' : 'पूरा नाम'}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={profile?.name || ''}
                      onChange={(e) => setProfile({ ...profile!, name: e.target.value })}
                      placeholder={language === 'en' ? 'Enter your full name' : 'अपना पूरा नाम दर्ज करें'}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone" className="mb-2 block">
                      {language === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile?.phone || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setProfile({ ...profile!, phone: value });
                        }
                      }}
                      placeholder={language === 'en' ? '10-digit phone number' : '10 अंकों का फ़ोन नंबर'}
                      maxLength={10}
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full btn-festive py-3 text-base font-semibold"
                    >
                      {saving
                        ? (language === 'en' ? 'Saving...' : 'सहेज रहे हैं...')
                        : (language === 'en' ? 'Save Changes' : 'परिवर्तन सहेजें')
                      }
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Recent Orders */}
            <div className="p-6 md:p-8 border border-border rounded-xl bg-card h-fit">
              <h2 className="font-display text-xl md:text-2xl font-semibold mb-6 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {language === 'en' ? 'Recent Orders' : 'हालिया आदेश'}
              </h2>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <div
                      key={order._id}
                      onClick={() => navigate(`/orders/${order._id}`)}
                      className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {language === 'en' ? 'Order' : 'ऑर्डर'} #{String(order._id).slice(-6)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">₹{order.total}</p>
                          <p className={`text-xs font-medium ${
                            order.status === 'delivered' ? 'text-green-600' :
                            order.status === 'cancelled' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {order.status?.replace(/_/g, ' ') || 'Pending'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {(order.items || []).map((i: any) => i.name).join(', ')}
                      </p>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate('/orders')}
                  >
                    {language === 'en' ? 'View All Orders' : 'सभी ऑर्डर देखें'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'No orders yet' : 'अभी कोई ऑर्डर नहीं'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate('/kits')}
                  >
                    {language === 'en' ? 'Start Shopping' : 'खरीदारी शुरू करें'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM: Logout Section - Full Width */}
          <div className="p-6 md:p-8 border border-red-200 rounded-xl bg-red-50 dark:bg-red-950/20">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-4 flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              {language === 'en' ? 'Session' : 'सत्र'}
            </h3>

            <p className="text-sm text-red-800 dark:text-red-400 mb-6">
              {language === 'en'
                ? 'Log out from your account'
                : 'अपने खाते से लॉग आउट करें'}
            </p>

            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-base"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Logout' : 'लॉग आउट'}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Profile;
