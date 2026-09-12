import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Code2, Plus, LogOut, LayoutDashboard, User, ChevronDown } from 'lucide-react';

export const Navbar = ({ onOpenCreateRoom, onOpenJoinRoom }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-dark-700 bg-dark-900/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center space-x-6">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg text-dark-100 tracking-tight flex items-center gap-1.5">
            CodeSync
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
          </span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition"
            >
              Dashboard
            </Link>
          </nav>
        )}
      </div>

      {/* Actions / Auth */}
      <div className="flex items-center space-x-3">
        {user ? (
          <>
            {onOpenJoinRoom && (
              <button
                onClick={onOpenJoinRoom}
                className="px-3 py-1.5 text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-800 border border-dark-700 rounded-md transition"
              >
                Join Room
              </button>
            )}

            {onOpenCreateRoom && (
              <button
                onClick={onOpenCreateRoom}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-md shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Room</span>
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
                <span className="text-sm font-medium hidden sm:inline-block max-w-[120px] truncate">
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
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
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
