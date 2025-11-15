// pages/index.js
import { useState, useEffect } from "react";
import Login from "../components/Login";
import LiveLocationShare from "../components/LiveLocationShare";
import Navigation from "../components/Navigation";

export default function Home() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span className="text-2xl text-indigo-600">🛡️</span>
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-white/90 font-medium">Loading SafeJourney</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "map":
        return <LiveLocationShare userId={user.id} />;
      
      case "safety":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Safety features grid */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-red-600">🚨</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency SOS</h3>
                <p className="text-gray-600 text-sm">Instant emergency alerts to your contacts</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-blue-600">📍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Tracking</h3>
                <p className="text-gray-600 text-sm">Real-time location sharing with trusted contacts</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl text-green-600">⏰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety Check-ins</h3>
                <p className="text-gray-600 text-sm">Periodic safety confirmations during journeys</p>
              </div>
            </div>
          </div>
        );
      
      case "profile":
        return (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl text-white font-semibold">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-500 text-sm">{user.phone}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <button className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Edit Profile</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
              
              <button className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Emergency Contacts</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
              
              <button className="w-full text-left p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Privacy Settings</span>
                  <span className="text-gray-400">→</span>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left p-4 rounded-2xl hover:bg-red-50 transition-colors border border-red-200 text-red-600"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Logout</span>
                  <span className="text-red-400">→</span>
                </div>
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SafeJourney
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Your Safety Companion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/60">
            <div className="flex space-x-2">
              {[
                { id: "map", label: "Map & Safety", icon: "🗺️" },
                { id: "safety", label: "Safety Tools", icon: "🛡️" },
                { id: "profile", label: "Profile", icon: "👤" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}