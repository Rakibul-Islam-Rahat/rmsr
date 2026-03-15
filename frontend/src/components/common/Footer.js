import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main container">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="footer-logo-icon">R</div>
            <span>RMSR Food</span>
          </div>
          <p className="footer-tagline">
            Rangpur's favourite food delivery platform. Fresh food, fast delivery, right to your door.
          </p>
          <div className="footer-socials">
            <a href="#!" className="social-link"><FiFacebook /></a>
            <a href="#!" className="social-link"><FiInstagram /></a>
            <a href="#!" className="social-link"><FiTwitter /></a>
          </div>
        </div>

        <div className="footer-links-col">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/restaurants">Restaurants</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/loyalty">Loyalty Points</Link>
        </div>

        <div className="footer-links-col">
          <h4>Join Us</h4>
          <Link to="/register">Customer Sign Up</Link>
          <Link to="/register">Partner Restaurant</Link>
          <Link to="/register">Become a Rider</Link>
        </div>

        <div className="footer-links-col">
          <h4>Contact</h4>
          <div className="footer-contact-item">
            <FiMapPin size={14} />
            <span>Rangpur City, Bangladesh</span>
          </div>
          <div className="footer-contact-item">
            <FiPhone size={14} />
            <span>+880 1794-558994</span>
          </div>
          <div className="footer-contact-item">
            <FiMail size={14} />
            <span>cse12105026brur@gmail.com</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} RMSR Food Delivery. All rights reserved.</span>
          <span>Made with ❤️ in Rangpur, Bangladesh</span>
        </div>
      </div>
    </footer>
  );
}
