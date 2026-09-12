import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { roomService } from '../services/room.js';
import {
  Code2,
  Plus,
  ArrowRight,
  Hash,
  Users,
  Search,
  Sparkles,
  Lock,
  Globe,
  Trash2,
  Calendar,
  FileCode
} from 'lucide-react';
import { ROLES } from '@codesync/shared/constants';

export const DashboardPage = ({ onOpenCreateRoom, onOpenJoinRoom }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getMyRooms();
      setRooms(data);
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      await roomService.deleteRoom(roomId);
      setRooms(rooms.filter((r) => r.id !== roomId));
    } catch (err) {
      alert(err.message || 'Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.roomCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-dark-750">
        <div>
          <h1 className="text-2xl font-bold text-dark-100 flex items-center gap-2">
            Welcome back, {user?.name || user?.username}
            <Sparkles className="w-5 h-5 text-accent-cyan" />
          </h1>
          <p className="text-xs text-dark-400 mt-1">
            Collaborate in real time, build software, and run programs in your workspaces.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenJoinRoom}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-dark-800 hover:bg-dark-750 border border-dark-700 rounded-lg text-xs font-semibold text-dark-200 hover:text-dark-100 transition shadow-sm"
          >
            <Hash className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Join Room</span>
          </button>

          <button
            onClick={onOpenCreateRoom}
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-semibold text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-dark-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rooms by name or code..."
            className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="text-xs text-dark-400">
          Showing <span className="text-dark-200 font-semibold">{filteredRooms.length}</span> {filteredRooms.length === 1 ? 'room' : 'rooms'}
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-xl bg-dark-900 border border-dark-800 animate-pulse p-5"></div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl bg-dark-900 border border-dark-800">
          <div className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center mx-auto mb-3 text-dark-400">
            <Code2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-dark-200 mb-1">
            {searchTerm ? 'No rooms match your search' : 'No coding rooms yet'}
          </h3>
          <p className="text-xs text-dark-500 max-w-sm mx-auto mb-5">
            {searchTerm
              ? 'Try searching with a different room name or code.'
              : 'Create your first collaborative coding room or join an existing session.'}
          </p>
          <button
            onClick={onOpenCreateRoom}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create your first room</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const isOwner = room.myRole === ROLES.OWNER || room.ownerId === user?.id;
            const primaryLanguage = room.files?.[0]?.language || 'cpp';

            return (
              <div
                key={room.id}
                onClick={() => navigate(`/room/${room.id}`)}
                className="group relative flex flex-col justify-between p-5 rounded-xl bg-dark-900 border border-dark-750 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition cursor-pointer"
              >
                <div>
                  {/* Top row: Code badge & Visibility */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded bg-dark-800 border border-dark-700 font-mono text-[11px] font-semibold text-brand-400">
                      #{room.roomCode}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-dark-800 text-dark-400 border border-dark-700 flex items-center gap-1">
                        {room.visibility === 'PUBLIC' ? (
                          <Globe className="w-3 h-3 text-accent-emerald" />
                        ) : (
                          <Lock className="w-3 h-3 text-accent-amber" />
                        )}
                        {room.visibility}
                      </span>

                      {isOwner && (
                        <button
                          onClick={(e) => handleDeleteRoom(room.id, e)}
                          title="Delete Room"
                          className="p-1 hover:bg-accent-rose/10 text-dark-500 hover:text-accent-rose rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Room Name & Description */}
                  <h3 className="text-base font-semibold text-dark-100 group-hover:text-brand-300 transition truncate">
                    {room.name}
                  </h3>
                  <p className="text-xs text-dark-400 line-clamp-2 mt-1 min-h-[32px]">
                    {room.description || 'Shared collaborative coding workspace.'}
                  </p>
                </div>

                {/* Bottom Meta */}
                <div className="pt-4 mt-4 border-t border-dark-800 flex items-center justify-between text-xs text-dark-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <FileCode className="w-3.5 h-3.5 text-accent-cyan" />
                      {primaryLanguage.toUpperCase()}
                    </span>

                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-dark-500" />
                      {room.members?.length || 1}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
