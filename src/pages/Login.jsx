import { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-green.png'; // مسیر لوگو

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      sessionStorage.setItem('isAuthenticated', 'true');
      alert('✅ ورود با موفقیت انجام شد.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || '❌ ورود ناموفق!';
      setError(msg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#00b9b5] px-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6 text-center">
        <img
          src={logo}
          alt="Milad Beauty Center"
          className="mx-auto w-60 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
        />

        <div className="bg-white p-6 rounded-2xl shadow-md font-vazir space-y-5">
          <h2 className="text-xl font-bold text-right text-gray-800">ورود به سامانه</h2>

          <form onSubmit={handleLogin} className="space-y-4 text-right">
            <div>
              <label className="block text-sm text-gray-600 mb-1">نام کاربری</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00b9b5]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">رمز عبور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00b9b5]"
                placeholder="••••••"
              />
            </div>

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[#00b9b5] hover:bg-[#00a1a0] text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              ورود
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;