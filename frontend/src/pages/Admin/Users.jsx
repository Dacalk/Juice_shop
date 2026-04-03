import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Shield, 
  User, 
  Trash2,
  Key,
  BadgeCheck,
  Loader2,
  X,
  Plus,
  MoreHorizontal,
  Mail,
  UserCheck
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const API_URL = 'http://localhost:8000';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useAuthStore(state => state.token);

  // Form States
  const [formData, setFormData] = useState({ username: '', password: '', role: 'cashier' });
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ username: '', password: '', role: 'cashier' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch personnel');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers([...users, response.data]);
      setIsAddModalOpen(false);
      setFormData({ username: '', password: '', role: 'cashier' });
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        // Optional: auto-logout after delay
        setTimeout(() => {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.detail || 'Failed to register user');
      }
      console.error(err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({ username: user.username, password: '', role: user.role });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/users/${editingUser.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user');
      console.error(err);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to remove @${username}?`)) return;
    try {
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user');
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border border-white">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 rotate-2">
            <UsersIcon size={36} className="drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
              Personnel Registry
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Shield size={16} className="text-indigo-500" />
              Manage system access and roles securely
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group min-w-[300px]">
            <Search size={20} className="absolute inset-y-0 left-5 my-auto text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Filter by name..."
              className="w-full h-16 pl-14 pr-6 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-2 border-slate-100/50 focus:border-indigo-500/20 rounded-[1.5rem] outline-none font-bold text-slate-800 transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-16 bg-slate-900 text-white hover:bg-black px-10 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 flex items-center gap-3 transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            Onboard Member
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6 bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <UserCheck size={18} className="text-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Synchronizing Personnel...</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] border border-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Team Member</th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Access Role</th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Security Clearance</th>
                  <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${user.role === 'admin' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-slate-800 shadow-slate-100'}`}>
                          {user.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">@{user.username}</p>
                          <div className="flex items-center gap-2 mt-1.5 capitalize font-medium text-slate-400 text-xs">
                            <Mail size={12} />
                            {user.username}@juicebar.pos
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                        user.role === 'admin' 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-8">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-xl border ${user.role === 'admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                          <Key size={18} />
                        </div>
                        <div className={`p-2 rounded-xl border ${user.role === 'admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                          <BadgeCheck size={18} />
                        </div>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-[1rem] border border-transparent hover:border-indigo-100"
                        >
                          <BadgeCheck size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-[1rem] border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="py-32 text-center bg-slate-50/10">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6">
                  <UserPlus size={40} />
                </div>
                <p className="text-lg font-black text-slate-300 uppercase tracking-widest italic">No matches found in records</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Onboard Member</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Entry #{(users.length + 1).toString().padStart(3, '0')}</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">System Username</label>
                <input required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500/20 focus:bg-white rounded-2xl outline-none font-black text-slate-800 transition-all placeholder:text-slate-300" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="e.g. janesmith" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Authorization Role</label>
                <div className="flex gap-4 p-1.5 bg-slate-100 rounded-[1.5rem]">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, role: 'cashier'})}
                    className={`flex-1 py-3 px-4 rounded-[1.1rem] font-black text-xs uppercase tracking-widest transition-all ${formData.role === 'cashier' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Cashier
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, role: 'admin'})}
                    className={`flex-1 py-3 px-4 rounded-[1.1rem] font-black text-xs uppercase tracking-widest transition-all ${formData.role === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Admin
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Temporary Password</label>
                <input required type="password" className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500/20 focus:bg-white rounded-2xl outline-none font-black text-slate-800 transition-all placeholder:text-slate-300" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full h-16 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all">Authorize Registration</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Modify Permissions</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel ID #{editingUser?.id.toString().padStart(3, '0')}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-100"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">System Username</label>
                <input required className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500/20 focus:bg-white rounded-2xl outline-none font-black text-slate-800 transition-all placeholder:text-slate-300" value={editFormData.username} onChange={(e) => setEditFormData({...editFormData, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Access Rights</label>
                <div className="flex gap-4 p-1.5 bg-slate-100 rounded-[1.5rem]">
                  <button 
                    type="button" 
                    onClick={() => setEditFormData({...editFormData, role: 'cashier'})}
                    className={`flex-1 py-3 px-4 rounded-[1.1rem] font-black text-xs uppercase tracking-widest transition-all ${editFormData.role === 'cashier' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Cashier
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditFormData({...editFormData, role: 'admin'})}
                    className={`flex-1 py-3 px-4 rounded-[1.1rem] font-black text-xs uppercase tracking-widest transition-all ${editFormData.role === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Admin
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">New Access Key (Optional)</label>
                <input type="password" className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500/20 focus:bg-white rounded-2xl outline-none font-black text-slate-800 transition-all placeholder:text-slate-300" value={editFormData.password} onChange={(e) => setEditFormData({...editFormData, password: e.target.value})} placeholder="Leave blank to maintain current" />
              </div>
              <button type="submit" className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl">Commit Profile Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
