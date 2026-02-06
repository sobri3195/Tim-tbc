import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { USERS } from '../data/users';
import { usePatients } from '../context/PatientContext';

export default function UserSidebar() {
  const { currentUser, logout, switchUser } = useAuth();
  const { getStats } = usePatients();
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const stats = getStats();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'viewer': return '👁️';
      case 'kader': return '👨‍⚕️';
      case 'pelapor': return '📝';
      default: return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'viewer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'kader': return 'bg-green-100 text-green-800 border-green-200';
      case 'pelapor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPermissionDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Akses penuh ke semua fitur sistem';
      case 'viewer':
        return 'Melihat data dan laporan';
      case 'kader':
        return 'Mengelola data pasien dan tambah/edit';
      case 'pelapor':
        return 'Menambah dan melihat data sendiri';
      default:
        return 'Role tidak dikenal';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Current User Info */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getRoleIcon(currentUser.role)}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">{currentUser.fullName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(currentUser.role)}`}>
                {currentUser.role.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600">{currentUser.region}</p>
            <p className="text-xs text-gray-500">{currentUser.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition duration-200"
          >
            📊 Stats
          </button>
          <button
            onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition duration-200"
          >
            🔄 Switch User
          </button>
          <button
            onClick={logout}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition duration-200"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Statistik Data Pasien</h4>
          <div className="grid grid-cols-5 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.aktif}</div>
              <div className="text-xs text-gray-600">Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.pengobatan}</div>
              <div className="text-xs text-gray-600">Obat</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.sehat}</div>
              <div className="text-xs text-gray-600">Sembuh</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{stats.recentlyAdded}</div>
              <div className="text-xs text-gray-600">Minggu Ini</div>
            </div>
          </div>
        </div>
      )}

      {/* User Switcher Panel */}
      {showUserSwitcher && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">Switch ke Akun Demo</h4>
          <p className="text-sm text-gray-600 mb-3">
            {getPermissionDescription(currentUser.role)}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  switchUser(user);
                  setShowUserSwitcher(false);
                  setShowStats(false);
                }}
                disabled={user.id === currentUser.id}
                className={`text-left p-3 rounded-lg border transition duration-200 ${
                  user.id === currentUser.id 
                    ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getRoleIcon(user.role)}</span>
                      <span className="font-medium text-sm">{user.fullName}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{user.region}</p>
                    <p className="text-xs text-gray-500">{getPermissionDescription(user.role)}</p>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {user.username}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 <strong>Tips:</strong> Setiap role memiliki akses yang berbeda:
            <ul className="mt-1 list-disc list-inside">
              <li><strong>Admin:</strong> Dapat melihat semua data dan mengelola sistem</li>
              <li><strong>Viewer:</strong> Hanya dapat melihat data tanpa edit</li>
              <li><strong>Kader:</strong> Dapat menambah dan edit data pasien</li>
              <li><strong>Pelapor:</strong> Dapat menambah data sendiri</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}