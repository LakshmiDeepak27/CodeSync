import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Plus, LogOut, User, ChevronDown } from 'lucide-react';
import { BrandMark } from './BrandMark.jsx';

export const Navbar = ({ onOpenCreateRoom, onOpenJoinRoom }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-cyan-100/10 bg-[#04131d]/95 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur">
      {/* Brand */}
      <div className="flex items-center space-x-4 sm:space-x-6 min-w-0">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
          <BrandMark size={32} className="transition-transform group-hover:scale-105" />
          <span className="font-semibold text-lg text-white tracking-tight flex items-center gap-1.5">
            CodeSync
          </span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-cyan-100/5 transition"
            >
              Dashboard
            </Link>
          </nav>
        )}
      </div>

      {/* Actions / Auth */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {user ? (
          <>
            {onOpenJoinRoom && (
              <button
                onClick={onOpenJoinRoom}
                className="hidden sm:block px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-cyan-100/5 border border-cyan-100/15 rounded-md transition"
              >
                Join Room
              </button>
            )}

            {onOpenCreateRoom && (
              <button
                onClick={onOpenCreateRoom}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold text-[#062033] bg-[#82dcff] hover:bg-[#b2edff] rounded-md transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Room</span>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-dark-800 text-dark-300 hover:text-dark-100 transition border border-transparent hover:border-dark-700"
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-dark-700 border border-dark-600"
                />
                <span className="text-sm font-medium hidden md:inline-block max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-dark-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-dark-850 border border-dark-700 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-dark-750">
                      <p className="text-sm font-semibold text-dark-100 truncate">{user.name}</p>
                      <p className="text-xs text-dark-400 truncate">@{user.username}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-accent-rose hover:bg-accent-rose/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-sm font-medium text-dark-300 hover:text-dark-100 transition"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-3.5 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-md shadow transition"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
