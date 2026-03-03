import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context";
import { LoadingSpinner } from "../components/ui";
import { BarChart3, Mail, ArrowLeft } from "lucide-react";
import { authService } from "../api/auth";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      // Automatically redirect to reset password page after 3 seconds
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to send reset code");
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
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                TaskForge
              </h1>
            </div>
            <h2
              className={`text-xl font-semibold mt-6 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Reset your password
            </h2>
            <p
              className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"} mb-8`}
            >
              Enter your email address and we'll send you a code to reset your
              password.
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

          {success ? (
            <div
              className={`mb-4 p-4 border rounded-md ${isDark ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200"} text-center`}
            >
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3
                className={`text-lg font-medium ${isDark ? "text-green-400" : "text-green-800"}`}
              >
                Check your email
              </h3>
              <p
                className={`mt-2 text-sm ${isDark ? "text-green-300" : "text-green-700"}`}
              >
                If an account exists for {email}, we've sent a 6-digit
                verification code. Redirecting...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  }`}
                  placeholder="name@company.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <LoadingSpinner text="Sending code..." />
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/login"
              className={`flex items-center text-sm font-medium transition-colors ${
                isDark
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-500"
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
