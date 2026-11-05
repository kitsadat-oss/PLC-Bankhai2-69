import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Users,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Download,
  BookOpen,
} from 'lucide-react';
import { PLCSubmission, SUBJECT_METAS } from '../types/plc';
import { exportToCSV } from '../services/storage';

interface DashboardTabProps {
  submissions: PLCSubmission[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ submissions }) => {
  // Aggregate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === 'รอตรวจ').length;
    const approved = submissions.filter((s) => s.status === 'ตรวจแล้ว').length;
    const resubmit = submissions.filter((s) => s.status === 'ส่งใหม่').length;

    // Unique teachers and groups
    const uniqueTeachers = new Set(submissions.map((s) => s.modelTeacher)).size;
    const uniqueGroups = new Set(submissions.map((s) => s.groupName)).size;

    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      pending,
      approved,
      resubmit,
      uniqueTeachers,
      uniqueGroups,
      completionRate,
    };
  }, [submissions]);

  // Breakdown by 10 Subject Groups (with distinct colors)
  const subjectBreakdown = useMemo(() => {
    return SUBJECT_METAS.map((meta) => {
      const groupSubmissions = submissions.filter(
        (s) =>
          s.subjectGroup === meta.name ||
          (meta.name.includes('คอมพิวเตอร์') && s.subjectGroup.includes('คอมพิวเตอร์'))
      );

      const total = groupSubmissions.length;
      const pending = groupSubmissions.filter((s) => s.status === 'รอตรวจ').length;
      const approved = groupSubmissions.filter((s) => s.status === 'ตรวจแล้ว').length;
      const resubmit = groupSubmissions.filter((s) => s.status === 'ส่งใหม่').length;

      return {
        ...meta,
        total,
        pending,
        approved,
        resubmit,
      };
    });
  }, [submissions]);

  const maxSubjectTotal = Math.max(...subjectBreakdown.map((s) => s.total), 1);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 shrink-0">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>3D Modern Analytics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              Dashboard สรุปผลการส่งบันทึกกิจกรรม PLC
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              โรงเรียนบ้านค่าย ภาคเรียนที่ 2 ปีการศึกษา 2569 • ข้อมูลวิเคราะห์แบบ Real-time
            </p>
          </div>
        </div>

        <button
          onClick={() => exportToCSV(submissions)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/25 transition hover:scale-105 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>ดาวน์โหลดรายงานสรุป (CSV)</span>
        </button>
      </div>

      {/* 3D Modern Hero Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Submissions */}
        <div className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-sky-900/5 border border-sky-100 overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-400/10 to-blue-500/20 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">จำนวนส่งงานทั้งหมด</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            {stats.total}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-sky-600">{stats.uniqueTeachers} ครูผู้สอน</span>
            <span>•</span>
            <span>{stats.uniqueGroups} กลุ่ม PLC</span>
          </div>
        </div>

        {/* Pending (รอตรวจ) */}
        <div className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-900/5 border border-amber-100 overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-orange-500/20 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700">รอตรวจ (Pending)</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">
            {stats.pending}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-amber-600">
              {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% ของทั้งหมด
            </span>
          </div>
        </div>

        {/* Approved (ตรวจแล้ว) */}
        <div className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-900/5 border border-emerald-100 overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-teal-500/20 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-700">ตรวจแล้ว (Approved)</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
            {stats.approved}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% ของทั้งหมด
            </span>
          </div>
        </div>

        {/* Resubmit (ส่งใหม่) */}
        <div className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-rose-900/5 border border-rose-100 overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-400/10 to-red-500/20 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-700">ส่งใหม่ (Revision)</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight">
            {stats.resubmit}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-rose-600">
              รอครูผู้สอนปรับปรุงแก้ไข
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Status Distribution Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-sky-600" />
              <span>ภาพรวมความคืบหน้าการตรวจงาน (Completion Rate)</span>
            </h3>
            <p className="text-xs text-slate-500">
              สัดส่วนสถานะการตรวจของคณะครูโรงเรียนบ้านค่าย
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold text-sky-600">
              {stats.completionRate}%
            </span>
            <span className="text-xs text-slate-500 ml-1">ตรวจแล้วเสร็จ</span>
          </div>
        </div>

        {/* 3D-styled Multi-segment Bar */}
        <div className="w-full h-5 rounded-full bg-slate-100 overflow-hidden flex shadow-inner p-0.5">
          {stats.total > 0 ? (
            <>
              <div
                style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-l-full transition-all duration-500 relative group"
                title={`ตรวจแล้ว: ${stats.approved} (${Math.round((stats.approved / stats.total) * 100)}%)`}
              />
              <div
                style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 relative group"
                title={`รอตรวจ: ${stats.pending} (${Math.round((stats.pending / stats.total) * 100)}%)`}
              />
              <div
                style={{ width: `${(stats.resubmit / stats.total) * 100}%` }}
                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-r-full transition-all duration-500 relative group"
                title={`ส่งใหม่: ${stats.resubmit} (${Math.round((stats.resubmit / stats.total) * 100)}%)`}
              />
            </>
          ) : (
            <div className="w-full h-full bg-slate-200" />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-emerald-400 to-teal-500 shadow-xs" />
            <span className="font-semibold text-slate-700">ตรวจแล้ว ({stats.approved})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 shadow-xs" />
            <span className="font-semibold text-slate-700">รอตรวจ ({stats.pending})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 shadow-xs" />
            <span className="font-semibold text-slate-700">ส่งใหม่ ({stats.resubmit})</span>
          </div>
        </div>
      </div>

      {/* Breakdown by 10 Learning Subjects (แยกเป็นสีตามกลุ่มสาระ) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              <span>สรุปจำนวนคนที่ส่ง แยกเป็นสีตาม 10 กลุ่มสาระการเรียนรู้</span>
            </h3>
            <p className="text-xs text-slate-500">
              แสดงสถานะ “รอตรวจ”, “ตรวจแล้ว” และ “ส่งใหม่” ของแต่ละกลุ่มสาระ
            </p>
          </div>
        </div>

        {/* 10 Subject 3D Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectBreakdown.map((subj) => {
            const barWidthPercent =
              maxSubjectTotal > 0 ? (subj.total / maxSubjectTotal) * 100 : 0;

            return (
              <div
                key={subj.code}
                className="p-4 sm:p-5 rounded-2xl border bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
                style={{ borderColor: subj.color + '40' }}
              >
                {/* Subject color bar strip */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-2"
                  style={{ backgroundColor: subj.color }}
                />

                <div className="pl-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subj.color }}
                      />
                      <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-sky-600 transition">
                        {subj.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-extrabold text-sm px-2.5 py-0.5 rounded-xl text-white shadow-xs"
                        style={{ backgroundColor: subj.color }}
                      >
                        {subj.total} คน
                      </span>
                    </div>
                  </div>

                  {/* Relative comparative bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barWidthPercent}%`,
                        backgroundColor: subj.color,
                      }}
                    />
                  </div>

                  {/* Detailed Counts by Status: รอตรวจ, ตรวจแล้ว, ส่งใหม่ */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="block text-[11px] text-amber-600 font-medium">รอตรวจ</span>
                      <span className="font-bold text-sm">{subj.pending}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="block text-[11px] text-emerald-600 font-medium">ตรวจแล้ว</span>
                      <span className="font-bold text-sm">{subj.approved}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                      <span className="block text-[11px] text-rose-600 font-medium">ส่งใหม่</span>
                      <span className="font-bold text-sm">{subj.resubmit}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
