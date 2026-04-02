import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import AdminLayout from './pages/Admin/AdminLayout';
import Products from './pages/Admin/Products';
import Users from './pages/Admin/Users';
import Reports from './pages/Admin/Reports';

// Admin Dashboard Home / Summary (Placeholder for now)
const AdminHome = () => (
  <div className="space-y-6">
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <h1 className="text-3xl font-black text-slate-800">Welcome, System Admin!</h1>
      <p className="text-slate-500 mt-2">Here is a quick overview of your business performance today.</p>
    </div>
    <Reports />
  </div>
);

const POS = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Cashier POS</h1>
    <p>Welcome, Cashier! Start taking orders.</p>
    <button 
      onClick={() => window.location.href = '/'} 
      className="mt-4 btn btn-primary"
    >Logout</button>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  const { role } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminHome />} />
          <Route path="products" element={<Products />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Cashier Routes */}
        <Route path="/pos/*" element={
          <ProtectedRoute allowedRole="cashier">
            <POS />
          </ProtectedRoute>
        } />

        {/* Redirect based on role if authenticated, else to login */}
        <Route path="/" element={
          role === 'admin' ? <Navigate to="/admin" replace /> :
          role === 'cashier' ? <Navigate to="/pos" replace /> :
          <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
