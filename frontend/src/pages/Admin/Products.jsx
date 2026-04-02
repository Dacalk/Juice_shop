import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Tag, 
  ChevronRight,
  ClipboardList,
  Coffee,
  X,
  Loader2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const API_URL = 'http://localhost:8000';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useAuthStore(state => state.token);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Add Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'FruitSalad & Juice',
    unit: 'pc'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Edit Form State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    category: 'FruitSalad & Juice',
    unit: 'pc'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('unit', formData.unit);
    if (selectedFile) {
      data.append('image_file', selectedFile);
    }

    try {
      const response = await axios.post(`${API_URL}/products`, data, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setProducts([...products, response.data]);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      setError('Failed to add product');
      console.error(err);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      unit: product.unit
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/products/${editingProduct.id}`, editFormData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      setError('Failed to update product');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: 'FruitSalad & Juice', unit: 'pc' });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete product - possible token issue. Try Logging Out and In.');
      console.error(err);
    }
  };

  const renderProductImage = (image) => {
    if (image && image.includes('.')) {
      return (
        <img 
          src={`${API_URL}/uploads/${image}`} 
          alt="Product" 
          className="w-full h-full object-cover rounded-xl"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/150?text=Product';
          }}
        />
      );
    }
    return <span className="text-2xl">{image || '🥤'}</span>;
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fruitJuiceProducts = filteredProducts.filter(p => p.category === 'FruitSalad & Juice');
  const gramSectionProducts = filteredProducts.filter(p => p.category === 'Gram Section');

  const ProductTable = ({ items, title, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
      <div className={`p-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r ${colorClass} bg-opacity-5`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100`}>
            <Icon size={20} className={colorClass.split('-')[1] === 'emerald' ? 'text-emerald-500' : 'text-amber-500'} />
          </div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{title}</h2>
        </div>
        <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-100 shadow-sm">
          {items.length} Items Total
        </span>
      </div>
      
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/30 border-b border-slate-100/50">
            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Detail</th>
            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (LKR)</th>
            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Unit</th>
            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right px-8">Control</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                    {renderProductImage(product.image)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">REF: #{product.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
              </td>
              <td className="p-5 text-sm font-black text-slate-800">
                {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
              </td>
              <td className="p-5 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                  per {product.unit === 'pc' ? 'unit' : product.unit}
                </span>
                {product.unit !== 'pc' && <span className="text-[10px] text-emerald-500 font-bold italic">Weight-based</span>}
              </td>
              <td className="p-5 text-right px-8">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => handleEditClick(product)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3">
            <ClipboardList size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              Menu Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Real-time management for your local store.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={18} className="absolute inset-y-0 left-4 my-auto text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Quick search..."
              className="w-64 input pl-12 border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white transition-all rounded-2xl h-14"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-14 bg-primary text-white hover:bg-black px-8 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Syncing High-Res Content...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <ProductTable 
            items={fruitJuiceProducts} 
            title="FruitSalad & Juice Section" 
            icon={Coffee}
            colorClass="from-emerald-50 to-teal-50"
          />

          <ProductTable 
            items={gramSectionProducts} 
            title="Gram Section (Savories)" 
            icon={Tag}
            colorClass="from-amber-50 to-orange-50"
          />
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">New Menu Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              <div className="group relative w-full h-40 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary cursor-pointer flex flex-col items-center justify-center overflow-hidden" onClick={() => fileInputRef.current.click()}>
                {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <><Upload size={24} className="text-slate-400" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload photo</p></>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                <input required className="input rounded-2xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price (LKR)</label>
                  <input required type="number" className="input rounded-2xl" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pricing Unit</label>
                  <select className="input rounded-2xl" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                    <option value="pc">Per Unit</option>
                    <option value="10g">10g</option><option value="50g">50g</option><option value="100g">100g</option><option value="500g">500g</option><option value="1kg">1kg</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest">Add Item</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Modify Item</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                <input required className="input rounded-2xl" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price (LKR)</label>
                  <input required type="number" className="input rounded-2xl" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pricing Unit</label>
                  <select className="input rounded-2xl" value={editFormData.unit} onChange={(e) => setEditFormData({...editFormData, unit: e.target.value})}>
                    <option value="pc">Per Unit</option>
                    <option value="10g">10g</option><option value="50g">50g</option><option value="100g">100g</option><option value="500g">500g</option><option value="1kg">1kg</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Update Item</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
