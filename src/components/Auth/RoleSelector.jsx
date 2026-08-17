import React from 'react';
import { User, Trophy, Check } from 'lucide-react';

export default function RoleSelector({ selectedRole, onSelectRole }) {
  const roles = [
    {
      id: 'user',
      title: 'Local User / Athlete',
      subtitle: 'Players, Team Captains & Fans',
      icon: User,
      badge: 'Popular',
      features: [
        'Personalized Tournament Feed',
        'Create & Manage Teams & Roster',
        'Real-time Live Scores & Notifications',
        'Discover Nearby Sports Events'
      ]
    },
    {
      id: 'organizer',
      title: 'Tournament Organizer',
      subtitle: 'Sports Clubs & Event Hosts',
      icon: Trophy,
      badge: 'Paid Hosting',
      features: [
        'Tournament Poster Upload & Promotions',
        'Automated Bracket & Fixtures',
        'Razorpay Payment Integration',
        'Live Score Update Controller'
      ]
    }
  ];

  return (
    <div className="space-y-2.5 my-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
        Select Account Role <span className="text-[#8B0000]">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;

          return (
            <div
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className={`relative cursor-pointer rounded-xl p-3.5 border flex flex-col justify-between transition-all duration-200 ${
                isSelected
                  ? 'bg-[#FFFFFF] border-[#8B0000] shadow-lg shadow-[#8B0000]/15'
                  : 'bg-[#FFFFFF]/80 border-[#E5E7EB] hover:border-[#FFABBA] hover:bg-[#FFFFFF]'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[#8B0000] text-white shadow-md' : 'bg-[#FFFFFF] text-[#5C4549]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {r.badge && (
                    <span className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#8B0000]/10 text-[#8B0000] border border-[#8B0000]/30">
                      {r.badge}
                    </span>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div className="mb-2">
                  <h4 className="text-xs font-extrabold text-[#2C1418] leading-tight">
                    {r.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{r.subtitle}</p>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-1 pt-2 border-t border-[#E5E7EB]/80 mt-1">
                {r.features.map((feat, idx) => (
                  <li key={idx} className="text-[10px] text-[#5C4549] flex items-start space-x-1 leading-tight">
                    <Check className={`w-3 h-3 shrink-0 mt-0.5 ${isSelected ? 'text-[#8B0000]' : 'text-slate-500'}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
