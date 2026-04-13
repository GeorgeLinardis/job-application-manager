"use client";

import { useState, useRef, useEffect } from "react";
import { UserCircle, LogOut, LogIn, ChevronDown, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "./LoginModal";

/**
 * Auth dropdown in the header.
 * Imported with `ssr: false` in page.tsx so it is excluded from the static HTML,
 * preventing the guest→owner flicker on page refresh.
 */
export default function AuthStatus() {
  const { isOwner, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /** Close dropdown when clicking outside. */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <UserCircle className="w-5 h-5" />
          <span className="hidden sm:inline">
            {isOwner ? "Owner" : "Guest"}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {/* Status row */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {isOwner ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Owner</p>
                    <p className="text-xs text-gray-400">Synced to Cloudflare KV</p>
                  </div>
                </>
              ) : (
                <>
                  <UserCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Guest</p>
                    <p className="text-xs text-gray-400">Data stored locally</p>
                  </div>
                </>
              )}
            </div>

            {/* Action */}
            {isOwner ? (
              <button
                onClick={() => { logout(); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => { setShowLogin(true); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login as Owner
              </button>
            )}
          </div>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
