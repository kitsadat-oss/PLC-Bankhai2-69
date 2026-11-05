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
  resetToSampleData,
} from './services/storage';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [submissions, setSubmissions] = useState<PLCSubmission[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);

  // Load submissions from storage on mount
  useEffect(() => {
    setSubmissions(getSubmissions());
  }, []);

  const refreshSubmissions = () => {
    setSubmissions(getSubmissions());
  };

  const pendingCount = submissions.filter((s) => s.status === 'รอตรวจ').length;

  const handleSelectTab = (tab: TabKey) => {
    if (tab === 'admin') {
      if (!isAdminAuthenticated) {
        setShowPasswordModal(true);
        return;
      }
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowPasswordModal(false);
    setActiveTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveTab('home');
  };

  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      const reset = resetToSampleData();
      setSubmissions(reset);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-blue-50/80 text-slate-800 flex flex-col font-['Prompt',sans-serif] selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingCount={pendingCount}
        isAdminAuthenticated={isAdminAuthenticated}
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
          <StatusTab submissions={submissions} />
        )}

        {activeTab === 'admin' && (
          <AdminTab
            submissions={submissions}
            onUpdate={refreshSubmissions}
            onLogout={handleAdminLogout}
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

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition"
              title="รีเซ็ตข้อมูลตัวอย่างเริ่มต้น"
            >
              <RefreshCw className="w-3 h-3" />
              <span>รีเซ็ตข้อมูลตัวอย่าง</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
