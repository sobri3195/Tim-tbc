export default function MobileBottomNav({ currentView, onViewChange }) {
  const navItems = [
    {
      id: "mobility",
      label: "Mobilitas",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
    {
      id: "planner",
      label: "Planner",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-[1000]">
      <nav className="flex justify-around items-center py-2 px-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center w-full py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
