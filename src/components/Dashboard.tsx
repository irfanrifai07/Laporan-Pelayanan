import React, { useState, useMemo } from 'react';
import { ContraceptiveMethod, FacilityProfile, PatientRecord, Village } from '../types';
import { METHOD_SHORT_LABELS, METHOD_LABELS } from '../data/initialData';
import {
  Calendar,
  Plus,
  ArrowRight,
  ClipboardList,
  Building2,
  Baby,
  RefreshCw,
  Sparkles,
  Heart,
  ShieldCheck,
  FileSpreadsheet,
  MapPin,
  TrendingUp,
} from 'lucide-react';

interface DashboardProps {
  records: PatientRecord[];
  villages: Village[];
  facility: FacilityProfile;
  onNavigateRegister: () => void;
  onNavigateRekap: () => void;
  onAddNew: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  villages,
  facility,
  onNavigateRegister,
  onNavigateRekap,
  onAddNew,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Semua Bulan
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedVillage, setSelectedVillage] = useState<string>('SEMUA');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Filter records based on selected period and village
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedVillage !== 'SEMUA' && r.village.toLowerCase() !== selectedVillage.toLowerCase()) {
        return false;
      }
      if (r.serviceDate) {
        const [y, m] = r.serviceDate.split('-').map(Number);
        if (selectedYear !== 0 && y !== selectedYear) return false;
        if (selectedMonth !== 0 && m !== selectedMonth) return false;
      }
      return true;
    });
  }, [records, selectedMonth, selectedYear, selectedVillage]);

  // Status Metrics (KBPP dan Ulangan dipisah secara tegas)
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const baruBukanPasca = filteredRecords.filter((r) => r.participantStatus === 'BARU_BUKAN_PASCA').length;
    const kbpp = filteredRecords.filter((r) => r.participantStatus === 'BARU_PASCA_SALIN').length; // KBPP dipisah
    const baruPascaGugur = filteredRecords.filter((r) => r.participantStatus === 'BARU_PASCA_GUGUR').length;
    const gantiCara = filteredRecords.filter((r) => r.participantStatus === 'GANTI_CARA').length;
    const ulangan = filteredRecords.filter((r) => r.participantStatus === 'ULANGAN').length; // Ulangan dipisah
    const apbn = filteredRecords.filter((r) => r.alokonSource === 'APBN').length;
    const mandiri = filteredRecords.filter((r) => r.alokonSource !== 'APBN').length;

    return {
      total,
      baruBukanPasca,
      kbpp,
      baruPascaGugur,
      totalBaruSemua: baruBukanPasca + kbpp + baruPascaGugur,
      gantiCara,
      ulangan,
      apbn,
      mandiri,
    };
  }, [filteredRecords]);

  // Method Breakdown Matrix (KBPP dan Ulangan dipisah per kolom)
  const methodList: ContraceptiveMethod[] = [
    'SUNTIK_3_BLN',
    'SUNTIK_1_BLN',
    'IMPLAN_2_BATANG',
    'IMPLAN_1_BATANG',
    'IUD',
    'PIL',
    'KONDOM',
    'MOW',
    'MOP',
  ];

  const methodMatrix = useMemo(() => {
    return methodList.map((m) => {
      const recs = filteredRecords.filter((r) => r.method === m);
      const baru = recs.filter((r) => r.participantStatus === 'BARU_BUKAN_PASCA').length;
      const kbpp = recs.filter((r) => r.participantStatus === 'BARU_PASCA_SALIN').length; // KBPP
      const pascaGugur = recs.filter((r) => r.participantStatus === 'BARU_PASCA_GUGUR').length;
      const gantiCara = recs.filter((r) => r.participantStatus === 'GANTI_CARA').length;
      const ulangan = recs.filter((r) => r.participantStatus === 'ULANGAN').length; // Ulangan
      const apbn = recs.filter((r) => r.alokonSource === 'APBN').length;
      const mandiri = recs.filter((r) => r.alokonSource !== 'APBN').length;

      return {
        key: m,
        label: METHOD_SHORT_LABELS[m] || m,
        fullLabel: METHOD_LABELS[m] || m,
        total: recs.length,
        baru,
        kbpp,
        pascaGugur,
        gantiCara,
        ulangan,
        apbn,
        mandiri,
      };
    });
  }, [filteredRecords]);

  // Village Breakdown Matrix (KBPP dan Ulangan dipisah)
  const villageMatrix = useMemo(() => {
    return villages.map((v) => {
      const recs = filteredRecords.filter(
        (r) => r.village.toLowerCase() === v.name.toLowerCase()
      );
      const baru = recs.filter((r) => r.participantStatus === 'BARU_BUKAN_PASCA').length;
      const kbpp = recs.filter((r) => r.participantStatus === 'BARU_PASCA_SALIN').length;
      const gantiCara = recs.filter((r) => r.participantStatus === 'GANTI_CARA').length;
      const ulangan = recs.filter((r) => r.participantStatus === 'ULANGAN').length;

      return {
        id: v.id,
        name: v.name,
        assignedBidan: v.assignedBidanName || '-',
        total: recs.length,
        baru,
        kbpp,
        gantiCara,
        ulangan,
      };
    });
  }, [villages, filteredRecords]);

  // Recent entries
  const recentRecords = useMemo(() => {
    return [...filteredRecords]
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
      .slice(0, 5);
  }, [filteredRecords]);

  return (
    <div className="space-y-5 pb-10 font-sans">
      {/* HEADER REKAP DATA & FILTER BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Rekapitulasi
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {facility.name} • Kec. {facility.district}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Rekap Data Pelayanan KB
          </h1>
          <p className="text-xs text-slate-500">
            Ringkasan capaian akseptor KB, KBPP (Pasca Persalinan), dan Kunjungan Ulang
          </p>
        </div>

        {/* Filter Periode & Wilayah */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Pilih Bulan */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-slate-800"
            >
              <option value={0}>Semua Bulan</option>
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-slate-800 ml-1"
            >
              <option value={0}>Semua Tahun</option>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Pilih Wilayah */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="text-xs font-medium bg-transparent border-none focus:outline-none text-slate-800"
            >
              <option value="SEMUA">Semua Desa (Puskesmas)</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  Desa {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <button
            onClick={onAddNew}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Entri Pasien</span>
          </button>

          <button
            onClick={onNavigateRegister}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
            <span>Tabel Register</span>
          </button>
        </div>
      </div>

      {/* KARTU REKAPITULASI STATUS (KBPP & ULANG DIPISAH SECARA TEGAS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Total Pelayanan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Pelayanan</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</div>
            <span className="text-[10px] text-slate-500">Seluruh Tindakan Pelayanan</span>
          </div>
        </div>

        {/* 2. Peserta KB Baru (Bukan Pasca Salin) */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">Baru (Bukan Pasca)</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-teal-950">{stats.baruBukanPasca}</div>
            <span className="text-[10px] text-teal-700 font-medium">Akseptor Pertama Kali</span>
          </div>
        </div>

        {/* 3. KBPP (Pasca Persalinan) - DIPISAH KHUSUS */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-emerald-50/40 shadow-xs flex flex-col justify-between ring-1 ring-emerald-400/20">
          <div className="flex items-center justify-between text-emerald-800">
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">KBPP</span>
              <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1 rounded">Prioritas</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-200/80 flex items-center justify-center text-emerald-900">
              <Baby className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.kbpp}</div>
            <span className="text-[10px] text-emerald-800 font-bold">Pasca Persalinan (Ibu Bersalin)</span>
          </div>
        </div>

        {/* 4. Ulangan (Kunjungan Rutin) - DIPISAH KHUSUS */}
        <div className="bg-white p-4 rounded-2xl border border-blue-300 bg-blue-50/40 shadow-xs flex flex-col justify-between ring-1 ring-blue-400/20">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-950">Ulangan</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-blue-950">{stats.ulangan}</div>
            <span className="text-[10px] text-blue-800 font-bold">Suntik / Kontrol Rutin</span>
          </div>
        </div>

        {/* 5. Ganti Cara */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Ganti Cara</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-950">{stats.gantiCara}</div>
            <span className="text-[10px] text-amber-700 font-medium">Beralih Metode Kontrasepsi</span>
          </div>
        </div>
      </div>

      {/* METRIK ALOKON (SUMBER LOGISTIK) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">Alokon Pemerintah (APBN)</span>
              <p className="text-[10px] text-slate-500">Logistik program BKKBN bebas biaya bagi masyarakat</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-purple-950">{stats.apbn}</span>
            <span className="text-[10px] text-slate-500 block">Akseptor</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">Alokon Mandiri / Swasta</span>
              <p className="text-[10px] text-slate-500">Pengadaan mandiri atau klinik mitra faskes</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-slate-900">{stats.mandiri}</span>
            <span className="text-[10px] text-slate-500 block">Akseptor</span>
          </div>
        </div>
      </div>

      {/* TABEL 1: REKAPITULASI PER METODE KONTRASEPSI (KOLOM KBPP & ULANGAN DIPISAH) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Rekapitulasi Pelayanan Berdasarkan Metode Kontrasepsi</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Rincian capaian setiap metode dengan kolom <b>KBPP</b> dan <b>Ulangan</b> dipisah secara jelas
            </p>
          </div>
          <button
            onClick={onNavigateRekap}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
          >
            <span>Formulir F/II/KB</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-center font-bold text-slate-800 border-b border-slate-300">
                <th className="border border-slate-300 p-2 w-10">No</th>
                <th className="border border-slate-300 p-2 text-left">Metode Kontrasepsi</th>
                <th className="border border-slate-300 p-2 w-20 bg-teal-50 text-teal-900">
                  Baru (Bukan)
                </th>
                {/* KOLOM KBPP DIPISAH */}
                <th className="border border-slate-300 p-2 w-24 bg-emerald-100 text-emerald-950 font-black">
                  KBPP (Pasca Salin)
                </th>
                <th className="border border-slate-300 p-2 w-20 bg-amber-50 text-amber-900">
                  Ganti Cara
                </th>
                {/* KOLOM ULANGAN DIPISAH */}
                <th className="border border-slate-300 p-2 w-20 bg-blue-100 text-blue-950 font-black">
                  Ulangan
                </th>
                <th className="border border-slate-300 p-2 w-24 bg-slate-200 font-extrabold text-slate-950">
                  Total Layanan
                </th>
                <th className="border border-slate-300 p-2 w-16 text-purple-900 bg-purple-50">APBN</th>
                <th className="border border-slate-300 p-2 w-16 bg-slate-50">Mandiri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {methodMatrix.map((row, idx) => (
                <tr
                  key={row.key}
                  className="hover:bg-slate-50 even:bg-slate-50/50 text-center font-mono transition-colors"
                >
                  <td className="border border-slate-300 p-2 text-slate-500 font-sans">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 text-left font-sans font-bold text-slate-900">
                    {row.label}
                  </td>
                  <td className="border border-slate-300 p-2 bg-teal-50/40 text-teal-950">
                    {row.baru}
                  </td>
                  {/* CELL KBPP */}
                  <td className="border border-slate-300 p-2 bg-emerald-50 text-emerald-950 font-black">
                    {row.kbpp > 0 ? (
                      <span className="text-emerald-700 font-bold">{row.kbpp}</span>
                    ) : (
                      <span className="text-slate-300 font-normal">0</span>
                    )}
                  </td>
                  <td className="border border-slate-300 p-2 bg-amber-50/40 text-amber-950">
                    {row.gantiCara}
                  </td>
                  {/* CELL ULANGAN */}
                  <td className="border border-slate-300 p-2 bg-blue-50 text-blue-950 font-black">
                    {row.ulangan > 0 ? (
                      <span className="text-blue-700 font-bold">{row.ulangan}</span>
                    ) : (
                      <span className="text-slate-300 font-normal">0</span>
                    )}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold bg-slate-100 text-slate-900">
                    {row.total}
                  </td>
                  <td className="border border-slate-300 p-2 text-purple-900 font-semibold">{row.apbn}</td>
                  <td className="border border-slate-300 p-2 text-slate-600">{row.mandiri}</td>
                </tr>
              ))}
            </tbody>
            {/* TOTAL FOOTER ROW */}
            <tfoot>
              <tr className="bg-slate-200 font-black text-slate-950 text-center border-t-2 border-slate-400">
                <td colSpan={2} className="border border-slate-300 p-2 text-right uppercase font-sans">
                  JUMLAH TOTAL :
                </td>
                <td className="border border-slate-300 p-2 font-mono text-teal-950">{stats.baruBukanPasca}</td>
                <td className="border border-slate-300 p-2 font-mono bg-emerald-200 text-emerald-950 font-black">
                  {stats.kbpp}
                </td>
                <td className="border border-slate-300 p-2 font-mono text-amber-950">{stats.gantiCara}</td>
                <td className="border border-slate-300 p-2 font-mono bg-blue-200 text-blue-950 font-black">
                  {stats.ulangan}
                </td>
                <td className="border border-slate-300 p-2 font-mono bg-slate-300 text-slate-950 font-black">
                  {stats.total}
                </td>
                <td className="border border-slate-300 p-2 font-mono text-purple-950">{stats.apbn}</td>
                <td className="border border-slate-300 p-2 font-mono text-slate-800">{stats.mandiri}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* TABEL 2: REKAPITULASI PER DESA (KBPP & ULANGAN DIPISAH) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Rekapitulasi Pelayanan per Desa Binaan</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Sebaran capaian akseptor di masing-masing desa wilayah kerja {facility.name}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-center font-bold text-slate-800 border-b border-slate-300">
                <th className="border border-slate-300 p-2 w-10">No</th>
                <th className="border border-slate-300 p-2 text-left">Nama Desa</th>
                <th className="border border-slate-300 p-2 text-left">Bidan Desa Penanggung Jawab</th>
                <th className="border border-slate-300 p-2 w-20 bg-teal-50 text-teal-900">Baru</th>
                <th className="border border-slate-300 p-2 w-24 bg-emerald-100 text-emerald-950 font-black">
                  KBPP
                </th>
                <th className="border border-slate-300 p-2 w-20 bg-amber-50 text-amber-900">Ganti Cara</th>
                <th className="border border-slate-300 p-2 w-20 bg-blue-100 text-blue-950 font-black">
                  Ulangan
                </th>
                <th className="border border-slate-300 p-2 w-24 bg-slate-200 font-extrabold text-slate-950">
                  Total Layanan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {villageMatrix.map((v, i) => (
                <tr
                  key={v.id}
                  className="hover:bg-slate-50 even:bg-slate-50/50 text-center font-mono transition-colors"
                >
                  <td className="border border-slate-300 p-2 text-slate-500 font-sans">{i + 1}</td>
                  <td className="border border-slate-300 p-2 text-left font-sans font-bold text-slate-900">
                    Desa {v.name}
                  </td>
                  <td className="border border-slate-300 p-2 text-left font-sans text-slate-600 text-[11px]">
                    {v.assignedBidan}
                  </td>
                  <td className="border border-slate-300 p-2 bg-teal-50/40">{v.baru}</td>
                  <td className="border border-slate-300 p-2 bg-emerald-50 font-bold text-emerald-900">
                    {v.kbpp}
                  </td>
                  <td className="border border-slate-300 p-2 bg-amber-50/40">{v.gantiCara}</td>
                  <td className="border border-slate-300 p-2 bg-blue-50 font-bold text-blue-900">
                    {v.ulangan}
                  </td>
                  <td className="border border-slate-300 p-2 bg-slate-100 font-bold text-slate-900">
                    {v.total}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-black text-slate-950 text-center border-t-2 border-slate-400">
                <td colSpan={3} className="border border-slate-300 p-2 text-right uppercase font-sans">
                  TOTAL SELURUH DESA :
                </td>
                <td className="border border-slate-300 p-2 font-mono text-teal-950">{stats.baruBukanPasca}</td>
                <td className="border border-slate-300 p-2 font-mono bg-emerald-200 text-emerald-950 font-black">
                  {stats.kbpp}
                </td>
                <td className="border border-slate-300 p-2 font-mono text-amber-950">{stats.gantiCara}</td>
                <td className="border border-slate-300 p-2 font-mono bg-blue-200 text-blue-950 font-black">
                  {stats.ulangan}
                </td>
                <td className="border border-slate-300 p-2 font-mono bg-slate-300 text-slate-950 font-black">
                  {stats.total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* RECENT RECORDS (5 DATA TERAKHIR DILAYANI) */}
      {filteredRecords.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">5 Pasien Terakhir Tercatat</h3>
              <p className="text-[11px] text-slate-500">Data entri pelayanan akseptor terkini</p>
            </div>
            <button
              onClick={onNavigateRegister}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
            >
              <span>Buka Register Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentRecords.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    {r.wifeName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{r.wifeName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({r.wifeAge} th)</span>
                      <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-100">
                        Desa {r.village}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Suami: {r.husbandName || '-'} • Tgl: {r.serviceDate} • No. Reg: {r.registerNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1.5 justify-end">
                    {r.participantStatus === 'BARU_PASCA_SALIN' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                        KBPP
                      </span>
                    ) : r.participantStatus === 'ULANGAN' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                        Ulangan
                      </span>
                    ) : r.participantStatus === 'GANTI_CARA' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Ganti Cara
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                        Baru
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {METHOD_SHORT_LABELS[r.method]}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Bidan: {r.officerName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
