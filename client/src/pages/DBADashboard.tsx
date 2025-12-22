import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

export default function DBADashboard() {
  const { user } = useAuthContext();

  if (!user || user.role !== 'dba') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050014] text-purple-100">
        Access denied. DBA privileges required.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050014] text-white p-6">
      <h1 className="text-2xl font-bold mb-4">DBA Dashboard</h1>
      <p className="text-sm text-purple-300 mb-6">Manage orders and delivery operations. Financial data is restricted.</p>
      <div className="mt-4">
        <Link to="/admin" className="px-4 py-2 bg-blue-600 rounded">Open Operational Panel</Link>
      </div>
    </div>
  );
}
