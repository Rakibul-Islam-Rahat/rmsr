import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiClock, FiTruck } from 'react-icons/fi';
import './RestaurantCard.css';

export default function RestaurantCard({ restaurant, featured }) {
  const {
    _id, name, logo, coverImage, cuisine, rating,
    deliveryTime, deliveryFee, minimumOrder, isActive, isFeatured, tags
  } = restaurant;

  return (
    <Link to={`/restaurants/${_id}`} className={`restaurant-card card ${featured ? 'featured' : ''}`}>
      <div className="restaurant-cover">
        {coverImage || logo
          ? <img src={coverImage || logo} alt={name} />
          : <div className="restaurant-cover-placeholder">🍽️</div>
        }
        {isFeatured && <div className="featured-badge">⭐ Featured</div>}
        {!isActive && <div className="closed-overlay">Closed</div>}
      </div>

      <div className="restaurant-body">
        <div className="restaurant-header">
          <div className="restaurant-logo-small">
            {logo ? <img src={logo} alt={name} /> : <span>{name.charAt(0)}</span>}
          </div>
          <div className="restaurant-info">
            <h3 className="restaurant-name">{name}</h3>
            <div className="restaurant-cuisine">
              {cuisine?.slice(0, 3).join(' • ')}
            </div>
          </div>
        </div>

        <div className="restaurant-meta">
          <div className="meta-item">
            <FiStar className="star-icon" />
            <span>{rating?.average > 0 ? rating.average.toFixed(1) : 'New'}</span>
            {rating?.count > 0 && <span className="rating-count">({rating.count})</span>}
          </div>
          <div className="meta-item">
            <FiClock size={13} />
            <span>{deliveryTime?.min}–{deliveryTime?.max} min</span>
          </div>
          <div className="meta-item">
            <FiTruck size={13} />
            <span>{deliveryFee === 0 ? 'Free delivery' : `৳${deliveryFee}`}</span>
          </div>
        </div>

        <div className="restaurant-footer">
          <span className="min-order">Min. ৳{minimumOrder}</span>
          {tags?.slice(0, 2).map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
