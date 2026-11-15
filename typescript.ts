// ============================================================================
// প্রতিষ্ঠানের নাম: তা'লীমুল কুরআন আদর্শ হিফজ ও নাজেরা মাদরাসা (২০২৬)
// এক্সেল ফাইল (হিফজ-নাজেরা ডেটাবেস ২০২৬.xlsx) থেকে এক্সট্রাক্ট ও নরমালাইজ করা ডেটা
// ============================================================================

export type DepartmentType = 'hifz' | 'najera';

export interface TeacherProfile {
  id: string;
  name: string;
  designation: string;
  department: DepartmentType | 'both';
  phone: string;
  qualification: string;
}

export interface StudentProfile {
  id: string;
  rollNo: string;
  name: string;
  guardianName: string;
  guardianPhone: string;
  department: DepartmentType;
  batchOrGroup: string;
  assignedUstadId: string;
  assignedUstadName: string;
  currentPara: number;
  currentPage: number;
  totalDiamondPoints: number;
  status: 'active' | 'inactive';
}

export interface HifzDailyLogEntry {
  id: string;
  date: string;
  dayName: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  // ১. আজকের সবক
  sabakAmount: string;
  sabakPara: number;
  sabakPage: number;
  sabakMistakes: number;
  // ২. সাত সবক
  satSabakAmount: number;
  satSabakRange: string;
  satSabakMistakes: number;
  // ৩. আমোক্তা
  amoktaPara: number;
  amoktaQuarterStart: number;
  amoktaAmount: number;
  amoktaRange: string;
  amoktaMistakes: number;
  // ৪. তেলাওয়াত ও নামাজ
  tilawatGeneral: string;
  tilawatNamaz: string;
  // ৫. গ্রেড ও পয়েন্ট
  grade: 'মুমতাজ' | 'জায়্যিদ জিদ্দান' | 'জায়্যিদ' | 'মাকবুল';
  basePoints: number;
  netPoints: number;
  hasRedFlag: boolean;
  teacherComment: string;
  ustadName: string;
}

export interface NajeraDailyLogEntry {
  id: string;
  date: string;
  dayName: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  // ১. আজকের নতুন সবক
  level: 'quran' | 'ampara' | 'kayda';
  sabakParaOrTakhti: number;
  sabakPage: number;
  sabakAmount: string;
  sabakMistakes: number;
  // ২. পেছনের / পুরাতন পড়া
  revisionAmount: number;
  revisionRange: string;
  revisionMistakes: number;
  // ৩. তাজবীদ ও তারতীল
  readingFluency: string;
  tajweedBonusPoints: number;
  // ৪. গ্রেড ও পয়েন্ট
  grade: 'মুমতাজ' | 'জায়্যিদ জিদ্দান' | 'জায়্যিদ' | 'মাকবুল';
  basePoints: number;
  netPoints: number;
  hasRedFlag: boolean;
  teacherComment: string;
  ustadName: string;
}

// ----------------------------------------------------------------------------
// ১. উস্তাদবৃন্দের তালিকা (Teachers)
// ----------------------------------------------------------------------------
export const MOCK_TEACHERS: TeacherProfile[] = [
  {
    id: 'ustad-01',
    name: 'হাফেজ মাওলানা খালিদ সাইফুল্লাহ',
    designation: 'প্রধান হিফজ শিক্ষক',
    department: 'hifz',
    phone: '01711-234567',
    qualification: 'হাফেজ, দাওরায়ে হাদিস'
  },
  {
    id: 'ustad-02',
    name: 'হাফেজ আব্দুর রহমান',
    designation: 'সিনিয়র হিফজ শিক্ষক',
    department: 'hifz',
    phone: '01812-345678',
    qualification: 'হাফেজ, ক্বারী'
  },
  {
    id: 'ustad-03',
    name: 'ক্বারী মাওলানা ইবরাহীম',
    designation: 'প্রধান নাজেরা ও তাজবীদ শিক্ষক',
    department: 'najera',
    phone: '01913-456789',
    qualification: 'ক্বারী (হুফফাজ প্রশিক্ষণপ্রাপ্ত)'
  },
  {
    id: 'ustad-04',
    name: 'মাওলানা আব্দুল্লাহ আল মামুন',
    designation: 'সহকারী নাজেরা শিক্ষক',
    department: 'najera',
    phone: '01614-567890',
    qualification: 'ফাযিল, নূরানী প্রশিক্ষণপ্রাপ্ত'
  }
];

// ----------------------------------------------------------------------------
// ২. ছাত্রদের মাস্টার তালিকা (হিফজ ও নাজেরা বিভাগ)
// ----------------------------------------------------------------------------
export const MOCK_STUDENTS: StudentProfile[] = [
  // হিফজ বিভাগ
  {
    id: 'std-h-01',
    rollNo: '০১',
    name: 'আব্দুল্লাহ বিন মাহমুদ',
    guardianName: 'মাওলানা মাহমুদুল হাসান',
    guardianPhone: '01715-112233',
    department: 'hifz',
    batchOrGroup: 'হিফজ ক-শাখা',
    assignedUstadId: 'ustad-01',
    assignedUstadName: 'হাফেজ মাওলানা খালিদ সাইফুল্লাহ',
    currentPara: 8,
    currentPage: 1,
    totalDiamondPoints: 420,
    status: 'active'
  },
  {
    id: 'std-h-02',
    rollNo: '০২',
    name: 'মুহাম্মদ উমর ফারুক',
    guardianName: 'আলহাজ্ব ফারুক আহমেদ',
    guardianPhone: '01716-223344',
    department: 'hifz',
    batchOrGroup: 'হিফজ ক-শাখা',
    assignedUstadId: 'ustad-01',
    assignedUstadName: 'হাফেজ মাওলানা খালিদ সাইফুল্লাহ',
    currentPara: 15,
    currentPage: 12,
    totalDiamondPoints: 685,
    status: 'active'
  },
  {
    id: 'std-h-03',
    rollNo: '০৩',
    name: 'তানভীর আহমেদ সাদ',
    guardianName: 'ডা. রফিকুল ইসলাম',
    guardianPhone: '01817-334455',
    department: 'hifz',
    batchOrGroup: 'হিফজ ক-শাখা',
    assignedUstadId: 'ustad-01',
    assignedUstadName: 'হাফেজ মাওলানা খালিদ সাইফুল্লাহ',
    currentPara: 4,
    currentPage: 18,
    totalDiamondPoints: 310,
    status: 'active'
  },
  {
    id: 'std-h-04',
    rollNo: '০৪',
    name: 'যুবায়ের বিন ওয়ালীদ',
    guardianName: 'ওয়ালীদ হোসেন',
    guardianPhone: '01918-445566',
    department: 'hifz',
    batchOrGroup: 'হিফজ খ-শাখা',
    assignedUstadId: 'ustad-02',
    assignedUstadName: 'হাফেজ আব্দুর রহমান',
    currentPara: 22,
    currentPage: 5,
    totalDiamondPoints: 890,
    status: 'active'
  },
  {
    id: 'std-h-05',
    rollNo: '০৫',
    name: 'সাদমান সাকিব',
    guardianName: 'আব্দুল করিম',
    guardianPhone: '01519-556677',
    department: 'hifz',
    batchOrGroup: 'হিফজ খ-শাখা',
    assignedUstadId: 'ustad-02',
    assignedUstadName: 'হাফেজ আব্দুর রহমান',
    currentPara: 1,
    currentPage: 4,
    totalDiamondPoints: 145,
    status: 'active'
  },

  // নাজেরা বিভাগ
  {
    id: 'std-n-01',
    rollNo: '০১',
    name: 'মুহাম্মদ আনাস বিন সাঈদ',
    guardianName: 'আবু সাঈদ',
    guardianPhone: '01720-667788',
    department: 'najera',
    batchOrGroup: 'নাজেরা কুরআন শাখা',
    assignedUstadId: 'ustad-03',
    assignedUstadName: 'ক্বারী মাওলানা ইবরাহীম',
    currentPara: 2,
    currentPage: 5,
    totalDiamondPoints: 260,
    status: 'active'
  },
  {
    id: 'std-n-02',
    rollNo: '০২',
    name: 'হামজা বিন আব্দুল্লাহ',
    guardianName: 'আব্দুল্লাহ আল বাকী',
    guardianPhone: '01821-778899',
    department: 'najera',
    batchOrGroup: 'নাজেরা আমপারা শাখা',
    assignedUstadId: 'ustad-03',
    assignedUstadName: 'ক্বারী মাওলানা ইবরাহীম',
    currentPara: 30,
    currentPage: 9,
    totalDiamondPoints: 195,
    status: 'active'
  },
  {
    id: 'std-n-03',
    rollNo: '০৩',
    name: 'ইয়াহইয়া বিন যাকারিয়া',
    guardianName: 'যাকারিয়া হোসেন',
    guardianPhone: '01922-889900',
    department: 'najera',
    batchOrGroup: 'নূরানী কায়দা শাখা',
    assignedUstadId: 'ustad-04',
    assignedUstadName: 'মাওলানা আব্দুল্লাহ আল মামুন',
    currentPara: 1,
    currentPage: 14,
    totalDiamondPoints: 120,
    status: 'active'
  },
  {
    id: 'std-n-04',
    rollNo: '০৪',
    name: 'মুয়াজ বিন জাবাল',
    guardianName: 'জাবালুল হক',
    guardianPhone: '01623-990011',
    department: 'najera',
    batchOrGroup: 'নাজেরা কুরআন শাখা',
    assignedUstadId: 'ustad-03',
    assignedUstadName: 'ক্বারী মাওলানা ইবরাহীম',
    currentPara: 6,
    currentPage: 11,
    totalDiamondPoints: 340,
    status: 'active'
  }
];

// ----------------------------------------------------------------------------
// ৩. হিফজ দৈনিক লগবুক সেমি-ডেমো রেকর্ডসমূহ (HifzDailyLogs)
// ----------------------------------------------------------------------------
export const MOCK_HIFZ_LOGS: HifzDailyLogEntry[] = [
  {
    id: 'hlog-101',
    date: '2026-11-13',
    dayName: 'শুক্রবার',
    studentId: 'std-h-01',
    studentName: 'আব্দুল্লাহ বিন মাহমুদ',
    rollNo: '০১',
    sabakAmount: '১ পৃষ্ঠা',
    sabakPara: 8,
    sabakPage: 1,
    sabakMistakes: 0,
    satSabakAmount: 5,
    satSabakRange: 'পারা ৭ (১৬–২০)',
    satSabakMistakes: 4,
    amoktaPara: 3,
    amoktaQuarterStart: 11,
    amoktaAmount: 5,
    amoktaRange: 'পারা ৩ (১১–১৫)',
    amoktaMistakes: 4,
    tilawatGeneral: '৫ পৃষ্ঠা',
    tilawatNamaz: '১ পৃষ্ঠা',
    grade: 'মাকবুল',
    basePoints: 20,
    netPoints: 4,
    hasRedFlag: true,
    teacherComment: 'সাত সবক ও আমোক্তায় আরও মনোযোগী হতে হবে।',
    ustadName: 'হাফেজ মাওলানা খালিদ সাইফুল্লাহ'
  },
  {
    id: 'hlog-102',
    date: '2026-11-13',
    dayName: 'শুক্রবার',
    studentId: 'std-h-02',
    studentName: 'মুহাম্মদ উমর ফারুক',
    rollNo: '০২',
    sabakAmount: '২ পৃষ্ঠা',
    sabakPara: 15,
    sabakPage: 12,
    sabakMistakes: 1,
    satSabakAmount: 7,
    satSabakRange: 'পারা ১৫ (৫–১১)',
    satSabakMistakes: 0,
    amoktaPara: 10,
    amoktaQuarterStart: 1,
    amoktaAmount: 20,
    amoktaRange: 'সম্পূর্ণ পারা ১০ (১–২০)',
    amoktaMistakes: 1,
    tilawatGeneral: '১০ পৃষ্ঠা',
    tilawatNamaz: '৫ পৃষ্ঠা',
    grade: 'মুমতাজ',
    basePoints: 40,
    netPoints: 36,
    hasRedFlag: false,
    teacherComment: 'মাশাআল্লাহ! ইয়াদ ও তিলাওয়াত অত্যন্ত মজবুত।',
    ustadName: 'হাফেজ মাওলানা খালিদ সাইফুল্লাহ'
  },
  {
    id: 'hlog-103',
    date: '2026-11-13',
    dayName: 'শুক্রবার',
    studentId: 'std-h-03',
    studentName: 'তানভীর আহমেদ সাদ',
    rollNo: '০৩',
    sabakAmount: 'আধা পৃষ্ঠা',
    sabakPara: 4,
    sabakPage: 18,
    sabakMistakes: 2,
    satSabakAmount: 5,
    satSabakRange: 'পারা ৪ (১৩–১৭)',
    satSabakMistakes: 2,
    amoktaPara: 2,
    amoktaQuarterStart: 6,
    amoktaAmount: 10,
    amoktaRange: 'পারা ২ (৬–১৫)',
    amoktaMistakes: 1,
    tilawatGeneral: '৫ পৃষ্ঠা',
    tilawatNamaz: '২ পৃষ্ঠা',
    grade: 'জায়্যিদ জিদ্দান',
    basePoints: 30,
    netPoints: 20,
    hasRedFlag: false,
    teacherComment: 'সবক নিয়মিত হচ্ছে, গতি আরেকটু বাড়াতে হবে।',
    ustadName: 'হাফেজ মাওলানা খালিদ সাইফুল্লাহ'
  }
];

// ----------------------------------------------------------------------------
// ৪. নাজেরা দৈনিক লগবুক সেমি-ডেমো রেকর্ডসমূহ (NajeraDailyLogs)
// ----------------------------------------------------------------------------
export const MOCK_NAJERA_LOGS: NajeraDailyLogEntry[] = [
  {
    id: 'nlog-201',
    date: '2026-11-13',
    dayName: 'শুক্রবার',
    studentId: 'std-n-01',
    studentName: 'মুহাম্মদ আনাস বিন সাঈদ',
    rollNo: '০১',
    level: 'quran',
    sabakParaOrTakhti: 2,
    sabakPage: 5,
    sabakAmount: '১ পৃষ্ঠা',
    sabakMistakes: 1,
    revisionAmount: 2,
    revisionRange: 'পারা ২ (পৃষ্ঠা ৩–৪)',
    revisionMistakes: 1,
    readingFluency: 'খুব ভালো ও সাবলীল (তারতীল)',
    tajweedBonusPoints: 2,
    grade: 'জায়্যিদ জিদ্দান',
    basePoints: 30,
    netPoints: 28,
    hasRedFlag: false,
    teacherComment: 'মাখরাজ ও গুন্নাহ খুব সুন্দর আদায় করেছে।',
    ustadName: 'ক্বারী মাওলানা ইবরাহীম'
  },
  {
    id: 'nlog-202',
    date: '2026-11-13',
    dayName: 'শুক্রবার',
    studentId: 'std-n-02',
    studentName: 'হামজা বিন আব্দুল্লাহ',
    rollNo: '০২',
    level: 'ampara',
    sabakParaOrTakhti: 30,
    sabakPage: 9,
    sabakAmount: 'আধা পৃষ্ঠা',
    sabakMistakes: 4,
    revisionAmount: 2,
    revisionRange: 'পারা ৩০ (পৃষ্ঠা ৭–৮)',
    revisionMistakes: 2,
    readingFluency: 'মোটামুটি (আরও মশক প্রয়োজন)',
    tajweedBonusPoints: -2,
    grade: 'মাকবুল',
    basePoints: 20,
    netPoints: 6,
    hasRedFlag: true,
    teacherComment: 'হিজ্জে কম করে রওয়াঁ পড়ার চেষ্টা করতে হবে।',
    ustadName: 'ক্বারী মাওলানা ইবরাহীম'
  },
  {
    id: 'nlog-203',
    date: '2026-11-13',
    dayName: 'শুক্রবার',
    studentId: 'std-n-03',
    studentName: 'ইয়াহইয়া বিন যাকারিয়া',
    rollNo: '০৩',
    level: 'kayda',
    sabakParaOrTakhti: 14,
    sabakPage: 1,
    sabakAmount: '৫ লাইন',
    sabakMistakes: 0,
    revisionAmount: 1,
    revisionRange: 'তখতি ১২–১৩',
    revisionMistakes: 0,
    readingFluency: 'ভালো পড়েছে (শুদ্ধ উচ্চারণ)',
    tajweedBonusPoints: 5,
    grade: 'মুমতাজ',
    basePoints: 40,
    netPoints: 45,
    hasRedFlag: false,
    teacherComment: 'তাশদীদ ও কলকলাহ একদম নির্ভুল হয়েছে!',
    ustadName: 'মাওলানা আব্দুল্লাহ আল মামুন'
  }
];