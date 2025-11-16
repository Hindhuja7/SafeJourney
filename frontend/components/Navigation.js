// components/Navigation.js
export default function Navigation({ activeTab, setActiveTab }) {
    const tabs = [
        { id: "map", label: "Map", icon: "🗺️" },
        { id: "safety", label: "Safety", icon: "🛡️" },
        { id: "reviews", label: "Reviews", icon: "📝" },
        { id: "profile", label: "Profile", icon: "👤" }
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900 dark:to-indigo-900 backdrop-blur-xl border-t border-purple-300/30 dark:border-purple-700/50 p-2 z-50 shadow-lg transition-all duration-300">
            <div className="flex justify-around">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex flex-col items-center p-2 rounded-lg transition-all duration-300 flex-1 group ${activeTab === tab.id
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105"
                            : "text-black dark:text-purple-200 hover:text-black dark:hover:text-purple-100"
                            }`}
                        onMouseEnter={(e) => {
                            if (activeTab !== tab.id) {
                                const labelSpan = e.currentTarget.querySelector('span.relative');
                                const underline = labelSpan?.querySelector('span');
                                if (underline) {
                                    underline.style.width = '100%';
                                }
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== tab.id) {
                                const labelSpan = e.currentTarget.querySelector('span.relative');
                                const underline = labelSpan?.querySelector('span');
                                if (underline) {
                                    underline.style.width = '0';
                                }
                            }
                        }}
                    >
                        <span className="text-xl mb-1">{tab.icon}</span>
                        <span className={`relative inline-block text-xs font-medium ${activeTab === tab.id ? "text-white" : "text-black dark:text-purple-200"
                            }`}>
                            {tab.label}
                            <span
                                className={`absolute -bottom-1 left-0 h-0.5 bg-yellow-400 transition-all duration-300 ${activeTab === tab.id ? 'w-full' : 'w-0'
                                    }`}
                                style={{
                                    width: activeTab === tab.id ? '100%' : '0'
                                }}
                            ></span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}