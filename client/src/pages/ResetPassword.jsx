import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context";
import { LoadingSpinner } from "../components/ui";
import { CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import { authService } from "../api/auth";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  // Get email from previous route's state if available
  const initialEmail = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: initialEmail,
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.otp || !formData.newPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.otp.length !== 6) {
      setError("Verification code must be exactly 6 digits");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (
      formData.newPassword.length < 6 ||
      !passwordRegex.test(formData.newPassword)
    ) {
      setError(
        "Password must be at least 6 characters and contain an uppercase letter, lowercase letter, and number",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.resetPassword(
        formData.email,
        formData.otp,
        formData.newPassword,
      );
      setSuccess(true);
      // Automatically redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Password reset successful! Please log in with your new password.",
          },
        });
      }, 3000);
    } catch (err) {
      setError(
        err.message ||
          "Failed to reset password. The code might be expired or invalid.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-white"} flex items-center justify-center px-4 sm:px-6 lg:px-8`}
    >
      <div className="max-w-md w-full space-y-8">
        <div
          className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-lg rounded-lg border p-8`}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Reset Password
              </h1>
            </div>
            {!success && (
              <p
                className={`text-sm mt-4 ${isDark ? "text-gray-400" : "text-gray-600"} mb-6`}
              >
                Enter the 6-digit verification code sent to your email along
                with your new password.
              </p>
            )}
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

          {success ? (
            <div
              className={`mt-6 mb-6 p-6 border rounded-md ${isDark ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200"} text-center`}
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3
                className={`text-xl font-medium ${isDark ? "text-green-400" : "text-green-800"}`}
              >
                Password Reset Complete
              </h3>
              <p
                className={`mt-4 text-sm ${isDark ? "text-green-300" : "text-green-700"}`}
              >
                Your password has been successfully reset. You are being
                redirected to the login page...
              </p>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Return to Login Now
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  }`}
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={formData.otp}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono tracking-[0.2em] text-center text-lg ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  }`}
                  placeholder="000000"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
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
                  >
                    {showPassword ? (
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
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  }`}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md mt-6 shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <LoadingSpinner text="Resetting..." />
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <Link
                to="/forgot-password"
                className={`flex items-center text-sm font-medium transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Need a new code?
              </Link>
              <Link
                to="/login"
                className={`flex items-center text-sm font-medium transition-colors ${
                  isDark
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-500"
                }`}
              >
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
