import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../hooks";
import { useTheme } from "../context";
import { LoadingSpinner } from "../components/ui";
import { BarChart3 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    handleKeyPress,
    errors,
    onSubmit,
    loading,
    error,
  } = useLogin({ rememberMe });

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-white"} flex items-center justify-center px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}

        {/* Login Form */}
        <div
          className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-lg rounded-lg border p-8`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                TaskForge
              </h1>
            </div>
            <p
              className={`text-lg ${isDark ? "text-gray-300" : "text-gray-600"} mb-8`}
            >
              Shape ideas into results.
            </p>
          </div>
          {error && (
            <div
              className={`mb-4 p-3 border rounded-md ${isDark ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"}`}
            >
              <p
                className={`text-sm ${isDark ? "text-red-400" : "text-red-800"}`}
              >
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={handleKeyPress(onSubmit)}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                id="email"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors pr-10 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className={`absolute inset-y-0 right-0 px-3 flex items-center transition-colors focus:outline-none ${
                    isDark
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye open icon (modern)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                      />
                    </svg>
                  ) : (
                    // Eye with slash icon (modern)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 002.25 12s3.75 7.5 9.75 7.5c1.956 0 3.693-.377 5.18-.98M6.32 6.321A10.45 10.45 0 0112 4.5c6 0 9.75 7.5 9.75 7.5a17.896 17.896 0 01-3.197 4.522M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  htmlFor="remember-me"
                  className={`ml-2 block text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className={`font-medium transition-colors ${
                    isDark
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-500"
                  }`}
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <LoadingSpinner text="Signing in..." /> : "Sign in"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t ${isDark ? "border-gray-700" : "border-gray-300"}`}
                />
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className={`px-2 ${isDark ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"}`}
                >
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate("/register")}
                className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? "border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                Create an account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
