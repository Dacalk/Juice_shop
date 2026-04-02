import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Shield, 
  User, 
  MoreVertical,
  Trash2,
  Key,
  BadgeCheck,
  Loader2
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const API_URL = 'http://localhost:8000';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useAuthStore(state => state.token);

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
      setError('Failed to fetch staff members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 rotate-3">
            <UsersIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              Staff Directory
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Manage access and roles for your POS team.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={18} className="absolute inset-y-0 left-4 my-auto text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search staff..."
              className="w-64 input pl-12 border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white transition-all rounded-2xl h-14"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="h-14 bg-slate-900 text-white hover:bg-black px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10 flex items-center gap-2 transition-all active:scale-95">
            <UserPlus size={18} />
            Register
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 size={48} className="text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Personnel...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${user.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                        {user.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">@{user.username}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 italic">
                          System ID: #{user.id.toString().padStart(3, '0')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      user.role === 'admin' 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2">
                      <BadgeCheck size={16} className="text-emerald-500" />
                      <Key size={16} className="text-slate-300" />
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-800 transition-all rounded-xl hover:bg-slate-100">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center bg-slate-50/20">
              <p className="text-sm font-bold text-slate-400 italic">No matching team members found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
