export type Role = 'admin_induk' | 'admin_kecamatan' | 'bidan_desa';

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  name: string;
  village?: string; // village assigned for bidan_desa
  phone?: string;
  nip?: string;
}

export interface Village {
  id: string;
  name: string;
  district: string;
  entryAllowed: boolean; // whether bidan desa is allowed to enter data
  assignedBidanName?: string;
  assignedUsername?: string;
  notes?: string;
}

export interface District {
  id: string;
  name: string;
}

export interface FacilityProfile {
  name: string;
  code: string; // Kode Faskes KB BKKBN
  k0kbCode: string; // Kode Register K/0/KB
  address: string;
  district: string;
  regency: string;
  province: string;
  phone: string;
  email: string;
  headName: string;
  headNip: string;
  headTitle: string; // e.g. "Kepala UPTD Puskesmas Sambungmacan I"
  kbCoordinatorName: string;
  kbCoordinatorNip: string;
  kbCoordinatorTitle: string; // e.g. "Bidan Koordinator KB"
}

export type ContraceptiveMethod =
  | 'SUNTIK_1_BLN'
  | 'SUNTIK_3_BLN'
  | 'PIL'
  | 'KONDOM'
  | 'IUD'
  | 'IMPLAN_1_BATANG'
  | 'IMPLAN_2_BATANG'
  | 'MOW'
  | 'MOP';

export type ParticipantStatus =
  | 'BARU_BUKAN_PASCA'
  | 'BARU_PASCA_SALIN'
  | 'BARU_PASCA_GUGUR'
  | 'GANTI_CARA'
  | 'ULANGAN';

export type AlokonSource = 'APBN' | 'NON_APBN' | 'MANDIRI';

export type ActionType =
  | 'PASANG_BARU'
  | 'PEMBERIAN_ULANG'
  | 'PENCABUTAN'
  | 'CABUT_PASANG';

export type ServicePlace =
  | 'PUSKESMAS'
  | 'PUSTU'
  | 'POLINDES_POSKESDES'
  | 'PMB'
  | 'MOBIL_PELAYANAN';

export interface PatientRecord {
  id: string;
  serviceDate: string; // YYYY-MM-DD
  registerNumber: string;
  wifeNik: string;
  wifeName: string;
  wifeDob: string; // YYYY-MM-DD
  wifeAge: number;
  husbandNik: string;
  husbandName: string;
  bpjsNumber: string;
  address: string;
  village: string;
  district: string;
  aliveChildrenMale: number;
  aliveChildrenFemale: number;
  youngestChildAgeMonths: number;
  participantStatus: ParticipantStatus;
  previousMethod?: ContraceptiveMethod | string;
  method: ContraceptiveMethod;
  alokonSource: AlokonSource;
  actionType: ActionType;
  bloodPressure: string; // e.g. "120/80"
  weightKg: number;
  hpht?: string; // Hari Pertama Haid Terakhir
  medicalNotes?: string;
  sideEffects: string; // "Tidak Ada", "Spotting/Bercak", "Amenorea", etc.
  complications: string; // "Tidak Ada", "Infeksi", "Ekspulsi IUD", etc.
  referralStatus: 'TIDAK' | 'DIRUJUK_RS' | 'DIRUJUK_FKTP';
  servicePlace: ServicePlace;
  officerName: string;
  createdAt: string;
  updatedAt: string;
  createdByUsername: string;
}

export interface MonthlyF2KBCellData {
  methodKey: ContraceptiveMethod;
  methodLabel: string;
  baruBukanPasca: number;
  baruPascaSalin: number;
  baruPascaGugur: number;
  totalBaru: number;
  gantiCara: number;
  ulangan: number;
  totalPelayanan: number; // totalBaru + gantiCara + ulangan
  apbn: number;
  nonApbn: number;
  komplikasi: number;
  kegagalan: number;
  cabutAlokon: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
}
