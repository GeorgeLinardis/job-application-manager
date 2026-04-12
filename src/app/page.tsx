"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/LoginModal";

/**
 * Root page. Renders the app header with owner login/logout.
 * Job list and form will be added in subsequent feature branches.
 */
export default function Home() {
  const { isOwner, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Job Tracker</h1>
            <p className="text-xs text-gray-500">
              {isOwner
                ? "Owner — data synced to Cloudflare KV"
                : "Guest — data stored locally"}
            </p>
          </div>

          {isOwner ? (
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Owner Login
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-400">
        <p className="text-sm">No applications yet.</p>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
