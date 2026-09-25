import React, { useState, useEffect } from 'react';
import {
  ActionType,
  AlokonSource,
  ContraceptiveMethod,
  ParticipantStatus,
  PatientRecord,
  ServicePlace,
  User,
  Village,
} from '../types';
import {
  METHOD_SHORT_LABELS,
  METHOD_LABELS,
  STATUS_LABELS,
  ACTION_LABELS,
  ALOKON_LABELS,
  SERVICE_PLACE_LABELS,
} from '../data/initialData';
import { X, Save, AlertCircle, UserCheck, Heart, Stethoscope, Sparkles } from 'lucide-react';

interface RegisterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt'> | PatientRecord) => void;
  initialData?: PatientRecord | null;
  villages: Village[];
  currentUser: User | null;
  existingRecordsCount: number;
}

export const RegisterFormModal: React.FC<RegisterFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  villages,
  currentUser,
  existingRecordsCount,
}) => {
  if (!isOpen) return null;

  const isEdit = !!initialData;

  const defaultVillage =
    initialData?.village ||
    (currentUser?.role === 'bidan_desa' && currentUser.village ? currentUser.village : villages[0]?.name || 'Duyungan');

  const selectedVillageObj = villages.find((v) => v.name === defaultVillage);
  const isVillageLocked = selectedVillageObj && !selectedVillageObj.entryAllowed && currentUser?.role === 'bidan_desa';

  // Form states
  const [serviceDate, setServiceDate] = useState(initialData?.serviceDate || new Date().toISOString().split('T')[0]);
  const [registerNumber, setRegisterNumber] = useState(initialData?.registerNumber || '');
  const [wifeName, setWifeName] = useState(initialData?.wifeName || '');
  const [wifeAge, setWifeAge] = useState<number>(initialData?.wifeAge || 28);
  const [wifeDob, setWifeDob] = useState(initialData?.wifeDob || '');
  const [wifeNik, setWifeNik] = useState(initialData?.wifeNik || '');
  const [husbandName, setHusbandName] = useState(initialData?.husbandName || '');
  const [husbandNik, setHusbandNik] = useState(initialData?.husbandNik || '');
  const [bpjsNumber, setBpjsNumber] = useState(initialData?.bpjsNumber || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [village, setVillage] = useState(defaultVillage);
  const [aliveChildrenMale, setAliveChildrenMale] = useState<number>(initialData?.aliveChildrenMale ?? 1);
  const [aliveChildrenFemale, setAliveChildrenFemale] = useState<number>(initialData?.aliveChildrenFemale ?? 1);
  const [youngestChildAgeMonths, setYoungestChildAgeMonths] = useState<number>(initialData?.youngestChildAgeMonths ?? 12);
  const [participantStatus, setParticipantStatus] = useState<ParticipantStatus>(
    initialData?.participantStatus || 'ULANGAN'
  );
  const [method, setMethod] = useState<ContraceptiveMethod>(initialData?.method || 'SUNTIK_3_BLN');
  const [alokonSource, setAlokonSource] = useState<AlokonSource>(initialData?.alokonSource || 'APBN');
  const [actionType, setActionType] = useState<ActionType>(initialData?.actionType || 'PEMBERIAN_ULANG');
  const [bloodPressure, setBloodPressure] = useState(initialData?.bloodPressure || '120/80');
  const [weightKg, setWeightKg] = useState<number>(initialData?.weightKg || 55);
  const [hpht, setHpht] = useState(initialData?.hpht || '');
  const [sideEffects, setSideEffects] = useState(initialData?.sideEffects || 'Tidak Ada');
  const [complications, setComplications] = useState(initialData?.complications || 'Tidak Ada');
  const [referralStatus, setReferralStatus] = useState<'TIDAK' | 'DIRUJUK_RS' | 'DIRUJUK_FKTP'>(
    initialData?.referralStatus || 'TIDAK'
  );
  const [servicePlace, setServicePlace] = useState<ServicePlace>(
    initialData?.servicePlace || (currentUser?.role === 'bidan_desa' ? 'POLINDES_POSKESDES' : 'PUSKESMAS')
  );
  const [officerName, setOfficerName] = useState(
    initialData?.officerName || currentUser?.name || 'Bidan Desa'
  );
  const [validationError, setValidationError] = useState('');

  // Auto-generate register number if new
  useEffect(() => {
    if (!isEdit && !registerNumber) {
      const now = new Date(serviceDate);
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const seq = String(existingRecordsCount + 1).padStart(3, '0');
      setRegisterNumber(`REG-${yy}${mm}-${seq}`);
    }
  }, [serviceDate, isEdit, existingRecordsCount, registerNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const targetVillage = villages.find((v) => v.name === village);
    if (targetVillage && !targetVillage.entryAllowed && currentUser?.role === 'bidan_desa') {
      setValidationError(`Entri data untuk Desa ${village} saat ini dikunci oleh Admin Puskesmas.`);
      return;
    }

    if (!wifeName.trim()) {
      setValidationError('Nama Istri (Akseptor) wajib diisi.');
      return;
    }

    const payload = {
      serviceDate,
      registerNumber,
      wifeNik: wifeNik.trim(),
      wifeName: wifeName.trim(),
      wifeDob: wifeDob.trim() || '1995-01-01',
      wifeAge: Number(wifeAge) || 28,
      husbandNik: husbandNik.trim(),
      husbandName: husbandName.trim(),
      bpjsNumber: bpjsNumber.trim(),
      address: address.trim(),
      village,
      district: targetVillage?.district || 'Sambungmacan',
      aliveChildrenMale: Number(aliveChildrenMale) || 0,
      aliveChildrenFemale: Number(aliveChildrenFemale) || 0,
      youngestChildAgeMonths: Number(youngestChildAgeMonths) || 0,
      participantStatus,
      method,
      alokonSource,
      actionType,
      bloodPressure: bloodPressure.trim() || '120/80',
      weightKg: Number(weightKg) || 55,
      hpht: hpht.trim(),
      medicalNotes: '',
      sideEffects: sideEffects.trim() || 'Tidak Ada',
      complications: complications.trim() || 'Tidak Ada',
      referralStatus,
      servicePlace,
      officerName: officerName.trim(),
      createdByUsername: currentUser?.username || 'admin',
    };

    if (isEdit && initialData) {
      onSave({
        ...initialData,
        ...payload,
      });
    } else {
      onSave(payload);
    }

    onClose();
  };

  // Quick popular methods chips (semua metode termasuk MOW & MOP)
  const popularMethods: ContraceptiveMethod[] = [
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {isEdit ? 'Ubah Data Akseptor KB' : 'Entri Data Pasien KB Baru'}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Standar Register Pelayanan KB Faskes Puskesmas & BKKBN
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation / Lock Alert */}
        {isVillageLocked && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              Perhatian: Entri data untuk Desa {village} sedang dikunci oleh admin faskes. Anda hanya dapat melihat data.
            </span>
          </div>
        )}

        {validationError && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs text-amber-900 flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* BAGIAN 1: IDENTITAS PASIEN (ISTRI & SUAMI) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>1. Identitas Akseptor (Istri) & Suami</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Istri (Akseptor) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wifeName}
                  onChange={(e) => setWifeName(e.target.value)}
                  placeholder="Nama lengkap akseptor"
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIK Istri (16 Digit)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={wifeNik}
                  onChange={(e) => setWifeNik(e.target.value)}
                  placeholder="331401..."
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usia Istri (Tahun) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={14}
                  max={60}
                  value={wifeAge}
                  onChange={(e) => setWifeAge(Number(e.target.value))}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Suami
                </label>
                <input
                  type="text"
                  value={husbandName}
                  onChange={(e) => setHusbandName(e.target.value)}
                  placeholder="Nama lengkap suami"
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIK Suami (16 Digit)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={husbandNik}
                  onChange={(e) => setHusbandNik(e.target.value)}
                  placeholder="331401..."
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. BPJS / JKN
                </label>
                <input
                  type="text"
                  value={bpjsNumber}
                  onChange={(e) => setBpjsNumber(e.target.value)}
                  placeholder="000123456789..."
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desa / Wilayah <span className="text-rose-500">*</span>
                </label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  disabled={currentUser?.role === 'bidan_desa'}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 disabled:bg-slate-100"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.name}>
                      Desa {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap / RT / RW
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: RT 02 / RW 01 Dukuh Krajan"
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Anak L
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={aliveChildrenMale}
                    onChange={(e) => setAliveChildrenMale(Number(e.target.value))}
                    className="w-full text-xs py-2 px-2 bg-white border border-slate-300 rounded-xl text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Anak P
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={aliveChildrenFemale}
                    onChange={(e) => setAliveChildrenFemale(Number(e.target.value))}
                    className="w-full text-xs py-2 px-2 bg-white border border-slate-300 rounded-xl text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    U. Terkecil
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={youngestChildAgeMonths}
                    onChange={(e) => setYoungestChildAgeMonths(Number(e.target.value))}
                    placeholder="Bln"
                    title="Usia anak terkecil dalam bulan"
                    className="w-full text-xs py-2 px-2 bg-white border border-slate-300 rounded-xl text-center font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: PILIHAN KB, METODE (TERMASUK MOW/MOP) & STATUS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span>2. Metode Kontrasepsi, Tindakan & Status</span>
            </h3>

            {/* Quick click chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Cepat Metode Kontrasepsi:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {popularMethods.map((m) => {
                  const isSelected = method === m;
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-400'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {METHOD_SHORT_LABELS[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode KB Terpilih <span className="text-rose-500">*</span>
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as ContraceptiveMethod)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-bold text-emerald-900"
                >
                  <option value="SUNTIK_3_BLN">Suntik 3 Bulan (Depo)</option>
                  <option value="SUNTIK_1_BLN">Suntik 1 Bulan (Kombinasi)</option>
                  <option value="IMPLAN_2_BATANG">Implan 2 Batang</option>
                  <option value="IMPLAN_1_BATANG">Implan 1 Batang</option>
                  <option value="IUD">IUD / AKDR</option>
                  <option value="PIL">Pil KB</option>
                  <option value="KONDOM">Kondom</option>
                  <option value="MOW">MOW (Tubektomi / Operasi Wanita)</option>
                  <option value="MOP">MOP (Vasektomi / Operasi Pria)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kunjungan KB <span className="text-rose-500">*</span>
                </label>
                <select
                  value={participantStatus}
                  onChange={(e) => setParticipantStatus(e.target.value as ParticipantStatus)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="ULANGAN">Ulangan / Kunjungan Rutin</option>
                  <option value="BARU_BUKAN_PASCA">Baru (Bukan Pasca Salin)</option>
                  <option value="BARU_PASCA_SALIN">Baru Pasca Salin (KBPP)</option>
                  <option value="BARU_PASCA_GUGUR">Baru Pasca Keguguran</option>
                  <option value="GANTI_CARA">Ganti Cara</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Tindakan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="PEMBERIAN_ULANG">Pemberian Ulang / Suntik</option>
                  <option value="PASANG_BARU">Pasang Baru</option>
                  <option value="PENCABUTAN">Pencabutan</option>
                  <option value="CABUT_PASANG">Cabut & Pasang Kembali</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sumber Alokon <span className="text-rose-500">*</span>
                </label>
                <select
                  value={alokonSource}
                  onChange={(e) => setAlokonSource(e.target.value as AlokonSource)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="APBN">APBN (Bantuan Pemerintah)</option>
                  <option value="MANDIRI">Mandiri / Beli Sendiri</option>
                  <option value="NON_APBN">Non-APBN (Dinkes/APBD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* BAGIAN 3: WAKTU & PEMERIKSAAN MEDIS */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>3. Waktu & Pemeriksaan Medis (Penapisan)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pelayanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Register Pasien
                </label>
                <input
                  type="text"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tekanan Darah (TD)
                </label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  placeholder="55"
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HPHT (Haid Terakhir)
                </label>
                <input
                  type="date"
                  value={hpht}
                  onChange={(e) => setHpht(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Rujukan
                </label>
                <select
                  value={referralStatus}
                  onChange={(e) => setReferralStatus(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl"
                >
                  <option value="TIDAK">Tidak Dirujuk</option>
                  <option value="DIRUJUK_RS">Dirujuk ke RS</option>
                  <option value="DIRUJUK_FKTP">Dirujuk ke FKTP Lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat Pelayanan
                </label>
                <select
                  value={servicePlace}
                  onChange={(e) => setServicePlace(e.target.value as ServicePlace)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl"
                >
                  <option value="PUSKESMAS">Puskesmas Induk</option>
                  <option value="PUSTU">Pustu (Puskesmas Pembantu)</option>
                  <option value="POLINDES_POSKESDES">Poskesdes / Polindes</option>
                  <option value="PMB">Praktik Mandiri Bidan (PMB)</option>
                  <option value="MOBIL_PELAYANAN">Mobil Pelayanan (Muyan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas / Bidan Pelaksana <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isVillageLocked}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Data Register'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
