import { ClipboardList, Dna, Target, TrendingUp, MessageCircle, Settings, Info, ChevronRight, LogOut, User } from 'lucide-react';
import type { Screen } from '../../types';

interface MoreMenuProps {
  userEmail: string;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  screen: Screen;
  color: string;
  bgColor: string;
}

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Nutrition & Tracking',
    items: [
      {
        icon: <ClipboardList className="w-5 h-5" />,
        label: 'Food Log History',
        subtitle: 'View all past meal logs',
        screen: 'history',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        icon: <Target className="w-5 h-5" />,
        label: 'My Goals',
        subtitle: 'Calorie, macro & water targets',
        screen: 'my-goals',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        label: 'Progress',
        subtitle: 'Trends and insights over time',
        screen: 'progress',
        color: 'text-nm-signature',
        bgColor: 'bg-nm-bg',
      },
    ],
  },
  {
    title: 'Personalization',
    items: [
      {
        icon: <Dna className="w-5 h-5" />,
        label: 'Food DNA Hub',
        subtitle: 'Taste profile, diets & allergies',
        screen: 'food-dna',
        color: 'text-nm-signature',
        bgColor: 'bg-nm-bg',
      },
      {
        icon: <MessageCircle className="w-5 h-5" />,
        label: 'AI Concierge',
        subtitle: 'Restaurant recommendations',
        screen: 'chat',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      },
    ],
  },
  {
    title: 'App',
    items: [
      {
        icon: <Settings className="w-5 h-5" />,
        label: 'Settings',
        subtitle: 'Account & preferences',
        screen: 'settings',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      },
      {
        icon: <Info className="w-5 h-5" />,
        label: 'About',
        subtitle: 'Version, terms & privacy',
        screen: 'about',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
      },
    ],
  },
];

export function MoreMenu({ userEmail, onNavigate, onLogout }: MoreMenuProps) {
  const initials = userEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-nm-signature to-nm-signature rounded-full flex items-center justify-center shadow-md shadow-nm-bg0/20">
            <span className="text-lg font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{userEmail.split('@')[0]}</h1>
            <p className="text-sm text-gray-500 truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => onNavigate('food-dna')}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <User className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              {section.title}
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.screen)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${
                    i > 0 ? 'border-t border-gray-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bgColor} ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-2 pb-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-colors group"
          >
            <LogOut className="w-4.5 h-4.5 text-red-500" />
            <span className="text-sm font-semibold text-red-500">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
