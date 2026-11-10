import { PLCSubmission, SubmissionStatus } from '../types/plc';
import { INITIAL_SUBMISSIONS } from '../data/initialData';

const STORAGE_KEY = 'bankhai_plc_submissions_v2569_prod';
const WEBHOOK_URL_KEY = 'bankhai_plc_webhook';

export const GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1qa0uli9Y0NawX76PYTwlE3W-pwNdffXCRRu_ZzrX-6U/edit?gid=0#gid=0';

export const GOOGLE_DRIVE_FOLDER_ID = '1X9O0ELOl-aBuc7n6L9AJJj3jxcoEGMUs';

export const GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1X9O0ELOl-aBuc7n6L9AJJj3jxcoEGMUs?usp=drive_link';

const DELETED_IDS_KEY = 'bankhai_plc_deleted_ids_v1';

export function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map((id) => String(id).trim()));
      }
    }
  } catch (e) {
    // ignore
  }
  return new Set();
}

export function markIdAsDeleted(id: string): void {
  try {
    const cleanId = String(id || '').trim();
    if (!cleanId) return;
    const set = getDeletedIds();
    set.add(cleanId);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    // ignore
  }
}

/**
 * Helper to check whether an item is sample, test, debug, or deleted data
 */
export function isSampleOrTestData(item: PLCSubmission): boolean {
  if (!item) return true;
  const id = String(item.id || '').trim();
  const idUpper = id.toUpperCase();
  const status = String(item.status || '').trim();
  const feedback = String(item.adminFeedback || '').trim();
  const teacher = String(item.modelTeacher || '').trim();
  const topic = String(item.lsTopic || '').trim();
  const group = String(item.groupName || '').trim();
  const notes = String(item.notes || '').trim();

  // 1. ตรวจสอบสถานะการลบ: หากสถานะมีคำว่า "ลบ", "ลบแล้ว", "ยกเลิก", "deleted" หรือข้อเสนอแนะระบุว่าลบ
  if (
    status.includes('ลบ') ||
    status.includes('ยกเลิก') ||
    status.toLowerCase().includes('delete') ||
    feedback.includes('ลบรายการ') ||
    notes.includes('ลบแล้ว')
  ) {
    return true;
  }
  const deletedSet = getDeletedIds();
  if (id && deletedSet.has(id)) {
    return true;
  }

  // 2. ตรวจสอบรหัสทดสอบ / ดีบัก
  if (
    idUpper.includes('DEBUG') ||
    idUpper.includes('BATCH') ||
    idUpper.includes('TEST') ||
    idUpper.startsWith('SAMPLE') ||
    id === 'PLC-2569-001' ||
    id === 'PLC-2569-002'
  ) {
    return true;
  }

  // 3. ตรวจสอบชื่อตัวอย่างเดิม
  if (
    teacher.includes('สมชาย มีสุข') ||
    teacher.includes('ณิชารัตน์ เจริญพร') ||
    teacher.includes('ทดสอบระบบ') ||
    teacher.includes('ครูทดสอบ') ||
    group.includes('กลุ่มทดสอบ') ||
    topic.includes('ทดสอบการส่งไฟล์') ||
    topic.includes('ทดสอบการอัปเดต') ||
    topic.includes('หัวข้อทดสอบ') ||
    notes.includes('รายการทดสอบ') ||
    notes.includes('ทดสอบการอัปเดต')
  ) {
    return true;
  }

  return false;
}

export const isDeletedOrTestData = isSampleOrTestData;

export function getSubmissions(): PLCSubmission[] {
  try {
    // ล้างคีย์ข้อมูลตัวอย่างเดิมเพื่อความสะอาดสำหรับใช้งานจริง
    if (localStorage.getItem('bankhai_plc_submissions_v2569_final')) {
      localStorage.removeItem('bankhai_plc_submissions_v2569_final');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    // กรองข้อมูลตัวอย่างและข้อมูลทดสอบออกทั้งหมดเพื่อเตรียมใช้งานจริง
    const clean = parsed.filter((item) => !isSampleOrTestData(item));
    if (clean.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      return clean;
    }

    return parsed;
  } catch (error) {
    console.error('Error reading submissions from localStorage:', error);
    return [];
  }
}

export function saveSubmissions(list: PLCSubmission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Error saving submissions to localStorage:', error);
  }
}

export function clearAllSubmissions(): PLCSubmission[] {
  saveSubmissions([]);
  return [];
}

export function generateSubmissionId(): string {
  // สร้างรหัสส่งงานที่ไม่ซ้ำกันแน่นอน แม้ส่งงานพร้อมกันหลายเครื่องในเสี้ยววินาทีเดียวกัน (Timestamp 6 หลัก + ตัวเลขสุ่ม 3 หลัก)
  const timeSlice = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100).toString();
  return `PLC-2569-${timeSlice}-${rand}`;
}

const recentInFlightSubmissions = new Map<string, { submission: PLCSubmission; timestamp: number }>();

export function registerInFlightSubmission(submission: PLCSubmission): void {
  if (submission && submission.id) {
    recentInFlightSubmissions.set(submission.id.trim(), {
      submission,
      timestamp: Date.now(),
    });
  }
}

export function addSubmission(newSub: Omit<PLCSubmission, 'id' | 'status'> & { status?: SubmissionStatus }): PLCSubmission {
  const current = getSubmissions();
  const id = generateSubmissionId();

  const submission: PLCSubmission = {
    ...newSub,
    id,
    status: newSub.status || 'รอตรวจ',
  };

  registerInFlightSubmission(submission);

  const updated = [submission, ...current];
  saveSubmissions(updated);

  return submission;
}

export function updateSubmission(
  id: string,
  updates: Partial<PLCSubmission>
): PLCSubmission | null {
  const current = getSubmissions();
  const index = current.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updatedItem = {
    ...current[index],
    ...updates,
  };

  current[index] = updatedItem;
  saveSubmissions(current);
  return updatedItem;
}

export function deleteSubmission(id: string): boolean {
  const current = getSubmissions();
  const filtered = current.filter((item) => item.id !== id);
  if (filtered.length === current.length) return false;
  saveSubmissions(filtered);
  return true;
}

export function resetToSampleData(): PLCSubmission[] {
  saveSubmissions([]);
  return [];
}

export interface UrlValidationResult {
  isValid: boolean;
  type: 'valid' | 'editor' | 'sheet' | 'drive' | 'ai_studio' | 'invalid';
  message: string;
}

export function validateWebhookUrl(url: string): UrlValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return {
      isValid: false,
      type: 'invalid',
      message: 'ยังไม่ได้ระบุ Web App URL',
    };
  }

  if (trimmed.includes('docs.google.com/spreadsheets')) {
    return {
      isValid: false,
      type: 'sheet',
      message: '⚠️ URL นี้คือลิงก์ Google Sheet ไม่ใช่ Web App URL ของ Google Apps Script',
    };
  }

  if (trimmed.includes('drive.google.com')) {
    return {
      isValid: false,
      type: 'drive',
      message: '⚠️ URL นี้คือลิงก์ Google Drive โฟลเดอร์ ไม่ใช่ Web App URL ของ Google Apps Script',
    };
  }

  if (
    trimmed.includes('aistudio.google.com') ||
    trimmed.includes('ais-dev') ||
    trimmed.includes('ais-pre') ||
    trimmed.includes('vercel.app') ||
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1')
  ) {
    return {
      isValid: false,
      type: 'ai_studio',
      message: '⚠️ URL นี้คือลิงก์เว็บไซต์ระบบ (ไม่ใช่ Web App URL ของ Apps Script)',
    };
  }

  if (trimmed.includes('/edit') && trimmed.includes('script.google.com')) {
    return {
      isValid: false,
      type: 'editor',
      message: '⚠️ URL นี้คือลิงก์หน้าโปรแกรมแก้ไข (Editor) กรุณากดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้ใหม่" แล้วคัดลอก URL ที่ลงท้ายด้วย /exec',
    };
  }

  if (trimmed.startsWith('https://script.google.com/macros/s/') && trimmed.endsWith('/exec')) {
    return {
      isValid: true,
      type: 'valid',
      message: '✅ รูปแบบ URL ถูกต้อง (Google Apps Script Web App /exec)',
    };
  }

  if (trimmed.startsWith('https://script.google.com/macros/s/')) {
    return {
      isValid: true,
      type: 'valid',
      message: '✅ URL เป็นสคริปต์ของ Google Apps Script',
    };
  }

  return {
    isValid: false,
    type: 'invalid',
    message: '⚠️ URL ควรขึ้นต้นด้วย https://script.google.com/macros/s/... และลงท้ายด้วย /exec',
  };
}

// Web App URL เริ่มต้นถาวรของโรงเรียนบ้านค่าย เพื่อให้ทุกเครื่องและทุกเบราว์เซอร์พร้อมใช้งานได้ทันทีโดยไม่ต้องกรอกใหม่
export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzB2UtIF52nTdkOyh45szd63hY9Kmwzsq4GX65Y9krdKrEWDKJ4c9KcEjlnTz7d20QM/exec';

// Google Apps Script Web App Endpoint for using Google Sheet as Live Database
export function getWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(WEBHOOK_URL_KEY);
    if (saved && saved.trim() && saved.trim().startsWith('https://script.google.com/macros/s/')) {
      return saved.trim();
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_WEBHOOK_URL;
}

export function setWebhookUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (!trimmed || trimmed === DEFAULT_WEBHOOK_URL) {
      localStorage.removeItem(WEBHOOK_URL_KEY);
    } else {
      localStorage.setItem(WEBHOOK_URL_KEY, trimmed);
    }
  } catch (e) {
    // ignore
  }
}

export function resetWebhookUrlToDefault(): string {
  try {
    localStorage.removeItem(WEBHOOK_URL_KEY);
  } catch (e) {
    // ignore
  }
  return DEFAULT_WEBHOOK_URL;
}

const activeSyncIds = new Set<string>();
let isTestDriveActive = false;

/**
 * Send a new submission to Google Sheet via Google Apps Script Web App
 * Automatically uploads attached file to Google Drive and saves file link into Google Sheet
 */
export async function sendSubmissionToGoogleSheet(
  submission: PLCSubmission,
  customUrl?: string
): Promise<{ success: boolean; fileUrl?: string; message?: string; error?: string }> {
  const url = customUrl || getWebhookUrl();
  if (!url) {
    return {
      success: false,
      error: 'ยังไม่ได้ระบุ Web App URL ของ Google Apps Script ข้อมูลจึงยังไม่ได้ส่งเข้า Google Drive & Sheet',
    };
  }

  // ป้องกันการส่งคำขอซ้ำซ้อนสำหรับ submission id เดียวกันภายใน 10 วินาที
  if (activeSyncIds.has(submission.id)) {
    console.log(`Skipping duplicate in-flight sync request for ${submission.id}`);
    return { success: true, fileUrl: submission.fileUrl };
  }
  activeSyncIds.add(submission.id);

  setTimeout(() => {
    activeSyncIds.delete(submission.id);
  }, 10000);

  const payload = {
    action: 'create',
    data: {
      ...submission,
      driveFolderId: GOOGLE_DRIVE_FOLDER_ID,
    },
  };

  try {
    // ส่งข้อมูลแบบมาตรฐาน (CORS Simple Request) เพื่อให้อ่านผลลัพธ์ JSON จาก Apps Script ได้
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script ส่งรหัสสถานะ HTTP ${response.status}`);
    }

    const resJson = await response.json();

    if (resJson.status === 'success') {
      if (resJson.message && resJson.message.includes('ข้ามการบันทึกซ้ำซ้อน')) {
        console.warn('Apps Script skipped duplicate:', resJson.message);
        return {
          success: true,
          fileUrl: resJson.fileUrl || submission.fileUrl || GOOGLE_DRIVE_FOLDER_URL,
          message: resJson.message,
        };
      }

      return {
        success: true,
        fileUrl: resJson.fileUrl || GOOGLE_DRIVE_FOLDER_URL,
        message: 'บันทึกข้อมูลและอัปโหลดไฟล์เรียบร้อย',
      };
    } else if (resJson.status === 'warning') {
      return {
        success: true,
        fileUrl: resJson.fileUrl || GOOGLE_DRIVE_FOLDER_URL,
        message: resJson.message || 'บันทึกข้อมูลลงชีตสำเร็จ แต่อาจมีข้อผิดพลาดในการอัปโหลดไฟล์',
      };
    } else {
      return {
        success: false,
        error: resJson.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลใน Google Apps Script',
      };
    }
  } catch (err: any) {
    console.warn('Standard POST failed or blocked by CORS redirect, attempting fallback:', err);
    // กรณีที่เบราว์เซอร์หรือสภาพแวดล้อมเครือข่ายบล็อกการอ่าน CORS redirect ให้ fallback แบบ no-cors สำรอง
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        fileUrl: GOOGLE_DRIVE_FOLDER_URL,
        message: 'ส่งข้อมูลแบบสำรองสำเร็จ (no-cors)',
      };
    } catch (fallbackErr: any) {
      activeSyncIds.delete(submission.id);
      return {
        success: false,
        error: err?.message || 'ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
      };
    }
  }
}

/**
 * Test upload a small test file directly to Google Drive via Google Apps Script
 */
export async function testDriveUpload(customUrl?: string): Promise<{ success: boolean; fileUrl?: string; message: string }> {
  const url = customUrl || getWebhookUrl();
  if (!url) {
    return {
      success: false,
      message: 'กรุณากรอก Web App URL ก่อนกดทดสอบ',
    };
  }

  if (isTestDriveActive) {
    return {
      success: true,
      message: 'กำลังดำเนินการทดสอบ กรุณารอสักครู่ ไม่จำเป็นต้องกดย้ำ',
    };
  }
  isTestDriveActive = true;
  setTimeout(() => {
    isTestDriveActive = false;
  }, 6000);

  const testPayload = {
    action: 'create',
    data: {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      cycle: 'วงรอบที่ 1',
      modelTeacher: 'ทดสอบระบบ',
      groupName: 'กลุ่มทดสอบ Google Drive',
      lsTopic: 'ทดสอบการส่งไฟล์เข้าสู่โฟลเดอร์ Google Drive โรงเรียนบ้านค่าย',
      subjectGroup: 'วิทยาศาสตร์และเทคโนโลยี(คอมพิวเตอร์)',
      submittedAt: new Date().toLocaleString('th-TH'),
      fileName: 'test_drive_connection.txt',
      fileSize: '1 KB',
      fileType: 'text/plain',
      fileData:
        'data:text/plain;base64,4LiX4LiU4Liq4Lit4Lia4LiB4Liy4Lij4LmA4LiK4Li34LmI4Lit4Lih4LiV4LmI4LitIEdvb2dsZSBEcml2ZSDguKPguLDguJrguJogUExDIOC5guC4o+C4h+C5gOC4o+C4teC4ouC4meC4muC5ieC4suC4meC4hOC5iOC4suC4oiDguKrguLPguYDguKPguYfguIjguKrguKHguJrguLnguKPguJPguYw=',
      notes: 'รายการทดสอบระบบ Google Drive',
      status: 'รอตรวจ',
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testPayload),
    });

    if (res.ok) {
      try {
        const json = await res.json();
        if (json && json.status === 'success') {
          return {
            success: true,
            fileUrl: json.fileUrl,
            message: 'เชื่อมต่อและอัปโหลดไฟล์เข้า Google Drive สำเร็จเรียบร้อย!',
          };
        } else if (json && json.message) {
          return {
            success: false,
            message: 'Apps Script แจ้งเตือน: ' + json.message,
          };
        }
      } catch {
        // response ok but cannot parse JSON (due to redirect)
      }
      return {
        success: true,
        message: 'ส่งคำขอสำเร็จเรียบร้อย กรุณาตรวจสอบใน Google Drive ว่ามีไฟล์ test_drive_connection.txt หรือไม่',
      };
    } else {
      return {
        success: false,
        message: `HTTP Error ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err) {
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(testPayload),
      });
      return {
        success: true,
        message: 'ส่งคำขอแบบ no-cors ไปยัง Apps Script แล้ว กรุณาเปิดดูในโฟลเดอร์ Google Drive ว่ามีไฟล์ test_drive_connection.txt ปรากฏหรือไม่',
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (fallbackErr?.message || 'Network Error'),
      };
    }
  }
}

/**
 * Update the review status and feedback of a single submission directly in Google Sheet
 * Compatible with existing and new Google Apps Script deployments (action: 'update_status')
 */
export async function updateSubmissionStatusInGoogleSheet(
  item: {
    id: string;
    status: string;
    adminFeedback?: string;
    reviewedAt?: string;
  },
  customUrl?: string
): Promise<{ success: boolean; message?: string }> {
  const url = customUrl || getWebhookUrl();
  if (!url) return { success: false, message: 'ยังไม่ได้ระบุ Web App URL' };

  const payload = {
    action: 'update_status',
    data: {
      id: item.id,
      status: item.status,
      adminFeedback: item.adminFeedback || '',
      reviewedAt: item.reviewedAt || '',
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      try {
        const json = await res.json();
        if (json.status === 'success') {
          return { success: true, message: 'อัปเดตสถานะใน Google Sheet สำเร็จ' };
        } else if (json.status === 'not_found') {
          return { success: false, message: `ไม่พบรหัสงาน ${item.id} ใน Google Sheet` };
        } else {
          return { success: false, message: json.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' };
        }
      } catch {
        return { success: true, message: 'ส่งคำขออัปเดตสถานะเรียบร้อยแล้ว' };
      }
    }
    return { success: false, message: `HTTP Error ${res.status}` };
  } catch (err: any) {
    console.warn('update_status standard fetch failed, attempting no-cors fallback:', err);
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      return { success: true, message: 'ส่งคำขออัปเดตสถานะแล้ว (no-cors)' };
    } catch (fallbackErr: any) {
      return { success: false, message: fallbackErr?.message || 'เชื่อมต่อกับ Google Sheet ไม่สำเร็จ' };
    }
  }
}

/**
 * Update multiple reviewed submissions in Google Sheet in parallel
 */
export async function updateMultipleSubmissionsStatusInGoogleSheet(
  items: Array<{
    id: string;
    status: string;
    adminFeedback?: string;
    reviewedAt?: string;
  }>,
  customUrl?: string
): Promise<{ success: boolean; successCount: number; message: string }> {
  if (items.length === 0) {
    return { success: true, successCount: 0, message: 'ไม่มีรายการที่ต้องอัปเดตสถานะ' };
  }

  const results = await Promise.allSettled(
    items.map((item) => updateSubmissionStatusInGoogleSheet(item, customUrl))
  );

  let successCount = 0;
  results.forEach((r) => {
    if (r.status === 'fulfilled' && r.value.success) {
      successCount++;
    }
  });

  return {
    success: successCount > 0 || items.length === 0,
    successCount,
    message: `อัปเดตสถานะลง Google Sheet สำเร็จ ${successCount} จาก ${items.length} รายการ`,
  };
}

/**
 * Batch sync all submissions to Google Sheet.
 * Tries 'batch_update' first; if the deployed script returns 'invalid_action',
 * it automatically falls back to updating individual items via 'update_status'.
 */
export async function syncAllToGoogleSheet(
  submissions: PLCSubmission[],
  customUrl?: string
): Promise<{ success: boolean; message?: string }> {
  const url = customUrl || getWebhookUrl();
  if (!url) return { success: false, message: 'ยังไม่ได้ระบุ Web App URL' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'batch_update',
        data: submissions,
      }),
    });

    if (res.ok) {
      try {
        const json = await res.json();
        if (json.status === 'success') {
          return {
            success: true,
            message: json.message || 'บันทึกผลการตรวจลง Google Sheet เรียบร้อยแล้ว',
          };
        } else if (json.status === 'invalid_action') {
          // Deployed script does not support batch_update yet; fallback to individual updates
          console.warn('Apps Script does not support batch_update, falling back to update_status for each item...');
          const updateResult = await updateMultipleSubmissionsStatusInGoogleSheet(submissions, url);
          return {
            success: updateResult.success,
            message: updateResult.message,
          };
        } else {
          return { success: false, message: json.message || 'Google Sheet รายงานข้อผิดพลาด' };
        }
      } catch {
        return { success: true, message: 'ส่งข้อมูลไปยัง Google Sheet เรียบร้อยแล้ว' };
      }
    }
    return { success: false, message: `Google Apps Script ส่งรหัสสถานะ HTTP ${res.status}` };
  } catch (err: any) {
    console.warn('Google Sheet batch sync standard fetch failed, attempting individual update fallback:', err);
    try {
      const updateResult = await updateMultipleSubmissionsStatusInGoogleSheet(submissions, url);
      return {
        success: updateResult.success,
        message: updateResult.message,
      };
    } catch (fallbackErr: any) {
      console.error('Google Sheet sync fallback failed:', fallbackErr);
      return { success: false, message: fallbackErr?.message || 'ส่งข้อมูลไปยัง Google Sheet ไม่สำเร็จ' };
    }
  }
}

/**
 * Intelligently merge remote Google Sheet data with local data:
 * - Google Sheet คือฐานข้อมูลหลัก 100% (Single Source of Truth)
 * - ซิงค์สถานะการตรวจจาก Google Sheet เสมอ (หากในชีตเป็น ตรวจแล้ว, รอตรวจ, ส่งใหม่ ให้ยึดตามชีต 100%)
 * - หากรายการใดไม่มีใน Google Sheet แล้ว แสดงว่าถูกลบออกจากชีต -> ให้ลบออกจากเครื่องด้วย (ห้ามนำกลับมา)
 * - หากรายการใดในชีตมีสถานะ "ลบ" / "ลบแล้ว" -> จะถูกคัดกรองทิ้งและไม่แสดงผล
 * - ยกเว้นเฉพาะรายการที่เพิ่งกดส่งใหม่จากเครื่องนี้ไม่เกิน 90 วินาที (in-flight) ที่กำลังรอส่งเข้าชีต
 */
export function mergeRemoteWithLocal(
  remoteData: PLCSubmission[],
  localData: PLCSubmission[]
): {
  merged: PLCSubmission[];
  pendingStatusUpdates: PLCSubmission[];
} {
  const cleanRemote = remoteData.filter((item) => !isSampleOrTestData(item));
  const mergedMap = new Map<string, PLCSubmission>();

  // 1. Google Sheet คือฐานข้อมูลหลัก: นำข้อมูลทุกรายการจาก Google Sheet มาใช้งาน 100%
  for (const remote of cleanRemote) {
    const id = remote.id ? remote.id.trim() : '';
    if (!id) continue;

    mergedMap.set(id, {
      ...remote,
      status: remote.status || 'รอตรวจ',
      adminFeedback: remote.adminFeedback || '',
      reviewedAt: remote.reviewedAt || '',
      reviewedBy: remote.reviewedAt ? (remote.reviewedBy || 'Admin งานวิชาการ โรงเรียนบ้านค่าย') : '',
      fileUrl: remote.fileUrl || '',
    });

    // หากรายการนี้ขึ้นไปบน Google Sheet เรียบร้อยแล้ว ให้นำออกจาก in-flight map
    recentInFlightSubmissions.delete(id);
  }

  // 2. คงเฉพาะรายการที่เพิ่งส่งใหม่จากเครื่องนี้ในช่วงเวลาไม่เกิน 90 วินาที (In-flight submissions)
  const now = Date.now();
  for (const [inFlightId, item] of recentInFlightSubmissions.entries()) {
    if (now - item.timestamp > 90000) {
      recentInFlightSubmissions.delete(inFlightId);
    } else if (!mergedMap.has(inFlightId) && !isSampleOrTestData(item.submission)) {
      mergedMap.set(inFlightId, item.submission);
    }
  }

  // ข้อสำคัญ: ข้อมูลใดที่เคยอยู่ใน localData แต่ไม่มีใน Google Sheet และไม่ได้เพิ่งกดส่งใน 90 วินาที
  // แสดงว่าถูกลบออกจาก Google Sheet แล้ว -> จะถูกตัดทิ้งโดยอัตโนมัติ ทำให้ข้อมูลตรงกับ Google Sheet ทันที!

  return {
    merged: Array.from(mergedMap.values()),
    pendingStatusUpdates: [],
  };
}

/**
 * Fetch rows from Google Sheet via Google Apps Script Web App
 */
export async function fetchFromGoogleSheet(customUrl?: string): Promise<PLCSubmission[] | null> {
  const url = customUrl || getWebhookUrl();
  if (!url) return null;

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      const cleanData = (json.data as PLCSubmission[]).filter((item) => !isSampleOrTestData(item));
      return cleanData;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch via Web App, trying fallback:', err);
    return null;
  }
}

export function getManifestTemplate(): string {
  return JSON.stringify(
    {
      timeZone: 'Asia/Bangkok',
      dependencies: {},
      exceptionLogging: 'STACKDRIVER',
      runtimeVersion: 'V8',
      oauthScopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    },
    null,
    2
  );
}

/**
 * Exact Google Apps Script code to paste into Google Sheet Extensions -> Apps Script
 * - Includes testDrivePermission() function to grant Google Drive authorization
 * - Saves submission data into Google Sheet
 * - Automatically uploads attached file into Google Drive Folder: 1X9O0ELOl-aBuc7n6L9AJJj3jxcoEGMUs
 * - Inserts the resulting Google Drive file URL into Column 11 of the Google Sheet
 */
export function getAppsScriptTemplate(): string {
  return `/**
 * สคริปต์ Google Apps Script สำหรับระบบ PLC โรงเรียนบ้านค่าย
 * 1. บันทึกข้อมูลลง Google Sheet อัตโนมัติ
 * 2. อัปโหลดไฟล์แนบเข้า Google Drive โฟลเดอร์: 1X9O0ELOl-aBuc7n6L9AJJj3jxcoEGMUs
 * 3. นำลิงก์ของไฟล์ใน Google Drive บันทึกลงในคอลัมน์ของ Google Sheet
 */

var DRIVE_FOLDER_ID = "1X9O0ELOl-aBuc7n6L9AJJj3jxcoEGMUs";

/**
 * ⭐️⭐️ ฟังก์ชันสำหรับกดอนุญาตสิทธิ์ (Authorize) ให้ Google Drive ⭐️⭐️
 * หากขึ้น "คุณไม่ได้รับอนุญาตให้เรียกใช้ DriveApp.getFolderById":
 * 1. เลือกฟังก์ชัน "authorizeNow" ด้านบน (ข้างปุ่ม 'แก้ไขข้อบกพร่อง')
 * 2. กดปุ่ม "เรียกใช้" (Run) 1 ครั้ง
 * 3. จะมีหน้าต่างป๊อปอัปขอสิทธิ์: กด "ตรวจสอบสิทธิ์" -> เลือกอีเมล (kitsada.t@bankhai.ac.th)
 *    -> กด "ขั้นสูง" (Advanced) มุมซ้ายล่าง -> กด "ไปยัง... (ไม่ปลอดภัย)" -> กด "อนุญาต" (Allow)
 * 4. สำคัญมาก: หลังกดอนุญาตแล้ว ให้ไปที่ปุ่ม "ทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้ใหม่" (New deployment)
 *    เลือกประเภท "เว็บแอป" (Web app) -> ผู้มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone) -> กด Deploy อีกครั้ง
 */
function authorizeNow() {
  testDrivePermission();
}

function testDrivePermission() {
  try {
    var folder;
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      Logger.log("✅ พบโฟลเดอร์ Google Drive: " + folder.getName());
    } catch (fErr) {
      Logger.log("⚠️ เข้าถึงโฟลเดอร์ตาม ID ไม่ได้ จะใช้ My Drive หลักแทน: " + fErr.toString());
      folder = DriveApp.getRootFolder();
    }

    var blob = Utilities.newBlob("ทดสอบการเชื่อมต่อ Google Drive ระบบ PLC โรงเรียนบ้านค่าย สำเร็จสมบูรณ์", "text/plain", "ทดสอบ_GoogleDrive_โรงเรียนบ้านค่าย.txt");
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(s) {}
    Logger.log("🎉 สำเร็จเรียบร้อย! อัปโหลดไฟล์เข้า Google Drive ได้แล้ว: " + file.getUrl());
    return file.getUrl();
  } catch(e) {
    Logger.log("❌ เกิดข้อผิดพลาด: " + e.toString());
    throw e;
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var data = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue;
    var hasCycle = String(row[1] || '').indexOf('วงรอบที่') === 0;
    if (hasCycle) {
      data.push({
        id: String(row[0] || ''),
        cycle: String(row[1] || 'วงรอบที่ 1'),
        modelTeacher: String(row[2] || ''),
        groupName: String(row[3] || ''),
        lsTopic: String(row[4] || ''),
        subjectGroup: String(row[5] || ''),
        submittedAt: String(row[6] || ''),
        status: String(row[7] || 'รอตรวจ'),
        adminFeedback: String(row[8] || ''),
        reviewedAt: String(row[9] || ''),
        fileName: String(row[10] || ''),
        fileUrl: String(row[11] || ''),
        notes: String(row[12] || '')
      });
    } else {
      data.push({
        id: String(row[0] || ''),
        cycle: 'วงรอบที่ 1',
        modelTeacher: String(row[1] || ''),
        groupName: String(row[2] || ''),
        lsTopic: String(row[3] || ''),
        subjectGroup: String(row[4] || ''),
        submittedAt: String(row[5] || ''),
        status: String(row[6] || 'รอตรวจ'),
        adminFeedback: String(row[7] || ''),
        reviewedAt: String(row[8] || ''),
        fileName: String(row[9] || ''),
        fileUrl: String(row[10] || ''),
        notes: String(row[11] || '')
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'create';

    // ตรวจสอบและสร้างหัวตารางหากแผ่นงานยังว่างเปล่า (13 คอลัมน์)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "รหัสส่งงาน", "วงรอบที่", "ชื่อ-นามสกุล ผู้ส่งงาน", "ชื่อกลุ่ม", "หัวข้อ LS (ประเด็นท้าทาย)",
        "กลุ่มสาระการเรียนรู้", "วันที่ส่งงาน", "สถานะ", "ข้อเสนอแนะจากผู้ตรวจ",
        "วันที่ตรวจ", "ชื่อไฟล์แนบ", "ลิงก์ไฟล์ Google Drive", "หมายเหตุ"
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#e0f2fe");
    }

    if (action === 'create') {
      var item = payload.data;
      var fileUrl = item.fileUrl || "";
      var uploadError = "";

      // หากไม่มีรหัสส่งงาน ให้สร้างอัตโนมัติตามเวลา (Timestamp)
      if (!item.id) {
        var timeSlice = new Date().getTime().toString().slice(-6);
        item.id = "PLC-2569-" + timeSlice;
      }

      // 0. ตรวจสอบว่ามีรหัสส่งงานนี้อยู่ในชีตแล้วหรือไม่ เพื่อป้องกันการบันทึกซ้ำซ้อน (Duplicate Protection)
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var r = 0; r < existingIds.length; r++) {
          if (String(existingIds[r][0]).trim() === String(item.id).trim()) {
            var existingUrl = String(sheet.getRange(r + 2, 12).getValue() || "");
            return ContentService.createTextOutput(JSON.stringify({ 
              status: "success", 
              message: "รายการนี้มีอยู่ในตารางแล้ว ข้ามการบันทึกซ้ำซ้อน",
              fileUrl: existingUrl,
              id: item.id
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      // 1. ตรวจสอบและอัปโหลดไฟล์ไปยัง Google Drive โฟลเดอร์ที่กำหนด
      if (item.fileData && item.fileName && item.fileName !== 'ไม่มีไฟล์แนบ') {
        try {
          var folder;
          try {
            folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
          } catch (fErr) {
            folder = DriveApp.getRootFolder();
          }

          var rawData = item.fileData;
          var contentType = item.fileType || "application/octet-stream";
          
          if (typeof rawData === "string" && rawData.indexOf(";base64,") > -1) {
            var parts = rawData.split(";base64,");
            if (parts[0].indexOf("data:") === 0) {
              contentType = parts[0].replace("data:", "");
            }
            rawData = parts[1];
          }

          // ล้างช่องว่างและการขึ้นบรรทัดใหม่โดยใช้รหัส ASCII เพื่อป้องกัน SyntaxError จาก newline escaping
          if (typeof rawData === "string") {
            var nl = String.fromCharCode(10);
            var cr = String.fromCharCode(13);
            var sp = String.fromCharCode(32);
            rawData = rawData.split(sp).join("").split(nl).join("").split(cr).join("");
          }

          var safeTeacher = String(item.modelTeacher || "ครู").split(" ").join("_");
          var safeFile = String(item.fileName || "file").split(" ").join("_");
          var safeCycle = String(item.cycle || "วงรอบที่ 1").split(" ").join("_");
          var safeFileName = item.id + "_" + safeCycle + "_" + safeTeacher + "_" + safeFile;
          var blob;

          try {
            var decoded = Utilities.base64Decode(rawData);
            blob = Utilities.newBlob(decoded, contentType, safeFileName);
          } catch (decodeErr) {
            // หากถอดรหัส Base64 ไม่ได้ ให้บันทึกเป็นข้อความโดยตรง
            blob = Utilities.newBlob(rawData, "text/plain;charset=utf-8", safeFileName);
          }

          var uploadedFile = folder.createFile(blob);
          
          // อนุญาตให้เข้าดูผ่านลิงก์ได้
          try {
            uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch(sharingErr) {}

          fileUrl = uploadedFile.getUrl();
        } catch (driveErr) {
          uploadError = driveErr.toString();
          // บันทึกข้อความข้อผิดพลาดลงในชีตเพื่อให้ตรวจสอบได้ชัดเจน
          fileUrl = "เกิดข้อผิดพลาด Drive: " + uploadError;
        }
      }

      // 2. บันทึกข้อมูลลง Google Sheet รวมถึงลิงก์ไฟล์ Google Drive ในคอลัมน์ที่ 12
      sheet.appendRow([
        item.id,
        item.cycle || "วงรอบที่ 1",
        item.modelTeacher,
        item.groupName,
        item.lsTopic,
        item.subjectGroup,
        item.submittedAt,
        item.status || "รอตรวจ",
        item.adminFeedback || "",
        item.reviewedAt || "",
        item.fileName || "",
        fileUrl,
        item.notes || ""
      ]);

      return ContentService.createTextOutput(JSON.stringify({ 
        status: uploadError ? "warning" : "success", 
        message: uploadError ? ("Sheet saved, Drive upload error: " + uploadError) : "Saved to Google Sheet & Google Drive successfully",
        fileUrl: fileUrl,
        id: item.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'batch_update' || action === 'update_all' || action === 'update_reviews') {
      var allData = payload.data;
      var lastRow = sheet.getLastRow();
      
      if (lastRow > 1) {
        var existingRange = sheet.getRange(2, 1, lastRow - 1, 13);
        var existingValues = existingRange.getValues();
        var idToRowIndex = {};
        for (var r = 0; r < existingValues.length; r++) {
          var rowId = String(existingValues[r][0]).trim();
          if (rowId) {
            idToRowIndex[rowId] = r;
          }
        }

        allData.forEach(function(item) {
          var rIdx = idToRowIndex[String(item.id).trim()];
          if (rIdx !== undefined) {
            existingValues[rIdx][7] = item.status || 'รอตรวจ';
            existingValues[rIdx][8] = item.adminFeedback || '';
            existingValues[rIdx][9] = item.reviewedAt || '';
          }
        });

        existingRange.setValues(existingValues);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "บันทึกผลการตรวจลง Google Sheet เรียบร้อยแล้ว" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update_status' || action === 'review_submission') {
      var updateItem = payload.data;
      var lastRow = sheet.getLastRow();
      var found = false;
      if (lastRow > 1) {
        var existingRange = sheet.getRange(2, 1, lastRow - 1, 13);
        var existingValues = existingRange.getValues();
        for (var k = 0; k < existingValues.length; k++) {
          if (String(existingValues[k][0]).trim() === String(updateItem.id).trim()) {
            existingValues[k][7] = updateItem.status || 'รอตรวจ';
            existingValues[k][8] = updateItem.adminFeedback || '';
            existingValues[k][9] = updateItem.reviewedAt || '';
            found = true;
            break;
          }
        }
        if (found) {
          existingRange.setValues(existingValues);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        status: found ? "success" : "not_found", 
        message: found ? "บันทึกสถานะเรียบร้อย" : "ไม่พบรหัสงานนี้ใน Google Sheet" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'delete' || action === 'delete_submission') {
      var deleteId = String(payload.id || (payload.data && payload.data.id) || '').trim();
      var lastRow = sheet.getLastRow();
      var deleted = false;
      if (lastRow > 1 && deleteId) {
        var existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var d = 0; d < existingIds.length; d++) {
          if (String(existingIds[d][0]).trim() === deleteId) {
            sheet.deleteRow(d + 2);
            deleted = true;
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        status: deleted ? "success" : "not_found", 
        message: deleted ? "ลบรายการออกจาก Google Sheet เรียบร้อยแล้ว" : "ไม่พบรหัสงานนี้ใน Google Sheet" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;
}

/**
 * Delete a submission from Google Sheet.
 * 1. Mark id as deleted in persistent storage so it will never reappear locally or across tabs.
 * 2. Try action: 'delete' (physical row deletion via Apps Script).
 * 3. If Apps Script returns 'invalid_action' or fails, fallback to action: 'update_status'
 *    with status: 'ลบแล้ว' which immediately updates column 8 in Google Sheet.
 */
export async function deleteSubmissionFromGoogleSheet(
  id: string,
  customUrl?: string
): Promise<{ success: boolean; message?: string }> {
  const cleanId = String(id || '').trim();
  if (!cleanId) return { success: false, message: 'ไม่พบรหัสงาน' };

  // 1. บันทึกลง local set ทันทีว่ารายการนี้ถูกลบแล้ว จะไม่มีวันดีดกลับมาแสดงผลอีก
  markIdAsDeleted(cleanId);

  const url = customUrl || getWebhookUrl();
  if (!url) return { success: true, message: 'ลบข้อมูลในระบบเรียบร้อย' };

  try {
    // 2. ลองส่งคำสั่ง delete ไปยัง Apps Script
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'delete',
        id: cleanId,
        data: { id: cleanId },
      }),
    });

    if (res.ok) {
      try {
        const json = await res.json();
        if (json.status === 'success') {
          return { success: true, message: json.message || 'ลบรายการออกจาก Google Sheet เรียบร้อยแล้ว' };
        } else if (json.status === 'invalid_action') {
          // หาก Apps Script ของผู้ใช้เป็นเวอร์ชันเดิมที่ยังไม่มี delete ให้ปรับสถานะในชีตเป็น 'ลบแล้ว' ผ่าน update_status
          console.warn(`Apps Script does not support 'delete' action yet, updating status to 'ลบแล้ว' for ${cleanId}`);
          return await updateSubmissionStatusInGoogleSheet(
            {
              id: cleanId,
              status: 'ลบแล้ว',
              adminFeedback: '[ลบรายการออกจากระบบแล้ว]',
              reviewedAt: new Date().toLocaleString('th-TH'),
            },
            url
          );
        }
      } catch {
        return { success: true, message: 'ส่งคำขอลบรายการเรียบร้อย' };
      }
    }

    // Fallback: หากคำสั่ง delete ส่งไม่สำเร็จ ให้บันทึกสถานะเป็น 'ลบแล้ว' ผ่าน update_status
    return await updateSubmissionStatusInGoogleSheet(
      {
        id: cleanId,
        status: 'ลบแล้ว',
        adminFeedback: '[ลบรายการออกจากระบบแล้ว]',
        reviewedAt: new Date().toLocaleString('th-TH'),
      },
      url
    );
  } catch (err: any) {
    console.warn('deleteSubmissionFromGoogleSheet error, falling back to update_status:', err);
    return await updateSubmissionStatusInGoogleSheet(
      {
        id: cleanId,
        status: 'ลบแล้ว',
        adminFeedback: '[ลบรายการออกจากระบบแล้ว]',
        reviewedAt: new Date().toLocaleString('th-TH'),
      },
      url
    );
  }
}

async function trySendToWebhook(submission: PLCSubmission): Promise<void> {
  await sendSubmissionToGoogleSheet(submission);
}

/**
 * Export data to UTF-8 CSV with BOM for direct opening in Excel & Google Sheets
 */
export function exportToCSV(submissions: PLCSubmission[]): void {
  const headers = [
    'รหัสส่งงาน',
    'วงรอบที่',
    'ชื่อ-นามสกุล ผู้ส่งงาน (Model Teacher)',
    'ชื่อกลุ่ม',
    'หัวข้อ LS (ประเด็นท้าทาย)',
    'กลุ่มสาระการเรียนรู้',
    'วันที่ส่งงาน',
    'สถานะ',
    'ข้อเสนอแนะจากผู้ตรวจ',
    'วันที่ตรวจ',
    'ชื่อไฟล์แนบ',
    'ลิงก์ไฟล์ Google Drive',
    'หมายเหตุ',
  ];

  const escapeCSV = (value: string | number | undefined) => {
    if (value === undefined || value === null) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const rows = submissions.map((s) => [
    escapeCSV(s.id),
    escapeCSV(s.cycle || 'วงรอบที่ 1'),
    escapeCSV(s.modelTeacher),
    escapeCSV(s.groupName),
    escapeCSV(s.lsTopic),
    escapeCSV(s.subjectGroup),
    escapeCSV(s.submittedAt),
    escapeCSV(s.status),
    escapeCSV(s.adminFeedback || '-'),
    escapeCSV(s.reviewedAt || '-'),
    escapeCSV(s.fileName || '-'),
    escapeCSV(s.fileUrl || GOOGLE_DRIVE_FOLDER_URL),
    escapeCSV(s.notes || '-'),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `บันทึกกิจกรรม_PLC_โรงเรียนบ้านค่าย_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format submissions as TSV (Tab Separated Values) for direct paste into Google Sheet cells
 */
export async function copyForGoogleSheet(submissions: PLCSubmission[]): Promise<boolean> {
  const headers = [
    'รหัสส่งงาน',
    'วงรอบที่',
    'ชื่อ-นามสกุล ผู้ส่งงาน',
    'ชื่อกลุ่ม',
    'หัวข้อ LS (ประเด็นท้าทาย)',
    'กลุ่มสาระการเรียนรู้',
    'วันที่ส่งงาน',
    'สถานะ',
    'ข้อเสนอแนะจากผู้ตรวจ',
    'วันที่ตรวจ',
    'ชื่อไฟล์แนบ',
    'ลิงก์ไฟล์ Google Drive',
    'หมายเหตุ',
  ];

  const rows = submissions.map((s) => [
    s.id,
    s.cycle || 'วงรอบที่ 1',
    s.modelTeacher,
    s.groupName,
    s.lsTopic.replace(/[\t\r\n]/g, ' '),
    s.subjectGroup,
    s.submittedAt,
    s.status,
    (s.adminFeedback || '-').replace(/[\t\r\n]/g, ' '),
    s.reviewedAt || '-',
    s.fileName || '-',
    (s.fileUrl || GOOGLE_DRIVE_FOLDER_URL).replace(/[\t\r\n]/g, ' '),
    (s.notes || '-').replace(/[\t\r\n]/g, ' '),
  ]);

  const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
