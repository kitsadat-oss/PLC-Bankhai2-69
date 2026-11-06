import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  FileText,
  User,
  Users,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { PLCSubmission, SubmissionStatus } from '../types/plc';
import { GOOGLE_DRIVE_FOLDER_URL } from '../services/storage';

interface StatusTabProps {
  submissions: PLCSubmission[];
}

const SUBJECT_FILTER_OPTIONS = [
  'ทั้งหมด',
  'ภาษาไทย',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และเทคโนโลยี(กลุ่มวิทยาศาสตร์)',
  'วิทยาศาสตร์และเทคโนโลยี(กลุ่มเทคโนโลยี)',
  'สังคมศึกษา ศาสนาและวัฒนธรรม',
  'ภาษาต่างประเทศ',
  'การงานอาชีพ',
  'ศิลปะ',
  'สุขศึกษาและพลศึกษา',
  'งานแนะแนว',
] as const;

export const StatusTab: React.FC<StatusTabProps> = ({ submissions }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');
  const [selectedSubject, setSelectedSubject] = useState<string>('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<PLCSubmission | null>(null);

  // Normalize matching between the submission subject and filter subject alias
  const matchesSubject = (subSubject: string, filterVal: string) => {
    if (filterVal === 'ทั้งหมด') return true;
    if (filterVal === 'วิทยาศาสตร์และเทคโนโลยี(กลุ่มวิทยาศาสตร์)') {
      return (
        subSubject === 'วิทยาศาสตร์และเทคโนโลยี' ||
        (subSubject.includes('วิทยาศาสตร์') &&
          !subSubject.includes('คอมพิวเตอร์') &&
          !subSubject.includes('เทคโนโลยี)'))
      );
    }
    if (filterVal === 'วิทยาศาสตร์และเทคโนโลยี(กลุ่มเทคโนโลยี)') {
      return (
        subSubject.includes('คอมพิวเตอร์') ||
        subSubject.includes('เทคโนโลยี') ||
        subSubject === 'วิทยาศาสตร์และเทคโนโลยี(คอมพิวเตอร์)'
      );
    }
    if (filterVal === 'สังคมศึกษา ศาสนาและวัฒนธรรม') {
      return subSubject.includes('สังคมศึกษา');
    }
    if (filterVal === 'การงานอาชีพ' || filterVal === 'กางงานอาชีพ') {
      return subSubject.includes('การงานอาชีพ') || subSubject.includes('กางงานอาชีพ');
    }
    if (filterVal === 'สุขศึกษาและพลศึกษา') {
      return subSubject.includes('สุขศึกษา');
    }
    if (filterVal === 'งานแนะแนว') {
      return subSubject.includes('แนะแนว');
    }
    return subSubject.toLowerCase().includes(filterVal.toLowerCase());
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Status filter
      if (selectedStatus !== 'ทั้งหมด' && sub.status !== selectedStatus) {
        return false;
      }
      // Subject filter
      if (!matchesSubject(sub.subjectGroup, selectedSubject)) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = sub.modelTeacher.toLowerCase().includes(query);
        const matchGroup = sub.groupName.toLowerCase().includes(query);
        const matchTopic = sub.lsTopic.toLowerCase().includes(query);
        const matchId = sub.id.toLowerCase().includes(query);
        if (!matchName && !matchGroup && !matchTopic && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, selectedStatus, selectedSubject, searchTerm]);

  // Status counts
  const counts = useMemo(() => {
    return {
      all: submissions.length,
      pending: submissions.filter((s) => s.status === 'รอตรวจ').length,
      approved: submissions.filter((s) => s.status === 'ตรวจแล้ว').length,
      resubmit: submissions.filter((s) => s.status === 'ส่งใหม่').length,
    };
  }, [submissions]);

  const renderStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'ตรวจแล้ว':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ตรวจแล้ว</span>
          </span>
        );
      case 'ส่งใหม่':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>ส่งใหม่</span>
          </span>
        );
      case 'รอตรวจ':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>รอตรวจ</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200 mb-1">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>ตรวจสอบสถานะ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            สถานะการส่งบันทึกกิจกรรม PLC โรงเรียนบ้านค่าย
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            แบ่งตามกลุ่มสาระการเรียนรู้ และสถานะการตรวจประเมิน
          </p>
        </div>

        {/* Status Count Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedStatus('ทั้งหมด')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedStatus === 'ทั้งหมด'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({counts.all})
          </button>
          <button
            onClick={() => setSelectedStatus('รอตรวจ')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedStatus === 'รอตรวจ'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>รอตรวจ ({counts.pending})</span>
          </button>
          <button
            onClick={() => setSelectedStatus('ตรวจแล้ว')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedStatus === 'ตรวจแล้ว'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ตรวจแล้ว ({counts.approved})</span>
          </button>
          <button
            onClick={() => setSelectedStatus('ส่งใหม่')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedStatus === 'ส่งใหม่'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ส่งใหม่ ({counts.resubmit})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-lg shadow-sky-900/5 border border-sky-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อครู, ชื่อกลุ่ม, หัวข้อ หรือรหัสส่งงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-sm text-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Subject Group Filter Dropdown */}
          <div className="md:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-sky-600" />
              <span>กลุ่มสาระการเรียนรู้:</span>
            </span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none text-xs sm:text-sm font-medium text-slate-800 cursor-pointer"
            >
              {SUBJECT_FILTER_OPTIONS.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Quick-Select Chips for 10 Subjects */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {SUBJECT_FILTER_OPTIONS.map((subj) => {
            const isActive = selectedSubject === subj;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-sky-50/70 text-slate-600 hover:bg-sky-100 hover:text-sky-800'
                }`}
              >
                {subj}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <span>พบข้อมูลบันทึก PLC ทั้งหมด {filteredSubmissions.length} รายการ</span>
          <span>คลิกที่รายการเพื่อดูรายละเอียดผลการตรวจและข้อเสนอแนะ</span>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-sky-200 space-y-3">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 mx-auto flex items-center justify-center">
              <FileText className="w-8 h-8 opacity-70" />
            </div>
            <h4 className="text-base font-bold text-slate-800">พร้อมใช้งานจริง: ยังไม่มีรายการส่งบันทึกกิจกรรม PLC</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              ข้อมูลตัวอย่างถูกล้างเรียบร้อยแล้ว เมื่อครูผู้สอนเริ่มส่งบันทึกกิจกรรมผ่านเมนู "ส่งงาน" ข้อมูลจะปรากฏที่นี่ทันที
            </p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-sky-200 space-y-3">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 mx-auto flex items-center justify-center">
              <FileText className="w-8 h-8 opacity-60" />
            </div>
            <h4 className="text-base font-bold text-slate-700">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</h4>
            <p className="text-xs text-slate-500">
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองกลุ่มสาระการเรียนรู้อื่น
            </p>
            <button
              onClick={() => {
                setSelectedStatus('ทั้งหมด');
                setSelectedSubject('ทั้งหมด');
                setSearchTerm('');
              }}
              className="px-4 py-2 rounded-xl bg-sky-100 text-sky-700 text-xs font-semibold hover:bg-sky-200 transition"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubmissions.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModalItem(item)}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-md shadow-sky-900/5 border border-sky-100 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/10 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top line: ID, Cycle & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                        {item.id}
                      </span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        {item.cycle || 'วงรอบที่ 1'}
                      </span>
                    </div>
                    {renderStatusBadge(item.status)}
                  </div>

                  {/* Teacher & Group */}
                  <div className="space-y-1 mb-3">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 group-hover:text-sky-600 transition">
                      <User className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>{item.modelTeacher}</span>
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>กลุ่ม: {item.groupName}</span>
                    </p>
                  </div>

                  {/* LS Topic */}
                  <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 leading-relaxed mb-3">
                    <span className="font-semibold text-slate-900 block mb-0.5">
                      ประเด็นท้าทาย (LS Topic):
                    </span>
                    <p className="line-clamp-2">{item.lsTopic}</p>
                  </div>
                </div>

                <div>
                  {/* Subject and Submission Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                    <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-medium truncate max-w-[180px]">
                      {item.subjectGroup}
                    </span>
                    <span className="font-mono">{item.submittedAt}</span>
                  </div>

                  {/* Attached file link if present */}
                  {item.fileName && item.fileName !== 'ไม่มีไฟล์แนบ' && (
                    <div className="mt-2.5 flex items-center justify-between text-xs bg-sky-50/50 px-2.5 py-1.5 rounded-xl border border-sky-100">
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-sky-500" />
                        <span className="truncate max-w-[150px]">{item.fileName}</span>
                      </span>
                      <a
                        href={item.fileUrl || GOOGLE_DRIVE_FOLDER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sky-600 hover:text-sky-800 font-bold inline-flex items-center gap-1 hover:underline ml-2"
                        title="เปิดใน Google Drive"
                      >
                        <span>Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* If Reviewed / Feedback preview */}
                  {item.adminFeedback && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800">
                      <span className="font-bold">ข้อเสนอแนะ:</span> {item.adminFeedback}
                    </div>
                  )}

                  {/* Card footer CTA */}
                  <div className="mt-3 flex items-center justify-end text-xs font-semibold text-sky-600 group-hover:translate-x-1 transition-transform">
                    <span>ดูรายละเอียด</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-sky-100 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {activeModalItem.id}
                  </span>
                  {renderStatusBadge(activeModalItem.status)}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  รายละเอียดการส่งบันทึกกิจกรรม PLC
                </h3>
              </div>
            </div>

            {/* Details Content */}
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 block">ผู้ส่งงาน (Model Teacher)</span>
                  <p className="font-bold text-slate-800">{activeModalItem.modelTeacher}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">ชื่อกลุ่ม PLC</span>
                  <p className="font-bold text-slate-800">{activeModalItem.groupName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">กลุ่มสาระการเรียนรู้</span>
                  <p className="font-bold text-slate-800">{activeModalItem.subjectGroup}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">วงรอบที่ (PLC Cycle)</span>
                  <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 text-xs inline-block mt-0.5">
                    {activeModalItem.cycle || 'วงรอบที่ 1'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">
                  หัวข้อ LS (ประเด็นท้าทาย/ปัญหาที่กลุ่ม PLC กำหนดร่วมกัน)
                </span>
                <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 text-slate-800 leading-relaxed">
                  {activeModalItem.lsTopic}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">วันที่และเวลาที่ส่ง</span>
                  <p className="font-mono text-slate-700 text-xs mt-1">{activeModalItem.submittedAt}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">หมายเหตุเพิ่มเติม</span>
                  <p className="text-slate-700 text-xs mt-1">{activeModalItem.notes || '-'}</p>
                </div>
              </div>

              {/* File Attachment Box */}
              <div>
                <span className="text-xs text-slate-500 block mb-1">เอกสารหลักฐานแนบ</span>
                <div className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                        {activeModalItem.fileName || 'ไม่มีไฟล์แนบ'}
                      </p>
                      <p className="text-[11px] text-slate-500">{activeModalItem.fileSize || '-'}</p>
                    </div>
                  </div>
                  {activeModalItem.fileName && activeModalItem.fileName !== 'ไม่มีไฟล์แนบ' && (
                    <a
                      href={activeModalItem.fileUrl || GOOGLE_DRIVE_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-sm transition shrink-0"
                    >
                      <span>เปิดใน Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Evaluation Feedback (If audited) */}
              {activeModalItem.status === 'ตรวจแล้ว' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ผลการตรวจและข้อเสนอแนะ</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                    {activeModalItem.adminFeedback || 'ตรวจแล้ว เอกสารครบถ้วนสมบูรณ์ตามเกณฑ์ PLC'}
                  </p>
                  {activeModalItem.reviewedAt && (
                    <p className="text-[11px] text-emerald-700 font-mono">
                      ตรวจเมื่อ: {activeModalItem.reviewedAt} โดย {activeModalItem.reviewedBy || 'Admin'}
                    </p>
                  )}
                </div>
              )}

              {/* If Resubmit Requested */}
              {activeModalItem.status === 'ส่งใหม่' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>คำแนะนำในการแก้ไขเพื่อส่งใหม่</span>
                  </span>
                  <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                    {activeModalItem.adminFeedback || 'กรุณาตรวจสอบเอกสารและแก้ไขข้อมูลตามที่กำหนด'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
