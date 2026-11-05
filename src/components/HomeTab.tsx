import React from 'react';
import {
  FileUp,
  ClipboardCheck,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { TabKey } from './Navbar';
import { CountdownClock } from './CountdownClock';
import { PLCSubmission } from '../types/plc';

interface HomeTabProps {
  onNavigate: (tab: TabKey) => void;
  submissions: PLCSubmission[];
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigate, submissions }) => {
  const total = submissions.length;
  const approved = submissions.filter((s) => s.status === 'ตรวจแล้ว').length;
  const pending = submissions.filter((s) => s.status === 'รอตรวจ').length;
  const resubmit = submissions.filter((s) => s.status === 'ส่งใหม่').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Center: Logo & Main Banner */}
      <div className="text-center bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-indigo-400 to-teal-400" />
        
        <div className="flex flex-col items-center justify-center">
          {/* Logo with clean shadow */}
          <div className="relative group mb-4">
            <div className="absolute -inset-2 bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition duration-300" />
            <img
              src="/assets/aistudio/Logo_ed04c8f2.png"
              alt="ตราสัญลักษณ์โรงเรียนบ้านค่าย"
              className="relative w-28 h-32 sm:w-32 sm:h-36 object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Main Titles strictly as requested */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs sm:text-sm font-semibold mb-3">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Professional Learning Community (PLC)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-snug">
            บันทึกกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ โรงเรียนบ้านค่าย
          </h1>

          <p className="mt-2 text-lg sm:text-xl font-semibold text-sky-700 bg-sky-50/80 px-4 py-1 rounded-xl border border-sky-100 inline-block">
            ภาคเรียนที่ 2 ปีการศึกษา 2569
          </p>
        </div>
      </div>

      {/* Main 2-Column Hero Grid: Left Element (Chibi + Welcome + Submit Button) & Right Element (Deadline & Countdown Clock) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Element: Chibi Illustration + Welcome + Submit Button */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Chibi Cartoon of Teachers Meeting */}
            <div className="relative shrink-0 w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-lg border-2 border-sky-200 bg-sky-50">
              <img
                src="/chibi_teachers_meeting.jpg"
                alt="การ์ตูนครูกำลังประชุม PLC สไตล์ chibi"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-sky-800 shadow-xs">
                PLC Team
              </div>
            </div>

            {/* Welcome Text and Description */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Users className="w-3.5 h-3.5" />
                <span>ชุมชนแห่งการเรียนรู้ทางวิชาชีพ</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
                ยินดีต้อนรับสู่ระบบส่งบันทึกกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ โรงเรียนบ้านค่าย
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                ระบบจัดการและบันทึกข้อมูลการดำเนินกิจกรรม PLC สำหรับคณะครูโรงเรียนบ้านค่าย
                สะดวกรวดเร็ว ติดตามผลการตรวจ และส่งเสริมการพัฒนาการจัดการเรียนรู้อย่างยั่งยืน
              </p>
            </div>
          </div>

          {/* Action button linking to tab 2.ส่งงาน */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => onNavigate('submit')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-base shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <FileUp className="w-5 h-5" />
              <span>ส่งงานบันทึกกิจกรรม PLC</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('status')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-50 text-sky-700 font-semibold text-sm hover:bg-sky-100 transition"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>ตรวจสอบสถานะ</span>
            </button>
          </div>
        </div>

        {/* Right Element: Box with Deadline 31 มีนาคม 2570 เวลา 23.59 น. & Real-time Digital Countdown Clock */}
        <div className="lg:col-span-5 flex flex-col">
          <CountdownClock />
        </div>
      </div>

      {/* Quick Status Stats Row in Cute 3D Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('status')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-md shadow-sky-900/5 hover:border-sky-300 transition-all cursor-pointer hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">ส่งงานทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
              📄
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">{total}</div>
          <span className="text-xs text-slate-500">บันทึกกิจกรรม</span>
        </div>

        <div
          onClick={() => onNavigate('status')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-md shadow-amber-900/5 hover:border-amber-300 transition-all cursor-pointer hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">รอตรวจ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
              ⏳
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pending}</div>
          <span className="text-xs text-amber-600">รอดำเนินการ</span>
        </div>

        <div
          onClick={() => onNavigate('status')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-md shadow-emerald-900/5 hover:border-emerald-300 transition-all cursor-pointer hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700">ตรวจแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
              ✅
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{approved}</div>
          <span className="text-xs text-emerald-600">ประเมินเรียบร้อย</span>
        </div>

        <div
          onClick={() => onNavigate('status')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-md shadow-rose-900/5 hover:border-rose-300 transition-all cursor-pointer hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700">ส่งใหม่</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold">
              🔄
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{resubmit}</div>
          <span className="text-xs text-rose-600">รอการแก้ไข</span>
        </div>
      </div>

      {/* 4 Steps Guide */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-sky-600" />
          <span>ขั้นตอนการส่งบันทึกกิจกรรม PLC โรงเรียนบ้านค่าย</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-sm mb-3 shadow-md shadow-sky-500/30">
              1
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">กรอกข้อมูลบันทึก PLC</h4>
            <p className="text-xs text-slate-600">
              ระบุชื่อ Model Teacher, ชื่อกลุ่ม, ประเด็นท้าทาย LS และกลุ่มสาระการเรียนรู้
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-sm mb-3 shadow-md shadow-sky-500/30">
              2
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">แนบไฟล์รายงาน</h4>
            <p className="text-xs text-slate-600">
              แนบไฟล์เอกสาร เช่น PDF, Word หรือรูปภาพกิจกรรม พร้อมระบุหมายเหตุเพิ่มเติม (ถ้ามี)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-sm mb-3 shadow-md shadow-sky-500/30">
              3
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">บันทึกข้อมูล</h4>
            <p className="text-xs text-slate-600">
              กดปุ่มบันทึกข้อมูล ระบบจะประทับวันเวลาและบันทึกข้อมูลเข้าสู่ระบบทันที
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-sm mb-3 shadow-md shadow-sky-500/30">
              4
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">ติดตามผลการตรวจ</h4>
            <p className="text-xs text-slate-600">
              ตรวจสอบสถานะ "รอตรวจ", "ตรวจแล้ว" หรือ "ส่งใหม่" พร้อมดูข้อเสนอแนะจาก Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
