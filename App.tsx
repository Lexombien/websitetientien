
import React, { useState, useEffect } from 'react';
import { FLOWERS_SAMPLES, ZALO_NUMBER, DEFAULT_CATEGORIES } from './constants';
import { FlowerProduct, CategorySettings, PaginationType, ImageTransitionEffect, ImageWithMetadata } from './types';
import FlowerCard from './components/FlowerCard';
import CategorySettingsModal from './components/CategorySettingsModal';
import CategoryEditModal from './components/CategoryEditModal';
import CategorySection from './components/CategorySection';
import ImageUploadWithMetadata from './components/ImageUploadWithMetadata';
import MediaLibrary from './components/MediaLibrary';
import ImageLightbox from './components/ImageLightbox';

// Auto-detect backend URL based on environment
const BACKEND_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'  // Local development
  : '';  // Production: use same origin (Nginx proxy)

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [products, setProducts] = useState<FlowerProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<FlowerProduct> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // NEW: admin tabs
  const [activeTab, setActiveTab] = useState<'products' | 'media'>('products');

  // NEW: Global Media Metadata (SEO)
  const [mediaMetadata, setMediaMetadata] = useState<Record<string, { alt?: string, title?: string, description?: string }>>({});

  // NEW: Category Settings State
  const [categorySettings, setCategorySettings] = useState<Record<string, CategorySettings>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [showCategorySettingsModal, setShowCategorySettingsModal] = useState(false); // NEW: Settings modal

  // NEW: Pagination state for each category
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({});

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    categories: true,    // Mặc định mở
    productForm: false,  // Mặc định đóng
    inventory: true,     // Mặc định mở
    settings: false,     // Mặc định đóng
    categorySettings: false  // NEW: Category settings section
  });

  const toggleSection = (section: 'categories' | 'productForm' | 'inventory' | 'settings' | 'categorySettings') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Global Settings
  const [globalSettings, setGlobalSettings] = useState({
    // Display Settings
    aspectRatio: '3/4',
    customValue: '',
    showSKU: false,
    zaloLink: `https://zalo.me/${ZALO_NUMBER}`,
    phoneNumber: '0900000000', // NEW: Số điện thoại liên hệ

    // Theme Settings
    themeColor: 'pink', // pink, purple, blue, green, orange

    // Branding
    websiteName: 'Floral Essence',
    logoUrl: '',
    logoSizeDesktop: 'h-12', // NEW: Logo size on desktop (h-8, h-10, h-12, h-16, h-20)
    logoSizeMobile: 'h-10',  // NEW: Logo size on mobile

    // SEO Meta Tags
    seoTitle: 'Tiệm Hoa Cao Cấp - Floral Essence',
    seoDescription: 'Chuyên cung cấp hoa tươi cao cấp, bó hoa đẹp, giao hoa tận nơi tại TP.HCM',
    seoKeywords: 'hoa tươi, bó hoa, tiệm hoa, hoa sinh nhật',

    // Feature Toggles
    enableLightbox: true,
    enablePriceDisplay: true,

    // Custom CSS
    customCSS: '' // NEW: Custom CSS code
  });

  // Lightbox State
  const [lightboxData, setLightboxData] = useState<{
    images: { url: string; alt?: string; title?: string }[];
    index: number;
    isOpen: boolean;
  }>({
    images: [],
    index: 0,
    isOpen: false
  });

  const openLightbox = (images: { url: string; alt?: string; title?: string }[], index: number = 0) => {
    setLightboxData({
      images,
      index,
      isOpen: true
    });
  };

  // Apply Theme Color Dynamically
  useEffect(() => {
    const themeColors = {
      pink: { primary: '#FF6B9D', secondary: '#BD5FFF', accent: '#FF8A5B' },
      purple: { primary: '#BD5FFF', secondary: '#9D4EDD', accent: '#A78BFA' },
      blue: { primary: '#4F9FFF', secondary: '#3B82F6', accent: '#60A5FA' },
      green: { primary: '#4ADE80', secondary: '#10B981', accent: '#34D399' },
      orange: { primary: '#FF8A5B', secondary: '#F97316', accent: '#FB923C' }
    };

    const colors = themeColors[globalSettings.themeColor as keyof typeof themeColors] || themeColors.pink;

    // Update CSS variables
    document.documentElement.style.setProperty('--primary-pink', colors.primary);
    document.documentElement.style.setProperty('--primary-fuchsia', colors.primary);
    document.documentElement.style.setProperty('--secondary-purple', colors.secondary);
    document.documentElement.style.setProperty('--accent-orange', colors.accent);
  }, [globalSettings.themeColor]);

  // Apply SEO Meta Tags
  useEffect(() => {
    document.title = globalSettings.seoTitle || 'Floral Essence';

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', globalSettings.seoDescription);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', globalSettings.seoKeywords);
  }, [globalSettings.seoTitle, globalSettings.seoDescription, globalSettings.seoKeywords]);

  // Apply Custom CSS
  useEffect(() => {
    const styleId = 'custom-css-inject';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = globalSettings.customCSS;
  }, [globalSettings.customCSS]);

  // Register Service Worker for PWA Caching
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ SW registered:', registration);
          })
          .catch((error) => {
            console.log('❌ SW registration failed:', error);
          });
      });
    }
  }, []);

  // Theo dõi thay đổi URL (Hash routing: #admin)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Khởi tạo dữ liệu từ LocalStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('flowers_data');
    const savedCategories = localStorage.getItem('categories_data');
    const savedSettings = localStorage.getItem('global_settings');
    const savedCategorySettings = localStorage.getItem('category_settings');
    const authStatus = sessionStorage.getItem('admin_auth');

    if (authStatus === 'true') setIsAuthenticated(true);

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(FLOWERS_SAMPLES);
      localStorage.setItem('flowers_data', JSON.stringify(FLOWERS_SAMPLES));
    }

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem('categories_data', JSON.stringify(DEFAULT_CATEGORIES));
    }

    if (savedSettings) {
      setGlobalSettings(JSON.parse(savedSettings));
    } else {
      const defaultSettings = { aspectRatio: '3/4' };
      setGlobalSettings(defaultSettings);
      localStorage.setItem('global_settings', JSON.stringify(defaultSettings));
    }

    // NEW: Initialize category settings
    if (savedCategorySettings) {
      setCategorySettings(JSON.parse(savedCategorySettings));
    } else {
      // Create default settings for each category
      const defaultCategorySettings: Record<string, CategorySettings> = {};
      DEFAULT_CATEGORIES.forEach(cat => {
        defaultCategorySettings[cat] = {
          name: cat,
          itemsPerPage: 8,
          paginationType: 'none',
          imageTransition: 'fade'
        };
      });
      setCategorySettings(defaultCategorySettings);
      localStorage.setItem('category_settings', JSON.stringify(defaultCategorySettings));
    }

    // AUTO-LOAD FROM SERVER (để user luôn thấy data mới nhất!)
    const loadDataFromServer = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/database`);
        const result = await response.json();

        if (result.success && result.data) {
          // Update states with server data
          if (result.data.products && result.data.products.length > 0) {
            setProducts(result.data.products);
            localStorage.setItem('flowers_data', JSON.stringify(result.data.products));
          }
          if (result.data.categories && result.data.categories.length > 0) {
            setCategories(result.data.categories);
            localStorage.setItem('categories_data', JSON.stringify(result.data.categories));
          }
          if (result.data.settings) {
            setGlobalSettings(result.data.settings);
            localStorage.setItem('global_settings', JSON.stringify(result.data.settings));
          }
          if (result.data.categorySettings) {
            setCategorySettings(result.data.categorySettings);
            localStorage.setItem('category_settings', JSON.stringify(result.data.categorySettings));
          }
          if (result.data.media) {
            setMediaMetadata(result.data.media);
          }

          console.log('✅ Đã tải data từ server thành công!');
        }
      } catch (error) {
        // Nếu server không chạy hoặc lỗi, dùng localStorage (đã load ở trên)
        console.log('ℹ️ Không kết nối được server, dùng localStorage');
      }
    };

    // Load từ server ngay khi app khởi động
    loadDataFromServer();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TÀI KHOẢN MẶC ĐỊNH: admin / admin123
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Sai tài khoản hoặc mật khẩu! (Gợi ý: admin/admin123)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    window.location.hash = '';
  };

  const saveProducts = (newProducts: FlowerProduct[]) => {
    setProducts(newProducts);
    localStorage.setItem('flowers_data', JSON.stringify(newProducts));
  };

  const saveCategories = (newCats: string[]) => {
    setCategories(newCats);
    localStorage.setItem('categories_data', JSON.stringify(newCats));
  };

  const handleAddOrUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated = [...products];
    if (editingProduct.id) {
      const index = updated.findIndex(p => p.id === editingProduct.id);
      updated[index] = editingProduct as FlowerProduct;
    } else {
      const newProd = {
        ...editingProduct,
        id: Date.now().toString(),
        images: editingProduct.images || [],
        switchInterval: editingProduct.switchInterval || 3000
      } as FlowerProduct;
      updated.unshift(newProd);
    }
    saveProducts(updated);
    setEditingProduct(null);
    setShowEditModal(false); // Close modal
  };

  const openEditModal = (product: FlowerProduct) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setShowEditModal(false);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      saveProducts(products.filter(p => p.id !== id));
    }
  };

  const addCategory = () => {
    if (newCategoryName && !categories.includes(newCategoryName)) {
      saveCategories([...categories, newCategoryName]);
      setNewCategoryName('');
    }
  };

  const deleteCategory = (cat: string) => {
    if (confirm(`Xóa danh mục "${cat}" sẽ làm ẩn các sản phẩm thuộc mục này. Tiếp tục?`)) {
      saveCategories(categories.filter(c => c !== cat));
    }
  };

  const moveCategoryUp = (index: number) => {
    if (index > 0) {
      const newCats = [...categories];
      [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
      saveCategories(newCats);
    }
  };

  const moveCategoryDown = (index: number) => {
    if (index < categories.length - 1) {
      const newCats = [...categories];
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
      saveCategories(newCats);
    }
  };

  // NEW: Category Settings Functions
  const saveCategorySettings = (newSettings: Record<string, CategorySettings>) => {
    setCategorySettings(newSettings);
    localStorage.setItem('category_settings', JSON.stringify(newSettings));
  };

  const updateCategorySettings = (categoryName: string, updates: Partial<CategorySettings>) => {
    const updated = {
      ...categorySettings,
      [categoryName]: {
        ...categorySettings[categoryName],
        ...updates
      }
    };
    saveCategorySettings(updated);
  };

  const openCategoryEditModal = (categoryName: string) => {
    setEditingCategory(categoryName);
    setShowCategoryEditModal(true);
  };

  const closeCategoryEditModal = () => {
    setEditingCategory(null);
    setShowCategoryEditModal(false);
  };

  const renameCategoryInSettings = (oldName: string, newName: string) => {
    if (oldName === newName) return;

    // Update category list
    const newCategories = categories.map(c => c === oldName ? newName : c);
    saveCategories(newCategories);

    // Update category settings
    const newSettings = { ...categorySettings };
    if (newSettings[oldName]) {
      newSettings[newName] = { ...newSettings[oldName], name: newName };
      delete newSettings[oldName];
      saveCategorySettings(newSettings);
    }

    // Update products
    const updatedProducts = products.map(p =>
      p.category === oldName ? { ...p, category: newName } : p
    );
    saveProducts(updatedProducts);
  };

  // Pagination helpers
  const loadMoreProducts = (categoryName: string) => {
    const currentPage = categoryPages[categoryName] || 1;
    setCategoryPages(prev => ({
      ...prev,
      [categoryName]: currentPage + 1
    }));
  };

  const resetCategoryPage = (categoryName: string) => {
    setCategoryPages(prev => ({
      ...prev,
      [categoryName]: 1
    }));
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, category: string) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
    // Add a subtle visual effect
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedCategory(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();

    if (!draggedCategory || draggedCategory === targetCategory) return;

    const newCats = [...categories];
    const draggedIndex = newCats.indexOf(draggedCategory);
    const targetIndex = newCats.indexOf(targetCategory);

    // Remove dragged item and insert at target position
    newCats.splice(draggedIndex, 1);
    newCats.splice(targetIndex, 0, draggedCategory);

    saveCategories(newCats);
    setDraggedCategory(null);
  };

  // Product Drag & Drop handlers
  const handleProductDragStart = (e: React.DragEvent, productId: string) => {
    setDraggedProduct(productId);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleProductDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedProduct(null);
  };

  const handleProductDrop = (e: React.DragEvent, targetProductId: string, category: string) => {
    e.preventDefault();

    if (!draggedProduct || draggedProduct === targetProductId) return;

    // Get products in this category only
    const categoryProducts = products.filter(p => p.category === category);
    const otherProducts = products.filter(p => p.category !== category);

    const draggedIndex = categoryProducts.findIndex(p => p.id === draggedProduct);
    const targetIndex = categoryProducts.findIndex(p => p.id === targetProductId);

    // Reorder within category
    const reordered = [...categoryProducts];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update order numbers
    const updatedCategoryProducts = reordered.map((p, index) => ({
      ...p,
      order: index
    }));

    // Combine and save
    saveProducts([...otherProducts, ...updatedCategoryProducts]);
    setDraggedProduct(null);
  };

  // NEW: Handle image deletion from Media Library
  const handleImageDeletedFromLibrary = (deletedFilename: string) => {
    console.log(`🧹 Đang dọn dẹp sản phẩm chứa ảnh bị xóa: ${deletedFilename}`);

    let productsUpdated = false;
    let latestUpdatedProducts: FlowerProduct[] = [];

    // Sử dụng functional update để đảm bảo lấy list sản phẩm mới nhất
    setProducts(prevProducts => {
      const updated = prevProducts.map(product => {
        // Kiểm tra xem sản phẩm có chứa ảnh này không
        const hasLegacy = product.images.some(url => url.includes(deletedFilename));
        const hasMeta = product.imagesWithMetadata?.some(img => img.url.includes(deletedFilename));

        if (hasLegacy || hasMeta) {
          productsUpdated = true;
          return {
            ...product,
            images: product.images.filter(url => !url.includes(deletedFilename)),
            imagesWithMetadata: product.imagesWithMetadata?.filter(img => !img.url.includes(deletedFilename))
          };
        }
        return product;
      });
      latestUpdatedProducts = updated;
      localStorage.setItem('flowers_data', JSON.stringify(updated));
      return updated;
    });

    // Cập nhật metadata
    let latestMetadata: Record<string, any> = {};
    setMediaMetadata(prev => {
      const next = { ...prev };
      delete next[deletedFilename];
      latestMetadata = next;
      return next;
    });

    // TỰ ĐỘNG SYNC VỚI SERVER
    const syncWithServer = async () => {
      if (!productsUpdated) {
        console.log('ℹ️ Không có sản phẩm nào bị ảnh hưởng, chỉ cập nhật metadata.');
      }

      try {
        const fullData = {
          products: latestUpdatedProducts.length > 0 ? latestUpdatedProducts : products,
          categories: categories,
          settings: globalSettings,
          categorySettings: categorySettings,
          media: latestMetadata
        };

        await fetch(`${BACKEND_URL}/api/database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullData)
        });
        console.log('☁️ Đã tự động đồng bộ dọn dẹp lên server!');
      } catch (e) {
        console.error('❌ Tự động đồng bộ dọn dẹp thất bại:', e);
      }
    };

    // Chạy đồng bộ sau một khoảng ngắn để đảm bảo state đã được set
    setTimeout(syncWithServer, 100);

    console.log('✅ Đã dọn dẹp xong dữ liệu sản phẩm!');
  };

  // Hàm xử lý cuộn mượt tới danh mục
  const scrollToCategory = (cat: string) => {
    setIsMobileMenuOpen(false); // Đóng menu mobile nếu đang mở
    const element = document.getElementById(cat);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // GIAO DIỆN ĐĂNG NHẬP ADMIN (KHI VÀO #admin)
  if (currentPath === '#admin' && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
        <div className="max-w-md w-full glass-strong rounded-[2rem] shadow-2xl p-10 border border-white/30">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-sunset rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg glow-pink pulse-glow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-3xl font-bold serif-display gradient-text">Quản trị viên</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Vui lòng đăng nhập để quản lý cửa hàng</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>Tài khoản</label>
              <input
                type="text"
                required
                className="glass-input w-full rounded-2xl px-5 py-4 text-sm"
                placeholder="admin"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>Mật khẩu</label>
              <input
                type="password"
                required
                className="glass-input w-full rounded-2xl px-5 py-4 text-sm"
                placeholder="••••••••"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>
            {loginError && (
              <div className="glass-pink text-sm font-semibold px-4 py-3 rounded-xl border border-pink-300 animate-pulse" style={{ color: 'var(--primary-fuchsia)' }}>
                {loginError}
              </div>
            )}
            <button type="submit" className="pill-button w-full bg-gradient-pink text-white py-4 font-bold shadow-xl hover-glow-pink active:scale-[0.98]">
              Đăng nhập hệ thống
            </button>
            <button
              type="button"
              onClick={() => window.location.hash = ''}
              className="w-full text-center text-xs hover:text-[var(--primary-pink)] mt-4 transition-all font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              ← Quay lại trang chủ
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== SERVER SYNC FUNCTIONS ====================

  const loadFromServer = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/database`);
      const result = await response.json();

      if (result.success && result.data) {
        // Update states
        if (result.data.products) setProducts(result.data.products);
        if (result.data.categories) setCategories(result.data.categories);
        if (result.data.settings) setGlobalSettings(result.data.settings);
        if (result.data.categorySettings) setCategorySettings(result.data.categorySettings);

        // Also save to localStorage for offline access
        localStorage.setItem('flowers_data', JSON.stringify(result.data.products || []));
        localStorage.setItem('categories_data', JSON.stringify(result.data.categories || []));
        localStorage.setItem('global_settings', JSON.stringify(result.data.settings || {}));
        localStorage.setItem('category_settings', JSON.stringify(result.data.categorySettings || {}));

        setLastSyncTime(new Date().toLocaleString('vi-VN'));
        alert('✅ Đã tải dữ liệu từ server thành công!');
      }
    } catch (error) {
      console.error('Load from server error:', error);
      alert('❌ Lỗi kết nối server! Vui lòng kiểm tra backend đang chạy.');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToServer = async () => {
    setIsSyncing(true);
    try {
      const data = {
        products,
        categories,
        settings: globalSettings,
        categorySettings,
        zaloNumber: ZALO_NUMBER
      };

      const response = await fetch(`${BACKEND_URL}/api/database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        setLastSyncTime(new Date().toLocaleString('vi-VN'));
        alert('✅ Đã đồng bộ lên server thành công!\n\nBây giờ máy khác có thể thấy dữ liệu mới!');
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Save to server error:', error);
      alert('❌ Lỗi đồng bộ! Vui lòng kiểm tra:\n1. Backend server đang chạy\n2. URL đúng: ' + BACKEND_URL);
    } finally {
      setIsSyncing(false);
    }
  };

  // ==================== GIAO DIỆN QUẢN TRỊ ADMIN ====================

  // GIAO DIỆN QUẢN TRỊ ADMIN (KHI ĐÃ ĐĂNG NHẬP)
  if (currentPath === '#admin' && isAuthenticated) {
    return (
      <div className="min-h-screen bg-pattern pb-20">
        <header className="blur-backdrop border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {globalSettings.logoUrl ? (
                <img
                  src={globalSettings.logoUrl}
                  alt={globalSettings.websiteName}
                  className={`w-auto object-contain ${globalSettings.logoSizeDesktop}`}
                />
              ) : (
                <>
                  <div className="w-10 h-10 bg-gradient-pink rounded-2xl rotate-3 flex items-center justify-center shadow-lg glow-pink">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                  <h1 className="text-xl font-bold serif-display gradient-text">{globalSettings.websiteName || 'Admin Dashboard'}</h1>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Sync Buttons */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-2xl border border-white/20">
                <button
                  onClick={loadFromServer}
                  disabled={isSyncing}
                  className="text-xs font-bold hover:text-green-400 transition-all disabled:opacity-50"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Tải dữ liệu từ server"
                >
                  {isSyncing ? '⏳' : '⬇️'} Load
                </button>
                <div className="w-px h-4 bg-white/20"></div>
                <button
                  onClick={saveToServer}
                  disabled={isSyncing}
                  className="text-xs font-bold hover:text-blue-400 transition-all disabled:opacity-50"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Lưu dữ liệu lên server"
                >
                  {isSyncing ? '⏳' : '⬆️'} Save
                </button>
                {lastSyncTime && (
                  <>
                    <div className="w-px h-4 bg-white/20"></div>
                    <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }} title="Lần sync cuối">
                      {lastSyncTime.split(' ')[1]}
                    </span>
                  </>
                )}
              </div>

              <button onClick={() => window.location.hash = ''} className="text-sm font-semibold hover:text-[var(--primary-pink)] transition-all hover:scale-105" style={{ color: 'var(--text-secondary)' }}>Xem Shop</button>
              <button onClick={handleLogout} className="pill-button bg-gradient-pink text-white px-5 py-2 text-xs font-bold shadow-lg hover-glow-pink">Thoát</button>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="max-w-6xl mx-auto px-6 mt-6">
          <div className="flex gap-2 glass-strong p-2 rounded-2xl border border-white/30 inline-flex">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'products'
                ? 'bg-gradient-pink text-white shadow-lg'
                : 'text-neutral-600 hover:bg-white/50'
                }`}
            >
              📦 Quản Lý Sản Phẩm
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'media'
                ? 'bg-gradient-pink text-white shadow-lg'
                : 'text-neutral-600 hover:bg-white/50'
                }`}
            >
              📁 Thư Viện Ảnh
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'css'
                ? 'bg-gradient-pink text-white shadow-lg'
                : 'text-neutral-600 hover:bg-white/50'
                }`}
            >
              🎨 CSS
            </button>
          </div>
        </div>

        <main className="max-w-6xl mx-auto p-6 space-y-8 mt-6">
          {activeTab === 'products' ? (
            <>
              {/* CÀI ĐẶT CHUNG - MOVED TO TOP */}
              <section className="glass-strong p-8 rounded-3xl border border-white/30 shadow-xl">
                <div
                  className="flex justify-between items-center mb-6 cursor-pointer group"
                  onClick={() => toggleSection('settings')}
                >
                  <h3 className="text-lg font-bold serif-display gradient-text flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-sunset rounded-full inline-block"></span>
                    ⚙️ Cài đặt chung
                  </h3>
                  <button className="pill-button glass px-4 py-2 hover:glass-strong transition-all">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${expandedSections.settings ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--primary-pink)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {expandedSections.settings && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="glass p-6 rounded-2xl">
                      <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        🖼️ Tỷ lệ khung hình cho tất cả sản phẩm
                      </label>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Thay đổi tỷ lệ này sẽ áp dụng cho tất cả thumbnail sản phẩm trên trang chủ
                      </p>
                      <div className="space-y-4">
                        <div className="flex gap-3 items-center">
                          <select
                            className="glass-input flex-grow rounded-2xl px-5 py-3 text-sm font-semibold"
                            value={globalSettings.aspectRatio === 'custom' ? 'custom' : globalSettings.aspectRatio}
                            onChange={(e) => {
                              const newSettings = { ...globalSettings, aspectRatio: e.target.value };
                              setGlobalSettings(newSettings);
                              localStorage.setItem('global_settings', JSON.stringify(newSettings));
                            }}
                          >
                            <option value="1/1">1:1 - Vuông (Instagram)</option>
                            <option value="3/4">3:4 - Dọc (Mặc định)</option>
                            <option value="4/3">4:3 - Ngang</option>
                            <option value="16/9">16:9 - Widescreen</option>
                            <option value="custom">✨ Tùy chọn (Nhập riêng)...</option>
                          </select>
                          <div className="badge-glass bg-gradient-pink text-white px-4 py-2 text-xs font-bold">
                            {globalSettings.aspectRatio === 'custom' ? (globalSettings.customValue || 'Chưa nhập') : globalSettings.aspectRatio}
                          </div>
                        </div>

                        {globalSettings.aspectRatio === 'custom' && (
                          <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-bold uppercase text-neutral-400 ml-1 mb-2 block">Nhập tỷ lệ hoặc Pixel (Vd: 2:3, 500x700, 0.75)</label>
                            <input
                              type="text"
                              placeholder="Ví dụ: 2:3 hoặc 500x700"
                              className="glass-input w-full rounded-2xl px-5 py-3 text-sm font-medium"
                              value={globalSettings.customValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newSettings = { ...globalSettings, customValue: val };
                                setGlobalSettings(newSettings);
                                localStorage.setItem('global_settings', JSON.stringify(newSettings));
                              }}
                            />
                            <p className="text-[10px] text-neutral-400 mt-2 ml-1">
                              * Hệ thống sẽ tự chuyển đổi ':' và 'x' thành dấu '/' để CSS hiểu được.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NEW: SKU Display Toggle */}
                    <div className="glass p-6 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                            🏷️ Hiển thị mã SKU trên ảnh sản phẩm
                          </label>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Bật để hiển thị mã sản phẩm (SKU) ở góc dưới bên trái của ảnh
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={globalSettings.showSKU}
                            onChange={(e) => {
                              const newSettings = { ...globalSettings, showSKU: e.target.checked };
                              setGlobalSettings(newSettings);
                              localStorage.setItem('global_settings', JSON.stringify(newSettings));
                            }}
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-pink"></div>
                        </label>
                      </div>
                    </div>

                    {/* NEW: Zalo Link Input */}
                    <div className="glass p-6 rounded-2xl">
                      <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        📱 Link Zalo cho nút "Liên hệ đặt hàng"
                      </label>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Nhập link Zalo của shop (vd: https://zalo.me/0900000000)
                      </p>
                      <input
                        type="text"
                        className="glass-input w-full rounded-2xl px-5 py-3 text-sm font-medium"
                        placeholder="https://zalo.me/0900000000"
                        value={globalSettings.zaloLink}
                        onChange={(e) => {
                          const newSettings = { ...globalSettings, zaloLink: e.target.value };
                          setGlobalSettings(newSettings);
                          localStorage.setItem('global_settings', JSON.stringify(newSettings));
                        }}
                      />
                    </div>

                    {/* Phone Number Input */}
                    <div className="glass p-6 rounded-2xl">
                      <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        ☎️ Số điện thoại liên hệ
                      </label>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Nhập số điện thoại để khách hàng gọi trực tiếp
                      </p>
                      <input
                        type="tel"
                        className="glass-input w-full rounded-2xl px-5 py-3 text-sm font-medium"
                        placeholder="0900000000"
                        value={globalSettings.phoneNumber}
                        onChange={(e) => {
                          const newSettings = { ...globalSettings, phoneNumber: e.target.value };
                          setGlobalSettings(newSettings);
                          localStorage.setItem('global_settings', JSON.stringify(newSettings));
                        }}
                      />
                    </div>

                    {/* Theme Color Selector */}
                    <div className="glass p-6 rounded-2xl">
                      <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        🎨 Chọn màu chủ đạo website
                      </label>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Thay đổi tone màu cho toàn bộ giao diện
                      </p>
                      <div className="grid grid-cols-5 gap-3">
                        {[
                          { name: 'pink', label: 'Hồng', color: '#FF6B9D' },
                          { name: 'purple', label: 'Tím', color: '#BD5FFF' },
                          { name: 'blue', label: 'Xanh Dương', color: '#4F9FFF' },
                          { name: 'green', label: 'Xanh Lá', color: '#4ADE80' },
                          { name: 'orange', label: 'Cam', color: '#FF8A5B' }
                        ].map(theme => (
                          <button
                            key={theme.name}
                            onClick={() => {
                              const newSettings = { ...globalSettings, themeColor: theme.name };
                              setGlobalSettings(newSettings);
                              localStorage.setItem('global_settings', JSON.stringify(newSettings));
                            }}
                            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${globalSettings.themeColor === theme.name
                              ? 'border-current shadow-lg'
                              : 'border-neutral-200'
                              }`}
                            style={{ backgroundColor: theme.color + '20', borderColor: globalSettings.themeColor === theme.name ? theme.color : undefined }}
                          >
                            <div
                              className="w-8 h-8 rounded-full mx-auto mb-2"
                              style={{ backgroundColor: theme.color }}
                            />
                            <p className="text-[10px] font-bold text-center">{theme.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Branding: Logo & Website Name */}
                    <div className="glass p-6 rounded-2xl">
                      <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        🏪 Thương hiệu & Logo
                      </label>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                            Tên website/cửa hàng
                          </label>
                          <input
                            type="text"
                            className="glass-input w-full rounded-2xl px-5 py-3 text-sm font-medium"
                            placeholder="Vd: Floral Essence"
                            value={globalSettings.websiteName}
                            onChange={(e) => {
                              const newSettings = { ...globalSettings, websiteName: e.target.value };
                              setGlobalSettings(newSettings);
                              localStorage.setItem('global_settings', JSON.stringify(newSettings));
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                            Upload Logo
                          </label>
                          <div className="space-y-3">
                            {globalSettings.logoUrl && (
                              <div className="p-4 glass rounded-xl">
                                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Logo hiện tại:</p>
                                <img src={globalSettings.logoUrl} alt="Logo" className="max-h-20 w-auto mx-auto" />
                                <button
                                  onClick={() => {
                                    const newSettings = { ...globalSettings, logoUrl: '' };
                                    setGlobalSettings(newSettings);
                                    localStorage.setItem('global_settings', JSON.stringify(newSettings));
                                  }}
                                  className="mt-3 w-full text-xs text-rose-500 hover:text-rose-600 font-bold"
                                >
                                  Xóa logo
                                </button>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append('image', file);

                                try {
                                  const response = await fetch(`${BACKEND_URL}/api/upload`, {
                                    method: 'POST',
                                    body: formData
                                  });
                                  const result = await response.json();

                                  if (result.success) {
                                    const newSettings = { ...globalSettings, logoUrl: result.url };
                                    setGlobalSettings(newSettings);
                                    localStorage.setItem('global_settings', JSON.stringify(newSettings));
                                    alert('✅ Upload logo thành công!');
                                  }
                                } catch (error) {
                                  console.error('Upload error:', error);
                                  alert('❌ Lỗi khi upload logo!');
                                }

                                e.target.value = '';
                              }}
                              className="glass-input w-full rounded-2xl px-5 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-pink file:text-white hover:file:bg-opacity-90"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                              Kích thước logo PC
                            </label>
                            <select
                              className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-medium"
                              value={globalSettings.logoSizeDesktop}
                              onChange={(e) => {
                                const newSettings = { ...globalSettings, logoSizeDesktop: e.target.value };
                                setGlobalSettings(newSettings);
                                localStorage.setItem('global_settings', JSON.stringify(newSettings));
                              }}
                            >
                              <option value="h-8">Nhỏ (32px)</option>
                              <option value="h-10">Vừa (40px)</option>
                              <option value="h-12">Lớn (48px)</option>
                              <option value="h-16">Rất lớn (64px)</option>
                              <option value="h-20">Cực lớn (80px)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                              Kích thước logo Mobile
                            </label>
                            <select
                              className="glass-input w-full rounded-2xl px-4 py-3 text-sm font-medium"
                              value={globalSettings.logoSizeMobile}
                              onChange={(e) => {
                                const newSettings = { ...globalSettings, logoSizeMobile: e.target.value };
                                setGlobalSettings(newSettings);
                                localStorage.setItem('global_settings', JSON.stringify(newSettings));
                              }}
                            >
                              <option value="h-8">Nhỏ (32px)</option>
                              <option value="h-10">Vừa (40px)</option>
                              <option value="h-12">Lớn (48px)</option>
                              <option value="h-16">Rất lớn (64px)</option>
                              <option value="h-20">Cực lớn (80px)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEO Settings */}
                    <div className="glass p-6 rounded-2xl">
                      <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        📊 Tối ưu hóa SEO (Google Search)
                      </label>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Cải thiện thứ hạng website trên Google
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                            Tiêu đề SEO (Title Tag)
                          </label>
                          <input
                            type="text"
                            className="glass-input w-full rounded-2xl px-5 py-3 text-sm"
                            placeholder="Vd: Tiệm Hoa Tươi Cao Cấp - Giao Hàng Nhanh"
                            value={globalSettings.seoTitle}
                            onChange={(e) => {
                              const newSettings = { ...globalSettings, seoTitle: e.target.value };
                              setGlobalSettings(newSettings);
                              localStorage.setItem('global_settings', JSON.stringify(newSettings));
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                            Mô tả SEO (Meta Description)
                          </label>
                          <textarea
                            className="glass-input w-full rounded-2xl px-5 py-3 text-sm"
                            rows={3}
                            placeholder="Vd: Chuyên cung cấp hoa tươi cao cấp, bó hoa đẹp, giao hoa tận nơi..."
                            value={globalSettings.seoDescription}
                            onChange={(e) => {
                              const newSettings = { ...globalSettings, seoDescription: e.target.value };
                              setGlobalSettings(newSettings);
                              localStorage.setItem('global_settings', JSON.stringify(newSettings));
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                            Từ khóa SEO (Keywords) - Cách nhau bởi dấu phẩy
                          </label>
                          <input
                            type="text"
                            className="glass-input w-full rounded-2xl px-5 py-3 text-sm"
                            placeholder="hoa tươi, bó hoa, tiệm hoa, hoa sinh nhật"
                            value={globalSettings.seoKeywords}
                            onChange={(e) => {
                              const newSettings = { ...globalSettings, seoKeywords: e.target.value };
                              setGlobalSettings(newSettings);
                              localStorage.setItem('global_settings', JSON.stringify(newSettings));
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="glass p-6 rounded-2xl">
                      <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                        ⚡ Chức năng website
                      </label>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                              🖼️ Bật/Tắt Lightbox xem ảnh
                            </label>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              Cho phép khách hàng xem ảnh toàn màn hình
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={globalSettings.enableLightbox}
                              onChange={(e) => {
                                const newSettings = { ...globalSettings, enableLightbox: e.target.checked };
                                setGlobalSettings(newSettings);
                                localStorage.setItem('global_settings', JSON.stringify(newSettings));
                              }}
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-pink"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                              💰 Hiển thị giá sản phẩm
                            </label>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              Tắt nếu muốn khách hỏi giá qua Zalo
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={globalSettings.enablePriceDisplay}
                              onChange={(e) => {
                                const newSettings = { ...globalSettings, enablePriceDisplay: e.target.checked };
                                setGlobalSettings(newSettings);
                                localStorage.setItem('global_settings', JSON.stringify(newSettings));
                              }}
                            />
                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-pink"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="glass-pink p-4 rounded-xl text-sm" style={{ color: 'var(--text-secondary)' }}>
                      💡 <span className="font-semibold">Lưu ý:</span> Thay đổi sẽ được lưu tự động và áp dụng ngay lập tức.
                    </div>
                  </div>
                )}
              </section>

              {/* QUẢN LÝ DANH MỤC */}
              <section className="glass-strong p-8 rounded-3xl border border-white/30 shadow-xl">
                <div
                  className="flex justify-between items-center mb-6 cursor-pointer group"
                  onClick={() => toggleSection('categories')}
                >
                  <h3 className="text-lg font-bold serif-display gradient-text flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-pink rounded-full inline-block"></span>
                    Cấu trúc danh mục
                  </h3>
                  <button className="pill-button glass px-4 py-2 hover:glass-strong transition-all">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${expandedSections.categories ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--primary-pink)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {expandedSections.categories && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex gap-3 mb-6">
                      <input
                        type="text"
                        placeholder="Tên danh mục mới (Vd: Hoa tươi 20/10)..."
                        className="glass-input flex-grow rounded-2xl px-5 py-3 text-sm"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                      />
                      <button onClick={addCategory} className="pill-button bg-gradient-pink text-white px-8 py-3 text-sm font-bold shadow-lg hover-glow-pink">Thêm mục</button>
                    </div>

                    {/* Preview Button */}
                    <div className="mb-4 p-4 glass-gradient rounded-xl border border-white/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5" style={{ color: 'var(--secondary-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Xem trước thứ tự danh mục</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thứ tự này sẽ hiển thị trên trang chủ</p>
                          </div>
                        </div>
                        <a
                          href="#"
                          target="_blank"
                          className="pill-button bg-gradient-purple text-white px-4 py-2 text-xs font-bold shadow-md hover-glow-pink"
                        >
                          Mở trang chủ
                        </a>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {categories.map((cat, index) => {
                        const productCount = products.filter(p => p.category === cat).length;
                        return (
                          <div
                            key={cat}
                            draggable
                            onDragStart={(e) => handleDragStart(e, cat)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, cat)}
                            className={`glass p-4 rounded-xl flex items-center gap-3 text-sm font-medium group hover:glass-strong hover:scale-[1.02] transition-all cursor-move shadow-md border-white/40 ${draggedCategory === cat ? 'opacity-50 scale-95' : ''
                              }`}
                          >
                            {/* Drag Handle Icon */}
                            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5a2 2 0 100 4 2 2 0 000-4zM8 11a2 2 0 100 4 2 2 0 000-4zM8 17a2 2 0 100 4 2 2 0 000-4zM16 5a2 2 0 100 4 2 2 0 000-4zM16 11a2 2 0 100 4 2 2 0 000-4zM16 17a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>

                            {/* Position Number */}
                            <span className="w-8 h-8 bg-gradient-pink text-white rounded-xl flex items-center justify-center text-xs font-bold shadow-lg flex-shrink-0 glow-pink">
                              {index + 1}
                            </span>

                            {/* Category Name */}
                            <span className="flex-grow font-semibold" style={{ color: 'var(--text-primary)' }}>{cat}</span>

                            {/* Product Count Badge */}
                            <span className={`badge-glass px-3 py-1 text-xs font-bold flex-shrink-0 ${productCount > 0
                              ? 'bg-gradient-soft text-green-700'
                              : 'bg-white/20'
                              }`} style={{ color: productCount > 0 ? 'var(--primary-pink)' : 'var(--text-secondary)' }}>
                              {productCount} SP
                            </span>

                            {/* Reorder Buttons */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => moveCategoryUp(index)}
                                disabled={index === 0}
                                className={`p-2 rounded-lg transition-all ${index === 0
                                  ? 'text-neutral-200 cursor-not-allowed'
                                  : 'text-neutral-400 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                title="Di chuyển lên"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                              </button>
                              <button
                                onClick={() => moveCategoryDown(index)}
                                disabled={index === categories.length - 1}
                                className={`p-2 rounded-lg transition-all ${index === categories.length - 1
                                  ? 'text-neutral-200 cursor-not-allowed'
                                  : 'text-neutral-400 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                title="Di chuyển xuống"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                              </button>
                            </div>

                            {/* Settings Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(cat);
                                setShowCategorySettingsModal(true);
                              }}
                              className="p-2 text-neutral-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="Cài đặt danh mục"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => deleteCategory(cat)}
                              className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="Xóa danh mục"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg>
                            </button>
                          </div>
                        );
                      })}

                      {categories.length === 0 && (
                        <div className="text-center py-8 text-neutral-400 text-sm">
                          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                          Chưa có danh mục nào. Thêm danh mục đầu tiên!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* FORM SẢN PHẨM */}
              <section className="glass-strong p-8 rounded-3xl border border-white/30 shadow-xl">
                <div
                  className="flex justify-between items-center mb-8 cursor-pointer group"
                  onClick={() => toggleSection('productForm')}
                >
                  <h3 className="text-lg font-bold serif-display gradient-text flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-purple rounded-full inline-block"></span>
                    Thêm sản phẩm mới
                  </h3>
                  <div className="flex items-center gap-3">
                    <button className="pill-button glass px-4 py-2 hover:glass-strong transition-all">
                      <svg
                        className={`w-5 h-5 transition-transform duration-300 ${expandedSections.productForm ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--primary-pink)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {expandedSections.productForm && (
                  <div className="animate-in fade-in duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct({ title: '', category: categories[0] || '', images: [], switchInterval: 3000, aspectRatio: '3/4', originalPrice: 0, salePrice: 0 });
                        setShowEditModal(true);
                      }}
                      className="pill-button bg-gradient-pink text-white px-6 py-3 text-sm font-bold shadow-lg hover-glow-pink w-full mb-6"
                    >
                      + Tạo sản phẩm mới
                    </button>

                    <p className="text-sm text-center py-8 border-2 border-dashed border-white/30 rounded-2xl glass-pink" style={{ color: 'var(--text-secondary)' }}>
                      Click nút <span className="font-bold" style={{ color: 'var(--primary-pink)' }}>"+  Tạo sản phẩm mới"</span> ở trên để thêm sản phẩm.<br />
                      Hoặc click <span className="font-bold" style={{ color: 'var(--secondary-purple)' }}>icon bút chì</span> trên sản phẩm bên dưới để chỉnh sửa.
                    </p>
                  </div>
                )}
              </section>

              {/* QUẢN LÝ NHANH SẢN PHẨM */}
              <section>
                <div
                  className="flex justify-between items-center mb-6 cursor-pointer group glass-strong p-4 rounded-2xl"
                  onClick={() => toggleSection('inventory')}
                >
                  <h3 className="text-lg font-bold serif-display gradient-text flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-sunset rounded-full inline-block"></span>
                    Kho hàng hiện tại ({products.length})
                  </h3>
                  <button className="pill-button glass px-4 py-2 hover:glass-strong transition-all">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${expandedSections.inventory ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--primary-pink)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {expandedSections.inventory && (

                  <div className="space-y-8">
                    {categories.map((category) => {
                      const categoryProducts = products
                        .filter(p => p.category === category)
                        .sort((a, b) => (a.order || 0) - (b.order || 0));

                      if (categoryProducts.length === 0) return null;

                      return (
                        <div key={category} className="glass-strong p-6 rounded-2xl border border-white/30 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                              <span className="w-2 h-2 bg-gradient-pink rounded-full glow-pink"></span>
                              {category}
                            </h4>
                            <span className="badge-glass bg-gradient-soft text-xs font-bold" style={{ color: 'var(--primary-pink)' }}>{categoryProducts.length} sản phẩm</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {categoryProducts.map(p => (
                              <div
                                key={p.id}
                                draggable
                                onDragStart={(e) => handleProductDragStart(e, p.id)}
                                onDragEnd={handleProductDragEnd}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleProductDrop(e, p.id, category)}
                                className={`relative group cursor-move ${draggedProduct === p.id ? 'opacity-50 scale-95' : ''
                                  }`}
                              >
                                <div className="absolute top-2 left-2 z-10 bg-neutral-900/70 text-white px-2 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  ⋮⋮ Kéo
                                </div>
                                <FlowerCard
                                  product={p}
                                  isAdmin
                                  onEdit={openEditModal}
                                  globalAspectRatio={
                                    globalSettings.aspectRatio === 'custom'
                                      ? globalSettings.customValue.replace(/:/g, '/').replace(/x/gi, '/')
                                      : globalSettings.aspectRatio
                                  }
                                  mediaMetadata={mediaMetadata}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {products.length === 0 && (
                      <div className="text-center py-16 text-neutral-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        <p className="text-sm font-medium">Chưa có sản phẩm nào. Tạo sản phẩm đầu tiên!</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          ) : activeTab === 'media' ? (
            <section className="glass-strong p-8 rounded-3xl border border-white/30 shadow-xl">
              <MediaLibrary
                onMetadataChange={setMediaMetadata}
                onImageDelete={handleImageDeletedFromLibrary}
              />
            </section>
          ) : activeTab === 'css' ? (
            <section className="glass-strong p-8 rounded-3xl border border-white/30 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold serif-display gradient-text flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-pink rounded-full inline-block"></span>
                  🎨 Custom CSS
                </h3>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Nhập CSS tùy chỉnh để thay đổi giao diện website. CSS sẽ được áp dụng ngay lập tức.
                </p>
              </div>

              <div className="space-y-4">
                <div className="glass p-6 rounded-2xl">
                  <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    CSS Code
                  </label>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Ví dụ: .glass {'{ background: rgba(255, 255, 255, 0.1); }'}
                  </p>
                  <textarea
                    className="glass-input w-full rounded-2xl px-5 py-4 text-sm font-mono"
                    rows={20}
                    placeholder="/* Nhập CSS tùy chỉnh tại đây */&#10;.your-class {&#10;  color: #FF6B9D;&#10;  font-size: 16px;&#10;}"
                    value={globalSettings.customCSS}
                    onChange={(e) => {
                      const newSettings = { ...globalSettings, customCSS: e.target.value };
                      setGlobalSettings(newSettings);
                      localStorage.setItem('global_settings', JSON.stringify(newSettings));
                    }}
                    style={{
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: '13px',
                      lineHeight: '1.6'
                    }}
                  />
                </div>

                <div className="glass-pink p-4 rounded-xl">
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    💡 Mẹo sử dụng Custom CSS:
                  </p>
                  <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    <li>• CSS sẽ tự động lưu và áp dụng khi bạn nhập</li>
                    <li>• Sử dụng !important nếu cần ghi đè style mặc định</li>
                    <li>• Test trên  cả PC và Mobile để đảm bảo responsive</li>
                    <li>• Có thể tùy chỉnh: màu sắc, font chữ, khoảng cách, hiệu ứng, v.v.</li>
                  </ul>
                </div>

                {globalSettings.customCSS && (
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn xóa toàn bộ Custom CSS?')) {
                        const newSettings = { ...globalSettings, customCSS: '' };
                        setGlobalSettings(newSettings);
                        localStorage.setItem('global_settings', JSON.stringify(newSettings));
                        alert('✅ Đã xóa Custom CSS!');
                      }
                    }}
                    className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all"
                  >
                    🗑️ Xóa toàn bộ CSS
                  </button>
                )}
              </div>
            </section>
          ) : null}
        </main>

        {/* MODAL SỬA TÊN DANH MỤC */}
        {showCategoryEditModal && editingCategory && (
          <CategoryEditModal
            categoryName={editingCategory}
            displayName={categorySettings[editingCategory]?.displayName}
            onSave={renameCategoryInSettings}
            onClose={closeCategoryEditModal}
          />
        )}

        {/* MODAL CÀI ĐẶT DANH MỤC */}
        {showCategorySettingsModal && editingCategory && (
          <CategorySettingsModal
            categoryName={editingCategory}
            settings={categorySettings[editingCategory] || {
              name: editingCategory,
              itemsPerPage: 8,
              paginationType: 'none',
              imageTransition: 'fade',
              imageInterval: 3000
            }}
            onUpdate={(updates) => updateCategorySettings(editingCategory, updates)}
            onClose={() => setShowCategorySettingsModal(false)}
            onRename={() => {
              setShowCategorySettingsModal(false);
              setShowCategoryEditModal(true);
            }}
          />
        )}

        {/* MODAL POPUP SỬA SẢN PHẨM */}
        {
          showEditModal && editingProduct && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={(e) => {
                // Only close if clicking directly on backdrop, not on modal content
                if (e.target === e.currentTarget) {
                  closeEditModal();
                }
              }}
            >
              {/* Modal Container */}
              <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-neutral-100 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
                  <h3 className="text-xl font-bold serif flex items-center gap-2">
                    <span className="w-2 h-8 bg-blue-500 rounded-full inline-block"></span>
                    {editingProduct?.id ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm mới'}
                  </h3>
                  <button
                    onClick={closeEditModal}
                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Modal Body - Form */}
                <form onSubmit={handleAddOrUpdateProduct} className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-neutral-400 ml-1">Tên sản phẩm</label>
                      <input required className="w-full border border-neutral-200 rounded-2xl px-5 py-3.5 text-sm" value={editingProduct.title || ''} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-neutral-400 ml-1">Mã sản phẩm (SKU)</label>
                      <input className="w-full border border-neutral-200 rounded-2xl px-5 py-3.5 text-sm font-mono" placeholder="VD: HOA-001" value={editingProduct.sku || ''} onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-neutral-400 ml-1">Giá gốc (đ)</label>
                      <input type="number" className="w-full border border-neutral-200 rounded-2xl px-5 py-3.5 text-sm" value={editingProduct.originalPrice || ''} onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-neutral-400 ml-1">Giá khuyến mãi (đ)</label>
                      <input type="number" className="w-full border border-neutral-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-rose-600" value={editingProduct.salePrice || ''} onChange={e => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) })} />
                    </div>
                  </div>

                  {/* Multi-Category Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 ml-1">Danh mục hiển thị (Chọn nhiều)</label>
                    <p className="text-[9px] text-neutral-500 ml-1">💡 Sản phẩm sẽ xuất hiện ở tất cả danh mục được chọn</p>
                    <div className="glass p-4 rounded-2xl grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map(cat => {
                        const selectedCats = editingProduct.categories || [editingProduct.category];
                        const isChecked = selectedCats.includes(cat);
                        return (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newCategories = [...(editingProduct.categories || [editingProduct.category].filter(Boolean))];
                                if (e.target.checked) {
                                  if (!newCategories.includes(cat)) {
                                    newCategories.push(cat);
                                  }
                                } else {
                                  newCategories = newCategories.filter(c => c !== cat);
                                }
                                // Keep first as primary category for backward compatibility
                                setEditingProduct({
                                  ...editingProduct,
                                  categories: newCategories,
                                  category: newCategories[0] || cat
                                });
                              }}
                              className="w-4 h-4 text-pink-600 bg-neutral-100 border-neutral-300 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm font-medium group-hover:text-pink-600 transition-colors">{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 ml-1">
                      📸 Hình ảnh sản phẩm (Tối đa 5 ảnh) + SEO
                    </label>
                    <p className="text-[9px] text-neutral-500 ml-1">
                      💡 Tải ảnh lên và điền thông tin SEO để tối ưu hóa tìm kiếm Google Images
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[0, 1, 2, 3, 4].map(idx => {
                        // Initialize imagesWithMetadata if not exists
                        if (!editingProduct.imagesWithMetadata) {
                          editingProduct.imagesWithMetadata = [];
                        }

                        return (
                          <ImageUploadWithMetadata
                            key={idx}
                            index={idx}
                            image={editingProduct.imagesWithMetadata[idx] || null}
                            onUpdate={(imageData) => {
                              const newImagesWithMetadata = [...(editingProduct.imagesWithMetadata || [])];
                              if (imageData) {
                                newImagesWithMetadata[idx] = imageData;
                              } else {
                                // Remove image at this index
                                newImagesWithMetadata.splice(idx, 1);
                              }

                              // Also update legacy images array for backward compatibility
                              const legacyImages = newImagesWithMetadata
                                .filter(img => img && img.url)
                                .map(img => img.url);

                              setEditingProduct({
                                ...editingProduct,
                                imagesWithMetadata: newImagesWithMetadata.filter(Boolean),
                                images: legacyImages
                              });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Footer - Actions */}
                  <div className="flex gap-4 pt-6 border-t border-neutral-100">
                    <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">Lưu thông tin</button>
                    <button type="button" onClick={closeEditModal} className="bg-neutral-100 text-neutral-600 px-10 py-4 rounded-2xl text-sm font-bold hover:bg-neutral-200 transition-all">Hủy bỏ</button>
                    {editingProduct.id && (
                      <button type="button" onClick={() => { deleteProduct(editingProduct.id!); closeEditModal(); }} className="ml-auto bg-rose-50 text-rose-500 px-6 py-4 rounded-2xl text-sm font-bold hover:bg-rose-100 transition-all">Xóa vĩnh viễn</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )
        }
      </div >
    );
  }

  // GIAO DIỆN NGƯỜI DÙNG (TRANG CHỦ)
  return (
    <div className="min-h-screen bg-pattern">
      <header className="blur-backdrop sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-neutral-600 hover:text-rose-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>

            {globalSettings.logoUrl ? (
              <>
                <img
                  src={globalSettings.logoUrl}
                  alt={globalSettings.websiteName}
                  className={`w-auto object-contain hidden sm:block ${globalSettings.logoSizeDesktop}`}
                />
                <img
                  src={globalSettings.logoUrl}
                  alt={globalSettings.websiteName}
                  className={`w-auto object-contain sm:hidden ${globalSettings.logoSizeMobile}`}
                />
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-pink rounded-2xl flex items-center justify-center shadow-lg glow-pink rotate-6">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21l-8.228-3.69L2 7l7.662-3.11a2 2 0 011.676 0L19 7l-1.772 10.31L12 21z" /></svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight gradient-text uppercase serif-display hidden sm:block">{globalSettings.websiteName}</h1>
                <h1 className="text-xl font-bold tracking-tight gradient-text uppercase serif-display sm:hidden">{globalSettings.websiteName.split(' ')[0]}</h1>
              </>
            )}
          </div>

          <nav className="hidden lg:flex gap-6 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {categories.map((cat) => (
              <a
                key={cat}
                href={`#${cat}`}
                onClick={(e) => { e.preventDefault(); scrollToCategory(cat); }}
                className="hover:text-[var(--primary-pink)] transition-all hover:scale-105 whitespace-nowrap"
              >
                {categorySettings[cat]?.displayName || cat}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 modal-backdrop-glass transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>

          {/* Drawer */}
          <div className="absolute top-0 left-0 bottom-0 w-[280px] glass-strong shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex justify-center items-center mb-8 pb-4 border-b border-white/20 relative">
              <span className="font-bold serif-display text-lg gradient-text">{globalSettings.websiteName}</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="absolute right-0 p-2 glass rounded-full hover:bg-white/30 transition-all" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>Danh mục sản phẩm</div>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className="text-left py-3 px-4 rounded-xl font-semibold glass hover:bg-gradient-soft hover:text-[var(--primary-pink)] transition-all flex justify-between items-center group"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {categorySettings[cat]?.displayName || cat}
                  <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {categories.map((category) => {
          // Support both old single category and new multiple categories
          const categoryProducts = products.filter(f => {
            if (f.categories && f.categories.length > 0) {
              return f.categories.includes(category);
            }
            return f.category === category;
          });
          if (categoryProducts.length === 0) return null;

          const settings = categorySettings[category] || {
            name: category,
            itemsPerPage: 8,
            paginationType: 'none' as PaginationType,
            imageTransition: 'fade' as ImageTransitionEffect
          };

          const currentPage = categoryPages[category] || 1;
          const currentAspectRatio = globalSettings.aspectRatio === 'custom'
            ? globalSettings.customValue.replace(/:/g, '/').replace(/x/gi, '/')
            : globalSettings.aspectRatio;

          return (
            <CategorySection
              key={category}
              category={category}
              settings={settings}
              products={categoryProducts}
              currentPage={currentPage}
              globalAspectRatio={currentAspectRatio || '3/4'}
              mediaMetadata={mediaMetadata}
              onLoadMore={() => loadMoreProducts(category)}
              onPageChange={(page) => setCategoryPages(prev => ({ ...prev, [category]: page }))}
              onImageClick={(images, index) => openLightbox(images, index)}
              showSKU={globalSettings.showSKU}
              zaloLink={globalSettings.zaloLink}
              enablePriceDisplay={globalSettings.enablePriceDisplay}
            />
          );
        })}
      </main>

      {globalSettings.enableLightbox && (
        <ImageLightbox
          images={lightboxData.images}
          initialIndex={lightboxData.index}
          isOpen={lightboxData.isOpen}
          onClose={() => setLightboxData(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      <footer className="bg-neutral-50 border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h4 className="font-bold text-xl mb-3 serif text-rose-600">{globalSettings.websiteName}</h4>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-2xl mx-auto">
            Tiệm hoa cao cấp - Nơi khởi nguồn của những cảm xúc chân thành nhất qua từng đóa hoa tươi.
          </p>
          <p className="text-neutral-400 text-xs mt-6">© 2024 {globalSettings.websiteName}. All rights reserved.</p>
        </div>
      </footer>

      {/* NÚT GỌI ĐIỆN NỔI - Phía trên */}
      <a href={`tel:${globalSettings.phoneNumber}`} className="fixed bottom-24 right-4 z-50 group">
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all relative">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
          </svg>
          <div className="absolute inset-0 w-14 h-14 bg-green-500 rounded-full animate-ping opacity-20 -z-10"></div>
        </div>
      </a>

      {/* NÚT ZALO NỔI - Phía dưới */}
      <a href={globalSettings.zaloLink} target="_blank" className="fixed bottom-6 right-4 z-50 group">
        <div className="w-14 h-14 bg-[#0068ff] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all relative">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png" className="w-9 h-9" alt="Zalo" />
          <div className="absolute inset-0 w-14 h-14 bg-[#0068ff] rounded-full animate-ping opacity-20 -z-10"></div>
        </div>
      </a>
    </div>
  );
};

export default App;
