import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 60000
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rmsr_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      toast.error('Connection timeout. Please check your internet and try again.');
      return Promise.reject(error);
    }
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    if (error.response?.status === 401) {
      localStorage.removeItem('rmsr_token');
      localStorage.removeItem('rmsr_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status !== 401) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const changePassword = (data) => API.put('/auth/change-password', data);
export const updateFcmToken = (token) => API.put('/auth/fcm-token', { fcmToken: token });

// Restaurants
export const getRestaurants = (params) => API.get('/restaurants', { params });
export const getFeaturedRestaurants = () => API.get('/restaurants/featured');
export const getRestaurant = (id) => API.get(`/restaurants/${id}`);
export const getMyRestaurant = () => API.get('/restaurants/my');
export const createRestaurant = (data) => API.post('/restaurants', data);
export const updateRestaurant = (data) => API.put('/restaurants', data);
export const toggleRestaurantStatus = () => API.patch('/restaurants/toggle-status');

// Menu
export const getMenu = (restaurantId, params) => API.get(`/menu/restaurant/${restaurantId}`, { params });
export const addMenuItem = (data) => API.post('/menu', data);
export const updateMenuItem = (id, data) => API.put(`/menu/${id}`, data);
export const deleteMenuItem = (id) => API.delete(`/menu/${id}`);
export const toggleMenuItemAvailability = (id) => API.patch(`/menu/${id}/toggle`);

// Orders
export const createOrder = (data) => API.post('/orders', data);
export const getMyOrders = (params) => API.get('/orders/my', { params });
export const getRestaurantOrders = (params) => API.get('/orders/restaurant', { params });
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => API.put(`/orders/${id}/status`, data);
export const cancelOrder = (id, data) => API.put(`/orders/${id}/cancel`, data);

// Payments
export const initiatePayment = (data) => API.post('/payments/initiate', data);

// Reviews
export const addReview = (data) => API.post('/reviews', data);
export const getRestaurantReviews = (restaurantId) => API.get(`/reviews/restaurant/${restaurantId}`);

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

// Chat
export const getChatMessages = (orderId) => API.get(`/chat/${orderId}`);
export const sendChatMessage = (data) => API.post('/chat', data);

// Loyalty
export const getLoyalty = () => API.get('/loyalty');

// Recommendations
export const getRecommendations = () => API.get('/recommendations');

// Admin
export const getAdminDashboard = () => API.get('/admin/dashboard');
export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const getAdminRestaurants = (params) => API.get('/admin/restaurants', { params });
export const getAdminOrders = (params) => API.get('/admin/orders', { params });
export const approveRestaurant = (id, approve) => API.patch(`/admin/restaurants/${id}/approve`, { approve });
export const featureRestaurant = (id, featured) => API.patch(`/admin/restaurants/${id}/feature`, { featured });
export const toggleUserStatus = (id) => API.patch(`/admin/users/${id}/toggle`);

// Rider
export const getRiderOrders = () => API.get('/rider/orders');
export const getAvailableOrders = () => API.get('/rider/available');
export const acceptRiderOrder = (id) => API.post(`/rider/orders/${id}/accept`);
export const updateRiderLocation = (data) => API.put('/rider/location', data);
export const toggleRiderOnline = () => API.patch('/rider/toggle-online');
export const getRiderStatus = () => API.get('/rider/status');


export const verifyPayment = (orderId) => API.post(`/admin/orders/${orderId}/verify-payment`);
export const rejectPayment = (orderId, reason) => API.post(`/admin/orders/${orderId}/reject-payment`, { reason });

export default API;

// Delete own account
export const deleteAccount = () => API.delete('/users/delete-account');
export const adminDeleteUser = (id) => API.delete(`/admin/users/${id}`);

// Earnings
export const getAdminEarnings = () => API.get('/admin/earnings');
export const getRestaurantEarnings = () => API.get('/restaurants/earnings');
