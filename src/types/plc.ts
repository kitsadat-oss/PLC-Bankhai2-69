/**
 * PLC Submission and Evaluation Types for Bankhai School (โรงเรียนบ้านค่าย)
 */

export type SubmissionStatus = 'รอตรวจ' | 'ตรวจแล้ว' | 'ส่งใหม่';

export type AdminActionStatus = 'รอตรวจ' | 'ตรวจแล้ว' | 'ส่งใหม่' | 'ลบ';

export type LearningSubject =
  | 'ภาษาไทย'
  | 'คณิตศาสตร์'
  | 'วิทยาศาสตร์และเทคโนโลยี'
  | 'วิทยาศาสตร์และเทคโนโลยี(คอมพิวเตอร์)'
  | 'สังคมศึกษา'
  | 'แนะแนว'
  | 'ภาษาต่างประเทศ'
  | 'ศิลปะ'
  | 'สุขศึกษาและพละศึกษา'
  | 'การงานอาชีพ';

export interface PLCSubmission {
  id: string;
  modelTeacher: string; // ชื่อ-นามสกุล ผู้ส่งงาน (Model Teacher)
  groupName: string; // ชื่อกลุ่ม
  lsTopic: string; // หัวข้อ LS (ประเด็นท้าทาย/ปัญหาที่กลุ่ม PLC กำหนดร่วมกัน)
  subjectGroup: LearningSubject; // กลุ่มสาระการเรียนรู้
  submittedAt: string; // วันที่ส่งงาน (ISO string or formatted date)
  fileName?: string; // ชื่อไฟล์แนบ
  fileSize?: string; // ขนาดไฟล์
  fileUrl?: string; // ลิงก์ไฟล์งาน หรือ data URI
  fileType?: string;
  notes?: string; // หมายเหตุเพิ่มเติม
  status: SubmissionStatus; // สถานะการส่งงาน: รอตรวจ, ตรวจแล้ว, ส่งใหม่
  adminFeedback?: string; // ความคิดเห็น/คำแนะนำจากผู้ตรวจ (Admin)
  reviewedAt?: string; // วันที่ตรวจ
  reviewedBy?: string; // ผู้ตรวจ
}

export interface SubjectMeta {
  name: LearningSubject;
  code: string;
  alias: string;
  color: string;
  bgLight: string;
  borderColor: string;
  iconName: string;
}

export const SUBJECT_METAS: SubjectMeta[] = [
  {
    name: 'ภาษาไทย',
    code: 'THAI',
    alias: 'ภาษาไทย',
    color: '#EC4899', // Pink
    bgLight: 'bg-pink-50 text-pink-700',
    borderColor: 'border-pink-300',
    iconName: 'BookOpen',
  },
  {
    name: 'คณิตศาสตร์',
    code: 'MATH',
    alias: 'คณิตศาสตร์',
    color: '#3B82F6', // Blue
    bgLight: 'bg-blue-50 text-blue-700',
    borderColor: 'border-blue-300',
    iconName: 'Calculator',
  },
  {
    name: 'วิทยาศาสตร์และเทคโนโลยี',
    code: 'SCI',
    alias: 'วิทยาศาสตร์และเทคโนโลยี(กลุ่มวิทยาศาสตร์)',
    color: '#10B981', // Emerald
    bgLight: 'bg-emerald-50 text-emerald-700',
    borderColor: 'border-emerald-300',
    iconName: 'FlaskConical',
  },
  {
    name: 'วิทยาศาสตร์และเทคโนโลยี(คอมพิวเตอร์)',
    code: 'TECH',
    alias: 'วิทยาศาสตร์และเทคโนโลยี(กลุ่มเทคโนโลยี)',
    color: '#06B6D4', // Cyan
    bgLight: 'bg-cyan-50 text-cyan-700',
    borderColor: 'border-cyan-300',
    iconName: 'Laptop',
  },
  {
    name: 'สังคมศึกษา',
    code: 'SOC',
    alias: 'สังคมศึกษา ศาสนาและวัฒนธรรม',
    color: '#F59E0B', // Amber
    bgLight: 'bg-amber-50 text-amber-700',
    borderColor: 'border-amber-300',
    iconName: 'Globe',
  },
  {
    name: 'ภาษาต่างประเทศ',
    code: 'ENG',
    alias: 'ภาษาต่างประเทศ',
    color: '#8B5CF6', // Purple
    bgLight: 'bg-purple-50 text-purple-700',
    borderColor: 'border-purple-300',
    iconName: 'Languages',
  },
  {
    name: 'การงานอาชีพ',
    code: 'OCC',
    alias: 'การงานอาชีพ',
    color: '#EA580C', // Orange
    bgLight: 'bg-orange-50 text-orange-700',
    borderColor: 'border-orange-300',
    iconName: 'Briefcase',
  },
  {
    name: 'ศิลปะ',
    code: 'ART',
    alias: 'ศิลปะ',
    color: '#D946EF', // Fuchsia
    bgLight: 'bg-fuchsia-50 text-fuchsia-700',
    borderColor: 'border-fuchsia-300',
    iconName: 'Palette',
  },
  {
    name: 'สุขศึกษาและพละศึกษา',
    code: 'PE',
    alias: 'สุขศึกษาและพลศึกษา',
    color: '#EF4444', // Red
    bgLight: 'bg-rose-50 text-rose-700',
    borderColor: 'border-rose-300',
    iconName: 'HeartPulse',
  },
  {
    name: 'แนะแนว',
    code: 'GUI',
    alias: 'งานแนะแนว',
    color: '#14B8A6', // Teal
    bgLight: 'bg-teal-50 text-teal-700',
    borderColor: 'border-teal-300',
    iconName: 'Compass',
  },
];
