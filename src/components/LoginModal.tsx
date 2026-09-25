import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { ShieldCheck, UserCheck, KeyRound, AlertCircle, Building2, UserCircle, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const users = StorageService.getUsers();
  const facility = StorageService.getFacilityProfile();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim().toLowerCase();
    const found = users.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === password
    );

    if (found) {
      StorageService.setCurrentUser(found);
      StorageService.logActivity(found.username, 'LOGIN', `Pengguna ${found.name} berhasil masuk`);
      onLoginSuccess(found);
      if (onClose) onClose();
    } else {
      setErrorMessage('Username atau kata sandi tidak cocok. Silakan periksa kembali.');
    }
  };

  const handleQuickSelect = (user: User) => {
    StorageService.setCurrentUser(user);
    StorageService.logActivity(user.username, 'LOGIN_CEPAT', `Pilih akun cepat: ${user.name}`);
    onLoginSuccess(user);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 border border-white/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold">Pilih Akun / Masuk Aplikasi</h2>
          <p className="text-xs text-emerald-100 mt-0.5">{facility.name}</p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick 1-Click Role Switcher */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <UserCircle className="w-4 h-4 text-emerald-600" />
              <span>Masuk Cepat 1-Klik (Siap Pakai):</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {users.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className="p-3 text-left border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 rounded-2xl transition group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-emerald-800 line-clamp-1">
                    {u.name}
                  </div>
                  <div className="text-[10px] text-slate-500 group-hover:text-emerald-600 mt-0.5">
                    {u.role === 'admin_induk'
                      ? 'Admin Puskesmas'
                      : u.role === 'admin_kecamatan'
                      ? 'Admin Kecamatan'
                      : `Bidan ${u.village || ''}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold">
              atau masuk dengan akun lain
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Manual Form */}
          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: admin / nama desa"
                required
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi bawaan: 123"
                required
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold transition shadow-sm flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Masuk Sekarang</span>
            </button>
          </form>

          {onClose && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Tutup jendela ini
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
