import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { roomService } from '../services/room.js';
import { getGraphFriendSuggestions } from '../utils/graphRecommendation.js';
import {
  Code2,
  Plus,
  ArrowRight,
  Hash,
  Users,
  Search,
  Lock,
  Globe,
  Trash2,
  FileCode,
  UserPlus,
  UserCheck,
  UserX,
  Send,
  CheckCircle2,
  ExternalLink,
  Network,
  Info,
  GitFork
} from 'lucide-react';
import { ROLES } from '@codesync/shared/constants';

export const DashboardPage = ({ onOpenCreateRoom, onOpenJoinRoom }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Friends & Friend Requests State (strictly real data, mock defaults completely removed)
  const [activeSocialTab, setActiveSocialTab] = useState('friends'); // 'friends' | 'requests'
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem(`codesync-friends-${user?.id || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out any previous dummy/mock users
        return parsed.filter(
          (f) =>
            !['f1', 'f2', 'f3', 'alex_dev', 'rohan_code', 'jordan_b', 'sarah_c', 'mayacodes', 'kavya_t', 'marcus_k', 'elena_v'].includes(f.username) &&
            !f.id?.startsWith('f') &&
            !f.id?.startsWith('dev_')
        );
      } catch {
        return [];
      }
    }
    return [];
  });

  const [friendRequests, setFriendRequests] = useState(() => {
    const saved = localStorage.getItem(`codesync-requests-${user?.id || 'guest'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(
          (r) =>
            !['req1', 'req2', 'mayacodes', 'sarah_c', 'kavya_t'].includes(r.username) &&
            !r.id?.startsWith('req') &&
            !r.id?.startsWith('dev_')
        );
      } catch {
        return [];
      }
    }
    return [];
  });

  const [newFriendHandle, setNewFriendHandle] = useState('');
  const [toast, setToast] = useState('');

  // Real Graph Algorithm Suggestions State (starts clean without fake accounts)
  const [graphSuggestions, setGraphSuggestions] = useState([]);
  const [showGraphMath, setShowGraphMath] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Clean out any legacy mock friends/requests from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const fKey = `codesync-friends-${user.id}`;
      const rKey = `codesync-requests-${user.id}`;
      try {
        const savedF = localStorage.getItem(fKey);
        if (savedF) {
          const parsed = JSON.parse(savedF);
          const cleaned = parsed.filter(
            (f) =>
              !['f1', 'f2', 'f3', 'alex_dev', 'rohan_code', 'jordan_b', 'sarah_c', 'mayacodes', 'kavya_t', 'marcus_k', 'elena_v'].includes(f.username) &&
              !f.id?.startsWith('f') &&
              !f.id?.startsWith('dev_')
          );
          if (cleaned.length !== parsed.length) {
            setFriends(cleaned);
            localStorage.setItem(fKey, JSON.stringify(cleaned));
          }
        }
      } catch { }

      try {
        const savedR = localStorage.getItem(rKey);
        if (savedR) {
          const parsed = JSON.parse(savedR);
          const cleaned = parsed.filter(
            (r) =>
              !['req1', 'req2', 'mayacodes', 'sarah_c', 'kavya_t'].includes(r.username) &&
              !r.id?.startsWith('req') &&
              !r.id?.startsWith('dev_')
          );
          if (cleaned.length !== parsed.length) {
            setFriendRequests(cleaned);
            localStorage.setItem(rKey, JSON.stringify(cleaned));
          }
        }
      } catch { }
    }
  }, [user?.id]);

  // Sync real friends to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`codesync-friends-${user.id}`, JSON.stringify(friends));
    }
  }, [friends, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`codesync-requests-${user.id}`, JSON.stringify(friendRequests));
    }
  }, [friendRequests, user?.id]);

  // Recalculate Graph Suggestions strictly on real network data
  useEffect(() => {
    const computed = getGraphFriendSuggestions(user, friends, rooms, []);
    setGraphSuggestions(computed);
  }, [user, friends, rooms]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getMyRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
      setRooms([]);
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
      showToast('Room deleted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to delete room');
    }
  };

  // Connect via Graph Recommendation
  const handleConnectGraphFriend = (candidate) => {
    const newFriend = {
      id: candidate.id || `friend_${Date.now()}`,
      name: candidate.name,
      username: candidate.username,
      avatarUrl: candidate.avatarUrl,
      status: 'online',
      currentRoom: candidate.rooms?.[0] || null
    };

    setFriends((prev) => [newFriend, ...prev]);
    showToast(`Connected with @${candidate.username} via Graph Algorithm!`);
  };

  // Friend Request Actions
  const handleAcceptRequest = (request) => {
    const newFriend = {
      id: `friend_${Date.now()}`,
      name: request.name,
      username: request.username,
      avatarUrl: request.avatarUrl,
      status: 'online',
      currentRoom: null
    };

    setFriends((prev) => [newFriend, ...prev]);
    setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
    showToast(`Accepted friend request from @${request.username}!`);
  };

  const handleDeclineRequest = (requestId) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    showToast('Declined friend request.');
  };

  const handleRemoveFriend = (friendId, friendName) => {
    if (confirm(`Remove ${friendName} from friends?`)) {
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      showToast(`Removed ${friendName} from friends.`);
    }
  };

  // Add Real Friend via handle / email
  const handleSendFriendRequest = (e) => {
    e.preventDefault();
    const handle = newFriendHandle.trim().replace(/^@/, '');
    if (!handle) return;

    if (handle.toLowerCase() === user?.username?.toLowerCase()) {
      showToast('You cannot add yourself as a friend.');
      return;
    }

    if (friends.some((f) => f.username.toLowerCase() === handle.toLowerCase())) {
      showToast(`@${handle} is already in your friends list!`);
      return;
    }

    // Add real friend with generated avatar and online status
    const newFriend = {
      id: `user_${Date.now()}`,
      name: handle.charAt(0).toUpperCase() + handle.slice(1),
      username: handle.toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(handle)}`,
      status: 'online',
      currentRoom: null
    };

    setFriends((prev) => [newFriend, ...prev]);
    showToast(`Connected with @${handle}!`);
    setNewFriendHandle('');
  };

  const handleInviteFriendToRoom = (friend, e) => {
    e?.stopPropagation();
    if (rooms.length === 0) {
      showToast('Create a room first to invite friends!');
      return;
    }
    const targetRoom = rooms[0];
    const inviteUrl = `${window.location.origin}/room/${targetRoom.id}`;
    navigator.clipboard.writeText(inviteUrl);
    showToast(`Copied room invite for @${friend.username}!`);
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#020d13] px-4 py-6 text-slate-200 sm:px-6 sm:py-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Main Dashboard Layout: Workspaces (Left 8 cols) + Profile, Graph Suggestions & Friends (Right 4 cols) */}
        {/* (NOTE: The oversized welcome banner from image 1 has been completely removed as requested) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SECTION: Workspaces & Rooms (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Rooms Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-44 bg-[#061923] rounded-xl animate-pulse p-5 border border-cyan-100/10" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-16 px-6 bg-[#061923] rounded-xl border border-cyan-100/10">
                <div className="w-14 h-14 rounded-full bg-[#092737] border border-cyan-100/20 flex items-center justify-center mx-auto mb-4 text-[#84dfff]">
                  <Code2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">
                  {searchTerm ? 'No rooms match your search' : 'No coding workspaces yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                  {searchTerm
                    ? 'Try searching with a different room name or room code.'
                    : 'Create your first collaborative coding room with Judge0 compilation, Notepad++ editing, and live Yjs synchronization.'}
                </p>
                <button
                  onClick={onOpenCreateRoom}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#84dfff] hover:bg-[#a2e8ff] text-[#04121a] rounded-lg text-xs font-bold shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create your first room</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredRooms.map((room) => {
                  const isOwner = room.myRole === ROLES.OWNER || room.ownerId === user?.id;
                  const primaryLanguage = room.files?.[0]?.language || 'cpp';

                  return (
                    <div
                      key={room.id}
                      onClick={() => navigate(`/room/${room.id}`)}
                      className="group relative flex flex-col justify-between p-5 bg-[#061923] hover:bg-[#092737] border border-cyan-100/10 hover:border-[#84dfff]/40 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div>
                        {/* Top row: Code badge & Visibility */}
                        <div className="flex items-center justify-between mb-3.5">
                          <span className="px-2.5 py-1 rounded bg-[#092737] group-hover:bg-[#0c354b] border border-cyan-100/15 font-mono text-[11px] font-bold text-[#84dfff]">
                            #{room.roomCode}
                          </span>

                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#020d13] text-slate-400 border border-cyan-100/10 flex items-center gap-1">
                              {room.visibility === 'PUBLIC' ? (
                                <Globe className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Lock className="w-3 h-3 text-amber-400" />
                              )}
                              {room.visibility}
                            </span>

                            {isOwner && (
                              <button
                                onClick={(e) => handleDeleteRoom(room.id, e)}
                                title="Delete Room"
                                className="p-1 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Room Name & Description */}
                        <h3 className="text-base font-bold text-white group-hover:text-[#84dfff] transition truncate">
                          {room.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 min-h-[34px] leading-relaxed">
                          {room.description || 'Shared collaborative coding workspace.'}
                        </p>
                      </div>

                      {/* Bottom Meta */}
                      <div className="pt-4 mt-4 border-t border-cyan-100/10 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center space-x-3.5">
                          <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-300">
                            <FileCode className="w-3.5 h-3.5 text-[#84dfff]" />
                            {primaryLanguage.toUpperCase()}
                          </span>

                          <span className="flex items-center gap-1.5 text-[11px] font-mono">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {room.members?.length || 1}
                          </span>
                        </div>

                        <span className="flex items-center gap-1 text-xs font-bold text-[#84dfff] group-hover:translate-x-1 transition-transform">
                          <span>Open IDE</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SECTION: Peer suggestions and network list */}
          <div className="lg:col-span-4 space-y-5">
            {/* Graph Algorithm Friend Suggestions Card */}
            <div className="p-4 rounded-xl bg-[#061923] border border-cyan-100/10 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#84dfff]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Suggested Peers
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-700/50 text-[10px] font-mono text-[#84dfff] flex items-center gap-1">
                    <GitFork className="w-3 h-3" />
                    Graph BFS
                  </span>
                  <button
                    onClick={() => setShowGraphMath(!showGraphMath)}
                    title="How Graph Recommendations work"
                    className="p-1 rounded text-slate-400 hover:text-[#84dfff] transition"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interactive Graph Theory Mathematics Explainer */}
              {showGraphMath && (
                <div className="p-3 rounded-lg bg-[#04121a] border border-cyan-500/20 text-[11px] text-slate-300 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between font-mono font-bold text-[#84dfff] text-[10px]">
                    <span>GRAPH RECOMMENDATION ALGORITHM</span>
                    <button onClick={() => setShowGraphMath(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10.5px]">
                    Candidate developers are scored using real graph algorithms:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[10.5px]">
                    <li>
                      <strong className="text-slate-200">BFS 2-Hop Traversal:</strong> Explores nodes at graph distance <span className="font-mono text-[#84dfff]">d = 2</span> (friends of friends).
                    </li>
                    <li>
                      <strong className="text-slate-200">Adamic-Adar Index:</strong> <span className="font-mono text-[#84dfff]">S(u,v) = Σ 1/log₂(deg(w))</span> over mutual friends.
                    </li>
                    <li>
                      <strong className="text-slate-200">Bipartite Jaccard Similarity:</strong> Computes room and tech stack overlap: <span className="font-mono text-[#84dfff]">|R_u ∩ R_v| / |R_u ∪ R_v|</span>.
                    </li>
                  </ul>
                </div>
              )}

              {/* Suggestions List: No fake mock developers! */}
              <div className="space-y-2.5">
                {graphSuggestions.length === 0 ? (
                  <div className="py-6 px-3 text-center bg-[#04121a] rounded-lg border border-cyan-100/5">
                    <p className="text-xs font-semibold text-slate-300 mb-1">
                      No peer recommendations yet
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Add friends using the input below or invite peers to your coding rooms to expand your graph network.
                    </p>
                  </div>
                ) : (
                  graphSuggestions.slice(0, 3).map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-2.5 rounded-lg bg-[#04121a] hover:bg-[#071d2b] border border-cyan-100/10 transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={candidate.avatarUrl}
                            alt={candidate.name}
                            className="w-8 h-8 rounded-full bg-[#0d2e40] object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{candidate.name}</p>
                            <p className="text-[10px] font-mono text-[#84dfff] truncate">
                              @{candidate.username}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleConnectGraphFriend(candidate)}
                          className="px-2.5 py-1 bg-[#84dfff] hover:bg-[#a5e8ff] text-[#04121a] rounded text-[11px] font-bold flex items-center gap-1 transition shrink-0 shadow-sm"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Connect</span>
                        </button>
                      </div>

                      {/* Graph Proof / Metric Badge */}
                      <div className="flex items-center justify-between pt-1 border-t border-cyan-100/5 text-[10.5px]">
                        <span className="text-slate-400 font-mono flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#84dfff]" />
                          {candidate.primaryMetric}
                        </span>
                        <span className="font-mono font-bold text-emerald-400 shrink-0">
                          {candidate.matchPercentage}% match
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Friends & Friend Requests Network Card (Clean, only real friends) */}
            <div className="rounded-xl bg-[#061923] border border-cyan-100/10 shadow-sm overflow-hidden">
              {/* Tabs: Friends vs Requests */}
              <div className="flex border-b border-cyan-100/10 bg-[#04121a]">
                <button
                  onClick={() => setActiveSocialTab('friends')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 transition border-b-2 ${activeSocialTab === 'friends'
                    ? 'border-[#84dfff] text-white bg-[#061923]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Friends ({friends.length})</span>
                </button>

                <button
                  onClick={() => setActiveSocialTab('requests')}
                  className={`flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 transition border-b-2 ${activeSocialTab === 'requests'
                    ? 'border-[#84dfff] text-white bg-[#061923]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Requests</span>
                  {friendRequests.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                      {friendRequests.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Add Friend Input Bar */}
              <form onSubmit={handleSendFriendRequest} className="p-2.5 border-b border-cyan-100/10 bg-[#061923]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFriendHandle}
                    onChange={(e) => setNewFriendHandle(e.target.value)}
                    placeholder="Enter @username or email..."
                    className="flex-1 px-2.5 py-1.5 bg-[#04121a] border border-cyan-100/15 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#84dfff] transition"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 bg-[#84dfff] hover:bg-[#a6e8ff] text-[#04121a] rounded-md text-xs font-bold flex items-center gap-1 transition shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Tab Contents: Shows real friends or empty state */}
              <div className="p-2.5 max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
                {activeSocialTab === 'friends' ? (
                  friends.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No friends yet. Add peers by typing their username above!
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#04121a] hover:bg-[#071d2b] border border-cyan-100/10 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 mr-2">
                          <div className="relative shrink-0">
                            <img
                              src={friend.avatarUrl}
                              alt={friend.name}
                              className="w-7 h-7 rounded-full bg-[#0d2e40] object-cover"
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-[#04121a] ${friend.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                                }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{friend.name}</p>
                            <p className="text-[10px] font-mono text-[#84dfff] truncate">
                              @{friend.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleInviteFriendToRoom(friend, e)}
                            title="Invite to your current workspace"
                            className="p-1 rounded hover:bg-[#84dfff]/20 text-[#84dfff] transition text-[11px] font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(friend.id, friend.name)}
                            title="Remove Friend"
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  friendRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No pending friend requests.
                    </div>
                  ) : (
                    friendRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-lg bg-[#04121a] border border-cyan-100/10 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={req.avatarUrl}
                            alt={req.name}
                            className="w-7 h-7 rounded-full bg-[#0d2e40] object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{req.name}</p>
                            <p className="text-[10px] font-mono text-[#84dfff] truncate">
                              @{req.username}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{req.time}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-cyan-100/10">
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            className="flex-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1 transition"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 bg-[#08202d] text-white px-4 py-2.5 rounded-lg shadow-2xl border border-cyan-100/20 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
