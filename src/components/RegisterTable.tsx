import React, { useState, useMemo } from 'react';
import { ContraceptiveMethod, FacilityProfile, PatientRecord, User, Village } from '../types';
import {
  METHOD_SHORT_LABELS,
  STATUS_LABELS,
  ACTION_LABELS,
  ALOKON_LABELS,
} from '../data/initialData';
import {
  Search,
  Plus,
  Printer,
  Download,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  X,
  Stethoscope,
  UserCheck,
  Heart,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';

interface RegisterTableProps {
  records: PatientRecord[];
  villages: Village[];
  facility: FacilityProfile;
  currentUser: User | null;
  onAddNew: () => void;
  onEdit: (record: PatientRecord) => void;
  onDelete: (id: string) => void;
  onOpenPrint: () => void;
  onClearRecords?: () => void;
  onLoadSampleAgustus?: () => void;
}

export const RegisterTable: React.FC<RegisterTableProps> = ({
  records,
  villages,
  facility,
  currentUser,
  onAddNew,
  onEdit,
  onDelete,
  onOpenPrint,
  onClearRecords,
  onLoadSampleAgustus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>(
    currentUser?.role === 'bidan_desa' && currentUser.village ? currentUser.village : 'SEMUA'
  );
  const [selectedMethod, setSelectedMethod] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<string>('SEMUA');
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Semua Bulan
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Selected record for detail modal
  const [detailRecord, setDetailRecord] = useState<PatientRecord | null>(null);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedVillage !== 'SEMUA' && r.village.toLowerCase() !== selectedVillage.toLowerCase()) {
        return false;
      }
      if (selectedMethod !== 'SEMUA' && r.method !== selectedMethod) {
        return false;
      }
      if (selectedStatus !== 'SEMUA' && r.participantStatus !== selectedStatus) {
        return false;
      }
      if (r.serviceDate) {
        const [rYear, rMonth] = r.serviceDate.split('-').map(Number);
        if (selectedYear !== 0 && rYear !== selectedYear) return false;
        if (selectedMonth !== 0 && rMonth !== selectedMonth) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = r.wifeName.toLowerCase().includes(q) || (r.husbandName && r.husbandName.toLowerCase().includes(q));
        const matchNik = (r.wifeNik && r.wifeNik.includes(q)) || (r.husbandNik && r.husbandNik.includes(q));
        const matchReg = r.registerNumber.toLowerCase().includes(q);
        const matchAddr = r.address && r.address.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchReg && !matchAddr) return false;
      }
      return true;
    });
  }, [records, selectedVillage, selectedMethod, selectedStatus, selectedMonth, selectedYear, searchTerm]);

  // Aggregate summaries for bottom row
  const summary = useMemo(() => {
    let totalAnakL = 0;
    let totalAnakP = 0;
    let totalBaru = 0;
    let totalKbpp = 0;
    let totalGantiCara = 0;
    let totalUlangan = 0;
    let totalApbn = 0;
    let totalMandiri = 0;

    filteredRecords.forEach((r) => {
      totalAnakL += r.aliveChildrenMale || 0;
      totalAnakP += r.aliveChildrenFemale || 0;
      if (r.participantStatus === 'BARU_PASCA_SALIN') {
        totalKbpp += 1;
      } else if (r.participantStatus === 'BARU_BUKAN_PASCA' || r.participantStatus === 'BARU_PASCA_GUGUR') {
        totalBaru += 1;
      } else if (r.participantStatus === 'GANTI_CARA') {
        totalGantiCara += 1;
      } else if (r.participantStatus === 'ULANGAN') {
        totalUlangan += 1;
      }

      if (r.alokonSource === 'APBN') {
        totalApbn += 1;
      } else {
        totalMandiri += 1;
      }
    });

    return {
      total: filteredRecords.length,
      totalAnakL,
      totalAnakP,
      totalBaru,
      totalKbpp,
      totalGantiCara,
      totalUlangan,
      totalApbn,
      totalMandiri,
    };
  }, [filteredRecords]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal Pelayanan',
      'No. Register / Rekam Medis',
      'NIK Istri',
      'Nama Istri',
      'Tanggal Lahir Istri',
      'Usia Istri (Thn)',
      'Nama Suami',
      'NIK Suami',
      'No. BPJS',
      'Desa',
      'Alamat Domisili',
      'Jumlah Anak Hidup (L)',
      'Jumlah Anak Hidup (P)',
      'Umur Anak Terkecil (Bulan)',
      'Status Kepesertaan KB',
      'Metode Kontrasepsi',
      'Sumber Alokon',
      'Jenis Tindakan',
      'Tekanan Darah (TD)',
      'Berat Badan (kg)',
      'HPHT',
      'Efek Samping',
      'Komplikasi',
      'Status Rujukan',
      'Tempat Pelayanan',
      'Petugas Pelayanan',
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `"${r.serviceDate}"`,
      `"${r.registerNumber}"`,
      `'${r.wifeNik}`,
      `"${r.wifeName}"`,
      `"${r.wifeDob || '-'}"`,
      r.wifeAge,
      `"${r.husbandName || '-'}"`,
      `'${r.husbandNik || '-'}`,
      `"${r.bpjsNumber || '-'}"`,
      `"${r.village}"`,
      `"${r.address}"`,
      r.aliveChildrenMale,
      r.aliveChildrenFemale,
      r.youngestChildAgeMonths,
      `"${STATUS_LABELS[r.participantStatus] || r.participantStatus}"`,
      `"${METHOD_SHORT_LABELS[r.method] || r.method}"`,
      `"${r.alokonSource}"`,
      `"${ACTION_LABELS[r.actionType] || r.actionType}"`,
      `"${r.bloodPressure}"`,
      r.weightKg,
      `"${r.hpht || '-'}"`,
      `"${r.sideEffects}"`,
      `"${r.complications}"`,
      `"${r.referralStatus}"`,
      `"${r.servicePlace}"`,
      `"${r.officerName}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Register_Pelayanan_KB_Faskes_${monthNames[selectedMonth > 0 ? selectedMonth - 1 : 7]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BARU_PASCA_SALIN':
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            KBPP
          </span>
        );
      case 'BARU_BUKAN_PASCA':
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
            Baru
          </span>
        );
      case 'BARU_PASCA_GUGUR':
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
            Pasca Gugur
          </span>
        );
      case 'GANTI_CARA':
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Ganti Cara
          </span>
        );
      case 'ULANGAN':
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
            Ulangan
          </span>
        );
      default:
        return (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Register Pelayanan KB Faskes Puskesmas
              </h2>
              <p className="text-[11px] text-slate-500">
                Format Resmi BKKBN (Sesuai Dokumen Laporan Pelayanan KB)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Print/PDF */}
          <button
            onClick={onOpenPrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer active:scale-95"
            title="Cetak atau Simpan PDF format landscape resmi BKKBN"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-2xs cursor-pointer active:scale-95"
            title="Ekspor Seluruh Kolom ke format Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          {/* Add New Record */}
          <button
            onClick={onAddNew}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Entri Baru</span>
          </button>

          {/* Load Sample August 2026 data button */}
          {records.length === 0 && onLoadSampleAgustus && (
            <button
              onClick={onLoadSampleAgustus}
              className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition cursor-pointer"
              title="Muat contoh data akseptor Laporan KB Agustus 2026 untuk pratinjau tabel"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Muat Contoh Data</span>
            </button>
          )}

          {/* Clear records button if records exist */}
          {records.length > 0 && onClearRecords && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data register pelayanan KB? Seluruh data pasien akan dihapus menjadi 0 data.'
                  )
                ) {
                  onClearRecords();
                }
              }}
              className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
              title="Kosongkan seluruh data register"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Nama Istri, Suami, NIK 16 digit..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Bulan */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              <option value={0}>Semua Bulan</option>
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan: {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              <option value={0}>Semua Tahun</option>
              <option value={2026}>Tahun 2026</option>
              <option value={2025}>Tahun 2025</option>
              <option value={2024}>Tahun 2024</option>
            </select>
          </div>

          {/* Filter Desa */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              disabled={currentUser?.role === 'bidan_desa'}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
            >
              {currentUser?.role !== 'bidan_desa' && <option value="SEMUA">Semua Desa</option>}
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  Desa {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Metode KB (termasuk MOW dan MOP) */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="SEMUA">Semua Metode KB</option>
              {Object.entries(METHOD_SHORT_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredRecords.length === 0 && (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Data Pasien</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {records.length === 0
              ? 'Daftar register saat ini masih kosong (0 data). Anda dapat memulai entri data akseptor baru atau memuat contoh data Laporan KB Agustus 2026.'
              : `Tidak ada data akseptor yang tercatat pada filter: ${selectedMonth > 0 ? monthNames[selectedMonth - 1] : ''} ${selectedYear || ''} ${selectedVillage !== 'SEMUA' ? `Desa ${selectedVillage}` : ''}.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onAddNew}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Pasien Baru</span>
            </button>
            {records.length === 0 && onLoadSampleAgustus && (
              <button
                onClick={onLoadSampleAgustus}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Muat Contoh Laporan Agustus 2026</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* OFFICIAL BKKBN TABLE VIEW (SESUAI DOKUMEN LAPORAN KB AGUSTUS 2026) */}
      {filteredRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
          {/* Official Document Kop Header */}
          <div className="bg-slate-50 p-4 border-b border-slate-300 text-center">
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-mono pb-2 border-b border-slate-200">
              <div className="text-left">
                <div>KODE FASKES KB: <b className="text-slate-900">{facility.code}</b></div>
                <div>KODE REGISTER K/0/KB: <b className="text-slate-900">{facility.k0kbCode}</b></div>
              </div>
              <div className="text-right">
                <div>PROVINSI: <b className="text-slate-900">{facility.province.toUpperCase()}</b></div>
                <div>KABUPATEN: <b className="text-slate-900">{facility.regency.toUpperCase()}</b></div>
                <div>KECAMATAN: <b className="text-slate-900">{facility.district.toUpperCase()}</b></div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm sm:text-base font-extrabold uppercase text-slate-900 tracking-wider">
                REGISTER PELAYANAN KELUARGA BERENCANA FASILITAS KESEHATAN
              </h3>
              <h4 className="text-xs font-bold uppercase text-slate-800">
                {facility.name}
              </h4>
              <div className="mt-1 text-xs text-slate-700 font-semibold flex items-center justify-center gap-3">
                <span>
                  PERIODE LAPORAN: <b>{selectedMonth > 0 ? monthNames[selectedMonth - 1].toUpperCase() : 'SEMUA BULAN'} {selectedYear}</b>
                </span>
                <span>•</span>
                <span>
                  CAKUPAN WILAYAH: <b>{selectedVillage === 'SEMUA' ? 'SELURUH DESA' : `DESA ${selectedVillage.toUpperCase()}`}</b>
                </span>
              </div>
            </div>
          </div>

          {/* The Exact Official Table (23 BKKBN Columns + 1 Action Column) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-600 text-slate-900 min-w-[1280px]">
              {/* Table Header: Grouped Multi-level Rows + Column Numbers (1) to (23) */}
              <thead>
                {/* Header Row 1: Grouped categories */}
                <tr className="bg-slate-200/90 text-center font-bold text-slate-900 border-b border-slate-600">
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-9">
                    NO
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-20">
                    TANGGAL PELAYANAN
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-24">
                    NO. REGISTER / SERI KARTU
                  </th>
                  <th colSpan={3} className="border border-slate-600 p-1.5 bg-emerald-100/70 text-emerald-950">
                    IDENTITAS PESERTA KB (ISTRI)
                  </th>
                  <th colSpan={2} className="border border-slate-600 p-1.5 bg-teal-100/70 text-teal-950">
                    IDENTITAS SUAMI
                  </th>
                  <th colSpan={2} className="border border-slate-600 p-1.5 bg-sky-100/70 text-sky-950">
                    ALAMAT DOMISILI
                  </th>
                  <th colSpan={2} className="border border-slate-600 p-1.5 bg-blue-100/70 text-blue-950">
                    JUMLAH ANAK HIDUP
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-16 bg-blue-50">
                    UMUR ANAK TERKECIL
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-24 bg-amber-100/70 text-amber-950">
                    STATUS PESERTA KB
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-24 bg-emerald-100/70 text-emerald-950">
                    METODE KONTRASEPSI
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-16 bg-purple-100/70 text-purple-950">
                    SUMBER ALOKON
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-20 bg-indigo-100/70 text-indigo-950">
                    JENIS TINDAKAN
                  </th>
                  <th colSpan={3} className="border border-slate-600 p-1.5 bg-rose-100/70 text-rose-950">
                    PENAPISAN / PEMERIKSAAN MEDIS
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-20 bg-rose-50">
                    EFEK SAMPING / KOMPLIKASI
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-14">
                    RUJUKAN
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-28">
                    PEMBERI PELAYANAN / PETUGAS
                  </th>
                  <th rowSpan={2} className="border border-slate-600 p-1.5 w-20 text-center bg-slate-300">
                    AKSI
                  </th>
                </tr>

                {/* Header Row 2: Sub-headers */}
                <tr className="bg-slate-100 text-center font-bold text-slate-800 text-[10px] border-b border-slate-600">
                  <th className="border border-slate-600 p-1 w-32 bg-emerald-50">NIK Istri (16 Digit)</th>
                  <th className="border border-slate-600 p-1 w-32 bg-emerald-50">Nama Lengkap Istri</th>
                  <th className="border border-slate-600 p-1 w-12 bg-emerald-50">Umur (Thn)</th>
                  <th className="border border-slate-600 p-1 w-28 bg-teal-50">Nama Suami</th>
                  <th className="border border-slate-600 p-1 w-32 bg-teal-50">NIK Suami</th>
                  <th className="border border-slate-600 p-1 w-24 bg-sky-50">Desa / Kel.</th>
                  <th className="border border-slate-600 p-1 w-32 bg-sky-50">RT/RW / Alamat</th>
                  <th className="border border-slate-600 p-1 w-8 bg-blue-50">L</th>
                  <th className="border border-slate-600 p-1 w-8 bg-blue-50">P</th>
                  <th className="border border-slate-600 p-1 w-16 bg-rose-50">TD (mmHg)</th>
                  <th className="border border-slate-600 p-1 w-12 bg-rose-50">BB (kg)</th>
                  <th className="border border-slate-600 p-1 w-16 bg-rose-50">HPHT</th>
                </tr>

                {/* Header Row 3: Official BKKBN Column Numbers (1) to (23) */}
                <tr className="bg-slate-50 text-center text-[9px] text-slate-600 font-mono border-b border-slate-600">
                  <th className="border border-slate-600 p-0.5">(1)</th>
                  <th className="border border-slate-600 p-0.5">(2)</th>
                  <th className="border border-slate-600 p-0.5">(3)</th>
                  <th className="border border-slate-600 p-0.5">(4)</th>
                  <th className="border border-slate-600 p-0.5">(5)</th>
                  <th className="border border-slate-600 p-0.5">(6)</th>
                  <th className="border border-slate-600 p-0.5">(7)</th>
                  <th className="border border-slate-600 p-0.5">(8)</th>
                  <th className="border border-slate-600 p-0.5">(9)</th>
                  <th className="border border-slate-600 p-0.5">(10)</th>
                  <th className="border border-slate-600 p-0.5">(11)</th>
                  <th className="border border-slate-600 p-0.5">(12)</th>
                  <th className="border border-slate-600 p-0.5">(13)</th>
                  <th className="border border-slate-600 p-0.5">(14)</th>
                  <th className="border border-slate-600 p-0.5">(15)</th>
                  <th className="border border-slate-600 p-0.5">(16)</th>
                  <th className="border border-slate-600 p-0.5">(17)</th>
                  <th className="border border-slate-600 p-0.5">(18)</th>
                  <th className="border border-slate-600 p-0.5">(19)</th>
                  <th className="border border-slate-600 p-0.5">(20)</th>
                  <th className="border border-slate-600 p-0.5">(21)</th>
                  <th className="border border-slate-600 p-0.5">(22)</th>
                  <th className="border border-slate-600 p-0.5">(23)</th>
                  <th className="border border-slate-600 p-0.5 bg-slate-200">Aksi</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-300">
                {filteredRecords.map((r, index) => (
                  <tr
                    key={r.id}
                    className="hover:bg-amber-50/50 even:bg-slate-50/60 transition-colors"
                  >
                    {/* (1) NO */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono font-semibold text-slate-700">
                      {index + 1}
                    </td>

                    {/* (2) TANGGAL PELAYANAN */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono whitespace-nowrap">
                      {r.serviceDate}
                    </td>

                    {/* (3) NO. REGISTER */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                      {r.registerNumber}
                    </td>

                    {/* (4) NIK ISTRI (16 DIGIT) */}
                    <td className="border border-slate-500 p-1.5 font-mono text-[10px] text-slate-900 tracking-tight whitespace-nowrap">
                      {r.wifeNik ? (
                        <span className="font-semibold">{r.wifeNik}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* (5) NAMA LENGKAP ISTRI */}
                    <td className="border border-slate-500 p-1.5 font-semibold text-slate-900">
                      {r.wifeName}
                    </td>

                    {/* (6) UMUR ISTRI */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono">
                      {r.wifeAge}
                    </td>

                    {/* (7) NAMA SUAMI */}
                    <td className="border border-slate-500 p-1.5 text-slate-800">
                      {r.husbandName || '-'}
                    </td>

                    {/* (8) NIK SUAMI */}
                    <td className="border border-slate-500 p-1.5 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                      {r.husbandNik || '-'}
                    </td>

                    {/* (9) DESA / KELURAHAN */}
                    <td className="border border-slate-500 p-1.5 font-medium text-slate-900">
                      Desa {r.village}
                    </td>

                    {/* (10) RT/RW / ALAMAT */}
                    <td className="border border-slate-500 p-1.5 text-[10px] text-slate-700 truncate max-w-[140px]" title={r.address}>
                      {r.address || '-'}
                    </td>

                    {/* (11) JUMLAH ANAK L */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono font-semibold">
                      {r.aliveChildrenMale}
                    </td>

                    {/* (12) JUMLAH ANAK P */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono font-semibold">
                      {r.aliveChildrenFemale}
                    </td>

                    {/* (13) UMUR ANAK TERKECIL */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono text-[10px]">
                      {r.youngestChildAgeMonths > 0 ? `${r.youngestChildAgeMonths} bln` : '-'}
                    </td>

                    {/* (14) STATUS PESERTA KB */}
                    <td className="border border-slate-500 p-1.5 text-center whitespace-nowrap">
                      {getStatusBadge(r.participantStatus)}
                    </td>

                    {/* (15) METODE KONTRASEPSI */}
                    <td className="border border-slate-500 p-1.5 text-center font-bold text-emerald-900 whitespace-nowrap">
                      {METHOD_SHORT_LABELS[r.method] || r.method}
                    </td>

                    {/* (16) SUMBER ALOKON */}
                    <td className="border border-slate-500 p-1.5 text-center font-semibold text-[10px]">
                      <span className={r.alokonSource === 'APBN' ? 'text-purple-800' : 'text-slate-700'}>
                        {r.alokonSource}
                      </span>
                    </td>

                    {/* (17) JENIS TINDAKAN */}
                    <td className="border border-slate-500 p-1.5 text-center text-[10px]">
                      {ACTION_LABELS[r.actionType] || r.actionType}
                    </td>

                    {/* (18) TD (mmHg) */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono text-[10px] whitespace-nowrap">
                      {r.bloodPressure || '-'}
                    </td>

                    {/* (19) BB (kg) */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono text-[10px]">
                      {r.weightKg > 0 ? `${r.weightKg}` : '-'}
                    </td>

                    {/* (20) HPHT */}
                    <td className="border border-slate-500 p-1.5 text-center font-mono text-[10px] whitespace-nowrap">
                      {r.hpht || '-'}
                    </td>

                    {/* (21) EFEK SAMPING / KOMPLIKASI */}
                    <td className="border border-slate-500 p-1.5 text-center text-[10px]">
                      {r.complications && r.complications !== 'Tidak Ada' ? (
                        <span className="text-rose-700 font-bold">{r.complications}</span>
                      ) : r.sideEffects && r.sideEffects !== 'Tidak Ada' ? (
                        <span className="text-amber-700">{r.sideEffects}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* (22) RUJUKAN */}
                    <td className="border border-slate-500 p-1.5 text-center text-[10px]">
                      {r.referralStatus === 'TIDAK' ? 'Tidak' : (
                        <span className="text-rose-600 font-bold">Rujuk</span>
                      )}
                    </td>

                    {/* (23) PETUGAS PELAYANAN */}
                    <td className="border border-slate-500 p-1.5 text-[10px] font-medium text-slate-800 truncate max-w-[120px]" title={r.officerName}>
                      {r.officerName}
                    </td>

                    {/* (AKSI) */}
                    <td className="border border-slate-500 p-1.5 text-center whitespace-nowrap bg-slate-50">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => setDetailRecord(r)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                          title="Lihat Detail Pasien"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(r)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition cursor-pointer"
                          title="Ubah Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus data register ${r.wifeName} (${r.registerNumber})?`)) {
                              onDelete(r.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Summary / Total Footer Row */}
              <tfoot>
                <tr className="bg-slate-200/90 font-bold text-slate-900 border-t-2 border-slate-600 text-center">
                  <td colSpan={10} className="border border-slate-600 p-2 text-right uppercase">
                    JUMLAH / TOTAL TERLAYANI ({summary.total} PASIEN) :
                  </td>
                  <td className="border border-slate-600 p-2 font-mono">{summary.totalAnakL}</td>
                  <td className="border border-slate-600 p-2 font-mono">{summary.totalAnakP}</td>
                  <td className="border border-slate-600 p-2 text-[10px] text-slate-600">-</td>
                  <td className="border border-slate-600 p-2 text-[10px]">
                    Baru: {summary.totalBaru} | KBPP: {summary.totalKbpp} | Ganti: {summary.totalGantiCara} | Ulang: {summary.totalUlangan}
                  </td>
                  <td className="border border-slate-600 p-2 text-[10px] text-emerald-900">
                    {summary.total} Akseptor
                  </td>
                  <td className="border border-slate-600 p-2 text-[10px]">
                    APBN: {summary.totalApbn}
                  </td>
                  <td colSpan={8} className="border border-slate-600 p-2 text-left text-[10px] text-slate-600">
                    Kondisi: Terdata Lengkap
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (SIMPEL & JELAS) */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-200 uppercase tracking-wider">
                  No. Register: {detailRecord.registerNumber}
                </span>
                <h3 className="text-lg font-bold mt-0.5">{detailRecord.wifeName}</h3>
                <p className="text-xs text-emerald-100">
                  Usia: {detailRecord.wifeAge} Tahun • Suami: {detailRecord.husbandName || '-'}
                </p>
              </div>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              {/* Identitas Pasien */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Identitas Akseptor & Suami</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">NIK Istri:</span>
                    <span className="font-mono font-bold text-slate-900">{detailRecord.wifeNik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NIK Suami:</span>
                    <span className="font-mono font-bold text-slate-900">{detailRecord.husbandNik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tanggal Lahir Istri:</span>
                    <span className="font-medium text-slate-800">{detailRecord.wifeDob || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">No. JKN / BPJS:</span>
                    <span className="font-mono font-medium text-slate-800">{detailRecord.bpjsNumber || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Alamat / Desa:</span>
                    <span className="font-medium text-slate-800">
                      {detailRecord.address}, Desa {detailRecord.village}, Kec. {detailRecord.district}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jumlah Anak Hidup:</span>
                    <span className="font-medium text-slate-800">
                      {detailRecord.aliveChildrenMale} Laki-laki / {detailRecord.aliveChildrenFemale} Perempuan
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Usia Anak Terkecil:</span>
                    <span className="font-medium text-slate-800">
                      {detailRecord.youngestChildAgeMonths > 0 ? `${detailRecord.youngestChildAgeMonths} Bulan` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Pelayanan KB */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Layanan Kontrasepsi</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Metode Kontrasepsi:</span>
                    <span className="font-bold text-emerald-800 text-xs">
                      {METHOD_SHORT_LABELS[detailRecord.method]}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status Kepesertaan:</span>
                    <span className="font-semibold text-slate-800">
                      {STATUS_LABELS[detailRecord.participantStatus] || detailRecord.participantStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sumber Alokon:</span>
                    <span className="font-medium text-slate-800">{ALOKON_LABELS[detailRecord.alokonSource] || detailRecord.alokonSource}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jenis Tindakan:</span>
                    <span className="font-medium text-slate-800">{ACTION_LABELS[detailRecord.actionType] || detailRecord.actionType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tanggal Dilayani:</span>
                    <span className="font-medium text-slate-800">{detailRecord.serviceDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tempat Layanan:</span>
                    <span className="font-medium text-slate-800">{detailRecord.servicePlace}</span>
                  </div>
                </div>
              </div>

              {/* Skrining Medis */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pemeriksaan Medis / Penapisan</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Tekanan Darah:</span>
                    <span className="font-mono font-bold text-slate-800">{detailRecord.bloodPressure || '-'} mmHg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Berat Badan:</span>
                    <span className="font-mono font-bold text-slate-800">{detailRecord.weightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">HPHT:</span>
                    <span className="font-mono text-slate-800">{detailRecord.hpht || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status Rujukan:</span>
                    <span className="font-medium text-slate-800">{detailRecord.referralStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Efek Samping:</span>
                    <span className="font-medium text-slate-800">{detailRecord.sideEffects || 'Tidak Ada'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Komplikasi:</span>
                    <span className="font-medium text-slate-800">{detailRecord.complications || 'Tidak Ada'}</span>
                  </div>
                </div>
              </div>

              {/* Petugas */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Bidan / Petugas: <b className="text-slate-800">{detailRecord.officerName}</b></span>
                <span>Diinput: <b className="text-slate-800">{detailRecord.createdByUsername}</b></span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  const r = detailRecord;
                  setDetailRecord(null);
                  onEdit(r);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah Data Ini</span>
              </button>
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
