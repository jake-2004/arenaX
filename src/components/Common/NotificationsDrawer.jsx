import React from 'react';
import { Bell, X, Sparkles, Activity, ShieldCheck, Check } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';

export default function NotificationsDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#FFFFFF] border-l border-[#E5E7EB] shadow-2xl p-4 flex flex-col justify-between animate-in slide-in-from-right duration-200">
      <div>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#8B0000]" />
            <h3 className="text-sm font-bold text-[#1F2937]">Notifications</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-[#8B0000]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {MOCK_NOTIFICATIONS.map((n) => (
            <div 
              key={n.id} 
              className={`p-3 rounded-xl border transition-all ${
                n.unread ? 'bg-[#FFFFFF] border-[#8B0000]/40' : 'bg-[#FFFFFF] border-[#E5E7EB] opacity-75'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-[#2C1418] flex items-center space-x-1.5">
                  {n.type === 'match' && <Activity className="w-3.5 h-3.5 text-[#8B0000]" />}
                  {n.type === 'ai' && <Sparkles className="w-3.5 h-3.5 text-[#8B0000]" />}
                  {n.type === 'system' && <ShieldCheck className="w-3.5 h-3.5 text-[#8B0000]" />}
                  <span>{n.title}</span>
                </h4>
                <span className="text-[10px] text-slate-500">{n.time}</span>
              </div>
              <p className="text-xs text-[#5C4549] mt-1 leading-snug">{n.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-[#E5E7EB] text-center">
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-[#8B0000] transition-colors">
          Close Notifications
        </button>
      </div>
    </div>
  );
}
