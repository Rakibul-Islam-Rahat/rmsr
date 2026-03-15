// src/pages/customer/Loyalty.js
import React, { useState, useEffect } from 'react';
import { getLoyalty } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiAward, FiStar } from 'react-icons/fi';
import './Loyalty.css';

const TIERS = {
  bronze: { label: 'Bronze', color: '#cd7f32', min: 0, max: 499, next: 'Silver', icon: '🥉' },
  silver: { label: 'Silver', color: '#c0c0c0', min: 500, max: 1999, next: 'Gold', icon: '🥈' },
  gold: { label: 'Gold', color: '#ffd700', min: 2000, max: 4999, next: 'Platinum', icon: '🥇' },
  platinum: { label: 'Platinum', color: '#e5e4e2', min: 5000, max: Infinity, next: null, icon: '💎' }
};

export default function Loyalty() {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLoyalty(); }, []);

  const fetchLoyalty = async () => {
    try {
      const res = await getLoyalty();
      setLoyalty(res.data.loyalty);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  const tier = TIERS[loyalty?.tier || 'bronze'];
  const progress = loyalty ? Math.min(100, ((loyalty.totalPointsEarned - tier.min) / (tier.max - tier.min)) * 100) : 0;

  return (
    <div className="loyalty-page container">
      <h1 className="page-title">Loyalty Rewards</h1>
      <div className="loyalty-layout">
        <div className="loyalty-card card" style={{ borderTop: `4px solid ${tier.color}` }}>
          <div className="loyalty-tier-icon">{tier.icon}</div>
          <div className="loyalty-tier-label" style={{ color: tier.color }}>{tier.label} Member</div>
          <div className="loyalty-points-big">{user?.loyaltyPoints || 0}</div>
          <div className="loyalty-points-label">Available Points</div>
          <div className="loyalty-divider" />
          <div className="loyalty-info-row"><span>Total Earned</span><span>{loyalty?.totalPointsEarned || 0} pts</span></div>
          <div className="loyalty-info-row"><span>Total Redeemed</span><span>{loyalty?.totalPointsRedeemed || 0} pts</span></div>
          {tier.next && (
            <div className="loyalty-progress-section">
              <div className="loyalty-progress-label">Progress to {tier.next}</div>
              <div className="loyalty-progress-bar"><div className="loyalty-progress-fill" style={{ width: `${progress}%`, background: tier.color }} /></div>
              <div className="loyalty-progress-text">{loyalty?.totalPointsEarned || 0} / {tier.max + 1} points</div>
            </div>
          )}
        </div>

        <div className="loyalty-right">
          <div className="how-it-works card">
            <h3>How it works</h3>
            <div className="how-item"><div className="how-icon">🛒</div><div><strong>Earn points</strong><p>Get 1 point for every ৳10 spent on orders</p></div></div>
            <div className="how-item"><div className="how-icon">💰</div><div><strong>Redeem discounts</strong><p>100 points = ৳10 discount on your next order</p></div></div>
            <div className="how-item"><div className="how-icon">⬆️</div><div><strong>Level up</strong><p>Bronze → Silver (500pts) → Gold (2000pts) → Platinum (5000pts)</p></div></div>
          </div>

          <div className="loyalty-history card">
            <h3>Transaction History</h3>
            {loyalty?.transactions?.length === 0 ? (
              <p className="no-history">No transactions yet. Start ordering to earn points!</p>
            ) : (
              <div className="history-list">
                {loyalty?.transactions?.slice(-10).reverse().map((t, i) => (
                  <div key={i} className="history-item">
                    <div className={`history-icon ${t.type}`}>{t.type === 'earned' ? '+' : '-'}</div>
                    <div className="history-desc">{t.description}</div>
                    <div className={`history-pts ${t.type}`}>{t.type === 'earned' ? '+' : '-'}{t.points} pts</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
