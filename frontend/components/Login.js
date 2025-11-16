// components/Login.js
import { useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? API_ENDPOINTS.auth.login : API_ENDPOINTS.auth.register;
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(endpoint, payload);
      
      if (response.data.token && response.data.user) {
        onLogin(response.data.user, response.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/40 dark:from-purple-950 dark:via-purple-900 dark:to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden transition-all duration-300">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200/30 dark:bg-purple-800/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-800/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/40 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="relative w-20 h-20 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-purple-200/50 dark:border-white/10 transform hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300">
                <span className="text-3xl">🛡️</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2 tracking-tight">
            SafeJourney
          </h1>
          <p className="text-purple-600 dark:text-purple-300 text-base font-medium">Your Trusted Safety Companion</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-purple-100/50 dark:border-white/10 relative overflow-hidden hover:shadow-2xl hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 transition-all duration-300">
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isLogin ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-purple-600 dark:text-purple-300 text-sm">
                {isLogin ? "Sign in to continue your safe journey" : "Create your account and start traveling safely"}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-purple-50/50 dark:bg-white/5 rounded-xl p-1 mb-6 border border-purple-100/50 dark:border-white/10">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  isLogin 
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105" 
                    : "text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  !isLogin 
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105" 
                    : "text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="block text-purple-700 dark:text-purple-300 text-sm font-medium">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-purple-500 dark:text-purple-400 text-base">👤</span>
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-white/5 border border-purple-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-purple-700 dark:text-purple-300 text-sm font-medium">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-purple-500 dark:text-purple-400 text-base">📱</span>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-white/5 border border-purple-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-500 transition-all"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="block text-purple-700 dark:text-purple-300 text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-purple-500 dark:text-purple-400 text-base">✉️</span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-white/5 border border-purple-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-500 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-purple-700 dark:text-purple-300 text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-purple-500 dark:text-purple-400 text-base">🔒</span>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-white/80 dark:bg-white/5 border border-purple-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-500 transition-all"
                    placeholder="••••••••"
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    <span className="text-base">{showPassword ? "👁️" : "👁️‍🗨️"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800/50 rounded-lg">
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <span className="mr-2">⚠️</span>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-lg font-semibold text-base shadow-lg hover:from-purple-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {isLogin ? "Sign In" : "Create Account"}
                    <span className="ml-2">→</span>
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-purple-600 dark:text-purple-300 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-purple-700 dark:text-purple-400 font-semibold hover:text-purple-900 dark:hover:text-purple-300 transition-colors underline decoration-1 underline-offset-2"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center group">
            <div className="w-12 h-12 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center mx-auto mb-2 border border-purple-200/50 dark:border-white/10 group-hover:border-purple-400 dark:group-hover:border-purple-500 group-hover:bg-purple-50/50 dark:group-hover:bg-white/10 transition-all transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/30 dark:group-hover:shadow-purple-500/50">
              <span className="text-xl">📍</span>
            </div>
            <p className="text-purple-600 dark:text-purple-300 text-xs font-medium">Live Tracking</p>
          </div>
          <div className="text-center group">
            <div className="w-12 h-12 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center mx-auto mb-2 border border-purple-200/50 dark:border-white/10 group-hover:border-purple-400 dark:group-hover:border-purple-500 group-hover:bg-purple-50/50 dark:group-hover:bg-white/10 transition-all transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/30 dark:group-hover:shadow-purple-500/50">
              <span className="text-xl">🚨</span>
            </div>
            <p className="text-purple-600 dark:text-purple-300 text-xs font-medium">SOS Alerts</p>
          </div>
          <div className="text-center group">
            <div className="w-12 h-12 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center mx-auto mb-2 border border-purple-200/50 dark:border-white/10 group-hover:border-purple-400 dark:group-hover:border-purple-500 group-hover:bg-purple-50/50 dark:group-hover:bg-white/10 transition-all transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/30 dark:group-hover:shadow-purple-500/50">
              <span className="text-xl">🛡️</span>
            </div>
            <p className="text-purple-600 dark:text-purple-300 text-xs font-medium">Safe Routes</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}