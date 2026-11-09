import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  FileUp,
  User,
  Users,
  Lightbulb,
  BookOpen,
  Calendar,
  Paperclip,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Trash2,
  ExternalLink,
  FolderUp,
  RefreshCw,
  Settings,
  Link2,
  RotateCcw,
} from 'lucide-react';
import { LearningSubject, PLCSubmission, PLCCycle, PLC_CYCLES } from '../types/plc';
import {
  addSubmission,
  updateSubmission,
  sendSubmissionToGoogleSheet,
  GOOGLE_DRIVE_FOLDER_URL,
  getWebhookUrl,
  setWebhookUrl,
  validateWebhookUrl,
  resetWebhookUrlToDefault,
  DEFAULT_WEBHOOK_URL,
} from '../services/storage';
import { TabKey } from './Navbar';

const SUBJECT_OPTIONS: LearningSubject[] = [
  'คณิตศาสตร์',
  'วิทยาศาสตร์และเทคโนโลยี',
  'วิทยาศาสตร์และเทคโนโลยี(คอมพิวเตอร์)',
  'สังคมศึกษา',
  'แนะแนว',
  'ภาษาต่างประเทศ',
  'ภาษาไทย',
  'ศิลปะ',
  'สุขศึกษาและพละศึกษา',
  'การงานอาชีพ',
];

interface SubmitTabProps {
  onSuccess: () => void;
  onNavigate: (tab: TabKey) => void;
}

export const SubmitTab: React.FC<SubmitTabProps> = ({ onSuccess, onNavigate }) => {
  const [modelTeacher, setModelTeacher] = useState('');
  const [groupName, setGroupName] = useState('');
  const [cycle, setCycle] = useState<PLCCycle>('วงรอบที่ 1');
  const [lsTopic, setLsTopic] = useState('');
  const [subjectGroup, setSubjectGroup] = useState<LearningSubject>('คณิตศาสตร์');
  const [notes, setNotes] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<PLCSubmission | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [webhookUrl, setWebhookState] = useState(getWebhookUrl());
  const [showUrlConfig, setShowUrlConfig] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState(getWebhookUrl());
  const [syncNotice, setSyncNotice] = useState<string>('');

  // Format Current Date & Time in Thai format
  const getThaiDateTime = () => {
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day} ${month} ${thaiYear} เวลา ${hours}:${minutes}:${seconds} น.`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();

    reader.onload = (event) => {
      setSelectedFile({
        name: file.name,
        size: sizeInMB,
        type: file.type || 'application/octet-stream',
        dataUrl: event.target?.result as string,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          size: sizeInMB,
          type: file.type || 'application/octet-stream',
          dataUrl: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!modelTeacher.trim()) {
      setErrorMessage('กรุณาระบุ ชื่อ-นามสกุล ผู้ส่งงาน (Model Teacher)');
      return;
    }
    if (!groupName.trim()) {
      setErrorMessage('กรุณาระบุ ชื่อกลุ่ม');
      return;
    }
    if (!lsTopic.trim()) {
      setErrorMessage('กรุณาระบุ หัวข้อ LS (ประเด็นท้าทาย/ปัญหาที่กลุ่ม PLC กำหนดร่วมกัน)');
      return;
    }

    setIsSubmitting(true);

    try {
      const submission = addSubmission({
        modelTeacher: modelTeacher.trim(),
        groupName: groupName.trim(),
        cycle,
        lsTopic: lsTopic.trim(),
        subjectGroup,
        submittedAt: getThaiDateTime(),
        fileName: selectedFile?.name || 'ไม่มีไฟล์แนบ',
        fileSize: selectedFile?.size || '-',
        fileUrl: selectedFile ? GOOGLE_DRIVE_FOLDER_URL : '',
        fileType: selectedFile?.type || '',
        fileData: selectedFile?.dataUrl || '',
        notes: notes.trim(),
        status: 'รอตรวจ',
      });

      // ส่งข้อมูลไปยัง Google Sheet และอัปโหลดไฟล์เข้า Google Drive อัตโนมัติ
      try {
        const syncResult = await sendSubmissionToGoogleSheet(submission);
        if (syncResult && syncResult.fileUrl) {
          submission.fileUrl = syncResult.fileUrl;
          updateSubmission(submission.id, { fileUrl: syncResult.fileUrl });
        }
        if (syncResult && syncResult.error) {
          setSyncNotice('แจ้งเตือนจาก Apps Script: ' + syncResult.error);
        } else if (syncResult && syncResult.message && syncResult.message.includes('ข้ามการบันทึกซ้ำซ้อน')) {
          setSyncNotice('⚠️ ' + syncResult.message);
        } else if (!getWebhookUrl()) {
          setSyncNotice('ยังไม่ได้ระบุ Web App URL: ข้อมูลและไฟล์ถูกบันทึกไว้ในเครื่องนี้เท่านั้น');
        } else {
          setSyncNotice('');
        }
      } catch (syncErr: any) {
        setSyncNotice('ไม่สามารถเชื่อมต่อ Google Apps Script ได้: ' + (syncErr?.message || ''));
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#38bdf8', '#34d399', '#f43f5e', '#a855f7'],
      });

      setSubmittedData(submission);
      onSuccess();
    } catch (err) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setModelTeacher('');
    setGroupName('');
    setCycle('วงรอบที่ 1');
    setLsTopic('');
    setSubjectGroup('คณิตศาสตร์');
    setNotes('');
    setSelectedFile(null);
    setSubmittedData(null);
    setErrorMessage('');
    setSyncNotice('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-900/5 border border-sky-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
          <FileUp className="w-7 h-7" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200 mb-1">
            <span>แบบฟอร์มส่งงาน</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            ส่งบันทึกกิจกรรม PLC โรงเรียนบ้านค่าย
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            ภาคเรียนที่ 2 ปีการศึกษา 2569 • บันทึกข้อมูลเข้าสู่ระบบ
          </p>
        </div>
      </div>

      {/* Google Drive & Sheet Connection Status Box */}
      <div className={`p-4 rounded-3xl border transition-all ${
        webhookUrl
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-amber-50/90 border-amber-300 text-amber-950'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ${
              webhookUrl ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-200' : 'bg-amber-500 ring-4 ring-amber-200'
            }`} />
            <div>
              <p className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>{webhookUrl ? 'เชื่อมต่อ Google Drive & Sheet พร้อมใช้งานทุกเครื่อง' : '⚠️ ยังไม่ได้ระบุ Web App URL สำหรับส่งเข้า Google Drive'}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-medium border border-emerald-300">
                  URL โรงเรียนบ้านค่าย
                </span>
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {webhookUrl
                  ? 'ระบบตั้งค่า Web App URL เริ่มต้นให้เรียบร้อยแล้ว ไม่ต้องกรอกใหม่ในทุกเครื่อง ไฟล์จะถูกอัปโหลดเข้า Google Drive และบันทึกลง Sheet อัตโนมัติ'
                  : 'หากต้องการให้อัปโหลดไฟล์เข้าโฟลเดอร์ Google Drive (1X9O0ELOl...) อัตโนมัติ กรุณาระบุ Web App URL'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowUrlConfig(!showUrlConfig)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 flex items-center gap-1.5 ${
              webhookUrl
                ? 'bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{webhookUrl ? 'ดู / แก้ไข URL' : 'ระบุ Web App URL'}</span>
          </button>
        </div>

        {/* Expandable Web App URL input */}
        {showUrlConfig && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Web App URL ของ Google Apps Script:
              </label>
              <button
                type="button"
                onClick={() => {
                  const defaultUrl = resetWebhookUrlToDefault();
                  setUrlInputValue(defaultUrl);
                  setWebhookState(defaultUrl);
                }}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-bold hover:underline"
              >
                คืนค่า URL เริ่มต้นของโรงเรียน
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono outline-none focus:border-sky-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWebhookUrl(urlInputValue);
                    setWebhookState(urlInputValue.trim() || DEFAULT_WEBHOOK_URL);
                    setShowUrlConfig(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlConfig(false)}
                  className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* Validation warning or confirmation */}
            {urlInputValue.trim() && (() => {
              const validation = validateWebhookUrl(urlInputValue);
              return (
                <div
                  className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                    validation.isValid
                      ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100/90 text-amber-950 border border-amber-300'
                  }`}
                >
                  {validation.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  )}
                  <span className="font-medium text-[11px]">{validation.message}</span>
                </div>
              );
            })()}

            <p className="text-[11px] text-slate-500">
              💡 ดูโค้ดสคริปต์และขั้นตอนตั้งค่าได้ที่หน้า <b>4.ตรวจงาน</b> ➔ ปุ่ม <b>"ตั้งค่า Google Sheet / Drive"</b>
            </p>
          </div>
        )}
      </div>

      {/* Success Modal / Banner */}
      {submittedData ? (
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-emerald-300 animate-scaleUp text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-12 h-12 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              บันทึกสำเร็จเรียบร้อยแล้ว
            </span>
            <h3 className="text-2xl font-extrabold text-slate-800">
              ส่งบันทึกกิจกรรม PLC สำเร็จ!
            </h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              รหัสอ้างอิง: <span className="font-mono font-bold text-sky-600">{submittedData.id}</span> •
              ผู้ส่ง: <span className="font-semibold">{submittedData.modelTeacher}</span> • กลุ่ม:{' '}
              <span className="font-semibold">{submittedData.groupName}</span>
            </p>
          </div>

          {/* Details summary */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 text-left text-xs sm:text-sm space-y-2 max-w-xl mx-auto">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">วงรอบที่ (PLC Cycle):</span>
              <span className="font-bold text-sky-800 bg-sky-100 px-3 py-1 rounded-full text-xs border border-sky-200">
                {submittedData.cycle || 'วงรอบที่ 1'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ประเด็นท้าทาย (LS Topic):</span>
              <span className="font-medium text-slate-800 text-right max-w-xs truncate">
                {submittedData.lsTopic}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">กลุ่มสาระการเรียนรู้:</span>
              <span className="font-medium text-slate-800">{submittedData.subjectGroup}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ประทับเวลาส่งงาน:</span>
              <span className="font-mono text-slate-700">{submittedData.submittedAt}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ไฟล์แนบ:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-700">{submittedData.fileName}</span>
                {submittedData.fileName && submittedData.fileName !== 'ไม่มีไฟล์แนบ' && (
                  <a
                    href={submittedData.fileUrl || GOOGLE_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold transition"
                    title="เปิดไฟล์ใน Google Drive"
                  >
                    <FolderUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เปิดใน Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">สถานะเริ่มต้น:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                รอตรวจ
              </span>
            </div>

            {syncNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
                <span className="font-bold block mb-0.5">⚠️ ข้อมูลการส่งเข้า Google Drive & Sheet:</span>
                <span>{syncNotice}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('status')}
              className="w-full sm:w-auto px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm rounded-xl shadow-md transition"
            >
              ไปยังหน้าตรวจสอบสถานะ
            </button>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
            >
              ส่งผลงานรายการใหม่
            </button>
          </div>
        </div>
      ) : (
        /* The Main Submission Form */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-sky-900/5 border border-sky-100 space-y-6"
        >
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Model Teacher Name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600" />
              <span>ชื่อ-นามสกุล ผู้ส่งงาน (Model Teacher) <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น นายสมชาย มีสุข หรือ ครูสมศรี ใจดี"
              value={modelTeacher}
              onChange={(e) => setModelTeacher(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition text-slate-800 text-sm font-medium"
            />
          </div>

          {/* 2. Group Name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <span>ชื่อกลุ่ม PLC <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น กลุ่มก้าวหน้าคณิตคิดเร็ว, กลุ่มวิทย์คิดสร้างสรรค์"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition text-slate-800 text-sm font-medium"
            />
          </div>

          {/* 3. PLC Cycle (วงรอบที่ 1 ถึง 4) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-sky-600" />
                <span>วงรอบที่ (PLC Cycle) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-xs text-slate-500 font-medium">เลือกวงรอบการดำเนินการ (1 - 4)</span>
            </div>

            {/* Segmented Button Selection (4 Options) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PLC_CYCLES.map((c) => {
                const isSelected = cycle === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/25 ring-2 ring-sky-200'
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSelected ? 'bg-white' : 'bg-slate-400'
                      }`}
                    />
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. LS Topic */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>หัวข้อ LS (ประเด็นท้าทาย/ปัญหาที่กลุ่ม PLC กำหนดร่วมกัน) <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="ระบุประเด็นปัญหา นวัตกรรมการจัดการเรียนรู้ หรือประเด็นท้าทายที่กลุ่มร่วมกันพัฒนา เช่น การพัฒนาทักษะการอ่านจับใจความด้วยเทคนิคบันได 6 ขั้น..."
              value={lsTopic}
              onChange={(e) => setLsTopic(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition text-slate-800 text-sm leading-relaxed"
            />
          </div>

          {/* 4. Subject Group (10 options) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>กลุ่มสาระการเรียนรู้ (10 กลุ่มสาระ) <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={subjectGroup}
              onChange={(e) => setSubjectGroup(e.target.value as LearningSubject)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition text-slate-800 text-sm font-medium cursor-pointer"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Submission Timestamp */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>วันที่ส่งงาน (ประทับวันและเวลาอัตโนมัติ)</span>
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-sky-100 bg-sky-50/60 text-slate-700 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono font-semibold text-sky-800">{getThaiDateTime()}</span>
              <span className="text-xs text-slate-500 ml-auto">(ระบบจะประทับเวลาขณะกดบันทึกจริง)</span>
            </div>
          </div>

          {/* 6. File Attachment */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-sky-600" />
                <span>แนบไฟล์งาน (รายงานสรุป / แผนการสอน / ภาพกิจกรรม)</span>
              </label>
              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1 hover:underline"
                title="เปิดโฟลเดอร์ Google Drive บันทึกไฟล์แนบ"
              >
                <span>เปิดโฟลเดอร์ Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {selectedFile ? (
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{selectedFile.size}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                  title="ลบไฟล์"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="relative border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/30 rounded-2xl p-6 text-center transition group cursor-pointer"
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                />
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    รองรับไฟล์ PDF, Word (.docx), PowerPoint (.pptx), ZIP หรือรูปภาพ
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 7. Additional Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>หมายเหตุเพิ่มเติม (ถ้ามี)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น มีการปรับปรุงแผนเพิ่มเติม หรือข้อมูลเพิ่มเติมสำหรับการตรวจสอบ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition text-slate-800 text-sm font-medium"
            />
          </div>

          {/* Bottom Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
            >
              ล้างข้อมูล
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-3 px-10 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-base shadow-lg shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? 'กำลังบันทึกและอัปโหลดไฟล์ไปยัง Drive...'
                  : 'บันทึกข้อมูล'}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
