import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';

const links = [
  { to: '/create', label: 'Create Parcel' },
  { to: '/status', label: 'Live Status' },
  { to: '/scan', label: 'Scan Parcel' },
  { to: '/reset', label: 'Reset System' },
];

export const Sidebar: React.FC = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Skroutz Last Mile" className="sidebar-logo" />
      </div>
      <div className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
