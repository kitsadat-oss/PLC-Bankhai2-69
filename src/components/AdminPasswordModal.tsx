import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Admin password strictly set to plc1221 as requested
    if (password === 'plc1221') {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-sky-100 text-center relative animate-scaleUp">
        {/* Shield Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-800">
          เข้าสู่ระบบตรวจงาน (สำหรับ ADMIN)
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
          กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อเข้าถึงหน้าตรวจงาน
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              placeholder="กรอกรหัสผ่าน Admin"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              className="w-full pl-11 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none transition text-sm text-slate-800 font-mono tracking-widest"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/25 hover:from-sky-600 hover:to-blue-700 transition"
            >
              ยืนยันรหัสผ่าน
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>ระบบรักษาความปลอดภัยงานวิชาการ โรงเรียนบ้านค่าย</span>
        </div>
      </div>
    </div>
  );
};
