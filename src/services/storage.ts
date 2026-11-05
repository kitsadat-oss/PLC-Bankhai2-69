import { PLCSubmission, SubmissionStatus } from '../types/plc';
import { INITIAL_SUBMISSIONS } from '../data/initialData';

const STORAGE_KEY = 'bankhai_plc_submissions_v2569_final';
const WEBHOOK_URL_KEY = 'bankhai_plc_webhook';

export function getSubmissions(): PLCSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    return parsed;
  } catch (error) {
    console.error('Error reading submissions from localStorage:', error);
    return INITIAL_SUBMISSIONS;
  }
}

export function saveSubmissions(list: PLCSubmission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Error saving submissions to localStorage:', error);
  }
}

export function addSubmission(newSub: Omit<PLCSubmission, 'id' | 'status'> & { status?: SubmissionStatus }): PLCSubmission {
  const current = getSubmissions();
  const nextNumber = current.length + 1;
  const id = `PLC-2569-${String(nextNumber).padStart(3, '0')}`;

  const submission: PLCSubmission = {
    ...newSub,
    id,
    status: newSub.status || 'รอตรวจ',
  };

  const updated = [submission, ...current];
  saveSubmissions(updated);

  // Trigger optional webhook if configured
  trySendToWebhook(submission);

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
  saveSubmissions(INITIAL_SUBMISSIONS);
  return INITIAL_SUBMISSIONS;
}

// Optional Google Apps Script Webhook
export function getWebhookUrl(): string {
  return localStorage.getItem(WEBHOOK_URL_KEY) || '';
}

export function setWebhookUrl(url: string): void {
  localStorage.setItem(WEBHOOK_URL_KEY, url.trim());
}

async function trySendToWebhook(submission: PLCSubmission): Promise<void> {
  const webhook = getWebhookUrl();
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });
  } catch (err) {
    console.warn('Webhook dispatch skipped or failed:', err);
  }
}

/**
 * Export data to UTF-8 CSV with BOM for direct opening in Excel & Google Sheets
 */
export function exportToCSV(submissions: PLCSubmission[]): void {
  const headers = [
    'รหัสส่งงาน',
    'ชื่อ-นามสกุล ผู้ส่งงาน (Model Teacher)',
    'ชื่อกลุ่ม',
    'หัวข้อ LS (ประเด็นท้าทาย)',
    'กลุ่มสาระการเรียนรู้',
    'วันที่ส่งงาน',
    'สถานะ',
    'ข้อเสนอแนะจากผู้ตรวจ',
    'วันที่ตรวจ',
    'ชื่อไฟล์แนบ',
    'หมายเหตุ',
  ];

  const escapeCSV = (value: string | number | undefined) => {
    if (value === undefined || value === null) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const rows = submissions.map((s) => [
    escapeCSV(s.id),
    escapeCSV(s.modelTeacher),
    escapeCSV(s.groupName),
    escapeCSV(s.lsTopic),
    escapeCSV(s.subjectGroup),
    escapeCSV(s.submittedAt),
    escapeCSV(s.status),
    escapeCSV(s.adminFeedback || '-'),
    escapeCSV(s.reviewedAt || '-'),
    escapeCSV(s.fileName || '-'),
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
