// pages/index.js
import { useState, useEffect } from "react";
import Login from "../components/Login";
import LiveLocationShare from "../components/LiveLocationShare";
import MapViewClient from "../components/MapViewClient";
import NavigationView from "../components/navigation/NavigationView";
import Navigation from "../components/Navigation";
import UserReviews from "../components/UserReviews";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function Home() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationData, setNavigationData] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setShowLanding(false);
      setShowLogin(false);
    } else {
      setShowLanding(true);
    }
    setLoading(false);
  }, []);

  const handleGetStarted = () => {
    setShowLanding(false);
    setShowLogin(true);
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userToken);
    setShowLogin(false);
    setShowLanding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setShowLanding(true);
    setShowLogin(false);
    setIsNavigating(false);
    setNavigationData(null);
  };

  const handleStartNavigation = (navData) => {
    console.log('Starting navigation with data:', navData);
    
    // Validate navigation data
    if (!navData || !navData.route) {
      console.error('Invalid navigation data:', navData);
      alert('Error: Route information is missing. Please select a route and try again.');
      return;
    }
    
    if (!navData.origin || !navData.destination) {
      console.error('Missing coordinates:', navData);
      alert('Error: Source and destination coordinates are missing.');
      return;
    }
    
    setIsNavigating(true);
    setNavigationData(navData);
    setActiveTab("map"); // Switch to map tab when navigating
  };

  const handleExitNavigation = () => {
    console.log('Exiting navigation');
    setIsNavigating(false);
    setNavigationData(null);
    // Reset to show route planning view
  };

  // Get user initials for profile circle
  const getUserInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/40 dark:from-purple-950 dark:via-purple-900 dark:to-indigo-950 transition-all duration-300">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl flex items-center justify-center mx-auto mb-4 border border-purple-200/50 dark:border-white/10 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 dark:hover:shadow-purple-500/50 transition-all duration-300">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 dark:border-purple-400 absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
            </div>
            <p className="text-gray-900 dark:text-white font-medium mt-4">Loading SafeJourney</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show landing page (Navbar)
  if (showLanding && !user) {
    return (
      <ThemeProvider>
        <Navbar onGetStarted={handleGetStarted} />
      </ThemeProvider>
    );
  }

  // Show login page
  if (showLogin && !user) {
    return (
      <ThemeProvider>
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    // Show full-screen navigation view if navigating
    if (isNavigating && navigationData) {
      return (
        <NavigationView
          route={navigationData.route}
          origin={navigationData.origin}
          destination={navigationData.destination}
          originName={navigationData.originName}
          destinationName={navigationData.destinationName}
          onExit={handleExitNavigation}
        />
      );
    }

    switch (activeTab) {
      case "map":
        return <LiveLocationShare userId={user.id} onStartNavigation={handleStartNavigation} />;
      
      case "safety":
        return (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-purple-100/50 dark:border-white/10 p-6 hover:shadow-xl hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 transition-all duration-300">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Safety Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-5 border border-purple-100/50 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-xl flex items-center justify-center mb-3 shadow-md">
                    <span className="text-2xl">🚨</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Emergency SOS</h3>
                  <p className="text-gray-600 dark:text-purple-300 text-sm">Instant emergency alerts to your contacts</p>
                </div>
                
                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-5 border border-purple-100/50 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-purple-900/30 dark:to-indigo-800/30 rounded-xl flex items-center justify-center mb-3 shadow-md">
                    <span className="text-2xl">📍</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Live Tracking</h3>
                  <p className="text-gray-600 dark:text-purple-300 text-sm">Real-time location sharing with trusted contacts</p>
                </div>
                
                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-5 border border-purple-100/50 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl flex items-center justify-center mb-3 shadow-md">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Safety Check-ins</h3>
                  <p className="text-gray-600 dark:text-purple-300 text-sm">Periodic safety confirmations during journeys</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "reviews":
        return <UserReviews userId={user.id} />;
      
      case "profile":
        return (
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-purple-100/50 dark:border-white/10 p-6 hover:shadow-xl hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-purple-100/50 dark:border-white/10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300">
                <span className="text-xl text-white font-semibold">
                  {getUserInitials(user.name)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-purple-600 dark:text-purple-300 text-sm">{user.email}</p>
                {user.phone && (
                  <p className="text-gray-500 dark:text-purple-400 text-sm">{user.phone}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-4 rounded-lg hover:bg-purple-50/50 dark:hover:bg-white/10 transition-all duration-300 border border-purple-100/50 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-md hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">Edit Profile</span>
                  <span className="text-purple-400 dark:text-purple-500">→</span>
                </div>
              </button>
              
              <button className="w-full text-left p-4 rounded-lg hover:bg-purple-50/50 dark:hover:bg-white/10 transition-all duration-300 border border-purple-100/50 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-md hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">Emergency Contacts</span>
                  <span className="text-purple-400 dark:text-purple-500">→</span>
                </div>
              </button>
              
              <button className="w-full text-left p-4 rounded-lg hover:bg-purple-50/50 dark:hover:bg-white/10 transition-all duration-300 border border-purple-100/50 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-md hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">Privacy Settings</span>
                  <span className="text-purple-400 dark:text-purple-500">→</span>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left p-4 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-300 border border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700/50 text-red-600 dark:text-red-400 mt-4 hover:shadow-md hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Logout</span>
                  <span className="text-red-400 dark:text-red-500">→</span>
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
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/40 dark:from-purple-950 dark:via-purple-900 dark:to-indigo-950 transition-all duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border-b border-purple-100/50 dark:border-white/10 sticky top-0 z-50 shadow-lg hover:shadow-xl hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 transition-all duration-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300">
                <span className="text-xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400">
                  SafeJourney
                </h1>
                <p className="text-xs text-purple-600 dark:text-purple-300 hidden sm:block">Your Safety Companion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex sm:items-center sm:space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300">
                  <span className="text-xs text-white font-semibold">
                    {getUserInitials(user.name)}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-gray-500 dark:text-purple-300">Welcome back,</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-20 lg:pb-6">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex justify-center mb-6">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-xl p-1.5 shadow-lg border border-purple-100/50 dark:border-white/10 hover:shadow-xl hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex space-x-1">
              {[
                { id: "map", label: "Map", icon: "🗺️" },
                { id: "safety", label: "Safety", icon: "🛡️" },
                { id: "reviews", label: "Reviews", icon: "📝" },
                { id: "profile", label: "Profile", icon: "👤" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105"
                      : "text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white hover:bg-purple-50/50 dark:hover:bg-white/10"
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
    </ThemeProvider>
  );
}