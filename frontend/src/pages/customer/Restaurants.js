// src/pages/customer/Restaurants.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRestaurants } from '../../services/api';
import RestaurantCard from '../../components/customer/RestaurantCard';
import { FiSearch, FiFilter } from 'react-icons/fi';
import './Restaurants.css';

const CUISINES = ['All', 'Biriyani', 'Pizza', 'Burger', 'Chicken', 'Chinese', 'Kebab', 'Dessert', 'Drinks'];
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'deliveryTime', label: 'Fastest' },
  { value: 'deliveryFee', label: 'Lowest Delivery Fee' }
];

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');
  const [sort, setSort] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, [cuisine, sort, page]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (cuisine && cuisine !== 'All') params.cuisine = cuisine;
      if (sort) params.sort = sort;
      const res = await getRestaurants(params);
      setRestaurants(res.data.restaurants);
      setTotal(res.data.total);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRestaurants();
  };

  return (
    <div className="restaurants-page container">
      <div className="restaurants-header">
        <h1>Restaurants in Rangpur</h1>
        <p>{total} restaurants available</p>
      </div>

      <div className="restaurants-controls">
        <form className="search-bar" onSubmit={handleSearch}>
          <FiSearch className="search-icon-sm" />
          <input
            type="text"
            placeholder="Search restaurants or dishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input with-icon"
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <select className="form-input sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="cuisine-filters">
        {CUISINES.map(c => (
          <button
            key={c}
            className={`cuisine-filter-btn ${(cuisine === c || (c === 'All' && !cuisine)) ? 'active' : ''}`}
            onClick={() => { setCuisine(c === 'All' ? '' : c); setPage(1); }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="restaurants-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="restaurant-skeleton skeleton" style={{ height: 280 }} />)}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 60 }}>🍽️</div>
          <h3>No restaurants found</h3>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
        </div>
      )}

      {total > 12 && (
        <div className="pagination">
          {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
