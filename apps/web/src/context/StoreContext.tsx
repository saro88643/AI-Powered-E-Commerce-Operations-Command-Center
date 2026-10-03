import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  product_id: string;
  sku?: string;
  name: string;
  price: number;
  original_price?: number;
  image?: string;
  quantity: number;
  category?: string;
  totalStock?: number;
}

export interface CustomerAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface StoreNotification {
  id: string;
  customer_id: string;
  order_number?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: any, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  savedAddress: CustomerAddress;
  setSavedAddress: (addr: CustomerAddress) => void;
  notifications: StoreNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  recentViewed: any[];
  addRecentViewed: (product: any) => void;
}

const defaultAddress: CustomerAddress = {
  name: 'Aarav Sharma',
  phone: '+91 98765 43210',
  address: 'Flat 402, Ramanuja Enclave, 124 Gandhipuram',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  pincode: '641012'
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cart state persisted to localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shopsphere_customer_cart');
      return saved ? JSON.parse(saved) : [
        {
          product_id: 'P-204',
          sku: 'AP-FIT-204',
          name: 'Wireless Keyboard P-204 & AeroPulse Smart Controller',
          price: 3499.0,
          original_price: 4999.0,
          image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          quantity: 1,
          category: 'Electronics',
          totalStock: 524
        }
      ];
    } catch {
      return [];
    }
  });

  const [savedAddress, setSavedAddressState] = useState<CustomerAddress>(() => {
    try {
      const saved = localStorage.getItem('shopsphere_customer_address');
      return saved ? JSON.parse(saved) : defaultAddress;
    } catch {
      return defaultAddress;
    }
  });

  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [recentViewed, setRecentViewed] = useState<any[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('shopsphere_customer_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const setSavedAddress = (addr: CustomerAddress) => {
    setSavedAddressState(addr);
    try {
      localStorage.setItem('shopsphere_customer_address', JSON.stringify(addr));
    } catch {}
  };

  const refreshNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?customerId=CUST-0001');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.warn('Error marking notification read:', e);
    }
  };

  const addToCart = (product: any, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          sku: product.sku || product.product_id,
          name: product.name,
          price: product.price,
          original_price: product.original_price || Math.round(product.price * 1.2),
          image: product.image,
          quantity: qty,
          category: product.category,
          totalStock: product.totalStock || 100
        }
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product_id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const addRecentViewed = (product: any) => {
    setRecentViewed(prev => {
      const filtered = prev.filter(p => p.product_id !== product.product_id);
      return [product, ...filtered].slice(0, 6);
    });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.18);
  const cartTotal = cartSubtotal + (cartSubtotal > 499 ? 0 : 50);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartTax,
        cartTotal,
        savedAddress,
        setSavedAddress,
        notifications,
        unreadCount,
        refreshNotifications,
        markNotificationRead,
        recentViewed,
        addRecentViewed
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
