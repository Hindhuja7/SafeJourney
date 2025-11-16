// components/Navigation.js
export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "map", label: "Map", icon: "🗺️" },
    { id: "safety", label: "Safety", icon: "🛡️" },
    { id: "reviews", label: "Reviews", icon: "📝" },
    { id: "profile", label: "Profile", icon: "👤" }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-white/5 backdrop-blur-xl border-t border-purple-100/50 dark:border-white/10 p-2 z-50 shadow-lg hover:shadow-xl hover:shadow-purple-200/30 dark:hover:shadow-purple-500/20 transition-all duration-300">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 flex-1 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105"
                : "text-purple-600 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white hover:bg-purple-50/50 dark:hover:bg-white/10"
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className={`text-xs font-medium ${
              activeTab === tab.id ? "text-white" : "text-purple-600 dark:text-purple-300"
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}