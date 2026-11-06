import { PLCSubmission, SubmissionStatus } from '../types/plc';
import { INITIAL_SUBMISSIONS } from '../data/initialData';

const STORAGE_KEY = 'bankhai_plc_submissions_v2569_prod';
const WEBHOOK_URL_KEY = 'bankhai_plc_webhook';

export const GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1qa0uli9Y0NawX76PYTwlE3W-pwNdffXCRRu_ZzrX-6U/edit?gid=0#gid=0';

export const GOOGLE_DRIVE_FOLDER_ID = '1X9O0ELOl-aBuc7n6L9AJJj3jxcoEGMUs';

export const GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1X9O0ELOl-aBuc7n6L9AJJj3jxcoEGMUs?usp=drive_link';

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

    // กรองข้อมูลตัวอย่างเดิมออกหากยังมีตกค้าง
    const filtered = parsed.filter(
      (item) => item.modelTeacher !== 'ครูสมชาย มีสุข' && item.modelTeacher !== 'ครูณิชารัตน์ เจริญพร'
    );
    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
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

export function addSubmission(newSub: Omit<PLCSubmission, 'id' | 'status'> & { status?: SubmissionStatus }): PLCSubmission {
  const current = getSubmissions();
  
  // คำนวณเลขรหัสส่งงานอัตโนมัติจากเลขสูงสุดที่มีอยู่
  let maxNum = 0;
  current.forEach((item) => {
    const match = item.id.match(/PLC-2569-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextNumber = maxNum + 1;
  const id = `PLC-2569-${String(nextNumber).padStart(3, '0')}`;

  const submission: PLCSubmission = {
    ...newSub,
    id,
    status: newSub.status || 'รอตรวจ',
  };

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
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  const url = customUrl || getWebhookUrl();
  if (!url) {
    return {
      success: false,
      error: 'ยังไม่ได้ระบุ Web App URL ของ Google Apps Script ข้อมูลจึงยังไม่ได้ส่งเข้า Google Drive & Sheet',
    };
  }

  // ป้องกันการส่งคำขอซ้ำซ้อนสำหรับ submission id เดียวกัน
  if (activeSyncIds.has(submission.id)) {
    console.log(`Skipping duplicate sync request for ${submission.id}`);
    return { success: true, fileUrl: submission.fileUrl };
  }
  activeSyncIds.add(submission.id);

  // ปลดล็อกหลังจาก 15 วินาที
  setTimeout(() => {
    activeSyncIds.delete(submission.id);
  }, 15000);

  const payload = {
    action: 'create',
    data: {
      ...submission,
      driveFolderId: GOOGLE_DRIVE_FOLDER_ID,
    },
  };

  try {
    // ส่งเพียง 1 Request ผ่าน no-cors โดยตรง เพื่อป้องกันการส่งซ้ำสองรอบจาก CORS redirect
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, fileUrl: GOOGLE_DRIVE_FOLDER_URL };
  } catch (err: any) {
    activeSyncIds.delete(submission.id);
    console.warn('Google Sheet send failed:', err);
    return { success: false, error: err?.message || 'ส่งข้อมูลไม่สำเร็จ' };
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
 * Batch sync all submissions to Google Sheet
 */
export async function syncAllToGoogleSheet(
  submissions: PLCSubmission[],
  customUrl?: string
): Promise<boolean> {
  const url = customUrl || getWebhookUrl();
  if (!url) return false;
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'batch_update',
        data: submissions,
      }),
    });
    return true;
  } catch (err) {
    console.error('Google Sheet batch sync failed:', err);
    return false;
  }
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
      return json.data as PLCSubmission[];
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

    if (action === 'batch_update' || action === 'update_all') {
      var allData = payload.data;
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).clearContent();
      }
      var rowsToAppend = allData.map(function(item) {
        return [
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
          item.fileUrl || "",
          item.notes || ""
        ];
      });
      if (rowsToAppend.length > 0) {
        sheet.getRange(2, 1, rowsToAppend.length, 13).setValues(rowsToAppend);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Batch updated successfully" }))
        .setMimeType(ContentService.MimeType.JSON);
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
