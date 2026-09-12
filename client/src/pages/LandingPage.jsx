import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  Code2,
  Users2,
  Cpu,
  Terminal as TerminalIcon,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Layers,
  CheckCircle2
} from 'lucide-react';

export const LandingPage = ({ onOpenCreateRoom }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleHeroCTA = () => {
    if (user) {
      if (onOpenCreateRoom) onOpenCreateRoom();
      else navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-dark-200">
      {/* Navbar */}
      <nav className="h-16 border-b border-dark-750/80 px-6 flex items-center justify-between sticky top-0 bg-dark-900/80 backdrop-blur z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg text-dark-100 tracking-tight">CodeSync</span>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-dark-100 transition"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Engineered for seamless developer collaboration</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-dark-100 tracking-tight leading-[1.1] mb-6">
          Code together. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-400 via-accent-cyan to-accent-emerald bg-clip-text text-transparent">
            Build together.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          CodeSync is a real-time collaborative coding platform. Join shared coding rooms, edit code simultaneously with live cursors, chat with teammates, and execute programs in a sandboxed environment.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
          <button
            onClick={handleHeroCTA}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition"
          >
            <span>Create a room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-dark-300 hover:text-dark-100 bg-dark-800 hover:bg-dark-750 border border-dark-700 rounded-lg transition"
          >
            Explore CodeSync
          </Link>
        </div>

        {/* Authentic Product IDE Preview */}
        <div className="relative mx-auto rounded-xl border border-dark-700 bg-dark-950 shadow-2xl overflow-hidden text-left font-mono text-xs">
          {/* Mock Window Titlebar */}
          <div className="h-10 px-4 bg-dark-900 border-b border-dark-750 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-dark-700"></div>
              <div className="w-3 h-3 rounded-full bg-dark-700"></div>
              <div className="w-3 h-3 rounded-full bg-dark-700"></div>
              <span className="ml-3 text-dark-400 font-sans text-xs">main.cpp — CodeSync Room #CS-8F2A</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 text-[11px] font-sans">
                C++ (GCC 9.2.0)
              </span>
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-brand-500 border border-dark-900 flex items-center justify-center text-[9px] text-white font-bold">A</div>
                <div className="w-5 h-5 rounded-full bg-accent-cyan border border-dark-900 flex items-center justify-center text-[9px] text-white font-bold">B</div>
              </div>
            </div>
          </div>

          {/* IDE Grid */}
          <div className="grid grid-cols-12 h-[340px]">
            {/* Explorer Column */}
            <div className="col-span-3 border-r border-dark-750 bg-dark-950 p-3 hidden md:block">
              <div className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-2 font-sans">
                Explorer
              </div>
              <div className="space-y-1">
                <div className="px-2 py-1 rounded bg-dark-800 text-dark-100 flex items-center gap-2">
                  <span className="text-accent-cyan">◆</span> main.cpp
                </div>
                <div className="px-2 py-1 text-dark-400 hover:text-dark-200 flex items-center gap-2">
                  <span className="text-accent-amber">◆</span> solution.h
                </div>
                <div className="px-2 py-1 text-dark-400 hover:text-dark-200 flex items-center gap-2">
                  <span className="text-dark-500">◆</span> input.txt
                </div>
              </div>
            </div>

            {/* Code Column */}
            <div className="col-span-12 md:col-span-6 bg-dark-900 p-4 leading-relaxed overflow-hidden">
              <div className="text-dark-500">// Real-time collaborative coding in C++</div>
              <div><span className="text-accent-rose">#include</span> <span className="text-brand-300">&lt;iostream&gt;</span></div>
              <div><span className="text-accent-rose">#include</span> <span className="text-brand-300">&lt;vector&gt;</span></div>
              <br />
              <div><span className="text-brand-400">int</span> <span className="text-accent-cyan">main</span>() &#123;</div>
              <div className="pl-4">
                std::cout &lt;&lt; <span className="text-accent-emerald">"Hello, CodeSync!"</span> &lt;&lt; std::endl;
              </div>
              <div className="pl-4 relative inline-block">
                <span className="text-dark-300">std::vector&lt;<span className="text-brand-400">int</span>&gt; scores = &#123;98, 100, 95&#125;;</span>
                {/* Live Remote Cursor Demonstration */}
                <span className="absolute -top-4 right-0 px-1 py-0.5 rounded bg-accent-cyan text-dark-900 font-sans font-bold text-[9px]">
                  Rahul
                </span>
                <span className="inline-block w-0.5 h-4 bg-accent-cyan ml-0.5 animate-pulse align-middle"></span>
              </div>
              <div className="pl-4 text-dark-300">return <span className="text-accent-cyan">0</span>;</div>
              <div>&#125;</div>
            </div>

            {/* Terminal Preview Column */}
            <div className="col-span-3 border-l border-dark-750 bg-dark-950 p-3 hidden md:flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-2 font-sans flex items-center gap-1.5">
                  <TerminalIcon className="w-3.5 h-3.5 text-accent-emerald" />
                  Terminal
                </div>
                <div className="p-2 rounded bg-dark-900 border border-dark-800 text-[11px] font-mono text-dark-200">
                  <div className="text-dark-500">$ g++ -O2 main.cpp</div>
                  <div className="text-accent-emerald font-semibold mt-1">Hello, CodeSync!</div>
                  <div className="text-dark-500 text-[10px] mt-2">Program exited with code 0 (12ms)</div>
                </div>
              </div>

              <div className="p-2 rounded bg-dark-900/60 border border-dark-800 text-[11px] text-dark-400">
                <div className="font-semibold text-dark-300 font-sans mb-1">Collaborators (2)</div>
                <div className="text-dark-400 font-sans text-xs">Deepak: editing main.cpp</div>
                <div className="text-dark-400 font-sans text-xs">Rahul: viewing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-dark-750/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-dark-100 mb-3">
            Engineered for real engineering teams
          </h2>
          <p className="text-sm sm:text-base text-dark-400 max-w-xl mx-auto">
            Everything you need for pairing, technical interviews, problem-solving, and team code reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-dark-850/60 border border-dark-750 hover:border-dark-600 transition">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-dark-100 mb-2">Real-Time Multi-Cursor Editing</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Edit code simultaneously with teammates. See other developers' cursors, selection highlights, and presence without conflicts.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-dark-850/60 border border-dark-750 hover:border-dark-600 transition">
            <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-dark-100 mb-2">Judge0 Sandboxed Execution</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Compile and run C++ code securely with instant stdout, stderr, compile diagnostics, stdin support, and execution metrics.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-dark-850/60 border border-dark-750 hover:border-dark-600 transition">
            <div className="w-9 h-9 rounded-lg bg-accent-emerald/10 text-accent-emerald flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-dark-100 mb-2">Persistent Workspaces & Chat</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Manage multi-file projects, chat in real time, and persist all files and discussions in a relational database.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-dark-750/60">
        <h2 className="text-2xl font-bold text-center text-dark-100 mb-10">How CodeSync Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto text-sm">1</div>
            <h4 className="font-semibold text-dark-100 text-sm">Create a Room</h4>
            <p className="text-xs text-dark-400">Generate a private or public coding room with default starter code.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto text-sm">2</div>
            <h4 className="font-semibold text-dark-100 text-sm">Invite Collaborators</h4>
            <p className="text-xs text-dark-400">Share your 8-character room code or direct link to jump in instantly.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center mx-auto text-sm">3</div>
            <h4 className="font-semibold text-dark-100 text-sm">Code & Execute</h4>
            <p className="text-xs text-dark-400">Type together in Monaco, see live cursors, and run programs in real time.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-dark-750 py-6 px-6 text-center text-xs text-dark-500">
        CodeSync &copy; {new Date().getFullYear()} — Real-Time Collaborative Coding Platform. Built with React, Monaco, Express, Socket.IO, MySQL & Judge0.
      </footer>
    </div>
  );
};
