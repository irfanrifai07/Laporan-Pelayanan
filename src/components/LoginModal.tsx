import React, { useState } from 'react';
import { User, Village, Role } from '../types';
import { StorageService } from '../services/storage';
import {
  AlertCircle,
  Building2,
  Check,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: User) => void;
  onUserRegistered?: (user: User) => void;
  users?: User[];
  villages?: Village[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onUserRegistered,
  users: propUsers,
  villages: propVillages,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regRole, setRegRole] = useState<Role>('bidan_desa');
  const [regVillage, setRegVillage] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  if (!isOpen) return null;

  const facility = StorageService.getFacilityProfile();
  const villages =
    propVillages && propVillages.length > 0 ? propVillages : StorageService.getVillages();

  // Set default village for registration if not selected yet
  const effectiveVillage = regVillage || (villages.length > 0 ? villages[0].name : '');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Selalu ambil daftar user paling segar dari storage & prop
    const storageUsers = StorageService.getUsers();
    const allUsers = propUsers && propUsers.length > 0 ? propUsers : storageUsers;

    const inputUser = username.trim().toLowerCase();
    const cleanInputUser = inputUser.replace(/[\s_-]/g, '');
    const inputPass = password.trim();

    // Cocokkan username secara fleksibel (mengabaikan spasi, underscore, dan huruf besar/kecil)
    const userMatch = allUsers.find((u) => {
      const uName = (u.username || '').trim().toLowerCase();
      const cleanUName = uName.replace(/[\s_-]/g, '');
      return uName === inputUser || cleanUName === cleanInputUser;
    });

    if (!userMatch) {
      setErrorMessage(
        `Username "${username.trim()}" tidak ditemukan. Pastikan username sudah terdaftar atau gunakan menu "Daftar Akun Baru".`
      );
      return;
    }

    // Periksa password
    const savedPass = (userMatch.password || '').trim();
    if (savedPass !== inputPass) {
      setErrorMessage(
        `Kata sandi untuk username "${userMatch.username}" tidak cocok. Silakan periksa kembali ketikan password Anda.`
      );
      return;
    }

    StorageService.setCurrentUser(userMatch);
    StorageService.logActivity(
      userMatch.username,
      'LOGIN',
      `Pengguna ${userMatch.name} (${userMatch.username}) berhasil masuk`
    );
    onLoginSuccess(userMatch);
    if (onClose) onClose();
  };

  // Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setRegSuccessMessage('');

    const cleanName = regName.trim();
    const cleanUser = regUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();

    if (!cleanName) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username minimal terdiri dari 3 karakter.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Kata sandi tidak boleh kosong.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok. Mohon ulangi ketikan kata sandi.');
      return;
    }

    const storageUsers = StorageService.getUsers();
    const allUsers = propUsers && propUsers.length > 0 ? propUsers : storageUsers;

    // Cek apakah username sudah dipakai
    const isTaken = allUsers.some(
      (u) =>
        u.username.trim().toLowerCase() === cleanUser ||
        u.username.trim().toLowerCase().replace(/[\s_-]/g, '') === cleanUser.replace(/[\s_-]/g, '')
    );

    if (isTaken) {
      setErrorMessage(
        `Username "@${cleanUser}" sudah digunakan oleh petugas lain. Silakan pilih username yang berbeda.`
      );
      return;
    }

    // Buat objek User baru
    const newUser: User = {
      id: 'usr-' + Date.now(),
      username: cleanUser,
      password: cleanPass,
      name: cleanName,
      role: regRole,
      village: regRole === 'bidan_desa' ? effectiveVillage : undefined,
    };

    // Simpan ke storage
    const updatedUsers = [...allUsers.filter((u) => u.id !== newUser.id), newUser];
    StorageService.saveUsers(updatedUsers);
    StorageService.setCurrentUser(newUser);
    StorageService.logActivity(
      newUser.username,
      'DAFTAR_MANDIRI',
      `Pendaftaran akun baru secara mandiri: ${newUser.name} (@${newUser.username}) sebagai ${newUser.role}`
    );

    // Langsung update state aplikasi dan masuk sebagai user baru
    if (onUserRegistered) {
      onUserRegistered(newUser);
    } else {
      onLoginSuccess(newUser);
    }
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 sm:p-6 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 border border-white/20 shadow-inner">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold">
            {activeTab === 'login' ? 'Masuk ke Aplikasi' : 'Daftar Akun Baru'}
          </h2>
          <p className="text-xs text-emerald-100 mt-0.5">{facility.name}</p>

          {/* Toggle Switch Tabs */}
          <div className="mt-4 inline-flex p-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {regSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-fade-in">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-600 animate-spin" />
              <span className="font-semibold">{regSuccessMessage}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* ================= FORM LOGIN ================= */
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Username Akun
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: admin / adminkec / bidan"
                    required
                    autoFocus
                    className="w-full py-2.5 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    className="w-full py-2.5 pl-9 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer text-sm"
              >
                <Check className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </button>

              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-slate-500">
                  Belum memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMessage('');
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Daftar akun baru di sini &rarr;
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ================= FORM DAFTAR AKUN BARU ================= */
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Petugas <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Bd. Siti Aminah, S.Tr.Keb / Bpk. Rahmat, S.KM"
                    required
                    autoFocus
                    className="w-full py-2 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) =>
                      setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))
                    }
                    placeholder="Contoh: bidan_siti / adminkec"
                    required
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Huruf kecil, tanpa spasi</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Peran / Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as Role)}
                      className="w-full py-2 pl-8 pr-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    >
                      <option value="bidan_desa">Bidan Desa</option>
                      <option value="admin_induk">Admin Induk (Puskesmas / Koordinator KB)</option>
                    </select>
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {regRole === 'bidan_desa' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Wilayah Desa Binaan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={effectiveVillage}
                      onChange={(e) => setRegVillage(e.target.value)}
                      className="w-full py-2 pl-8 pr-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    >
                      {villages.map((v) => (
                        <option key={v.id} value={v.name}>
                          Desa {v.name} {!v.entryAllowed ? '(Izin Ditutup)' : ''}
                        </option>
                      ))}
                    </select>
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 3 karakter"
                      required
                      className="w-full py-2 pl-8 pr-8 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {regShowPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Konfirmasi Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      required
                      className="w-full py-2 pl-8 pr-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800">
                <p className="font-semibold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akun Langsung Aktif & Siap Digunakan</span>
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5">
                  Setelah menekan tombol di bawah, akun akan tersimpan dan Anda langsung masuk ke aplikasi.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer text-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar & Langsung Masuk</span>
              </button>

              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-slate-500">
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage('');
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Masuk di sini &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}

          {onClose && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
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
