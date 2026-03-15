import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRestaurants, getFeaturedRestaurants, getRecommendations } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiStar, FiClock, FiTruck, FiAward, FiZap } from 'react-icons/fi';
import RestaurantCard from '../../components/customer/RestaurantCard';
import './Home.css';

const CATEGORIES = [
  { name: 'Biriyani', emoji: '🍛', color: '#fff3e0' },
  { name: 'Pizza', emoji: '🍕', color: '#fce4ec' },
  { name: 'Burger', emoji: '🍔', color: '#e8f5e9' },
  { name: 'Chicken', emoji: '🍗', color: '#fff8e1' },
  { name: 'Chinese', emoji: '🍜', color: '#e3f2fd' },
  { name: 'Kebab', emoji: '🥙', color: '#f3e5f5' },
  { name: 'Dessert', emoji: '🍰', color: '#fce4ec' },
  { name: 'Drinks', emoji: '🧃', color: '#e0f7fa' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuredRes, popularRes] = await Promise.all([
        getFeaturedRestaurants(),
        getRestaurants({ sort: 'rating', limit: 8 })
      ]);
      setFeatured(featuredRes.data.restaurants);
      setPopular(popularRes.data.restaurants);

      if (user?.role === 'customer') {
        try {
          const recRes = await getRecommendations();
          setRecommendations(recRes.data.recommendations);
        } catch {}
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/restaurants?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-bg-pattern" />
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <FiZap size={14} /> Rangpur's #1 Food App
            </div>
            <h1 className="hero-title">
              Delicious Food,<br />
              <span className="hero-highlight">Delivered Fast</span>
            </h1>
            <p className="hero-subtitle">
              Order from the best restaurants in Rangpur. Fresh food at your doorstep in 30 minutes.
            </p>
            <form className="hero-search" onSubmit={handleSearch}>
              <div className="search-wrapper">
                <FiSearch className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search restaurants, cuisines, dishes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="btn btn-primary search-btn">Search</button>
              </div>
            </form>
            <div className="hero-stats">
              <div className="stat-item"><FiStar className="stat-icon" /><span><strong>4.8★</strong> Rating</span></div>
              <div className="stat-item"><FiClock className="stat-icon" /><span><strong>30min</strong> Delivery</span></div>
              <div className="stat-item"><FiTruck className="stat-icon" /><span><strong>Free</strong> on ৳500+</span></div>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="hero-img-wrapper">
              <div className="hero-circle" />
              <div className="hero-food-emoji">🍛</div>
              <div className="floating-card card-1">🍕 Pizza ৳180</div>
              <div className="floating-card card-2">🚀 30 min</div>
              <div className="floating-card card-3">⭐ 4.9</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">Browse by Category</h2>
          <Link to="/restaurants" className="see-all">See all →</Link>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              to={`/restaurants?cuisine=${cat.name}`}
              className="category-card"
              style={{ background: cat.color }}
            >
              <div className="category-emoji">{cat.emoji}</div>
              <div className="category-name">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Restaurants */}
      {featured.length > 0 && (
        <section className="section container">
          <div className="section-header">
            <h2 className="section-title">⭐ Featured Restaurants</h2>
            <Link to="/restaurants" className="see-all">View all →</Link>
          </div>
          {loading ? (
            <div className="restaurants-grid">
              {[1,2,3].map(i => <div key={i} className="restaurant-skeleton skeleton" />)}
            </div>
          ) : (
            <div className="restaurants-grid">
              {featured.map(r => <RestaurantCard key={r._id} restaurant={r} featured />)}
            </div>
          )}
        </section>
      )}

      {/* Popular Restaurants */}
      <section className="section container">
        <div className="section-header">
          <h2 className="section-title">🔥 Popular Near You</h2>
          <Link to="/restaurants" className="see-all">View all →</Link>
        </div>
        {loading ? (
          <div className="restaurants-grid">
            {[1,2,3,4].map(i => <div key={i} className="restaurant-skeleton skeleton" />)}
          </div>
        ) : popular.length === 0 ? (
          <div className="empty-state">
            <p>No restaurants available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="restaurants-grid">
            {popular.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <section className="section container">
          <div className="section-header">
            <h2 className="section-title">🤖 Recommended for You</h2>
          </div>
          <div className="recommendations-grid">
            {recommendations.slice(0, 4).map(item => (
              <Link
                key={item._id}
                to={`/restaurants/${item.restaurant._id}`}
                className="rec-card card"
              >
                <div className="rec-image">
                  {item.image
                    ? <img src={item.image} alt={item.name} />
                    : <div className="rec-placeholder">🍽️</div>
                  }
                </div>
                <div className="rec-info">
                  <div className="rec-name">{item.name}</div>
                  <div className="rec-restaurant">{item.restaurant?.name}</div>
                  <div className="rec-price">৳{item.discountedPrice || item.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why RMSR */}
      <section className="why-section">
        <div className="container">
          <h2 className="section-title text-center" style={{ marginBottom: 40 }}>Why Choose RMSR?</h2>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">🚀</div>
              <h3>Fast Delivery</h3>
              <p>Average 30 minute delivery across Rangpur city. Track your order live on map.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🎁</div>
              <h3>Loyalty Rewards</h3>
              <p>Earn points on every order. Redeem for discounts. Bronze to Platinum tiers.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">💳</div>
              <h3>bKash / Nagad / Rocket</h3>
              <p>Pay your way. All major Bangladeshi mobile banking options supported.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">⭐</div>
              <h3>Top Restaurants</h3>
              <p>Handpicked quality restaurants from across Rangpur, all verified by us.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
