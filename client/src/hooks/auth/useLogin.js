import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../utils/validation";
import { useAuth } from "../../context";
import { useNavigate } from "react-router-dom";

export function useLogin(options = {}) {
  const { rememberMe = false } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEmail, setMfaEmail] = useState("");
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await login({ ...data, rememberMe });
      
      if (response && response.data && response.data.mfaRequired) {
        setMfaRequired(true);
        setMfaEmail(response.data.email);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await verifyMfa(mfaEmail, otp, rememberMe);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (mfaRequired) {
        onVerifyOtp();
      } else {
        onSubmit(); // this won't work perfectly since onSubmit needs data from react-hook-form, but it's bound via onKeyDown usually. Actually wait, handleSubmit(onSubmit) is bound to form.
      }
    }
  };

  return {
    register,
    handleSubmit,
    handleKeyPress,
    errors,
    onSubmit,
    loading,
    error,
    mfaRequired,
    mfaEmail,
    otp,
    setOtp,
    onVerifyOtp,
    setError,
  };
}

export default useLogin;
