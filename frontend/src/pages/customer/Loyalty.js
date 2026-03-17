import React, { useState, useEffect } from 'react';
import { getLoyalty } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiAward } from 'react-icons/fi';
import CustomerSidebar from './CustomerSidebar';
import './CustomerDashboard.css';
import './Loyalty.css';

const TIERS = {
  bronze:   { label: 'Bronze',   color: '#cd7f32', min: 0,    max: 499,      next: 'Silver',   icon: '🥉' },
  silver:   { label: 'Silver',   color: '#aaa',    min: 500,  max: 1999,     next: 'Gold',     icon: '🥈' },
  gold:     { label: 'Gold',     color: '#ffd700', min: 2000, max: 4999,     next: 'Platinum', icon: '🥇' },
  platinum: { label: 'Platinum', color: '#8b9dc3', min: 5000, max: Infinity, next: null,       icon: '💎' }
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tier = TIERS[loyalty?.tier || 'bronze'];

  const progress = loyalty && tier.max !== Infinity
    ? Math.min(
        100,
        ((loyalty.totalPointsEarned - tier.min) / (tier.max - tier.min)) * 100
      )
    : 100;

  return (
    <div className="customer-dashboard">
      <CustomerSidebar />

      <div className="customer-main">
        <div className="customer-topbar">
          <h1 className="customer-page-title">Loyalty Rewards</h1>
        </div>

        <div className="customer-content">

          {loading ? (
            <div className="page-loader">
              <div className="spinner" />
            </div>
          ) : (

            <div className="loyalty-layout">

              {/* Tier Card */}
              <div
                className="loyalty-card card"
                style={{ borderTop: `4px solid ${tier.color}` }}
              >
                <div className="loyalty-tier-icon">{tier.icon}</div>

                <div
                  className="loyalty-tier-label"
                  style={{ color: tier.color }}
                >
                  {tier.label} Member
                </div>

                <div className="loyalty-points-big">
                  {user?.loyaltyPoints || 0}
                </div>

                <div className="loyalty-points-label">
                  Available Points
                </div>

                <div className="loyalty-divider" />

                <div className="loyalty-info-row">
                  <span>Total Earned</span>
                  <span>{loyalty?.totalPointsEarned || 0} pts</span>
                </div>

                <div className="loyalty-info-row">
                  <span>Total Redeemed</span>
                  <span>{loyalty?.totalPointsRedeemed || 0} pts</span>
                </div>

                {tier.next && (
                  <div className="loyalty-progress-section">
                    <div className="loyalty-progress-label">
                      Progress to {tier.next}
                    </div>

                    <div className="loyalty-progress-bar">
                      <div
                        className="loyalty-progress-fill"
                        style={{
                          width: `${progress}%`,
                          background: tier.color
                        }}
                      />
                    </div>

                    <div className="loyalty-progress-text">
                      {loyalty?.totalPointsEarned || 0} / {tier.max + 1} points
                    </div>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="loyalty-info card">
                <h3>
                  <FiAward size={18} /> How Loyalty Points Work
                </h3>

                <div className="loyalty-rules">

                  <div className="loyalty-rule">
                    <span className="rule-icon">🛍️</span>
                    <div>
                      <strong>Earn Points</strong>
                      <p>Get 1 point for every ৳10 spent on orders</p>
                    </div>
                  </div>

                  <div className="loyalty-rule">
                    <span className="rule-icon">💰</span>
                    <div>
                      <strong>Redeem Points</strong>
                      <p>Use points at checkout — 10 points = ৳1 off</p>
                    </div>
                  </div>

                  <div className="loyalty-rule">
                    <span className="rule-icon">🏆</span>
                    <div>
                      <strong>Tier Rewards</strong>
                      <p>Higher tiers unlock better discounts and perks</p>
                    </div>
                  </div>

                </div>

                <div
                  style={{
                    marginBottom: 14,
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px'
                  }}
                >
                  Membership Tiers
                </div>

                <div className="loyalty-tiers">
                  {Object.entries(TIERS).map(([key, t]) => {
                    const isCurrent = (loyalty?.tier || 'bronze') === key;

                    return (
                      <div
                        key={key}
                        className={`loyalty-tier-row ${isCurrent ? 'current' : ''}`}
                        style={{ borderLeft: `4px solid ${t.color}` }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {t.icon} {t.label}
                          {isCurrent && (
                            <span className="tier-badge">Current</span>
                          )}
                        </span>

                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: 13
                          }}
                        >
                          {t.max === Infinity
                            ? `${t.min.toLocaleString()}+ pts`
                            : `${t.min.toLocaleString()}–${t.max.toLocaleString()} pts`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          )}

        </div>
      </div>
    </div>
  );
}