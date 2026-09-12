import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { RoomPage } from './pages/RoomPage.jsx';
import { CreateRoomModal } from './components/CreateRoomModal.jsx';
import { JoinRoomModal } from './components/JoinRoomModal.jsx';
import { roomService } from './services/room.js';

const ProtectedRoomRoute = ({ user }) => {
  const { roomId } = useParams();
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(`/room/${roomId}`)}`} replace />;
  }
  return <RoomPage />;
};

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
      <div className="h-[100dvh] w-screen flex flex-col gap-3 items-center justify-center bg-dark-950 text-dark-400 font-mono text-xs">
        <span className="w-5 h-5 rounded-full border-2 border-dark-700 border-t-brand-400 animate-spin" />
        Initializing workspace…
      </div>
    );
  }

  return (
    <div className="app-shell bg-dark-900 text-dark-200">
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

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
        <Route path="/profile" element={user ? <><Navbar onOpenCreateRoom={() => setIsCreateModalOpen(true)} onOpenJoinRoom={() => setIsJoinModalOpen(true)} /><ProfilePage /></> : <Navigate to="/login" replace />} />

        {/* Collaborative Room (IDE) */}
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoomRoute user={user} />
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
