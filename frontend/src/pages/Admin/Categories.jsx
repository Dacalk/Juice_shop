import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  LayoutGrid,
  Hash
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { API_URL } from '../../store/useAuthStore';

const EMOJI_LIST = [
  '🍉', '🥭', '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍇', '🍓', 
  '🫐', '🍈', '🍒', '🍑', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', 
  '🥕', '🥨', '🍘', '🥠', '🍹', '🥤', '🧋', '🍵', '☕', '🍧', 
  '🍨', '🍦', '🍰', '🧁', '🍪', '🍩', '🥗', '🥪', '🥙', '📦', '🏷️', '🥪'
];

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useAuthStore(state => state.token);

  const defaultForm = {
    name: '',
    icon: '🏷️'
  };

  const [formData, setFormData] = useState(defaultForm);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    icon: '🏷️'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/categories`, {
        name: formData.name,
        icon: formData.icon
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories([...categories, response.data]);
      setIsAddModalOpen(false);
      setFormData(defaultForm);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create category');
      console.error(err);
    }
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name,
      icon: category.icon
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/categories/${editingCategory.id}`, {
        ...editFormData
      }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setCategories(categories.map(c => c.id === editingCategory.id ? response.data : c));
      setIsEditModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setError('Update failed.');
      console.error(err);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await axios.delete(`${API_URL}/categories/${categoryToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Deletion failed. Check if products are assigned to this category.');
      console.error(err);
      setIsDeleteModalOpen(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputCls = "w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-amber-500/30 transition-all text-white";
  const labelCls = "text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-2";

  return (
    <div className="w-full px-4 sm:px-6 space-y-6 sm:space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 bg-white/5 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-3xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#eaf89b] to-[#c5eef5] rounded-[2rem] flex items-center justify-center text-slate-900 shadow-xl shadow-lime-500/20 rotate-3">
            <Tag size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Category Manager</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Define and organize your product sections</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-1">
            <Search className="absolute left-5 inset-y-0 my-auto text-slate-500 group-focus-within:text-white" size={18} />
            <input
              placeholder="Search categories..."
              className="h-14 pl-14 pr-6 bg-[#282828] border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-lime-500/20 transition-all font-bold w-full md:w-64 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-14 bg-white text-slate-900 px-8 sm:px-10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#eaf89b] transition-all flex items-center justify-center gap-3 whitespace-nowrap"
          >
            <Plus size={20} /> <span className="hidden sm:inline">New Category</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 text-center"><Loader2 size={40} className="animate-spin text-lime-500 mx-auto" /></div>
      ) : (
        <div className="glass-panel rounded-[2.5rem] overflow-hidden mb-8 border border-white/5 shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#eaf89b]">
                <LayoutGrid size={24} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Registered Categories</h2>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{categories.length} Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px] table-fixed">
              <thead>
                <tr className="bg-white/2">
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">Icon</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[60%]">Category Name</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-[30%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-6">
                      <span className="text-3xl grayscale-[0.5] hover:grayscale-0 transition-all">{c.icon || '🏷️'}</span>
                    </td>
                    <td className="p-6">
                      <p className="font-extrabold text-sm">{c.name}</p>
                      <p className="text-[10px] font-bold text-slate-500">ID: {c.id}</p>
                    </td>
                    <td className="p-6 text-right space-x-2">
                      <button onClick={() => handleEditClick(c)} className="p-2 text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => { setCategoryToDelete(c); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-300 flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          {error}
          <button onClick={() => setError('')} className="ml-4 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-[#202020] w-full max-w-md rounded-[3rem] border border-white/5 overflow-hidden animate-scale-up">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-[#202020]">
              <h3 className="text-2xl font-black uppercase tracking-tight">Add Category</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCategory} className="p-10 space-y-6">
               <div className="space-y-4">
                  <label className={labelCls}>Select Icon</label>
                  <div className="grid grid-cols-6 gap-2 p-4 bg-white/5 border border-white/10 rounded-3xl max-h-48 overflow-y-auto custom-scrollbar">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({...formData, icon: emoji})}
                        className={`text-2xl p-2 rounded-xl transition-all hover:bg-white/10 ${formData.icon === emoji ? 'bg-amber-500/20 ring-2 ring-amber-500/50 scale-110' : ''}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelCls}>Category Name</label>
                  <input required className={inputCls} placeholder="e.g. Smoothies" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>

              <button className="w-full h-16 resto-gradient text-slate-900 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl mt-4">Save Category</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-xl" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-[#202020] w-full max-w-md rounded-[3rem] border border-white/5 overflow-hidden animate-scale-up">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-[#202020]">
              <h3 className="text-2xl font-black uppercase tracking-tight">Edit Category</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateCategory} className="p-10 space-y-6">
               <div className="space-y-4">
                  <label className={labelCls}>Update Icon</label>
                  <div className="grid grid-cols-6 gap-2 p-4 bg-white/5 border border-white/10 rounded-3xl max-h-48 overflow-y-auto custom-scrollbar">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditFormData({...editFormData, icon: emoji})}
                        className={`text-2xl p-2 rounded-xl transition-all hover:bg-white/10 ${editFormData.icon === emoji ? 'bg-amber-500/20 ring-2 ring-amber-500/50 scale-110' : ''}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelCls}>Category Name</label>
                  <input required className={inputCls} value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                </div>

              <button className="w-full h-16 resto-gradient text-slate-900 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl mt-4">Update Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-[#202020] w-full max-w-sm rounded-[2.5rem] border border-white/10 overflow-hidden shadow-3xl animate-scale-up">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Delete Category?</h3>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                Are you sure you want to permanently remove <span className="text-white">"{categoryToDelete?.name}"</span>? 
                This will fail if items are currently assigned to this category.
              </p>
            </div>
            <div className="flex border-t border-white/5">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/2 transition-colors border-r border-white/5">Cancel</button>
              <button onClick={handleDeleteCategory} className="flex-1 py-6 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
