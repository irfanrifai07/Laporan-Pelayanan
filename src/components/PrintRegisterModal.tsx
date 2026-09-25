import React, { useState, useMemo } from 'react';
import { FacilityProfile, PatientRecord, Village } from '../types';
import { METHOD_SHORT_LABELS, STATUS_LABELS, ACTION_LABELS } from '../data/initialData';
import { Printer, X, Download } from 'lucide-react';

interface PrintRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PatientRecord[];
  facility: FacilityProfile;
  villages: Village[];
}

export const PrintRegisterModal: React.FC<PrintRegisterModalProps> = ({
  isOpen,
  onClose,
  records,
  facility,
  villages,
}) => {
  if (!isOpen) return null;

  const [filterVillage, setFilterVillage] = useState<string>('SEMUA');
  const [filterMonth, setFilterMonth] = useState<number>(8); // Default Agustus (sesuai dokumen Laporan KB Agustus 2026)
  const [filterYear, setFilterYear] = useState<number>(2026);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const printableRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterVillage !== 'SEMUA' && r.village.toLowerCase() !== filterVillage.toLowerCase()) return false;
      if (r.serviceDate) {
        const [y, m] = r.serviceDate.split('-').map(Number);
        if (filterYear !== 0 && y !== filterYear) return false;
        if (filterMonth !== 0 && m !== filterMonth) return false;
      }
      return true;
    });
  }, [records, filterVillage, filterMonth, filterYear]);

  // Totals for bottom summary row
  const summary = useMemo(() => {
    let totalAnakL = 0;
    let totalAnakP = 0;
    let totalBaru = 0;
    let totalGantiCara = 0;
    let totalUlangan = 0;
    let totalApbn = 0;
    let totalMandiri = 0;

    printableRecords.forEach((r) => {
      totalAnakL += r.aliveChildrenMale || 0;
      totalAnakP += r.aliveChildrenFemale || 0;
      if (
        r.participantStatus === 'BARU_BUKAN_PASCA' ||
        r.participantStatus === 'BARU_PASCA_SALIN' ||
        r.participantStatus === 'BARU_PASCA_GUGUR'
      ) {
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
      total: printableRecords.length,
      totalAnakL,
      totalAnakP,
      totalBaru,
      totalGantiCara,
      totalUlangan,
      totalApbn,
      totalMandiri,
    };
  }, [printableRecords]);

  const getStatusLabelText = (status: string) => {
    switch (status) {
      case 'BARU_PASCA_SALIN':
        return 'Baru (KBPP)';
      case 'BARU_BUKAN_PASCA':
        return 'Baru';
      case 'BARU_PASCA_GUGUR':
        return 'Baru (Gugur)';
      case 'GANTI_CARA':
        return 'Ganti Cara';
      case 'ULANGAN':
        return 'Ulangan';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[95vw] lg:max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2">
        {/* Modal Action Bar (hidden on print) */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Cetak / Simpan PDF Register Pelayanan KB Faskes</h3>
              <p className="text-[11px] text-slate-400">
                Format Resmi BKKBN (Sesuai Dokumen Laporan Pelayanan KB)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              className="py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            >
              <option value="SEMUA">Semua Desa</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  Desa {v.name}
                </option>
              ))}
            </select>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            >
              <option value={0}>Semua Bulan</option>
              {monthNames.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan {m}
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="py-1.5 px-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>

            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL BKKBN CONTENT */}
        <div className="p-4 sm:p-8 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 font-sans text-slate-900">
          {/* Official Document Kop */}
          <div className="border-b-2 border-slate-900 pb-3 mb-3 text-center">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-700 mb-2">
              <div className="text-left">
                <div>KODE FASKES KB: <b>{facility.code}</b></div>
                <div>KODE REGISTER K/0/KB: <b>{facility.k0kbCode}</b></div>
              </div>
              <div className="text-right">
                <div>PROVINSI: <b>{facility.province.toUpperCase()}</b></div>
                <div>KABUPATEN: <b>{facility.regency.toUpperCase()}</b></div>
                <div>KECAMATAN: <b>{facility.district.toUpperCase()}</b></div>
              </div>
            </div>

            <h1 className="text-sm sm:text-base font-extrabold uppercase text-slate-950 tracking-wider">
              REGISTER PELAYANAN KELUARGA BERENCANA FASILITAS KESEHATAN
            </h1>
            <h2 className="text-xs font-bold uppercase text-slate-800">
              {facility.name} - KECAMATAN {facility.district.toUpperCase()}
            </h2>
            <div className="text-[11px] text-slate-700 mt-1 font-semibold flex items-center justify-center gap-3">
              <span>
                Periode Laporan: <b>{filterMonth !== 0 ? monthNames[filterMonth - 1].toUpperCase() : 'SEMUA BULAN'} {filterYear}</b>
              </span>
              <span>•</span>
              <span>
                Cakupan Wilayah: <b>{filterVillage === 'SEMUA' ? 'SELURUH DESA' : `DESA ${filterVillage.toUpperCase()}`}</b>
              </span>
            </div>
          </div>

          {/* Official 23-Column Table Format matching PDF */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-[9px] print:text-[8px] border-collapse border border-black text-slate-950 min-w-[1200px] print:min-w-full">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-200 print:bg-slate-100 text-center font-bold border-b border-black">
                  <th rowSpan={2} className="border border-black p-1 w-7">
                    NO
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-16">
                    TANGGAL PELAYANAN
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-20">
                    NO. REGISTER / SERI KARTU
                  </th>
                  <th colSpan={3} className="border border-black p-1">
                    IDENTITAS PESERTA KB (ISTRI)
                  </th>
                  <th colSpan={2} className="border border-black p-1">
                    IDENTITAS SUAMI
                  </th>
                  <th colSpan={2} className="border border-black p-1">
                    ALAMAT DOMISILI
                  </th>
                  <th colSpan={2} className="border border-black p-1">
                    JUMLAH ANAK HIDUP
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-14">
                    UMUR ANAK TERKECIL
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-20">
                    STATUS PESERTA KB
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-20">
                    METODE KONTRASEPSI
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-14">
                    SUMBER ALOKON
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-16">
                    JENIS TINDAKAN
                  </th>
                  <th colSpan={3} className="border border-black p-1">
                    PENAPISAN / PEMERIKSAAN MEDIS
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-16">
                    EFEK SAMPING / KOMPLIKASI
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-12">
                    RUJUKAN
                  </th>
                  <th rowSpan={2} className="border border-black p-1 w-24">
                    PEMBERI PELAYANAN / PARAF
                  </th>
                </tr>

                {/* Header Row 2 */}
                <tr className="bg-slate-100 print:bg-slate-50 text-center font-bold text-[8.5px] print:text-[7.5px] border-b border-black">
                  <th className="border border-black p-1 w-28">NIK Istri (16 Digit)</th>
                  <th className="border border-black p-1 w-28">Nama Lengkap Istri</th>
                  <th className="border border-black p-1 w-10">Umur</th>
                  <th className="border border-black p-1 w-24">Nama Suami</th>
                  <th className="border border-black p-1 w-28">NIK Suami</th>
                  <th className="border border-black p-1 w-20">Desa</th>
                  <th className="border border-black p-1 w-28">RT/RW / Alamat</th>
                  <th className="border border-black p-1 w-7">L</th>
                  <th className="border border-black p-1 w-7">P</th>
                  <th className="border border-black p-1 w-14">TD</th>
                  <th className="border border-black p-1 w-10">BB</th>
                  <th className="border border-black p-1 w-14">HPHT</th>
                </tr>

                {/* Header Row 3: Column Numbers */}
                <tr className="bg-slate-50 text-center text-[7.5px] font-mono border-b border-black">
                  <th className="border border-black p-0.5">(1)</th>
                  <th className="border border-black p-0.5">(2)</th>
                  <th className="border border-black p-0.5">(3)</th>
                  <th className="border border-black p-0.5">(4)</th>
                  <th className="border border-black p-0.5">(5)</th>
                  <th className="border border-black p-0.5">(6)</th>
                  <th className="border border-black p-0.5">(7)</th>
                  <th className="border border-black p-0.5">(8)</th>
                  <th className="border border-black p-0.5">(9)</th>
                  <th className="border border-black p-0.5">(10)</th>
                  <th className="border border-black p-0.5">(11)</th>
                  <th className="border border-black p-0.5">(12)</th>
                  <th className="border border-black p-0.5">(13)</th>
                  <th className="border border-black p-0.5">(14)</th>
                  <th className="border border-black p-0.5">(15)</th>
                  <th className="border border-black p-0.5">(16)</th>
                  <th className="border border-black p-0.5">(17)</th>
                  <th className="border border-black p-0.5">(18)</th>
                  <th className="border border-black p-0.5">(19)</th>
                  <th className="border border-black p-0.5">(20)</th>
                  <th className="border border-black p-0.5">(21)</th>
                  <th className="border border-black p-0.5">(22)</th>
                  <th className="border border-black p-0.5">(23)</th>
                </tr>
              </thead>

              <tbody>
                {printableRecords.length === 0 ? (
                  <tr>
                    <td colSpan={23} className="border border-black p-4 text-center text-slate-500 font-sans">
                      Tidak ada data pelayanan akseptor KB pada periode dan wilayah ini.
                    </td>
                  </tr>
                ) : (
                  printableRecords.map((r, i) => (
                    <tr key={r.id} className="text-center font-sans">
                      {/* (1) */}
                      <td className="border border-black p-1 font-mono">{i + 1}</td>
                      {/* (2) */}
                      <td className="border border-black p-1 whitespace-nowrap font-mono">{r.serviceDate}</td>
                      {/* (3) */}
                      <td className="border border-black p-1 font-mono font-bold whitespace-nowrap">{r.registerNumber}</td>
                      {/* (4) */}
                      <td className="border border-black p-1 font-mono tracking-tight whitespace-nowrap">{r.wifeNik || '-'}</td>
                      {/* (5) */}
                      <td className="border border-black p-1 text-left font-bold">{r.wifeName}</td>
                      {/* (6) */}
                      <td className="border border-black p-1 font-mono">{r.wifeAge}</td>
                      {/* (7) */}
                      <td className="border border-black p-1 text-left">{r.husbandName || '-'}</td>
                      {/* (8) */}
                      <td className="border border-black p-1 font-mono text-[8px] whitespace-nowrap">{r.husbandNik || '-'}</td>
                      {/* (9) */}
                      <td className="border border-black p-1 text-left">Desa {r.village}</td>
                      {/* (10) */}
                      <td className="border border-black p-1 text-left text-[8px] truncate max-w-[120px]" title={r.address}>
                        {r.address}
                      </td>
                      {/* (11) */}
                      <td className="border border-black p-1 font-mono">{r.aliveChildrenMale}</td>
                      {/* (12) */}
                      <td className="border border-black p-1 font-mono">{r.aliveChildrenFemale}</td>
                      {/* (13) */}
                      <td className="border border-black p-1 font-mono text-[8px]">
                        {r.youngestChildAgeMonths > 0 ? `${r.youngestChildAgeMonths} bln` : '-'}
                      </td>
                      {/* (14) */}
                      <td className="border border-black p-1 text-[8px] font-semibold whitespace-nowrap">
                        {getStatusLabelText(r.participantStatus)}
                      </td>
                      {/* (15) */}
                      <td className="border border-black p-1 font-bold whitespace-nowrap">
                        {METHOD_SHORT_LABELS[r.method] || r.method}
                      </td>
                      {/* (16) */}
                      <td className="border border-black p-1 text-[8px]">{r.alokonSource}</td>
                      {/* (17) */}
                      <td className="border border-black p-1 text-[8px]">
                        {ACTION_LABELS[r.actionType] || r.actionType}
                      </td>
                      {/* (18) */}
                      <td className="border border-black p-1 font-mono text-[8px] whitespace-nowrap">{r.bloodPressure || '-'}</td>
                      {/* (19) */}
                      <td className="border border-black p-1 font-mono text-[8px]">{r.weightKg > 0 ? r.weightKg : '-'}</td>
                      {/* (20) */}
                      <td className="border border-black p-1 font-mono text-[8px] whitespace-nowrap">{r.hpht || '-'}</td>
                      {/* (21) */}
                      <td className="border border-black p-1 text-[8px]">
                        {r.complications && r.complications !== 'Tidak Ada'
                          ? r.complications
                          : r.sideEffects && r.sideEffects !== 'Tidak Ada'
                          ? r.sideEffects
                          : '-'}
                      </td>
                      {/* (22) */}
                      <td className="border border-black p-1 text-[8px]">{r.referralStatus === 'TIDAK' ? 'Tidak' : 'Rujuk'}</td>
                      {/* (23) */}
                      <td className="border border-black p-1 text-left text-[8px] truncate max-w-[90px]" title={r.officerName}>
                        {r.officerName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Total Summary Footer Row */}
              {printableRecords.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-200 print:bg-slate-100 font-bold border-t-2 border-black text-center">
                    <td colSpan={10} className="border border-black p-1 text-right uppercase">
                      JUMLAH TOTAL : {summary.total} PASIEN
                    </td>
                    <td className="border border-black p-1 font-mono">{summary.totalAnakL}</td>
                    <td className="border border-black p-1 font-mono">{summary.totalAnakP}</td>
                    <td className="border border-black p-1">-</td>
                    <td className="border border-black p-1 text-[8px]">
                      Baru: {summary.totalBaru} | Ganti: {summary.totalGantiCara} | Ulang: {summary.totalUlangan}
                    </td>
                    <td className="border border-black p-1 text-[8px]">{summary.total} Akseptor</td>
                    <td className="border border-black p-1 text-[8px]">APBN: {summary.totalApbn}</td>
                    <td colSpan={7} className="border border-black p-1 text-left text-[8px]">
                      Sumber Data: Buku Register Pelayanan KB
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Official Signature Block */}
          <div className="mt-6 pt-3 grid grid-cols-2 gap-8 text-[11px] print:text-[9px] text-center break-inside-avoid">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold uppercase mt-0.5">{facility.headTitle}</p>
              <div className="h-14"></div>
              <p className="font-bold underline">{facility.headName}</p>
              <p className="font-mono text-slate-700">NIP. {facility.headNip}</p>
            </div>
            <div>
              <p>
                {facility.district}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="font-bold uppercase mt-0.5">{facility.kbCoordinatorTitle}</p>
              <div className="h-14"></div>
              <p className="font-bold underline">{facility.kbCoordinatorName}</p>
              <p className="font-mono text-slate-700">NIP. {facility.kbCoordinatorNip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
