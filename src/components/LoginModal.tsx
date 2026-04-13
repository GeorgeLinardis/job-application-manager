"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";

interface LoginFormFields {
  username: string;
  password: string;
}

interface LoginModalProps {
  onClose: () => void;
}

/**
 * Modal form for owner login.
 * On success the JWT is stored and the modal closes.
 * MVP — single owner only, no registration.
 */
export function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormFields>();

  async function onSubmit(fields: LoginFormFields): Promise<void> {
    setServerError(null);
    try {
      await login(fields.username, fields.password);
      onClose();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Owner Login
        </h2>
        <p className="text-sm text-gray-500 mb-2">
          Your data syncs to Cloudflare KV.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">MVP:</span> Only the owner can log
            in. Guest users can still use the app — their data is saved in their
            local browser only.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              {...register("username", { required: "Required" })}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register("password", { required: "Required" })}
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium shadow-sm transition-colors"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
