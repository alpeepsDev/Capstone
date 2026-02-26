import React from "react";
import { useNavigate } from "react-router-dom";
import { useRegister } from "../hooks";
import { useTheme } from "../context";
import { LoadingSpinner } from "../components/ui";
import { BarChart3 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { register, handleSubmit, errors, onSubmit, loading, error, success } =
    useRegister();

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-white"} flex items-center justify-center px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
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

        {/* Registration Form */}
        <div
          className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-lg rounded-lg border p-8`}
        >
          <div className="mb-6">
            <h2
              className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"} text-center`}
            >
              Create your account
            </h2>
            <p
              className={`${isDark ? "text-gray-300" : "text-gray-600"} text-center mt-2`}
            >
              Join TaskForge and start organizing your tasks
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

          {success && (
            <div
              className={`mb-4 p-3 border rounded-md ${isDark ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200"}`}
            >
              <p
                className={`text-sm ${isDark ? "text-green-400" : "text-green-800"}`}
              >
                {success}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Username
              </label>
              <input
                {...register("username")}
                type="text"
                id="username"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                }`}
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Full Name
              </label>
              <input
                {...register("name")}
                type="text"
                id="name"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Email address
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
              <input
                {...register("password")}
                type="password"
                id="password"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                }`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Confirm Password
              </label>
              <input
                {...register("confirmPassword")}
                type="password"
                id="confirmPassword"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <LoadingSpinner text="Creating account..." />
              ) : (
                "Create account"
              )}
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
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate("/login")}
                className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? "border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                Sign in to your account
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            © 2025 TaskForge. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
