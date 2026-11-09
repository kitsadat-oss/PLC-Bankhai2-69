import React, { useState } from 'react';
import {
  Database,
  ExternalLink,
  Copy,
  Check,
  X,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Code2,
  BookOpen,
  FolderUp,
  FileCheck,
} from 'lucide-react';
import {
  GOOGLE_SHEET_URL,
  GOOGLE_DRIVE_FOLDER_URL,
  getWebhookUrl,
  setWebhookUrl,
  getAppsScriptTemplate,
  getManifestTemplate,
  syncAllToGoogleSheet,
  fetchFromGoogleSheet,
  testDriveUpload,
  validateWebhookUrl,
  getSubmissions,
  saveSubmissions,
  resetWebhookUrlToDefault,
  DEFAULT_WEBHOOK_URL,
} from '../services/storage';
import { PLCSubmission } from '../types/plc';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataSynced: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  onDataSynced,
}) => {
  const [urlInput, setUrlInput] = useState(getWebhookUrl());
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCopiedManifest, setIsCopiedManifest] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [showManifestGuide, setShowManifestGuide] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyManifest = async () => {
    const manifest = getManifestTemplate();
    await navigator.clipboard.writeText(manifest);
    setIsCopiedManifest(true);
    setTimeout(() => setIsCopiedManifest(false), 3000);
  };

  const handleSaveUrl = () => {
    setWebhookUrl(urlInput);
    setStatusMessage({
      type: 'success',
      text: 'บันทึก URL การเชื่อมต่อเรียบร้อยแล้ว',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleTestDrive = async () => {
    if (!urlInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณากรอก Web App URL ของ Google Apps Script ก่อนกดทดสอบส่งไฟล์',
      });
      return;
    }

    setIsTestingDrive(true);
    setStatusMessage(null);

    try {
      const result = await testDriveUpload(urlInput.trim());
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: result.message + (result.fileUrl ? ` (ดูไฟล์: ${result.fileUrl})` : ''),
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการทดสอบ: ' + (err?.message || ''),
      });
    } finally {
      setIsTestingDrive(false);
    }
  };

  const handleCopyCode = async () => {
    const code = getAppsScriptTemplate();
    await navigator.clipboard.writeText(code);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 3000);
  };

  const handlePullFromSheet = async () => {
    if (!urlInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณากรอก Web App URL ของ Google Apps Script ก่อนดึงข้อมูล',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      const data = await fetchFromGoogleSheet(urlInput.trim());
      if (data && data.length > 0) {
        saveSubmissions(data);
        onDataSynced();
        setStatusMessage({
          type: 'success',
          text: `ดึงข้อมูลจาก Google Sheet สำเร็จเรียบร้อย (${data.length} รายการ)`,
        });
      } else if (data && data.length === 0) {
        setStatusMessage({
          type: 'success',
          text: 'เชื่อมต่อ Google Sheet สำเร็จ แต่ยังไม่มีข้อมูลแถวในชีต',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบว่าเลือกผู้มีสิทธิ์เข้าถึงเป็น "ทุกคน (Anyone)" ใน Apps Script หรือไม่',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err.message || 'Network Error'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAllToSheet = async () => {
    if (!urlInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณากรอก Web App URL ของ Google Apps Script ก่อนส่งข้อมูล',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      const localData = getSubmissions();
      const res = await syncAllToGoogleSheet(localData, urlInput.trim());
      if (res && res.success) {
        setStatusMessage({
          type: 'success',
          text: `ส่งข้อมูลทั้งหมด (${localData.length} รายการ) ไปยัง Google Sheet สำเร็จเรียบร้อย!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.message || 'ไม่สามารถส่งข้อมูลไปยัง Google Sheet ได้ กรุณาตรวจสอบ URL',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + (err.message || ''),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-sky-100 relative max-h-[92vh] overflow-y-auto animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                Google Sheet Live Database
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">
              การเชื่อมต่อ Google Sheet เป็นฐานข้อมูล
            </h3>
          </div>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 mb-4 animate-shake ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="space-y-5 text-xs sm:text-sm text-slate-700">
          {/* Target Sheet & Drive Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  1. Google Sheet (ตารางข้อมูล)
                </span>
                <p className="font-mono text-[11px] text-slate-500 truncate">
                  {GOOGLE_SHEET_URL}
                </p>
              </div>
              <a
                href={GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดชีต</span>
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-sky-800 block">
                  2. Google Drive (โฟลเดอร์ไฟล์แนบ)
                </span>
                <p className="font-mono text-[11px] text-slate-500 truncate">
                  {GOOGLE_DRIVE_FOLDER_URL}
                </p>
              </div>
              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shrink-0 transition"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>เปิด Drive</span>
              </a>
            </div>
          </div>

          {/* Web App URL input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Web App URL ของ Google Apps Script (สำหรับเชื่อมต่อเป็น API)
              </label>
              <button
                type="button"
                onClick={() => {
                  const defaultUrl = resetWebhookUrlToDefault();
                  setUrlInput(defaultUrl);
                  setStatusMessage({
                    type: 'success',
                    text: 'คืนค่าเป็น Web App URL เริ่มต้นของโรงเรียนบ้านค่ายเรียบร้อยแล้ว',
                  });
                  setTimeout(() => setStatusMessage(null), 3500);
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
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-xs font-mono text-slate-800"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shrink-0 transition"
              >
                บันทึก URL
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              * ระบบถูกตั้งค่าเริ่มต้นให้ใช้ Web App URL ของโรงเรียนบ้านค่ายโดยอัตโนมัติ ทุกเครื่องและทุกคนสามารถส่งงานได้ทันทีโดยไม่ต้องตั้งค่าใหม่
            </p>

            {/* Real-time URL validation indicator */}
            {urlInput.trim() && (() => {
              const validation = validateWebhookUrl(urlInput);
              return (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    validation.isValid
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}
                >
                  {validation.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="font-medium">{validation.message}</span>
                </div>
              );
            })()}

            <p className="text-[11px] text-slate-500">
              เมื่อระบุ URL แล้ว ระบบจะบันทึกและส่งข้อมูลลงชีตนี้โดยอัตโนมัติทุกครั้งที่มีการส่งงานหรือปรับสถานะ
            </p>
          </div>

          {/* Sync Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleTestDrive}
              disabled={isTestingDrive || isTesting}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-700/20 disabled:opacity-50"
              title="ทดสอบสร้างไฟล์จริงในโฟลเดอร์ Google Drive โรงเรียนบ้านค่าย"
            >
              {isTestingDrive ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileCheck className="w-4 h-4 text-emerald-100" />
              )}
              <span>ทดสอบส่งไฟล์เข้า Drive ทันที</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromSheet}
              disabled={isTesting || isTestingDrive}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
              ) : (
                <DownloadCloud className="w-4 h-4 text-sky-600" />
              )}
              <span>ดึงข้อมูลจาก Sheet</span>
            </button>

            <button
              type="button"
              onClick={handlePushAllToSheet}
              disabled={isTesting || isTestingDrive}
              className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <UploadCloud className="w-4 h-4 text-emerald-600" />
              )}
              <span>ส่งข้อมูลทั้งหมดไป Sheet</span>
            </button>
          </div>

          {/* 5 Step Instructions with Drive Authorization */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>ขั้นตอนการเปิดใช้ Google Sheet & Google Drive (ทำเพียงครั้งเดียว):</span>
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
              <li>
                เปิด{' '}
                <a
                  href={GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline font-semibold"
                >
                  Google Sheet ของโรงเรียนบ้านค่าย
                </a>
              </li>
              <li>
                ไปที่เมนู <span className="font-semibold text-slate-800">ส่วนขยาย (Extensions)</span> ➔{' '}
                <span className="font-semibold text-slate-800">Apps Script</span>
              </li>
              <li>
                ลบโค้ดเดิมออกทั้งหมด แล้วคลิกปุ่มด้านล่างเพื่อ{' '}
                <span className="font-semibold text-slate-800">"คัดลอกโค้ดสคริปต์"</span> และนำไปวาง (Ctrl+V)
              </li>
              <li className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold text-amber-800 block mb-0.5">
                  ⭐️ ขั้นตอนสำคัญที่สุด (กดอนุญาตสิทธิ์เข้าถึง Drive):
                </span>
                ที่แถบเครื่องมือด้านบนของ Apps Script มองหาช่องเลือกฟังก์ชัน เลือก{' '}
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">authorizeNow</span> หรือ{' '}
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">testDrivePermission</span>{' '}
                แล้วกดปุ่ม <span className="font-bold text-slate-800">"เรียกใช้" (Run)</span> 1 ครั้ง ➔ จะมีหน้าต่างขอสิทธิ์ ให้กด{' '}
                <span className="font-semibold">"ตรวจสอบสิทธิ์"</span> ➔ เลือกบัญชี Google ➔ กด{' '}
                <span className="font-semibold">"ขั้นสูง" (Advanced)</span> ➔ กด{' '}
                <span className="font-semibold">"ไปยัง... (ไม่ปลอดภัย)"</span> ➔ กด{' '}
                <span className="font-bold text-emerald-800">"อนุญาต" (Allow)</span>
                <p className="mt-1 text-[11px] text-amber-700">
                  (หากไม่กดขั้นตอนนี้ Google จะบล็อกไม่ให้สคริปต์บันทึกไฟล์ลง Drive!)
                </p>
              </li>
              <li>
                กดปุ่มสีน้ำเงิน <span className="font-semibold text-slate-800">"ทำให้ใช้งานได้" (Deploy)</span> ➔{' '}
                <span className="font-semibold text-slate-800">"การทำให้ใช้งานได้ใหม่" (New deployment)</span>
              </li>
              <li>
                เลือกประเภทเป็น <span className="font-semibold text-slate-800">"เว็บแอป" (Web app)</span> ➔{' '}
                ในช่อง <span className="font-semibold text-slate-800">ผู้มีสิทธิ์เข้าถึง (Who has access)</span> ให้เลือกเป็น{' '}
                <span className="font-bold text-emerald-700">"ทุกคน" (Anyone)</span> ➔ กดทำให้ใช้งานได้
              </li>
              <li>
                คัดลอก <span className="font-mono text-slate-800">URL ของเว็บแอป</span> ที่ได้ (ที่ลงท้ายด้วย <b>/exec</b>) มาวางในช่องด้านบนแล้วกด "บันทึก URL"
                จากนั้นสามารถกดปุ่ม <span className="font-bold text-emerald-700">"ทดสอบส่งไฟล์เข้า Drive ทันที"</span> เพื่อตรวจสอบได้เลย!
              </li>
            </ol>

            {/* Troubleshooting 1: DriveApp.getFolderById blocked */}
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>คำถาม: วางใน appsscript.json แล้วแต่ยังติดข้อผิดพลาด "ไม่ได้รับอนุญาตให้เรียกใช้ DriveApp.getFolderById" แก้ไขอย่างไร?</span>
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                การวางใน <code className="bg-white px-1 rounded border border-rose-200">appsscript.json</code> เป็นเพียงการขอเปิดสิทธิ์ แต่ Google จะยัง <b>ไม่อนุญาต</b> จนกว่าจะทำ 3 ข้อนี้:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 font-medium">
                <li>
                  <b>กดบันทึกไฟล์ appsscript.json:</b> กด Ctrl+S หรือกดไอคอนรูปแผ่นดิสก์ 💾 ที่ด้านบน (ต้องไม่มีจุดส้มข้างชื่อไฟล์)
                </li>
                <li>
                  <b>กด Run เพื่อให้หน้าต่างอนุญาตเด้งขึ้นมา:</b> สลับกลับมาที่แท็บ <code className="bg-white px-1 rounded border border-slate-300">Code.gs</code> เลือกฟังก์ชัน <b>authorizeNow</b> หรือ <b>testDrivePermission</b> แล้วกดปุ่ม <b>"เรียกใช้" (Run)</b> หน้าต่าง "จำเป็นต้องได้รับสิทธิ์" จะเด้งขึ้นมาให้กด <b>"ตรวจสอบสิทธิ์"</b> ➔ <b>"ขั้นสูง (Advanced)"</b> ➔ <b>"อนุญาต (Allow)"</b>
                </li>
                <li>
                  <b>จุดตายสำคัญที่สุด: ต้อง Deploy ใหม่ 1 ครั้ง!</b> หลังจากกดยินยอมแล้ว ให้กด <b>Deploy ➔ New deployment</b> เลือกผู้มีสิทธิ์เป็น <b>Anyone (ทุกคน)</b> แล้วกด Deploy อีกครั้ง เพราะหากไม่ Deploy ใหม่ ตัว Web App เดิมจะยังจำสิทธิ์เก่าที่ยังไม่ได้อนุมัติ!
                </li>
              </ol>
            </div>

            {/* Troubleshooting 2: 302 Found nginx/1.22.1 */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>คำถาม: ขึ้นข้อความ "302 Found nginx/1.22.1" หมายถึงอะไร?</span>
              </span>
              <div className="space-y-1 text-[11px] text-slate-700 leading-relaxed">
                <p>
                  • <b>nginx/1.22.1</b> คือระบบรักษาความปลอดภัยของ AI Studio Dev Server ที่ตรวจจับการเข้าถึง
                </p>
                <p>
                  • หากเปิดลิงก์ Preview ในเบราว์เซอร์อื่น หรือเครื่องที่ไม่ได้ล็อกอินบัญชี Google AI Studio ไว้ ระบบจะตอบกลับเป็น <b>302 Found</b> เพื่อเปลี่ยนเส้นทางไปหน้าล็อกอิน Google
                </p>
                <p>
                  • <b>การแก้ไข:</b> ใช้งานผ่านหน้าต่างพรีวิวใน AI Studio หรือใช้งานผ่านลิงก์ Production จริง (เช่น Vercel) และตรวจสอบว่าในช่อง <b>Web App URL</b> ไม่ได้เผลอนำ URL พรีวิวของเว็บไซต์ระบบไปใส่ (ต้องเป็น URL จาก Apps Script ที่ลงท้ายด้วย <b>/exec</b> เท่านั้น)
                </p>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className={`inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition ${
                  isCopiedCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {isCopiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>
                  {isCopiedCode
                    ? 'คัดลอกโค้ดสคริปต์แล้ว!'
                    : '1. คัดลอกโค้ดสคริปต์ (Code.gs)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyManifest}
                className={`inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition ${
                  isCopiedManifest
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
                title="คัดลอกการตั้งค่าสิทธิ์ Google Drive สำหรับ appsscript.json"
              >
                {isCopiedManifest ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>
                  {isCopiedManifest
                    ? 'คัดลอก appsscript.json แล้ว!'
                    : '2. คัดลอก appsscript.json (เปิดสิทธิ์ Drive)'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
