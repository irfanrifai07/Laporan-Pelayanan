import React, { useState, useMemo } from 'react';
import { FacilityProfile, Village } from '../types';
import { StorageService } from '../services/storage';
import { Printer, Calendar, FileSpreadsheet, Building2, Download } from 'lucide-react';

interface RekapitulasiF2KBProps {
  facility: FacilityProfile;
  villages: Village[];
}

export const RekapitulasiF2KB: React.FC<RekapitulasiF2KBProps> = ({ facility, villages }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // September by default
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedVillage, setSelectedVillage] = useState<string>('SEMUA');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Calculate table data
  const matrixData = useMemo(() => {
    return StorageService.calculateMonthlyF2KB(selectedMonth, selectedYear, selectedVillage);
  }, [selectedMonth, selectedYear, selectedVillage]);

  // Calculate totals
  const totalSum = useMemo(() => {
    return matrixData.reduce(
      (acc, row) => ({
        baruBukanPasca: acc.baruBukanPasca + row.baruBukanPasca,
        baruPascaSalin: acc.baruPascaSalin + row.baruPascaSalin,
        baruPascaGugur: acc.baruPascaGugur + row.baruPascaGugur,
        totalBaru: acc.totalBaru + row.totalBaru,
        gantiCara: acc.gantiCara + row.gantiCara,
        ulangan: acc.ulangan + row.ulangan,
        totalPelayanan: acc.totalPelayanan + row.totalPelayanan,
        apbn: acc.apbn + row.apbn,
        nonApbn: acc.nonApbn + row.nonApbn,
        komplikasi: acc.komplikasi + row.komplikasi,
        kegagalan: acc.kegagalan + row.kegagalan,
        cabutAlokon: acc.cabutAlokon + row.cabutAlokon,
      }),
      {
        baruBukanPasca: 0,
        baruPascaSalin: 0,
        baruPascaGugur: 0,
        totalBaru: 0,
        gantiCara: 0,
        ulangan: 0,
        totalPelayanan: 0,
        apbn: 0,
        nonApbn: 0,
        komplikasi: 0,
        kegagalan: 0,
        cabutAlokon: 0,
      }
    );
  }, [matrixData]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Metode Kontrasepsi',
      'Baru (Bukan Pasca Salin)',
      'Baru (Pasca Salin/KBPP)',
      'Baru (Pasca Gugur)',
      'Total Baru',
      'Ganti Cara',
      'Ulangan',
      'Total Seluruh Pelayanan',
      'Alokon APBN',
      'Alokon Non-APBN/Mandiri',
      'Kasus Komplikasi',
      'Kasus Kegagalan',
      'Pencabutan Alokon',
    ];

    const rows = matrixData.map((row, idx) => [
      idx + 1,
      `"${row.methodLabel}"`,
      row.baruBukanPasca,
      row.baruPascaSalin,
      row.baruPascaGugur,
      row.totalBaru,
      row.gantiCara,
      row.ulangan,
      row.totalPelayanan,
      row.apbn,
      row.nonApbn,
      row.komplikasi,
      row.kegagalan,
      row.cabutAlokon,
    ]);

    rows.push([
      'TOTAL',
      '"JUMLAH KESELURUHAN"',
      totalSum.baruBukanPasca,
      totalSum.baruPascaSalin,
      totalSum.baruPascaGugur,
      totalSum.totalBaru,
      totalSum.gantiCara,
      totalSum.ulangan,
      totalSum.totalPelayanan,
      totalSum.apbn,
      totalSum.nonApbn,
      totalSum.komplikasi,
      totalSum.kegagalan,
      totalSum.cabutAlokon,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekapitulasi_F2KB_${monthNames[selectedMonth - 1]}_${selectedYear}_${selectedVillage}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control & Filter Bar (hidden when printing) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Rekapitulasi Pelayanan Kontrasepsi Bulanan (Format F/II/KB)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan agregasi bulanan resmi fasilitas kesehatan sesuai standar BKKBN
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Month selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-slate-800"
            >
              {monthNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-semibold bg-transparent border-none focus:outline-none text-slate-800 ml-1"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Village selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="text-xs font-medium bg-transparent border-none focus:outline-none text-slate-800"
            >
              <option value="SEMUA">Wilayah: Semua Desa (Puskesmas)</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  Wilayah: Desa {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Form F/II/KB</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE OFFICIAL F/II/KB SHEET */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none font-sans">
        {/* Official Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-4 text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="text-left text-[11px] font-mono font-semibold text-slate-600">
              <div>KODE REGISTER FASKES: {facility.k0kbCode}</div>
              <div>KODE FASKES KB: {facility.code}</div>
            </div>
            <div className="px-2.5 py-1 border border-slate-800 rounded font-bold text-xs bg-slate-50 text-slate-900">
              FORMULIR F/II/KB
            </div>
          </div>

          <h1 className="text-base sm:text-lg font-extrabold uppercase text-slate-900 tracking-wide">
            REKAPITULASI PELAYANAN KONTRASEPSI BULANAN
          </h1>
          <h2 className="text-xs sm:text-sm font-bold uppercase text-slate-800">
            {facility.name}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Kecamatan {facility.district}, {facility.regency}, Provinsi {facility.province}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-800 bg-slate-50 py-1.5 px-4 rounded-lg border border-slate-200 inline-block">
            <span>PERIODE LAPORAN: <b>{monthNames[selectedMonth - 1].toUpperCase()} {selectedYear}</b></span>
            <span>•</span>
            <span>CAKUPAN WILAYAH: <b>{selectedVillage === 'SEMUA' ? 'SELURUH WILAYAH KERJA PUSKESMAS' : `DESA ${selectedVillage.toUpperCase()}`}</b></span>
          </div>
        </div>

        {/* F/II/KB Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-slate-400 text-slate-900">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th rowSpan={3} className="border border-slate-400 p-2 w-10">NO</th>
                <th rowSpan={3} className="border border-slate-400 p-2 text-left">METODE KONTRASEPSI</th>
                <th colSpan={4} className="border border-slate-400 p-1.5 bg-emerald-50">PESERTA KB BARU</th>
                <th rowSpan={3} className="border border-slate-400 p-1.5 w-16 bg-amber-50">GANTI CARA</th>
                <th rowSpan={3} className="border border-slate-400 p-1.5 w-16 bg-blue-50">ULANGAN</th>
                <th rowSpan={3} className="border border-slate-400 p-2 w-20 bg-slate-200 font-extrabold">TOTAL PELAYANAN</th>
                <th colSpan={2} className="border border-slate-400 p-1.5 bg-purple-50">SUMBER ALOKON</th>
                <th colSpan={3} className="border border-slate-400 p-1.5 bg-rose-50">INDIKATOR KHUSUS</th>
              </tr>
              <tr className="bg-slate-100 text-center font-semibold text-[11px]">
                <th className="border border-slate-400 p-1 w-14 bg-emerald-50">Bukan Pasca Salin</th>
                <th className="border border-slate-400 p-1 w-14 bg-emerald-50">Pasca Salin</th>
                <th className="border border-slate-400 p-1 w-14 bg-emerald-50">Pasca Gugur</th>
                <th className="border border-slate-400 p-1 w-16 font-bold bg-emerald-100">Jumlah Baru</th>
                <th className="border border-slate-400 p-1 w-16 bg-purple-50">APBN</th>
                <th className="border border-slate-400 p-1 w-16 bg-purple-50">Non-APBN</th>
                <th className="border border-slate-400 p-1 w-14 bg-rose-50">Komplikasi</th>
                <th className="border border-slate-400 p-1 w-14 bg-rose-50">Kegagalan</th>
                <th className="border border-slate-400 p-1 w-14 bg-rose-50">Cabut Alokon</th>
              </tr>
              <tr className="bg-slate-50 text-center text-[10px] text-slate-500 font-mono">
                <th className="border border-slate-400 p-0.5">(1)</th>
                <th className="border border-slate-400 p-0.5">(2)</th>
                <th className="border border-slate-400 p-0.5">(3)</th>
                <th className="border border-slate-400 p-0.5">(4=1+2+3)</th>
                <th className="border border-slate-400 p-0.5">(5)</th>
                <th className="border border-slate-400 p-0.5">(6)</th>
                <th className="border border-slate-400 p-0.5">(7=4+5+6)</th>
                <th className="border border-slate-400 p-0.5">(8)</th>
                <th className="border border-slate-400 p-0.5">(9)</th>
                <th className="border border-slate-400 p-0.5">(10)</th>
                <th className="border border-slate-400 p-0.5">(11)</th>
                <th className="border border-slate-400 p-0.5">(12)</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, idx) => (
                <tr key={row.methodKey} className="hover:bg-slate-50 text-center font-mono">
                  <td className="border border-slate-400 p-2 font-semibold text-slate-600">{idx + 1}</td>
                  <td className="border border-slate-400 p-2 text-left font-sans font-medium text-slate-800">
                    {row.methodLabel}
                  </td>
                  <td className="border border-slate-400 p-2">{row.baruBukanPasca || '-'}</td>
                  <td className="border border-slate-400 p-2">{row.baruPascaSalin || '-'}</td>
                  <td className="border border-slate-400 p-2">{row.baruPascaGugur || '-'}</td>
                  <td className="border border-slate-400 p-2 font-bold bg-emerald-50/50 text-emerald-900">
                    {row.totalBaru || '-'}
                  </td>
                  <td className="border border-slate-400 p-2 bg-amber-50/40 text-amber-900">{row.gantiCara || '-'}</td>
                  <td className="border border-slate-400 p-2 bg-blue-50/40 text-blue-900">{row.ulangan || '-'}</td>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-100 text-slate-900 text-sm">
                    {row.totalPelayanan || '-'}
                  </td>
                  <td className="border border-slate-400 p-2">{row.apbn || '-'}</td>
                  <td className="border border-slate-400 p-2">{row.nonApbn || '-'}</td>
                  <td className="border border-slate-400 p-2 text-rose-700">{row.komplikasi || '-'}</td>
                  <td className="border border-slate-400 p-2 text-rose-700">{row.kegagalan || '-'}</td>
                  <td className="border border-slate-400 p-2">{row.cabutAlokon || '-'}</td>
                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr className="bg-slate-200 font-extrabold text-center font-mono border-t-2 border-slate-800">
                <td colSpan={2} className="border border-slate-400 p-2.5 text-right font-sans uppercase">
                  JUMLAH TOTAL PELAYANAN
                </td>
                <td className="border border-slate-400 p-2">{totalSum.baruBukanPasca}</td>
                <td className="border border-slate-400 p-2">{totalSum.baruPascaSalin}</td>
                <td className="border border-slate-400 p-2">{totalSum.baruPascaGugur}</td>
                <td className="border border-slate-400 p-2 bg-emerald-200/70 text-emerald-950 font-black">
                  {totalSum.totalBaru}
                </td>
                <td className="border border-slate-400 p-2 bg-amber-200/70 text-amber-950">{totalSum.gantiCara}</td>
                <td className="border border-slate-400 p-2 bg-blue-200/70 text-blue-950">{totalSum.ulangan}</td>
                <td className="border border-slate-400 p-2 bg-slate-300 text-slate-950 text-base font-black">
                  {totalSum.totalPelayanan}
                </td>
                <td className="border border-slate-400 p-2">{totalSum.apbn}</td>
                <td className="border border-slate-400 p-2">{totalSum.nonApbn}</td>
                <td className="border border-slate-400 p-2 text-rose-800">{totalSum.komplikasi}</td>
                <td className="border border-slate-400 p-2 text-rose-800">{totalSum.kegagalan}</td>
                <td className="border border-slate-400 p-2">{totalSum.cabutAlokon}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Highlights summary badge under the table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 print:hidden">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-700 font-medium">Akseptor Baru</span>
            <div className="text-xl font-bold text-emerald-900">{totalSum.totalBaru}</div>
            <span className="text-[10px] text-emerald-600 font-medium">
              Pasca Salin (KBPP): {totalSum.baruPascaSalin}
            </span>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-[11px] text-amber-700 font-medium">Ganti Cara</span>
            <div className="text-xl font-bold text-amber-900">{totalSum.gantiCara}</div>
            <span className="text-[10px] text-amber-600 font-medium">
              Proporsi: {totalSum.totalPelayanan > 0 ? Math.round((totalSum.gantiCara / totalSum.totalPelayanan) * 100) : 0}%
            </span>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[11px] text-blue-700 font-medium">Ulangan / Rutin</span>
            <div className="text-xl font-bold text-blue-900">{totalSum.ulangan}</div>
            <span className="text-[10px] text-blue-600 font-medium">
              Proporsi: {totalSum.totalPelayanan > 0 ? Math.round((totalSum.ulangan / totalSum.totalPelayanan) * 100) : 0}%
            </span>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
            <span className="text-[11px] text-purple-700 font-medium">Alokon APBN</span>
            <div className="text-xl font-bold text-purple-900">{totalSum.apbn}</div>
            <span className="text-[10px] text-purple-600 font-medium">
              Non-APBN/Mandiri: {totalSum.nonApbn}
            </span>
          </div>
        </div>

        {/* Official Signatures Section */}
        <div className="mt-10 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs break-inside-avoid">
          <div className="text-center">
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-800 uppercase mt-0.5">{facility.headTitle}</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline">{facility.headName}</p>
            <p className="text-slate-600 font-mono text-[11px]">NIP. {facility.headNip}</p>
          </div>

          <div className="text-center">
            <p className="text-slate-500">
              {facility.district}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="font-bold text-slate-800 uppercase mt-0.5">{facility.kbCoordinatorTitle}</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline">{facility.kbCoordinatorName}</p>
            <p className="text-slate-600 font-mono text-[11px]">NIP. {facility.kbCoordinatorNip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
