import React from 'react';
import { FacilityProfile, PatientRecord, User, Village } from '../types';
import {
  Shield,
  Building2,
  Users,
  MapPin,
  Cloud,
  Plus,
  FileSpreadsheet,
  Settings,
  UserCheck,
  CheckCircle,
  Database,
  ArrowRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

interface RoleWorkspaceBannerProps {
  currentUser: User | null;
  facility: FacilityProfile;
  records: PatientRecord[];
  villages: Village[];
  users: User[];
  onOpenNewRecord: () => void;
  onNavigateTab: (tab: 'dashboard' | 'register' | 'rekapitulasi' | 'admin') => void;
}

export const RoleWorkspaceBanner: React.FC<RoleWorkspaceBannerProps> = ({
  currentUser,
  facility,
  records,
  villages,
  users,
  onOpenNewRecord,
  onNavigateTab,
}) => {
  if (!currentUser) return null;

  const role = currentUser.role;

  // 1. ADMIN INDUK (PUSKESMAS / SUPER ADMIN)
  if (role === 'admin_induk') {
    return (
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-xl border border-purple-800/40 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Role & Title */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>👑 Pusat Kendali Utama • Admin Induk Faskes</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Selamat Datang, {currentUser.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              Anda memegang <strong>kendali penuh atas seluruh sistem</strong>: mengelola profil {facility.name}, memantau data pelayanan di seluruh {villages.length} desa binaan, mengatur seluruh akun pengguna, serta melakukan pencadangan & pemulihan database.
            </p>

            {/* Quick Metrics */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-purple-100">
              <span className="bg-purple-900/60 border border-purple-700/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-purple-300" />
                <span>Total Register: <strong>{records.length} Akseptor</strong></span>
              </span>
              <span className="bg-purple-900/60 border border-purple-700/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>Pengguna Aktif: <strong>{users.length} Akun</strong></span>
              </span>
              <span className="bg-purple-900/60 border border-purple-700/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-300" />
                <span>Cakupan: <strong>{villages.length} Desa</strong></span>
              </span>
              <span className="bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Database Aktif</span>
              </span>
            </div>
          </div>

          {/* Quick Actions for Admin Induk */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('admin')}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-900/40 flex items-center space-x-2 cursor-pointer group"
            >
              <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              <span>Pengaturan Faskes & Akun &rarr;</span>
            </button>

            <button
              onClick={() => onNavigateTab('register')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-xl text-xs font-semibold transition flex items-center space-x-2 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-purple-300" />
              <span>Buka Register Semua Desa</span>
            </button>

            <button
              onClick={() => onNavigateTab('rekapitulasi')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-xl text-xs font-semibold transition flex items-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-300" />
              <span>Laporan Rekapitulasi F2</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ADMIN KECAMATAN (MEMBAWAHI SELURUH USER DESA)
  if (role === 'admin_kecamatan') {
    const totalDesaUsers = users.filter((u) => u.role === 'bidan_desa').length;

    return (
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-sky-950 text-white p-5 sm:p-6 shadow-xl border border-blue-800/40 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Role & Title */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>🏢 Panel Koordinasi Wilayah • Admin Kecamatan</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Selamat Bertugas, {currentUser.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
              Wewenang Anda adalah <strong>membawahi seluruh User Desa se-Kecamatan {facility.district}</strong>. Anda bertugas mengawasi kelengkapan data entri dari {villages.length} desa binaan, memverifikasi register akseptor, dan mengelola akun bidan desa binaan.
            </p>

            {/* Quick Metrics */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-blue-100">
              <span className="bg-blue-900/60 border border-blue-700/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-blue-300" />
                <span>Membawahi: <strong>{totalDesaUsers} Akun User Desa</strong></span>
              </span>
              <span className="bg-blue-900/60 border border-blue-700/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                <span>Wilayah: <strong>Kec. {facility.district} ({villages.length} Desa)</strong></span>
              </span>
              <span className="bg-blue-900/60 border border-blue-700/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-blue-300" />
                <span>Total Register Masuk: <strong>{records.length} Akseptor</strong></span>
              </span>
            </div>
          </div>

          {/* Quick Actions for Admin Kecamatan */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('admin')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-900/40 flex items-center space-x-2 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Kelola User Desa Binaan &rarr;</span>
            </button>

            <button
              onClick={() => onNavigateTab('register')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-xl text-xs font-semibold transition flex items-center space-x-2 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-blue-300" />
              <span>Verifikasi Register Desa</span>
            </button>

            <button
              onClick={() => onNavigateTab('rekapitulasi')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-xl text-xs font-semibold transition flex items-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-300" />
              <span>Rekapitulasi Kecamatan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. USER DESA (TUGAS KHUSUS UNTUK MENENTRI SAJA)
  const myVillage = currentUser.village || '';
  const myVillageRecords = records.filter(
    (r) => myVillage && r.village.toLowerCase() === myVillage.toLowerCase()
  );

  return (
    <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-emerald-700/40 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Role & Title */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>🌿 Workspace Entri Pelayanan • User Desa {myVillage}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Selamat Datang, {currentUser.name}</span>
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Peran Anda adalah <strong>User Desa</strong> dengan tugas khusus untuk <strong>menentri data register pelayanan akseptor KB</strong> di wilayah Desa <strong>{myVillage || 'Binaan'}</strong>.
            Data yang dientri otomatis tersimpan dan langsung disinkronkan ke PC Admin Kecamatan dan Admin Induk.
          </p>

          {/* Quick Metrics */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-emerald-100">
            <span className="bg-emerald-900/70 border border-emerald-600/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Wilayah Entri: <strong>Desa {myVillage || 'Umum'}</strong> (Terkunci Otomatis)</span>
            </span>
            <span className="bg-emerald-900/70 border border-emerald-600/50 px-3 py-1 rounded-xl flex items-center space-x-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-emerald-300" />
              <span>Data Terentri di Desa Ini: <strong>{myVillageRecords.length} Akseptor</strong></span>
            </span>
            <span className="bg-teal-900/70 border border-teal-500/50 text-teal-200 px-3 py-1 rounded-xl flex items-center space-x-1.5">
              <Cloud className="w-3.5 h-3.5 text-teal-300" />
              <span>Tersambung Realtime (HP & PC)</span>
            </span>
          </div>
        </div>

        {/* Big Prominent Action for User Desa: INSTANT ENTRY */}
        <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
          <button
            onClick={onOpenNewRecord}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black rounded-2xl text-sm transition shadow-xl shadow-emerald-950/50 flex items-center justify-center space-x-2 cursor-pointer border border-emerald-300/40"
          >
            <Plus className="w-5 h-5 text-slate-950 stroke-[3]" />
            <span>+ ENTRI PASIEN KB BARU</span>
          </button>

          <button
            onClick={() => onNavigateTab('register')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer text-center"
          >
            <ClipboardList className="w-4 h-4 text-emerald-300" />
            <span>Lihat Daftar Register Desa {myVillage}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
