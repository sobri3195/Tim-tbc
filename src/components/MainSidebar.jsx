import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../data/users';

export default function MainSidebar({ currentView, onViewChange }) {
  const { currentUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Define available views based on user permissions
  const getAvailableViews = () => {
    const baseViews = [
      {
        id: 'mobility',
        name: 'Mobilitas',
        icon: '🌊',
        description: 'Peta mobilitas dan aliran populations'
      },
      {
        id: 'planner',
        name: 'Planner',
        icon: '🎯',
        description: 'Perencanaan intervensi dan coverage'
      },
      {
        id: 'patients',
        name: 'Data Pasien TBC',
        icon: '🏥',
        description: 'Manajemen data pasien TBC'
      }
    ];

    // Filter views based on user permissions
    const allowedViews = baseViews.filter(view => {
      if (view.id === 'patients') {
        return hasPermission(currentUser, 'view_own_data') || hasPermission(currentUser, 'view_all_data');
      }
      return true; // All users can access mobility and planner views
    });

    return allowedViews;
  };

  const availableViews = getAvailableViews();

  const handleViewChange = (viewId) => {
    onViewChange(viewId);
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-80'
      }`}>
        <SidebarHeader 
          collapsed={collapsed} 
          setCollapsed={setCollapsed}
          currentUser={currentUser}
        />
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {availableViews.map((view) => (
              <button
                key={view.id}
                onClick={() => handleViewChange(view.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                  currentView === view.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl flex-shrink-0">{view.icon}</span>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{view.name}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {view.description}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>User:</strong> {currentUser.fullName}</p>
              <p><strong>Role:</strong> {currentUser.role}</p>
              <p><strong>Region:</strong> {currentUser.region}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-3 gap-1">
          {availableViews.slice(0, 3).map((view) => (
            <button
              key={view.id}
              onClick={() => handleViewChange(view.id)}
              className={`flex flex-col items-center py-2 px-1 text-xs transition-all duration-200 ${
                currentView === view.id
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-lg mb-1">{view.icon}</span>
              <span className="truncate">{view.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SidebarHeader({ collapsed, setCollapsed, currentUser }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">TB</span>
        </div>
        {!collapsed && (
          <div>
            <h2 className="font-bold text-gray-800">Sistem TBC</h2>
            <p className="text-xs text-gray-500">v1.0 Demo</p>
          </div>
        )}
      </div>
      
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-1 hover:bg-gray-100 rounded transition duration-200"
      >
        <span className="text-gray-500">
          {collapsed ? '→' : '←'}
        </span>
      </button>
    </div>
  );
}