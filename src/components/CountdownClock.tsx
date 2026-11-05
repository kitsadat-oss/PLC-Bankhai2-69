import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

// Deadline: 31 มีนาคม 2570 เวลา 23:59 น. (2570 BE = 2027 CE)
const DEADLINE = new Date(2027, 2, 31, 23, 59, 59).getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalHours: number;
}

export const CountdownClock: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalHours: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = DEADLINE - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalHours: 0,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const totalHours = Math.floor(diff / (1000 * 60 * 60));

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalHours,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeBlocks = [
    { label: 'วัน', value: timeLeft.days, color: 'from-sky-500 to-blue-600' },
    { label: 'ชั่วโมง', value: timeLeft.hours, color: 'from-blue-500 to-indigo-600' },
    { label: 'นาที', value: timeLeft.minutes, color: 'from-indigo-500 to-violet-600' },
    { label: 'วินาที', value: timeLeft.seconds, color: 'from-teal-500 to-emerald-600' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-sky-900/5 border border-sky-100 relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-sky-900/10">
      {/* Decorative background glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-br from-sky-200/50 to-blue-300/30 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>นับถอยหลังส่งรายงาน PLC</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            <span>กำหนดส่งรายงาน</span>
          </h3>
          <p className="text-slate-600 text-sm mt-0.5">
            <span className="font-semibold text-sky-700">31 มีนาคม 2570</span> เวลา{' '}
            <span className="font-semibold text-rose-600">23.59 น.</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl text-xs font-medium border border-sky-200 shrink-0">
          <Clock className="w-4 h-4 text-sky-600 animate-spin-slow" />
          <span>Real-time</span>
        </div>
      </div>

      {/* Digital Countdown Timer Blocks */}
      {timeLeft.isExpired ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 font-semibold">
          สิ้นสุดระยะเวลาการส่งงานแล้ว
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10">
          {timeBlocks.map((block) => (
            <div
              key={block.label}
              className="group flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-b from-sky-50/70 to-slate-50 border border-sky-100 shadow-xs hover:border-sky-300 transition-all hover:scale-105"
            >
              <div
                className={`text-2xl sm:text-3xl font-extrabold bg-gradient-to-r ${block.color} bg-clip-text text-transparent font-mono tracking-tight`}
              >
                {String(block.value).padStart(2, '0')}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-slate-500 mt-1">
                {block.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helpful tip box */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>ภาคเรียนที่ 2 ปีการศึกษา 2569</span>
        <span className="text-sky-600 font-medium">โรงเรียนบ้านค่าย จ.ระยอง</span>
      </div>
    </div>
  );
};
