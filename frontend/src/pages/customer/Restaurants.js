import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRestaurants } from '../../services/api';
import RestaurantCard from '../../components/customer/RestaurantCard';
import { FiSearch, FiX } from 'react-icons/fi';
import './Restaurants.css';

const CUISINES = ['All', 'Biriyani', 'Pizza', 'Burger', 'Chicken', 'Chinese', 'Kebab', 'Dessert', 'Drinks'];
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'deliveryTime', label: 'Fastest' },
  { value: 'deliveryFee', label: 'Lowest Delivery Fee' }
];

export default function Restaurants() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');
  const [sort, setSort] = useState('');

  // Autocomplete
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchRestaurants();
  }, [cuisine, sort, page]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const handleSearchInput = (value) => {
    setSearch(value);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await getRestaurants({ search: value.trim(), limit: 5 });
        const rests = (res.data.restaurants || []).map(r => ({
          type: 'restaurant', id: r._id,
          name: r.name,
          sub: r.cuisine?.join(', ') || 'Restaurant',
          icon: r.logo
            ? <img src={r.logo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            : '🍽️',
          iconIsImg: !!r.logo
        }));
        const cuisines = ['Biriyani','Pizza','Burger','Chicken','Chinese','Kebab','Dessert','Drinks'];
        const cuisineMatches = cuisines
          .filter(c => c.toLowerCase().includes(value.toLowerCase()))
          .map(c => ({ type: 'cuisine', name: c, sub: 'Browse cuisine', icon: '🔍' }));
        const all = [...rests, ...cuisineMatches].slice(0, 7);
        setSuggestions(all);
        setShowSuggestions(all.length > 0);
      } catch {}
      finally { setSuggestLoading(false); }
    }, 300);
  };

  const handleSuggestionClick = (s) => {
    setShowSuggestions(false);
    if (s.type === 'restaurant') {
      navigate(`/restaurants/${s.id}`);
    } else {
      setCuisine(s.name);
      setSearch('');
      setSuggestions([]);
      setPage(1);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setPage(1);
    fetchRestaurants();
  };

  const clearSearch = () => {
    setSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setPage(1);
  };

  return (
    <div className="restaurants-page container">
      <div className="restaurants-header">
        <h1>Restaurants in Rangpur</h1>
        <p>{total} restaurants available</p>
      </div>

      <div className="restaurants-controls">
        {/* Search with autocomplete */}
        <div ref={searchRef} style={{ position: 'relative', flex: 1 }}>
          <form className="search-bar" onSubmit={handleSearch}>
            <FiSearch className="search-icon-sm" />
            <input
              type="text"
              placeholder="Search restaurants, dishes or cuisines..."
              value={search}
              onChange={e => handleSearchInput(e.target.value)}
              onFocus={() => search.trim() && setShowSuggestions(suggestions.length > 0)}
              className="form-input with-icon"
              autoComplete="off"
            />
            {search && (
              <button type="button" className="search-clear" onClick={clearSearch}>
                <FiX size={14} />
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div className="restaurants-autocomplete">
              {suggestLoading && (
                <div className="autocomplete-item loading">Searching...</div>
              )}
              {!suggestLoading && suggestions.map((s, i) => (
                <div
                  key={i}
                  className="autocomplete-item"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  <span className="autocomplete-icon">
                    {s.iconIsImg ? s.icon : s.icon}
                  </span>
                  <div className="autocomplete-text">
                    <div className="autocomplete-name">{s.name}</div>
                    <div className="autocomplete-sub">{s.sub}</div>
                  </div>
                  <span className="autocomplete-type">{s.type}</span>
                </div>
              ))}
              <div
                className="autocomplete-item autocomplete-all"
                onMouseDown={() => { setShowSuggestions(false); setPage(1); fetchRestaurants(); }}
              >
                <FiSearch size={13} />
                <span>Search all for "<strong>{search}</strong>"</span>
              </div>
            </div>
          )}
        </div>

        <select
          className="form-input sort-select"
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
        >
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
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="restaurant-skeleton skeleton" style={{ height: 280 }} />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 60 }}>🍽️</div>
          <h3>No restaurants found</h3>
          <p>Try a different search or category</p>
          {(search || cuisine) && (
            <button className="btn btn-outline" style={{ marginTop: 12 }}
              onClick={() => { clearSearch(); setCuisine(''); }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
        </div>
      )}

      {total > 12 && (
        <div className="pagination">
          {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`}
              onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
