import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('rmsr_token');
    const savedUser = localStorage.getItem('rmsr_user');
    const savedCart = localStorage.getItem('rmsr_cart');

    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (_) {}
      fetchUser();
    } else {
      setLoading(false);
    }

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart.items || []);
        setCartRestaurant(parsedCart.restaurant || null);
      } catch (_) {}
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await getMe();
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('rmsr_user', JSON.stringify(userData));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('rmsr_token', token);
    localStorage.setItem('rmsr_user', JSON.stringify(userData));
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}! 👋`);
    return userData;
  };

  const register = async (formData) => {
    const res = await registerUser(formData);
    const { token, user: userData } = res.data;
    localStorage.setItem('rmsr_token', token);
    localStorage.setItem('rmsr_user', JSON.stringify(userData));
    setUser(userData);
    toast.success('Account created successfully! Check your email for welcome message. 🎉');
    return userData;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('rmsr_token');
    localStorage.removeItem('rmsr_user');
    setUser(null);
    setCartItems([]);
    setCartRestaurant(null);
    localStorage.removeItem('rmsr_cart');
  }, []);

  const saveCart = (items, restaurant) => {
    if (items.length === 0) {
      localStorage.removeItem('rmsr_cart');
    } else {
      localStorage.setItem('rmsr_cart', JSON.stringify({ items, restaurant }));
    }
  };

  const addToCart = (item, restaurant) => {
    if (cartRestaurant && cartRestaurant._id !== restaurant._id) {
      toast.error('Clear your cart first to order from a different restaurant');
      return false;
    }
    setCartRestaurant(restaurant);
    setCartItems(prev => {
      const existing = prev.find(i => i.menuItemId === item._id);
      let updated;
      if (existing) {
        updated = prev.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        updated = [...prev, {
          menuItemId: item._id,
          name: item.name,
          price: item.discountedPrice || item.price,
          quantity: 1,
          image: item.image || '',
          addons: []
        }];
      }
      saveCart(updated, restaurant);
      return updated;
    });
    toast.success(`${item.name} added to cart 🛒`);
    return true;
  };

  const removeFromCart = (menuItemId) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i.menuItemId !== menuItemId);
      if (updated.length === 0) {
        setCartRestaurant(null);
        localStorage.removeItem('rmsr_cart');
      } else {
        saveCart(updated, cartRestaurant);
      }
      return updated;
    });
  };

  const updateCartQuantity = (menuItemId, quantity) => {
    if (quantity < 1) { removeFromCart(menuItemId); return; }
    setCartItems(prev => {
      const updated = prev.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i);
      saveCart(updated, cartRestaurant);
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCartRestaurant(null);
    localStorage.removeItem('rmsr_cart');
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, fetchUser,
      cartItems, cartRestaurant, cartTotal, cartCount,
      addToCart, removeFromCart, updateCartQuantity, clearCart
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
