import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRestaurant, getMenu, getRestaurantReviews } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiStar, FiClock, FiTruck, FiPhone, FiMapPin, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './RestaurantDetail.css';

export default function RestaurantDetail() {
  const { id } = useParams();
  const { addToCart, cartCount } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeTab, setActiveTab] = useState('menu');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [restRes, menuRes, reviewRes] = await Promise.all([
        getRestaurant(id),
        getMenu(id),
        getRestaurantReviews(id)
      ]);
      setRestaurant(restRes.data.restaurant);
      setMenu(menuRes.data.grouped);
      setReviews(reviewRes.data.reviews);
      const cats = Object.keys(menuRes.data.grouped);
      if (cats.length > 0) setActiveCategory(cats[0]);
    } catch {}
    finally { setLoading(false); }
  };

  const handleAddToCart = (item) => {
    const success = addToCart(item, restaurant);
    if (success) {
      setQuantities(prev => ({ ...prev, [item._id]: (prev[item._id] || 0) + 1 }));
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!restaurant) return <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}><h3>Restaurant not found</h3></div>;

  const categories = Object.keys(menu);

  return (
    <div className="restaurant-detail">
      {/* Cover */}
      <div className="detail-cover">
        {restaurant.coverImage
          ? <img src={restaurant.coverImage} alt={restaurant.name} className="cover-img" />
          : <div className="cover-placeholder">🍽️</div>
        }
        <div className="cover-overlay" />
        <div className="cover-info container">
          <div className="restaurant-detail-logo">
            {restaurant.logo
              ? <img src={restaurant.logo} alt={restaurant.name} />
              : <span>{restaurant.name.charAt(0)}</span>
            }
          </div>
          <div>
            <h1 className="detail-name">{restaurant.name}</h1>
            <p className="detail-cuisine">{restaurant.cuisine?.join(' • ')}</p>
            <div className="detail-meta">
              <span><FiStar className="star-icon" /> {restaurant.rating?.average > 0 ? restaurant.rating.average.toFixed(1) : 'New'} ({restaurant.rating?.count} reviews)</span>
              <span><FiClock size={14} /> {restaurant.deliveryTime?.min}–{restaurant.deliveryTime?.max} min</span>
              <span><FiTruck size={14} /> Delivery ৳{restaurant.deliveryFee}</span>
              <span><FiMapPin size={14} /> {restaurant.address?.area}, {restaurant.address?.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container detail-body">
        {/* Tabs */}
        <div className="detail-tabs">
          {['menu', 'reviews', 'info'].map(tab => (
            <button
              key={tab}
              className={`detail-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reviews' && reviews.length > 0 && ` (${reviews.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'menu' && (
          <div className="menu-layout">
            {/* Category sidebar */}
            <div className="category-sidebar">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`category-nav-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                  <span className="cat-count">{menu[cat]?.length}</span>
                </button>
              ))}
            </div>

            {/* Menu items */}
            <div className="menu-items-area">
              {categories.map(cat => (
                <div key={cat} id={`cat-${cat}`} className="menu-category-section">
                  <h3 className="menu-cat-title">{cat}</h3>
                  <div className="menu-items-list">
                    {menu[cat]?.map(item => (
                      <div key={item._id} className={`menu-item-card card ${!item.isAvailable ? 'unavailable' : ''}`}>
                        <div className="menu-item-image">
                          {item.image
                            ? <img src={item.image} alt={item.name} />
                            : <div className="menu-img-placeholder">🍽️</div>
                          }
                          {item.isBestseller && <span className="bestseller-tag">Bestseller</span>}
                          {item.isVeg && <span className="veg-tag">🌱 Veg</span>}
                        </div>
                        <div className="menu-item-info">
                          <div className="menu-item-header">
                            <h4 className="menu-item-name">{item.name}</h4>
                            {item.isSpicy && <span className="spicy-tag">🌶️</span>}
                          </div>
                          {item.description && <p className="menu-item-desc">{item.description}</p>}
                          <div className="menu-item-footer">
                            <div className="menu-item-price">
                              {item.discountedPrice && item.discountedPrice < item.price ? (
                                <>
                                  <span className="price-current">৳{item.discountedPrice}</span>
                                  <span className="price-original">৳{item.price}</span>
                                </>
                              ) : (
                                <span className="price-current">৳{item.price}</span>
                              )}
                            </div>
                            {item.isAvailable ? (
                              <button className="add-btn" onClick={() => handleAddToCart(item)}>
                                <FiPlus /> Add
                              </button>
                            ) : (
                              <span className="unavailable-tag">Unavailable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="empty-state">
                  <p>No menu items yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-section">
            {reviews.length === 0 ? (
              <div className="empty-state"><p>No reviews yet. Be the first to review!</p></div>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="review-card card">
                  <div className="review-header">
                    <div className="reviewer-avatar">{review.customer?.name?.charAt(0)}</div>
                    <div>
                      <div className="reviewer-name">{review.customer?.name}</div>
                      <div className="review-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiStar key={i} className={i < review.rating ? 'star-filled' : 'star-empty'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-section">
            <div className="info-card card">
              <h3>Contact & Location</h3>
              <p><FiPhone /> {restaurant.phone}</p>
              <p><FiMapPin /> {restaurant.address?.street}, {restaurant.address?.area}, {restaurant.address?.city}</p>
            </div>
            {restaurant.description && (
              <div className="info-card card">
                <h3>About</h3>
                <p>{restaurant.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating cart */}
      {cartCount > 0 && (
        <div className="floating-cart-bar">
          <span>{cartCount} items in cart</span>
          <Link to="/cart" className="btn btn-primary">View Cart →</Link>
        </div>
      )}
    </div>
  );
}
