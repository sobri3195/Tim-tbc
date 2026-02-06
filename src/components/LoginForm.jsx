import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { USERS } from '../data/users';

export default function LoginForm() {
  const { login, loginForm, setLoginForm, setShowLogin } = useAuth();
  const [error, setError] = useState('');
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const result = login(loginForm.username, loginForm.password);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleDemoLogin = (user) => {
    login(user.username, user.password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏥</div>
          <h2 className="text-2xl font-bold text-gray-800">Sistem TBC</h2>
          <p className="text-gray-600 text-sm mt-1">Login untuk akses sistem</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
          >
            Login
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => setShowDemoUsers(!showDemoUsers)}
            className="text-blue-600 text-sm hover:underline text-center w-full"
          >
            {showDemoUsers ? 'Sembunyikan' : 'Tampilkan'} Akun Demo
          </button>

          {showDemoUsers && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 text-center mb-3">
                Klik untuk login cepat dengan akun demo:
              </p>
              {USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleDemoLogin(user)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{user.fullName}</p>
                      <p className="text-xs text-gray-600">{user.role} • {user.region}</p>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {user.username}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Demo sistem TBC tanpa backend • Data simulasi
          </p>
        </div>
      </div>
    </div>
  );
}