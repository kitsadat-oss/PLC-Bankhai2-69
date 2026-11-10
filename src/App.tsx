/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { HomeTab } from './components/HomeTab';
import { SubmitTab } from './components/SubmitTab';
import { StatusTab } from './components/StatusTab';
import { AdminTab } from './components/AdminTab';
import { DashboardTab } from './components/DashboardTab';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { PLCSubmission } from './types/plc';
import {
  getSubmissions,
  saveSubmissions,
  fetchFromGoogleSheet,
  mergeRemoteWithLocal,
} from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [submissions, setSubmissions] = useState<PLCSubmission[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // ดึงข้อมูลอัตโนมัติจาก Google Sheet (Live Cloud Sync) โดยยึดสถานะการตรวจจาก Google Sheet เสมอ
  const syncWithGoogleSheet = async (showLoading = true) => {
    if (showLoading) setIsSyncing(true);
    try {
      const remoteData = await fetchFromGoogleSheet();
      if (remoteData && Array.isArray(remoteData)) {
        const currentLocal = getSubmissions();
        const { merged } = mergeRemoteWithLocal(remoteData, currentLocal);

        saveSubmissions(merged);
        setSubmissions(merged);

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
        setLastSyncTime(timeStr);
      }
    } catch (err) {
      console.warn('Auto-sync with Google Sheet failed:', err);
    } finally {
      if (showLoading) setIsSyncing(false);
    }
  };

  // โหลดข้อมูลแคชทันที และดึงข้อมูลสดจาก Google Sheet อัตโนมัติตั้งแต่เปิดเว็บ พร้อมตั้งเวลาซิงค์ทุก ๆ 5 นาที
  useEffect(() => {
    setSubmissions(getSubmissions());
    syncWithGoogleSheet(true);

    // Auto ซิงค์ข้อมูลในระบบและ Google Sheet ทุก ๆ 5 นาที (300,000 มิลลิวินาที) เพื่อให้ข้อมูลตรงกันระหว่าง User
    const intervalId = setInterval(() => {
      syncWithGoogleSheet(false);
    }, 5 * 60 * 1000);

    // ตรวจสอบซิงค์ข้อมูลสดทันทีเมื่อสลับกลับมาที่หน้าแท็บเบราว์เซอร์
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithGoogleSheet(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const refreshSubmissions = (overrideData?: PLCSubmission[]) => {
    if (overrideData && Array.isArray(overrideData)) {
      saveSubmissions(overrideData);
      setSubmissions(overrideData);
    } else {
      setSubmissions(getSubmissions());
      syncWithGoogleSheet(false);
    }
  };

  const pendingCount = submissions.filter(
    (s) =>
      s.status === 'รอตรวจ' &&
      !s.status.includes('ลบ') &&
      !s.status.includes('ยกเลิก') &&
      !s.adminFeedback?.includes('ลบรายการ')
  ).length;

  const handleSelectTab = (tab: TabKey) => {
    if (tab === 'admin') {
      if (!isAdminAuthenticated) {
        setShowPasswordModal(true);
        return;
      }
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ดึงข้อมูลจาก Google Sheet อัตโนมัติเมื่อเข้าสู่หน้าตรวจงาน, ตรวจสอบสถานะ หรือ สรุปผล
    if (tab === 'admin' || tab === 'status' || tab === 'dashboard') {
      syncWithGoogleSheet(false);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowPasswordModal(false);
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    syncWithGoogleSheet(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-blue-50/80 text-slate-800 flex flex-col font-['Prompt',sans-serif] selection:bg-sky-500 selection:text-white">
      {/* Top Navigation with Live Sync Status */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingCount={pendingCount}
        isAdminAuthenticated={isAdminAuthenticated}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onRefresh={() => syncWithGoogleSheet(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'home' && (
          <HomeTab onNavigate={handleSelectTab} submissions={submissions} />
        )}

        {activeTab === 'submit' && (
          <SubmitTab
            onSuccess={refreshSubmissions}
            onNavigate={handleSelectTab}
          />
        )}

        {activeTab === 'status' && (
          <StatusTab
            submissions={submissions}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onRefresh={() => syncWithGoogleSheet(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            submissions={submissions}
            onUpdate={refreshSubmissions}
            onLogout={handleAdminLogout}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onRefresh={() => syncWithGoogleSheet(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab submissions={submissions} />
        )}
      </main>

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => setShowPasswordModal(false)}
      />

      {/* Footer with pastel touches */}
      <footer className="mt-auto border-t border-sky-100 bg-white/80 backdrop-blur-xs py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <img
              src="/assets/aistudio/Logo_ed04c8f2.png"
              alt="ตราสัญลักษณ์โรงเรียนบ้านค่าย"
              className="w-10 h-11 object-contain filter drop-shadow-xs"
            />
            <div>
              <p className="font-bold text-slate-700">
                โรงเรียนบ้านค่าย (Bankhai School)
              </p>
              <p className="text-[11px] text-slate-400">
                บันทึกกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) • ภาคเรียนที่ 2 ปีการศึกษา 2569
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>เชื่อมต่อ Google Sheet • Auto-sync ทุก 5 นาที</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
