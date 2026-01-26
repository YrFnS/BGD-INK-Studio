
import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, getProducts, toggleProductStock, getGallery, addToGallery, removeFromGallery } from '../../utils/storage';
import { Order, Product, OrderStatus } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

export const Admin: React.FC = () => {
  const { t } = useAppContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PRODUCTS' | 'GALLERY'>('ORDERS');
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');

  // Initial Load
  useEffect(() => {
    if (isAuthenticated) {
      setOrders(getOrders());
      setProducts(getProducts());
      setGallery(getGallery());
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') { // Simple simulation auth
      setIsAuthenticated(true);
    } else {
      alert('Invalid Password');
    }
  };

  // --- ORDER ACTIONS ---
  const handleStatusChange = (id: string, status: OrderStatus) => {
    const updated = updateOrderStatus(id, status);
    setOrders(updated);
  };

  const downloadImage = (base64: string | null, filename: string) => {
    if (!base64) return;
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PRODUCT ACTIONS ---
  const handleStockToggle = (id: string) => {
    const updated = toggleProductStock(id);
    setProducts(updated);
  };

  // --- GALLERY ACTIONS ---
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newImage) {
      const updated = addToGallery(newImage);
      setGallery(updated);
      setNewImage('');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (confirm('Delete this image?')) {
      const updated = removeFromGallery(index);
      setGallery(updated);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 flex justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Access</h2>
          <input
            type="password"
            placeholder="Enter PIN (1234)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 mb-4"
          />
          <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
          {(['ORDERS', 'PRODUCTS', 'GALLERY'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === tab 
                  ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-zinc-800">
                <tr>
                  <th className="p-4 font-bold">ID</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Product</th>
                  <th className="p-4 font-bold">Design</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="p-4 font-mono font-bold text-accent">{order.id}</td>
                    <td className="p-4 text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="font-bold">{order.fullName}</div>
                      <div className="text-xs text-gray-500">{order.phone}</div>
                      <div className="text-xs text-gray-500">{order.area}</div>
                    </td>
                    <td className="p-4">
                      <div>{t(order.productName)}</div>
                      <div className="text-xs text-gray-500">{order.size} / {order.color}</div>
                    </td>
                    <td className="p-4">
                      {order.decalImage ? (
                        <button 
                          onClick={() => downloadImage(order.decalImage, `order-${order.id}.png`)}
                          className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:underline"
                        >
                          Download
                        </button>
                      ) : (
                        <span className="text-gray-400">No Upload</span>
                      )}
                      {order.notes && (
                         <div className="mt-1 text-xs italic text-gray-500 truncate w-32" title={order.notes}>
                           "{order.notes}"
                         </div>
                      )}
                    </td>
                    <td className="p-4">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className={`bg-transparent font-bold text-xs border rounded px-2 py-1 ${
                          order.status === 'COMPLETED' ? 'text-green-500 border-green-500' :
                          order.status === 'CANCELLED' ? 'text-red-500 border-red-500' :
                          'text-yellow-500 border-yellow-500'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No orders received yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'PRODUCTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
              <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
              <div className="flex-grow">
                <h3 className="font-bold">{t(product.name)}</h3>
                <p className="text-xs text-gray-500">{product.basePrice} IQD</p>
              </div>
              <button
                onClick={() => handleStockToggle(product.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold ${
                  product.inStock 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* GALLERY TAB */}
      {activeTab === 'GALLERY' && (
        <div className="space-y-8">
           <form onSubmit={handleAddImage} className="flex gap-4">
             <input 
               type="url" 
               placeholder="Enter Image URL (e.g. https://...)" 
               value={newImage}
               onChange={(e) => setNewImage(e.target.value)}
               className="flex-grow p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl"
             />
             <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-8 rounded-xl font-bold">
               Add
             </button>
           </form>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {gallery.map((url, idx) => (
               <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-900">
                 <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                 <button 
                   onClick={() => handleRemoveImage(idx)}
                   className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold"
                 >
                   Remove
                 </button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
