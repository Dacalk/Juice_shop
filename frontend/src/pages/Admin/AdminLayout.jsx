import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  BarChart3, 
  LogOut, 
  Store
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Sales Reports', path: '/admin', icon: BarChart3, exact: true },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Users', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 w-full flex flex-col overflow-x-hidden print:bg-white">
      {/* Fixed Top Header (Hide on Print) */}
      <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-50 px-8 flex items-center justify-between shadow-sm print:hidden transition-all duration-300">
        <div className="flex items-center gap-12">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md">
              <Store size={24} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">Admin Portal</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Juice Bar POS</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => 
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile & Logout (Combined) */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-1.5 pr-4 rounded-full border border-slate-200 bg-white hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all duration-300 group shadow-sm active:scale-95"
          title="Logout"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
            {user?.username?.charAt(0) || 'A'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-red-600">{user?.username || 'Admin'}</p>
            <p className="text-[9px] text-slate-400 uppercase font-black mt-1 tracking-widest flex items-center gap-1 group-hover:text-red-400">
               Click to Logout <LogOut size={10} />
            </p>
          </div>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-[1400px] w-full mx-auto print:p-0 print:max-w-none">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
