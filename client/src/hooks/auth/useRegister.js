import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../utils/validation.js";
import { useAuth } from "../../context/useAuth.js";
import { useNavigate } from "react-router-dom";

/**
 * Custom hook for registration logic
 * Encapsulates form state, validation, API calls, and navigation
 * Following the same pattern as useLogin
 */
export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { confirmPassword: _, ...userData } = data;
      await registerUser(userData);
      setSuccess("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    loading,
    error,
    success,
  };
};
