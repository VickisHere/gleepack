"use client";

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InfluencerPanel() {
  const { apiFetch, user, token } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'influencer') {
      loadDashboard();
      
      // Socket for real-time updates
      try {
        const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3010`;
        const socket = io(SOCKET_URL, { auth: token ? { token } : undefined });
        socket.on('order_created', () => loadDashboard());
        socket.on('order_updated', () => loadDashboard());
        socket.on('connect_error', (err) => console.warn('socket connect_error', err));

        return () => {
          socket.disconnect();
        };
      } catch (e) {
        console.warn('Socket connection failed', e);
      }
    }
  }, [user, apiFetch, token]);

  const loadDashboard = async () => {
    try {
      setError(null);
      const res = await apiFetch('/api/influencer/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Failed to load dashboard data');
        console.error('Failed to load dashboard:', errorData);
      }
    } catch (e) {
      setError('Network error while loading dashboard');
      console.error('Error loading dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'influencer') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="max-w-md bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-red-500">
              Access denied. This page is only accessible to influencers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Influencer Dashboard</h1>
              <p className="text-purple-700 mt-1">
                Welcome, {user?.name || user?.email}
              </p>
            </div>
            <Link to="/" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Back to Home
            </Link>
          </div>
          
          <Card className="bg-red-50 border border-red-200">
            <CardContent className="p-6">
              <p className="text-center text-red-600">
                Error loading dashboard: {error}
              </p>
              <button
                onClick={loadDashboard}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Influencer Dashboard</h1>
            <p className="text-purple-700 mt-1">
              Welcome, {user?.name || user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <Link to="/" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Back to Home
            </Link>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="bg-white border border-purple-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-purple-800">Your Influencer Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Name:</strong> {user?.name || 'Not set'}
              </p>
              <p>
                <strong>Role:</strong> {user?.role}
              </p>
              <p>
                <strong>Your Coupon Codes:</strong>
              </p>
              {dashboardData?.coupons?.filter((coupon: any) => coupon.active !== false).length > 0 ? (
                <div className="space-y-2 mt-2">
                  {dashboardData.coupons.filter((coupon: any) => coupon.active !== false).map((coupon: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="font-mono text-lg font-bold text-purple-600">
                        {coupon.code}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`} off)
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {coupon.active ? 'Active' : 'Inactive'}
                      </span>
                      {coupon.active && (
                        <button
                          onClick={async () => { try { await navigator.clipboard.writeText(coupon.code); alert('Coupon code copied'); } catch (e) { console.error(e); alert('Copy failed'); } }}
                          className="px-2 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500">No active coupons</span>
              )}
              <p className="text-sm text-gray-600">
                Share this coupon code with your audience to earn commissions on their orders.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Performance */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {dashboardData?.stats?.totalOrders || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">From your coupons</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₹{(dashboardData?.stats?.totalCommissionEarned || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Commission earned</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white border border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ₹{(dashboardData?.stats?.todayCommission || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Today's earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                ₹{(dashboardData?.stats?.thisMonthCommission || 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-600 mt-1">This month's earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders with Commission */}
        {dashboardData?.orders && dashboardData.orders.length > 0 && (
          <Card className="bg-white border border-purple-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-purple-800">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.orders.slice(0, 5).map((order: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-mono text-sm text-gray-600">{order._id}</div>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">Status: {order.status}</div>
                    </div>
                    <div className="text-right">
                      {dashboardData.showOrderAmount && (
                        <div className="text-sm text-gray-700">₹{order.total?.toFixed(2) || 'N/A'}</div>
                      )}
                      <div className="text-sm font-semibold text-green-600">
                        Commission: ₹{order.commissionAmount?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
