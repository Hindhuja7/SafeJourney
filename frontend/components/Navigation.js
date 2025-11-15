// components/Navigation.js
export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "map", label: "Map", icon: "🗺️" },
    { id: "safety", label: "Safety", icon: "🛡️" },
    { id: "profile", label: "Profile", icon: "👤" }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/60 p-3 z-50 shadow-2xl">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-2xl mb-1">{tab.icon}</span>
            <span className={`text-xs font-medium ${
              activeTab === tab.id ? "text-white" : "text-gray-500"
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}