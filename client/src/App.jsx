import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { RoomPage } from './pages/RoomPage.jsx';
import { CreateRoomModal } from './components/CreateRoomModal.jsx';
import { JoinRoomModal } from './components/JoinRoomModal.jsx';
import { roomService } from './services/room.js';

export const App = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleCreateRoom = async (roomData) => {
    const newRoom = await roomService.createRoom(roomData);
    navigate(`/room/${newRoom.id}`);
  };

  const handleJoinRoom = async (roomCode) => {
    const joinedRoom = await roomService.joinRoom(roomCode);
    navigate(`/room/${joinedRoom.id}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-950 text-dark-400 font-mono text-xs">
        Initializing CodeSync...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-200">
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage
                onOpenCreateRoom={() => setIsCreateModalOpen(true)}
              />
            )
          }
        />

        {/* Auth Pages */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
        />

        {/* Dashboard (Protected) */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <div>
                <Navbar
                  onOpenCreateRoom={() => setIsCreateModalOpen(true)}
                  onOpenJoinRoom={() => setIsJoinModalOpen(true)}
                />
                <DashboardPage
                  onOpenCreateRoom={() => setIsCreateModalOpen(true)}
                  onOpenJoinRoom={() => setIsJoinModalOpen(true)}
                />
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Collaborative Room (IDE) */}
        <Route
          path="/room/:roomId"
          element={
            user ? (
              <RoomPage />
            ) : (
              <Navigate to={`/login?redirect=/room`} replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinRoom}
      />
    </div>
  );
};
