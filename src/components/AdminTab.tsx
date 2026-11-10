import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Clock,
  Trash2,
  Save,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  LogOut,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Database,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { AdminActionStatus, PLCSubmission } from '../types/plc';
import {
  saveSubmissions,
  exportToCSV,
  GOOGLE_SHEET_URL,
  GOOGLE_DRIVE_FOLDER_URL,
  copyForGoogleSheet,
  syncAllToGoogleSheet,
  updateMultipleSubmissionsStatusInGoogleSheet,
  deleteSubmissionFromGoogleSheet,
  getWebhookUrl,
} from '../services/storage';
import { GoogleSheetSyncModal } from './GoogleSheetSyncModal';

interface AdminTabProps {
  submissions: PLCSubmission[];
  onUpdate: (overrideData?: PLCSubmission[]) => void;
  onLogout: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  onRefresh?: () => void;
}

const SUBJECT_LIST = [
  'ทั้งหมด',
  'ภาษาไทย',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และเทคโนโลยี',
  'วิทยาศาสตร์และเทคโนโลยี(คอมพิวเตอร์)',
  'สังคมศึกษา',
  'แนะแนว',
  'ภาษาต่างประเทศ',
  'ศิลปะ',
  'สุขศึกษาและพละศึกษา',
  'การงานอาชีพ',
] as const;

interface DraftReview {
  status: AdminActionStatus;
  feedback?: string;
  selected: boolean;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  submissions,
  onUpdate,
  onLogout,
  isSyncing = false,
  lastSyncTime = null,
  onRefresh,
}) => {
  // Mode: 'pending' (คิวรอตรวจ - รายการที่ตรวจแล้วจะไม่ขึ้นมาแสดง) หรือ 'history' (ดูรายการที่ตรวจแล้วทั้งหมด)
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
  const [selectedSubject, setSelectedSubject] = useState<string>('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleCopyReviewedData = async () => {
    const reviewedItems = submissions.filter((s) => s.status === 'ตรวจแล้ว');
    const success = await copyForGoogleSheet(reviewedItems);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } else {
      alert('ไม่สามารถคัดลอกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Draft edits keyed by submission ID
  const [drafts, setDrafts] = useState<Record<string, DraftReview>>({});

  // Initialize draft when submissions change
  React.useEffect(() => {
    const initialDrafts: Record<string, DraftReview> = {};
    submissions.forEach((sub) => {
      initialDrafts[sub.id] = {
        status: sub.status,
        feedback: sub.adminFeedback || '',
        selected: false,
      };
    });
    setDrafts(initialDrafts);
  }, [submissions]);

  const updateDraft = (
    id: string,
    field: keyof DraftReview,
    value: any
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { status: 'รอตรวจ', selected: false }),
        [field]: value,
      },
    }));
  };

  // Filter submissions
  const displayedSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // ไม่แสดงรายการที่ถูกลบหรือมีสถานะลบอย่างเด็ดขาด
      if (
        sub.status.includes('ลบ') ||
        sub.status.includes('ยกเลิก') ||
        sub.adminFeedback?.includes('ลบรายการ')
      ) {
        return false;
      }

      // Rule: "เมื่อรายการใดได้รับการตรวจแล้ว ไม่ต้องขึ้นมาให้ตรวจอีก"
      if (viewMode === 'pending') {
        if (sub.status === 'ตรวจแล้ว') return false;
      } else {
        if (sub.status !== 'ตรวจแล้ว') return false;
      }

      // Subject filter
      if (selectedSubject !== 'ทั้งหมด' && sub.subjectGroup !== selectedSubject) {
        return false;
      }

      // Search filter
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
  }, [submissions, viewMode, selectedSubject, searchTerm]);

  // Counts
  const pendingCount = useMemo(
    () =>
      submissions.filter(
        (s) =>
          (s.status === 'รอตรวจ' || s.status === 'ส่งใหม่') &&
          !s.status.includes('ลบ') &&
          !s.status.includes('ยกเลิก')
      ).length,
    [submissions]
  );
  const reviewedCount = useMemo(
    () =>
      submissions.filter(
        (s) =>
          s.status === 'ตรวจแล้ว' &&
          !s.status.includes('ลบ') &&
          !s.status.includes('ยกเลิก')
      ).length,
    [submissions]
  );

  // Group displayed submissions by subject
  const groupedBySubject = useMemo(() => {
    const groups: Record<string, PLCSubmission[]> = {};
    displayedSubmissions.forEach((sub) => {
      if (!groups[sub.subjectGroup]) {
        groups[sub.subjectGroup] = [];
      }
      groups[sub.subjectGroup].push(sub);
    });
    return groups;
  }, [displayedSubmissions]);

  // Select / Deselect All
  const handleSelectAll = (check: boolean) => {
    setDrafts((prev) => {
      const next = { ...prev };
      displayedSubmissions.forEach((sub) => {
        if (next[sub.id]) {
          next[sub.id].selected = check;
        }
      });
      return next;
    });
  };

  // Batch mark selected items with a specific status
  const handleBatchSetStatus = (status: AdminActionStatus) => {
    setDrafts((prev) => {
      const next = { ...prev };
      displayedSubmissions.forEach((sub) => {
        if (next[sub.id]?.selected) {
          next[sub.id].status = status;
        }
      });
      return next;
    });
  };

  // The main Save Action: "บันทึกการตรวจสอบ"
  const handleSaveReviews = async () => {
    setIsSaving(true);
    setSaveSuccessMessage('');

    try {
      const now = new Date();
      const thaiYear = now.getFullYear() + 543;
      const reviewTimestamp = `${now.getDate()}/${now.getMonth() + 1}/${thaiYear} ${String(
        now.getHours()
      ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

      let updatedList = [...submissions];
      let deletedCount = 0;
      let auditedCount = 0;
      let resubmitCount = 0;
      const modifiedItemsToSync: Array<{
        id: string;
        status: string;
        adminFeedback?: string;
        reviewedAt?: string;
      }> = [];
      const deletedIds: string[] = [];

      for (const [id, draft] of Object.entries(drafts)) {
        if (draft.status === 'ลบ') {
          // Rule: ข้อมูลใดที่ ADMIN กด "ลบ" และกดบันทึก ให้ลบข้อมูลนั้น
          updatedList = updatedList.filter((item) => item.id !== id);
          deletedCount++;
          deletedIds.push(id);
        } else {
          const itemIndex = updatedList.findIndex((item) => item.id === id);
          if (itemIndex !== -1) {
            const currentItem = updatedList[itemIndex];
            const hasChanged =
              currentItem.status !== draft.status ||
              currentItem.adminFeedback !== draft.feedback;

            if (hasChanged) {
              if (draft.status === 'ตรวจแล้ว') auditedCount++;
              if (draft.status === 'ส่งใหม่') resubmitCount++;

              const updatedItem: PLCSubmission = {
                ...currentItem,
                status: draft.status as any,
                adminFeedback: draft.feedback?.trim() || currentItem.adminFeedback,
                reviewedAt: reviewTimestamp,
                reviewedBy: 'Admin งานวิชาการ โรงเรียนบ้านค่าย',
              };
              updatedList[itemIndex] = updatedItem;

              modifiedItemsToSync.push({
                id: updatedItem.id,
                status: updatedItem.status,
                adminFeedback: updatedItem.adminFeedback,
                reviewedAt: updatedItem.reviewedAt,
              });
            }
          }
        }
      }

      // 1. บันทึกลงเครื่องและอัปเดต state ของหน้าเว็บทันทีก่อน ไม่ให้ดีดกลับ
      saveSubmissions(updatedList);
      onUpdate(updatedList);

      // 2. ส่งข้อมูลไปอัปเดตสถานะใน Google Sheet ทันทีด้วย update_status โดยตรงสำหรับทุกรายการที่ถูกตรวจ
      let sheetStatusDetail = '';
      if (modifiedItemsToSync.length > 0) {
        const updateResult = await updateMultipleSubmissionsStatusInGoogleSheet(modifiedItemsToSync);
        if (updateResult.success) {
          sheetStatusDetail = ` • อัปเดตสถานะลง Google Sheet แล้ว (${updateResult.successCount}/${modifiedItemsToSync.length} รายการ)`;
        } else {
          sheetStatusDetail = ` [⚠️ Google Sheet: ${updateResult.message}]`;
        }
      }

      // 3. หากมีรายการที่ถูกลบ ให้ส่งคำขอลบไปยัง Google Sheet และรอผลลัพธ์
      if (deletedIds.length > 0) {
        const deleteResults = await Promise.allSettled(
          deletedIds.map((delId) => deleteSubmissionFromGoogleSheet(delId))
        );
        const delSuccess = deleteResults.filter(
          (r) => r.status === 'fulfilled' && r.value.success
        ).length;
        if (delSuccess > 0) {
          sheetStatusDetail += ` • ซิงค์การลบลง Google Sheet แล้ว (${delSuccess}/${deletedIds.length} รายการ)`;
        }
      }

      // 4. สำรองด้วย syncAllToGoogleSheet ในพื้นหลัง
      syncAllToGoogleSheet(updatedList).catch((err) => console.warn('Background syncAll warning:', err));

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0284c7', '#10b981', '#f59e0b'],
      });

      const totalReviewed = auditedCount + resubmitCount;
      let msg = `บันทึกการตรวจสอบเรียบร้อยแล้ว! (ตรวจแล้ว ${auditedCount} รายการ, ส่งใหม่ ${resubmitCount} รายการ${
        deletedCount > 0 ? `, ลบ ${deletedCount} รายการ` : ''
      })`;
      if (sheetStatusDetail) {
        msg += sheetStatusDetail;
      } else if (totalReviewed > 0) {
        msg += ' • ซิงค์สถานะลง Google Sheet เรียบร้อย';
      }
      setSaveSuccessMessage(msg);

      setTimeout(() => {
        setSaveSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err?.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = displayedSubmissions.filter((s) => drafts[s.id]?.selected).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/25 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                Admin Mode: เข้าสู่ระบบแล้ว
              </span>
              <span className="text-xs text-slate-500 font-mono">Password: •••••••</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
              หน้าตรวจงาน (สำหรับ ADMIN)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              บันทึกกิจกรรม PLC โรงเรียนบ้านค่าย ภาคเรียนที่ 2/2569
            </p>
          </div>
        </div>

        {/* Admin Tools: Google Sheet, Database Setup, Export to CSV & Logout */}
        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-xs disabled:opacity-60 cursor-pointer"
              title={lastSyncTime ? `ดึงข้อมูลส่งงานล่าสุดจาก Google Sheet (ซิงค์ล่าสุด: ${lastSyncTime})` : 'ดึงข้อมูลส่งงานล่าสุดจาก Google Sheet'}
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังดึงข้อมูลล่าสุด...' : 'รีเฟรชข้อมูลจาก Sheet'}</span>
              {lastSyncTime && !isSyncing && (
                <span className="text-[10px] text-emerald-600 font-mono hidden sm:inline">({lastSyncTime})</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold transition shadow-xs"
            title="ตั้งค่าเชื่อมต่อ Google Sheet เป็นฐานข้อมูล Live Database"
          >
            <Database className="w-4 h-4 text-teal-600" />
            <span>เชื่อมต่อ Sheet ฐานข้อมูล</span>
            <span
              className={`w-2 h-2 rounded-full ${
                getWebhookUrl() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition hover:scale-105 active:scale-95"
            title="เปิด Google Sheet บันทึกข้อมูลงานที่ตรวจแล้ว"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Google Sheet (ข้อมูลงานที่ตรวจแล้ว)</span>
          </a>

          <a
            href={GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold transition"
            title="เปิดโฟลเดอร์ Google Drive รวมไฟล์แนบของโรงเรียนบ้านค่าย"
          >
            <FolderOpen className="w-4 h-4 text-sky-600" />
            <span>โฟลเดอร์ Google Drive</span>
          </a>

          <button
            onClick={() => exportToCSV(submissions)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
            title="ส่งออกไฟล์ข้อมูลเป็น CSV เพื่อเปิดในตารางข้อมูล"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold transition"
            title="ออกจากระบบ Admin"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between gap-3 shadow-md animate-scaleUp">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage('')}
            className="text-xs text-emerald-600 hover:text-emerald-800 underline"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Mode Switcher: Pending Audit vs Reviewed History */}
      <div className="bg-white rounded-3xl p-5 shadow-lg shadow-sky-900/5 border border-sky-100 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('pending')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                viewMode === 'pending'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>คิวที่ต้องตรวจ ({pendingCount})</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-white/20">
                ไม่แสดงรายการที่ตรวจแล้ว
              </span>
            </button>

            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                viewMode === 'history'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ประวัติที่ตรวจแล้ว ({reviewedCount})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            {viewMode === 'pending' ? (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                ⚡ กฎ: เมื่อบันทึกว่า "ตรวจแล้ว" รายการจะย้ายออกจากคิวนี้ทันที
              </span>
            ) : (
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
                ✓ รายการที่ได้รับการตรวจเรียบร้อยแล้ว
              </span>
            )}
          </div>
        </div>

        {/* Filters: Subject Group and Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อครู, ชื่อกลุ่ม, ประเด็นท้าทาย หรือรหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 outline-none text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="md:col-span-7 flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600 shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none text-xs sm:text-sm font-medium text-slate-800 cursor-pointer"
            >
              {SUBJECT_LIST.map((subj) => (
                <option key={subj} value={subj}>
                  กลุ่มสาระ: {subj}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Action Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSelectAll(selectedCount !== displayedSubmissions.length)}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-sky-600"
            >
              {selectedCount > 0 && selectedCount === displayedSubmissions.length ? (
                <CheckSquare className="w-4 h-4 text-sky-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>เลือกทั้งหมด ({selectedCount}/{displayedSubmissions.length})</span>
            </button>

            {selectedCount > 0 && (
              <span className="text-slate-400">| ปรับสถานะรายการที่เลือกเป็น:</span>
            )}

            {selectedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleBatchSetStatus('ตรวจแล้ว')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
                >
                  ตรวจแล้ว
                </button>
                <button
                  onClick={() => handleBatchSetStatus('ส่งใหม่')}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold hover:bg-rose-200"
                >
                  ส่งใหม่
                </button>
                <button
                  onClick={() => handleBatchSetStatus('ลบ')}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold hover:bg-rose-100 hover:text-rose-700"
                >
                  ลบ
                </button>
              </div>
            )}
          </div>

          <div className="text-slate-500">
            แสดง {displayedSubmissions.length} รายการ
          </div>
        </div>
      </div>

      {/* Google Sheet Sync Banner for Reviewed Items */}
      {viewMode === 'history' && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-3xl p-6 border border-emerald-200/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-base">
                ลิงก์ข้อมูลงานที่ตรวจแล้วไปยัง Google Sheet โรงเรียนบ้านค่าย
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              ท่านสามารถคลิกเพื่อเปิด Google Sheet หรือคัดลอกข้อมูลรายการที่ตรวจแล้ว ({reviewedCount} รายการ) ไปวางในตารางได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyReviewedData}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                isCopied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'คัดลอกเรียบร้อยแล้ว!' : 'คัดลอกข้อมูลไปวางใน Sheet'}</span>
            </button>

            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition hover:scale-105 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิด Google Sheet</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Review Queue / Cards Grouped by Subject */}
      {displayedSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-sky-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            {viewMode === 'pending'
              ? 'ยอดเยี่ยม! ไม่มีงานค้างตรวจในหมวดนี้'
              : 'ยังไม่มีรายการที่ตรวจแล้วในเงื่อนไขนี้'}
          </h4>
          <p className="text-xs text-slate-500">
            {viewMode === 'pending'
              ? 'คุณได้ตรวจรายการทั้งหมดแล้ว หรือลองเปลี่ยนตัวกรองกลุ่มสาระการเรียนรู้'
              : 'สามารถไปที่แท็บ "คิวที่ต้องตรวจ" เพื่อดำเนินการตรวจ'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBySubject).map(([subjectName, items]) => (
            <div
              key={subjectName}
              className="bg-white rounded-3xl p-6 shadow-xl shadow-sky-900/5 border border-sky-100 space-y-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-800">
                    กลุ่มสาระการเรียนรู้: {subjectName}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {items.length} รายการ
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((sub) => {
                  const draft = drafts[sub.id] || {
                    status: sub.status,
                    feedback: sub.adminFeedback || '',
                    selected: false,
                  };

                  const isMarkedDelete = draft.status === 'ลบ';

                  return (
                    <div
                      key={sub.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isMarkedDelete
                          ? 'bg-rose-50/60 border-rose-300 opacity-70'
                          : draft.status === 'ตรวจแล้ว'
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : draft.status === 'ส่งใหม่'
                          ? 'bg-rose-50/30 border-rose-200'
                          : 'bg-slate-50/60 border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      {/* Row Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateDraft(sub.id, 'selected', !draft.selected)}
                            className="text-slate-400 hover:text-sky-600"
                          >
                            {draft.selected ? (
                              <CheckSquare className="w-5 h-5 text-sky-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>

                          <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100/70 px-2.5 py-1 rounded-lg">
                            {sub.id}
                          </span>

                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            {sub.cycle || 'วงรอบที่ 1'}
                          </span>

                          <span className="font-bold text-slate-800 text-sm sm:text-base">
                            {sub.modelTeacher}
                          </span>
                          <span className="text-xs text-slate-500 hidden md:inline">
                            (กลุ่ม: {sub.groupName})
                          </span>
                        </div>

                        {/* Status selector buttons: รอตรวจ, ตรวจแล้ว, ส่งใหม่, ลบ */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateDraft(sub.id, 'status', 'รอตรวจ')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              draft.status === 'รอตรวจ'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>รอตรวจ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateDraft(sub.id, 'status', 'ตรวจแล้ว')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              draft.status === 'ตรวจแล้ว'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ตรวจแล้ว</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateDraft(sub.id, 'status', 'ส่งใหม่')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              draft.status === 'ส่งใหม่'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>ส่งใหม่</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(sub.id, 'status', draft.status === 'ลบ' ? 'รอตรวจ' : 'ลบ')
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              draft.status === 'ลบ'
                                ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-400'
                                : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
                            }`}
                            title="กดเพื่อทำเครื่องหมายลบข้อมูล"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{draft.status === 'ลบ' ? 'จะถูกลบ' : 'ลบ'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="p-3 rounded-xl bg-white/80 border border-slate-100">
                          <span className="font-bold text-slate-800">หัวข้อ LS: </span>
                          <span>{sub.lsTopic}</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span>ส่งเมื่อ: {sub.submittedAt}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600">ไฟล์แนบ:</span>
                            {sub.fileName && sub.fileName !== 'ไม่มี' && sub.fileName !== 'ไม่มีไฟล์แนบ' ? (
                              <a
                                href={sub.fileUrl || GOOGLE_DRIVE_FOLDER_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold hover:underline bg-white px-2 py-0.5 rounded border border-sky-200"
                                title="เปิดไฟล์ใน Google Drive โรงเรียนบ้านค่าย"
                              >
                                <span className="max-w-[160px] truncate">{sub.fileName}</span>
                                <ExternalLink className="w-3 h-3 text-sky-500 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-400">ไม่มี</span>
                            )}
                          </div>
                          {sub.notes && <span>หมายเหตุ: {sub.notes}</span>}
                        </div>
                      </div>

                      {/* Evaluation Section: Feedback only (no score) */}
                      {!isMarkedDelete && (
                        <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                            <MessageSquare className="w-4 h-4 text-sky-600" />
                            <span>ข้อเสนอแนะ:</span>
                          </span>
                          <input
                            type="text"
                            placeholder="ระบุข้อเสนอแนะ หรือคำแนะนำถึงคุณครู (ส่งถึง Model Teacher)"
                            value={draft.feedback || ''}
                            onChange={(e) => updateDraft(sub.id, 'feedback', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-sky-500"
                          />
                        </div>
                      )}

                      {isMarkedDelete && (
                        <div className="mt-3 p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>
                            รายการนี้ถูกกำหนดสถานะ "ลบ" — เมื่อกดปุ่ม "บันทึกการตรวจสอบ" ด้านล่าง ข้อมูลนี้จะถูกลบออกจากระบบถาวร
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Bottom Action Bar for "บันทึกการตรวจสอบ" */}
      <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-30">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">
                บันทึกผลการตรวจสอบและการปรับสถานะ
              </p>
              <p className="text-xs text-slate-400">
                ข้อมูลจะถูกบันทึกสู่ระบบ และปรับสถานะ "ตรวจแล้ว", "ส่งใหม่" หรือ "ลบ" ตามที่กำหนด
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-emerald-200 text-xs sm:text-sm font-semibold transition border border-white/10"
              title="เปิด Google Sheet บันทึกข้อมูลงานที่ตรวจแล้ว"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิด Google Sheet</span>
            </a>

            <button
              onClick={handleSaveReviews}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/30 transition hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตรวจสอบ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheet Live Database Sync Setup Modal */}
      <GoogleSheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataSynced={onUpdate}
      />
    </div>
  );
};
