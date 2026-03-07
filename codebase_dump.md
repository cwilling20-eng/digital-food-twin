# Codebase Dump

Generated on: Thu Jan 29 06:55:59 UTC 2026

### File: src/App.tsx

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { OnboardingScreen } from './components/OnboardingScreen';
import { SwipeDeck } from './components/SwipeDeck';
import { Dashboard } from './components/Dashboard';
import { MenuScanner } from './components/MenuScanner';
import { ChatResults } from './components/ChatResults';
import { HistoryScreen } from './components/HistoryScreen';
import { BottomNav } from './components/BottomNav';
import { LOCAL_FOODS } from './data/foods';
import type { FoodItem, Screen, ComprehensiveUserProfile } from './types';

const STORAGE_KEY = 'digital_food_twin_profile';
const COMPREHENSIVE_PROFILE_KEY = 'digital_food_twin_comprehensive_profile';
const DEVICE_ID_KEY = 'digital_food_twin_device_id';

interface StoredProfile {
  onboardingComplete: boolean;
  savoryPreference: number;
  spicyPreference: number;
  freshPreference: number;
  swipedFoods: string[];
}

function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [foods, setFoods] = useState<FoodItem[]>(LOCAL_FOODS);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState<'goal' | 'enjoyment'>('goal');
  const [deviceId, setDeviceId] = useState<string>('');
  const [profile, setProfile] = useState<StoredProfile>({
    onboardingComplete: false,
    savoryPreference: 50,
    spicyPreference: 50,
    freshPreference: 50,
    swipedFoods: []
  });
  const [likedFoods, setLikedFoods] = useState<FoodItem[]>([]);
  const [apiRecommendations, setApiRecommendations] = useState<any>(null);
  const [comprehensiveProfile, setComprehensiveProfile] = useState<ComprehensiveUserProfile>({
    coreProfile: {
      diets: [],
      allergies: [],
      goals: []
    },
    tasteProfile: {
      spicyTolerance: 5,
      texturePreferences: [],
      sweetVsSavory: 5
    },
    dislikes: []
  });

  useEffect(() => {
    const initializeApp = async () => {
      let currentDeviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (!currentDeviceId) {
        currentDeviceId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, currentDeviceId);
      }
      setDeviceId(currentDeviceId);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('device_id', currentDeviceId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        const loadedProfile: StoredProfile = {
          onboardingComplete: data.onboarding_complete,
          savoryPreference: data.savory_preference,
          spicyPreference: data.spicy_preference,
          freshPreference: data.fresh_preference,
          swipedFoods: data.swiped_foods || []
        };
        setProfile(loadedProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedProfile));

        if (data.core_profile || data.taste_profile || data.dislikes) {
          const loadedComprehensive: ComprehensiveUserProfile = {
            coreProfile: data.core_profile || { diets: [], allergies: [], goals: [] },
            tasteProfile: data.taste_profile || { spicyTolerance: 5, texturePreferences: [], sweetVsSavory: 5 },
            dislikes: data.dislikes || []
          };
          setComprehensiveProfile(loadedComprehensive);
          localStorage.setItem(COMPREHENSIVE_PROFILE_KEY, JSON.stringify(loadedComprehensive));
        }

        if (data.onboarding_complete) {
          setScreen('dashboard');
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredProfile;
          setProfile(parsed);
          if (parsed.onboardingComplete) {
            setScreen('dashboard');
          }
        }

        const storedComprehensive = localStorage.getItem(COMPREHENSIVE_PROFILE_KEY);
        if (storedComprehensive) {
          setComprehensiveProfile(JSON.parse(storedComprehensive));
        }
      }

      setLoading(false);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const fetchFoods = async () => {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('Error fetching foods:', error);
        return;
      }

      if (data && data.length > 0) {
        setFoods([...data, ...LOCAL_FOODS]);
      }
    };

    fetchFoods();
  }, []);

  const saveProfile = useCallback(async (newProfile: StoredProfile) => {
    setProfile(newProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));

    if (deviceId) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          device_id: deviceId,
          onboarding_complete: newProfile.onboardingComplete,
          savory_preference: newProfile.savoryPreference,
          spicy_preference: newProfile.spicyPreference,
          fresh_preference: newProfile.freshPreference,
          swiped_foods: newProfile.swipedFoods,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id'
        });

      if (error) {
        console.error('Error saving profile to Supabase:', error);
      }
    }
  }, [deviceId]);

  const handleStartProfile = () => {
    setScreen('swipe');
  };

  const handleSwipe = (food: FoodItem, liked: boolean) => {
    if (liked) {
      setLikedFoods(prev => [...prev, food]);
    }

    const newSwipedFoods = [...profile.swipedFoods, food.id];
    saveProfile({
      ...profile,
      swipedFoods: newSwipedFoods
    });
  };

  const handleSwipeComplete = () => {
    const totalLiked = likedFoods.length;
    if (totalLiked === 0) {
      saveProfile({
        ...profile,
        onboardingComplete: true,
        savoryPreference: 50,
        spicyPreference: 50,
        freshPreference: 50
      });
    } else {
      const avgSavory = Math.round(
        likedFoods.reduce((sum, f) => sum + f.savory_score, 0) / totalLiked
      );
      const avgSpicy = Math.round(
        likedFoods.reduce((sum, f) => sum + f.spicy_score, 0) / totalLiked
      );
      const avgFresh = Math.round(
        likedFoods.reduce((sum, f) => sum + f.fresh_score, 0) / totalLiked
      );

      saveProfile({
        ...profile,
        onboardingComplete: true,
        savoryPreference: avgSavory,
        spicyPreference: avgSpicy,
        freshPreference: avgFresh
      });
    }

    setScreen('dashboard');
  };

  const handleScanComplete = (recommendations: any) => {
    setApiRecommendations(recommendations);
    setScreen('recommendations');
  };

  const handleBackToDashboard = () => {
    setScreen('dashboard');
    setApiRecommendations(null);
  };

  const handleReset = async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COMPREHENSIVE_PROFILE_KEY);

    const resetProfile = {
      onboardingComplete: false,
      savoryPreference: 50,
      spicyPreference: 50,
      freshPreference: 50,
      swipedFoods: []
    };

    const resetComprehensive = {
      coreProfile: {
        diets: [],
        allergies: [],
        goals: []
      },
      tasteProfile: {
        spicyTolerance: 5,
        texturePreferences: [],
        sweetVsSavory: 5
      },
      dislikes: []
    };

    setProfile(resetProfile);
    setComprehensiveProfile(resetComprehensive);
    setLikedFoods([]);

    if (deviceId) {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error deleting profile from Supabase:', error);
      }
    }

    setScreen('onboarding');
  };

  const handleBackToOnboarding = () => {
    setScreen('onboarding');
  };

  const handleNavigate = (newScreen: Screen) => {
    setScreen(newScreen);
  };

  const handleSaveComprehensiveProfile = async (newProfile: ComprehensiveUserProfile) => {
    setComprehensiveProfile(newProfile);
    localStorage.setItem(COMPREHENSIVE_PROFILE_KEY, JSON.stringify(newProfile));

    if (deviceId) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          device_id: deviceId,
          core_profile: newProfile.coreProfile,
          taste_profile: newProfile.tasteProfile,
          dislikes: newProfile.dislikes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_id'
        });

      if (error) {
        console.error('Error saving comprehensive profile to Supabase:', error);
      }
    }
  };

  const availableFoods = foods.filter(f => !profile.swipedFoods.includes(f.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {screen === 'onboarding' && (
        <OnboardingScreen onStart={handleStartProfile} />
      )}

      {screen === 'swipe' && (
        <SwipeDeck
          foods={availableFoods}
          onSwipe={handleSwipe}
          onComplete={handleSwipeComplete}
          onBack={handleBackToOnboarding}
        />
      )}

      {screen === 'dashboard' && (
        <Dashboard
          savoryPreference={profile.savoryPreference}
          spicyPreference={profile.spicyPreference}
          freshPreference={profile.freshPreference}
          onScan={() => setScreen('scanner')}
          onReset={handleReset}
          comprehensiveProfile={comprehensiveProfile}
          onSaveProfile={handleSaveComprehensiveProfile}
          foods={availableFoods}
          onSwipe={handleSwipe}
        />
      )}

      {screen === 'scanner' && (
        <MenuScanner
          onScanComplete={handleScanComplete}
          comprehensiveProfile={comprehensiveProfile}
          scanMode={scanMode}
          setScanMode={setScanMode}
          deviceId={deviceId}
        />
      )}

      {screen === 'recommendations' && (
        <ChatResults
          initialAnalysis={apiRecommendations?.output || JSON.stringify(apiRecommendations?.recommendations || apiRecommendations || {}, null, 2)}
          userProfile={comprehensiveProfile}
          deviceId={deviceId}
          onBack={handleBackToDashboard}
        />
      )}

      {screen === 'history' && (
        <HistoryScreen />
      )}

      {screen !== 'recommendations' && (
        <BottomNav currentScreen={screen} onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;

```

### File: src/components/BottomNav.tsx

```typescript
import { Dna, Camera, Clock } from 'lucide-react';
import type { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'scanner', icon: <Camera className="w-6 h-6" />, label: 'Scanner' },
    { screen: 'history', icon: <Clock className="w-6 h-6" />, label: 'History' },
    { screen: 'dashboard', icon: <Dna className="w-6 h-6" />, label: 'Food DNA' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ screen, icon, label }) => {
          const isActive = currentScreen === screen ||
            (screen === 'dashboard' && currentScreen === 'recommendations');

          return (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {icon}
              <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

```

### File: src/components/ChatResults.tsx

```typescript
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, ClipboardList, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import type { ComprehensiveUserProfile } from '../types';

const N8N_WEBHOOK_URL = 'https://exponentmarketing.app.n8n.cloud/webhook/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResultsProps {
  initialAnalysis: string;
  userProfile: ComprehensiveUserProfile;
  deviceId: string;
  onBack: () => void;
}

type Feeling = 'Energized' | 'Satisfied' | 'Bloated' | 'Regret' | 'Hungry';

const FEELINGS: { label: Feeling; emoji: string }[] = [
  { label: 'Energized', emoji: '⚡️' },
  { label: 'Satisfied', emoji: '🙂' },
  { label: 'Bloated', emoji: '🎈' },
  { label: 'Regret', emoji: '🤢' },
  { label: 'Hungry', emoji: '🤤' }
];

export function ChatResults({ initialAnalysis, userProfile, deviceId, onBack }: ChatResultsProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: initialAnalysis,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: messageText,
          sessionId: sessionIdRef.current,
          menuContext: initialAnalysis
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'I received your message but have no response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I lost connection. Please try again or check your network.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveMealLog = async () => {
    if (!mealName.trim() || !selectedFeeling) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('meal_logs')
        .insert({
          device_id: deviceId,
          meal_name: mealName.trim(),
          feeling: selectedFeeling,
          notes: notes.trim() || null
        });

      if (error) {
        console.error('Error saving meal log:', error);
        return;
      }

      setShowLogModal(false);
      setMealName('');
      setSelectedFeeling(null);
      setNotes('');
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving meal log:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900">Food Twin Assistant</h1>
          <p className="text-xs text-gray-500">AI-powered recommendations</p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Log Meal</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-gray-700 prose-ul:my-2 prose-ol:text-gray-700 prose-ol:my-2 prose-li:mb-1">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-emerald-100' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a follow-up question..."
              disabled={isTyping}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isTyping}
            className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors active:scale-95"
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-900">Log Meal Outcome</h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="meal-name" className="block text-sm font-medium text-gray-700 mb-2">
                  What did you choose?
                </label>
                <input
                  id="meal-name"
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Spicy Thai Basil Chicken"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How did you feel?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {FEELINGS.map((feeling) => (
                    <button
                      key={feeling.label}
                      onClick={() => setSelectedFeeling(feeling.label)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        selectedFeeling === feeling.label
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl mb-1">{feeling.emoji}</span>
                      <span className="text-xs text-gray-700 font-medium text-center leading-tight">
                        {feeling.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional thoughts?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm resize-none"
                />
              </div>

              <button
                onClick={handleSaveMealLog}
                disabled={!mealName.trim() || !selectedFeeling || isSaving}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Feedback'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-medium">Feedback saved! I will remember this for next time.</span>
        </div>
      )}
    </div>
  );
}

```

### File: src/components/Dashboard.tsx

```typescript
import { useState } from 'react';
import { Dna, FileText, Sparkles } from 'lucide-react';
import { MyBlueprint } from './MyBlueprint';
import { EnhancedSwipeDeck } from './EnhancedSwipeDeck';
import type { ComprehensiveUserProfile, FoodItem, SwipeTag } from '../types';

interface DashboardProps {
  savoryPreference: number;
  spicyPreference: number;
  freshPreference: number;
  onScan: () => void;
  onReset: () => void;
  comprehensiveProfile: ComprehensiveUserProfile;
  onSaveProfile: (profile: ComprehensiveUserProfile) => void;
  foods: FoodItem[];
  onSwipe: (food: FoodItem, liked: boolean) => void;
}

type Tab = 'blueprint' | 'train';

export function Dashboard({
  comprehensiveProfile,
  onSaveProfile,
  foods,
  onSwipe
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('blueprint');

  const handleSwipeWithTags = (food: FoodItem, liked: boolean, tags: SwipeTag[]) => {
    onSwipe(food, liked);

    if (liked && tags.length > 0) {
      const updatedProfile = { ...comprehensiveProfile };

      tags.forEach(tag => {
        if (tag.category === 'taste') {
          if (tag.value === 'Spicy') {
            updatedProfile.tasteProfile.spicyTolerance = Math.min(10, updatedProfile.tasteProfile.spicyTolerance + 1);
          } else if (tag.value === 'Sweet') {
            updatedProfile.tasteProfile.sweetVsSavory = Math.max(1, updatedProfile.tasteProfile.sweetVsSavory - 1);
          } else if (tag.value === 'Savory') {
            updatedProfile.tasteProfile.sweetVsSavory = Math.min(10, updatedProfile.tasteProfile.sweetVsSavory + 1);
          }
        } else if (tag.category === 'texture') {
          if (!updatedProfile.tasteProfile.texturePreferences.includes(tag.value)) {
            updatedProfile.tasteProfile.texturePreferences.push(tag.value);
          }
        }
      });

      onSaveProfile(updatedProfile);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Dna className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Food DNA Hub</h1>
        </div>
        <p className="text-gray-500">Your comprehensive taste intelligence center</p>
      </div>

      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-200 flex gap-1">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'blueprint'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            My Blueprint
          </button>
          <button
            onClick={() => setActiveTab('train')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'train'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Train My AI
          </button>
        </div>
      </div>

      {activeTab === 'blueprint' ? (
        <div className="px-6 pb-8">
          <MyBlueprint profile={comprehensiveProfile} onSave={onSaveProfile} />
        </div>
      ) : (
        <EnhancedSwipeDeck foods={foods} onSwipeWithTags={handleSwipeWithTags} />
      )}
    </div>
  );
}

```

### File: src/components/EnhancedSwipeDeck.tsx

```typescript
import { useState } from 'react';
import { X, Heart, ChevronLeft, Flame, Cookie, Fish, Salad, Tag } from 'lucide-react';
import type { FoodItem, SwipeTag } from '../types';

interface EnhancedSwipeDeckProps {
  foods: FoodItem[];
  onSwipeWithTags: (food: FoodItem, liked: boolean, tags: SwipeTag[]) => void;
}

const TASTE_TAGS = [
  { category: 'taste' as const, value: 'Spicy', icon: Flame },
  { category: 'taste' as const, value: 'Sweet', icon: Cookie },
  { category: 'taste' as const, value: 'Savory', icon: Fish },
  { category: 'taste' as const, value: 'Fresh', icon: Salad },
];

const TEXTURE_TAGS = [
  { category: 'texture' as const, value: 'Crispy' },
  { category: 'texture' as const, value: 'Crunchy' },
  { category: 'texture' as const, value: 'Soft' },
  { category: 'texture' as const, value: 'Chewy' },
  { category: 'texture' as const, value: 'Creamy' },
];

const CUISINE_TAGS = [
  { category: 'cuisine' as const, value: 'Asian' },
  { category: 'cuisine' as const, value: 'Italian' },
  { category: 'cuisine' as const, value: 'Mexican' },
  { category: 'cuisine' as const, value: 'American' },
  { category: 'cuisine' as const, value: 'Mediterranean' },
];

const TEMPERATURE_TAGS = [
  { category: 'temperature' as const, value: 'Hot' },
  { category: 'temperature' as const, value: 'Cold' },
  { category: 'temperature' as const, value: 'Room Temp' },
];

export function EnhancedSwipeDeck({ foods, onSwipeWithTags }: EnhancedSwipeDeckProps) {
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<SwipeTag[]>([]);
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);

  if (foods.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-600">You've rated all available foods. Keep using the app to discover more!</p>
        </div>
      </div>
    );
  }

  const currentFood = foods[0];

  const handleDislike = () => {
    onSwipeWithTags(currentFood, false, []);
  };

  const handleLike = () => {
    setPendingFood(currentFood);
    setSelectedTags([]);
    setShowTagSelector(true);
  };

  const toggleTag = (tag: SwipeTag) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.category === tag.category && t.value === tag.value);
      if (exists) {
        return prev.filter(t => !(t.category === tag.category && t.value === tag.value));
      }
      return [...prev, tag];
    });
  };

  const handleConfirmTags = () => {
    if (pendingFood) {
      onSwipeWithTags(pendingFood, true, selectedTags);
      setShowTagSelector(false);
      setPendingFood(null);
      setSelectedTags([]);
    }
  };

  const handleSkipTags = () => {
    if (pendingFood) {
      onSwipeWithTags(pendingFood, true, []);
      setShowTagSelector(false);
      setPendingFood(null);
      setSelectedTags([]);
    }
  };

  if (showTagSelector && pendingFood) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-40 px-6 pt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Why did you like it?</h2>
          <p className="text-gray-600">Select all that apply to train your AI better</p>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-6 flex items-center gap-3">
          <img
            src={pendingFood.image_url}
            alt={pendingFood.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
          <span className="font-semibold text-gray-900">{pendingFood.name}</span>
        </div>

        <div className="space-y-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Taste Profile
            </h3>
            <div className="flex flex-wrap gap-2">
              {TASTE_TAGS.map(tag => {
                const Icon = tag.icon;
                const isSelected = selectedTags.some(t => t.category === tag.category && t.value === tag.value);
                return (
                  <button
                    key={tag.value}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tag.value}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Texture</h3>
            <div className="flex flex-wrap gap-2">
              {TEXTURE_TAGS.map(tag => {
                const isSelected = selectedTags.some(t => t.category === tag.category && t.value === tag.value);
                return (
                  <button
                    key={tag.value}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.value}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cuisine Style</h3>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TAGS.map(tag => {
                const isSelected = selectedTags.some(t => t.category === tag.category && t.value === tag.value);
                return (
                  <button
                    key={tag.value}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.value}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Temperature</h3>
            <div className="flex flex-wrap gap-2">
              {TEMPERATURE_TAGS.map(tag => {
                const isSelected = selectedTags.some(t => t.category === tag.category && t.value === tag.value);
                return (
                  <button
                    key={tag.value}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fixed bottom-6 left-0 right-0 px-6 space-y-3 max-w-md mx-auto">
          <button
            onClick={handleConfirmTags}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/30"
          >
            Confirm ({selectedTags.length} {selectedTags.length === 1 ? 'tag' : 'tags'})
          </button>
          <button
            onClick={handleSkipTags}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-all"
          >
            Skip Tagging
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-32">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Train Your AI</h1>
          <span className="text-sm font-medium text-gray-500">
            {foods.length} remaining
          </span>
        </div>

        <div className="relative">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
            <div className="relative aspect-[4/5]">
              <img
                src={currentFood.image_url}
                alt={currentFood.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <h2 className="text-3xl font-bold text-white mb-2">{currentFood.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {currentFood.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={handleDislike}
            className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-red-100 hover:border-red-200 hover:scale-110 transition-all active:scale-95"
          >
            <X className="w-8 h-8 text-red-500" />
          </button>

          <button
            onClick={handleLike}
            className="w-20 h-20 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 hover:scale-110 transition-all active:scale-95"
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Like a food to tag what you enjoyed about it
        </p>
      </div>
    </div>
  );
}

```

### File: src/components/HistoryScreen.tsx

```typescript
import { useState, useEffect } from 'react';
import { Clock, RefreshCw, Loader2, AlertCircle, ChevronRight, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Your Production URL
const WEBHOOK_URL = 'https://exponentmarketing.app.n8n.cloud/webhook/get-history';

interface HistoryItem {
  id: number;
  created_at: string;
  ai_response: string;
}

export function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(WEBHOOK_URL);
      if (!response.ok) {
        throw new Error(`Failed to load history (Status: ${response.status})`);
      }

      const rawData = await response.json();
      
      // Smart extraction logic (keeps your app safe from format changes)
      let cleanData: any[] = [];
      if (Array.isArray(rawData)) cleanData = rawData;
      else if (rawData.data && Array.isArray(rawData.data)) cleanData = rawData.data;
      else if (rawData.json && Array.isArray(rawData.json)) cleanData = rawData.json;
      else if (rawData.result && Array.isArray(rawData.result)) cleanData = rawData.result;

      setHistory(cleanData);
      
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Could not load past meals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPreviewText = (text: string) => {
    if (!text) return "No analysis available";
    // Strip markdown chars for a cleaner preview
    const cleanText = text.replace(/[#*]/g, '');
    return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-600" />
              Scan History
            </h1>
            <p className="text-gray-500 text-sm mt-1">Your recent food analysis timeline</p>
          </div>
          <button 
            onClick={fetchHistory} 
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {loading && history.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
            <p className="text-gray-400">Loading your history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 text-red-700 border border-red-100">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center pt-20 text-gray-400">
            <p className="mb-2">No scans found yet.</p>
            <p className="text-sm">Scan your first menu to see it here!</p>
          </div>
        ) : (
          history.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-100'}`}
              >
                <button 
                  onClick={() => toggleExpand(item.id)}
                  className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.created_at)}
                    </div>
                    {isExpanded ? (
                      <span className="text-xs text-emerald-600 font-semibold">Open</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1">Menu Analysis</h3>
                  
                  {!isExpanded && (
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {getPreviewText(item.ai_response)}
                    </p>
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 bg-gray-50/50">
                    <div className="prose prose-sm max-w-none prose-emerald">
                      <ReactMarkdown>{item.ai_response}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

### File: src/components/MenuScanner.tsx

```typescript
import { useState, useEffect, useRef } from 'react';
import { Camera, Scan, Loader2, Upload, Image, AlertCircle, X } from 'lucide-react';
import type { ComprehensiveUserProfile } from '../types';

interface MenuScannerProps {
  onScanComplete: (recommendations: any) => void;
  comprehensiveProfile: ComprehensiveUserProfile;
  scanMode: 'goal' | 'enjoyment';
  setScanMode: (mode: 'goal' | 'enjoyment') => void;
  deviceId: string;
}

const WEBHOOK_URL = 'https://exponentmarketing.app.n8n.cloud/webhook/341c1c9e-85e0-4923-8f89-29b1a23cb839';

export function MenuScanner({ onScanComplete, comprehensiveProfile, scanMode, setScanMode, deviceId }: MenuScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(true);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      let capturedImage = uploadedImage;

      if (!capturedImage && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          capturedImage = canvas.toDataURL('image/jpeg', 0.9);
          console.log('Camera frame captured. Size:', capturedImage.length, 'characters');
        }
      }

      const requestBody = {
        menuImage: capturedImage || null,
        userProfile: {
          coreProfile: {
            diets: comprehensiveProfile.coreProfile.diets,
            allergies: comprehensiveProfile.coreProfile.allergies,
            goals: comprehensiveProfile.coreProfile.goals
          },
          tasteProfile: {
            spicyTolerance: comprehensiveProfile.tasteProfile.spicyTolerance,
            texturePreferences: comprehensiveProfile.tasteProfile.texturePreferences,
            sweetVsSavory: comprehensiveProfile.tasteProfile.sweetVsSavory
          },
          dislikes: comprehensiveProfile.dislikes
        },
        mode: scanMode,
        deviceId: deviceId
      };

      console.log('Sending request to n8n:', {
        ...requestBody,
        menuImage: capturedImage ? `Base64 image (${capturedImage.length} characters)` : null
      });

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Brain is still waking up! Please try again.');
      }

      let data;
      try {
        data = await response.json();
        console.log('Raw API Response (fetchHistory):', data);
        console.log('Raw API Response JSON:', JSON.stringify(data, null, 2));
      } catch {
        throw new Error('Brain is still waking up! Please try again.');
      }

      let extractedContent = null;

      if (Array.isArray(data) && data.length > 0 && data[0].output && typeof data[0].output === 'string' && data[0].output.trim() !== '') {
        extractedContent = data[0].output;
        console.log('Extracted from data[0].output');
      } else if (data && typeof data === 'object' && data.output && typeof data.output === 'string' && data.output.trim() !== '') {
        extractedContent = data.output;
        console.log('Extracted from data.output');
      } else if (Array.isArray(data) && data.length > 0 && data[0].recommendations) {
        extractedContent = data[0].recommendations;
        console.log('Extracted from data[0].recommendations');
      } else if (data && typeof data === 'object' && data.recommendations) {
        extractedContent = data.recommendations;
        console.log('Extracted from data.recommendations');
      }

      if (!extractedContent) {
        console.error('No valid content found in response. Checked: data[0].output, data.output, data[0].recommendations, data.recommendations');
        throw new Error('Brain is still waking up! Please try again.');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const normalizedData = {
        output: typeof extractedContent === 'string' ? extractedContent : null,
        recommendations: Array.isArray(extractedContent) ? extractedContent : null,
        rawData: data
      };

      onScanComplete(normalizedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brain is still waking up! Please try again.');
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPG or PNG image file.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setError(null);
        console.log('Image uploaded and converted to Base64. Size:', file.size, 'bytes');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Scanner</h1>
        <p className="text-gray-500">Scan or upload a menu for personalized recommendations</p>
      </div>

      <div className="px-6">
        <div className="bg-black rounded-3xl overflow-hidden aspect-[4/3] relative mb-6">
          {uploadedImage ? (
            <img
              src={uploadedImage}
              alt="Uploaded menu"
              className="w-full h-full object-cover"
            />
          ) : cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-center text-sm">
                Camera not available. Use the options below.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-64">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
                </div>
              </div>
            </>
          )}

          {isScanning && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
              <p className="text-white font-semibold text-lg mb-2">Analyzing Menu</p>
              <p className="text-emerald-200 text-sm">Getting your personalized recommendations...</p>
            </div>
          )}
        </div>

        <div className="mb-6 bg-white rounded-2xl p-2 border-2 border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScanMode('goal')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                scanMode === 'goal'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>🎯</span>
              Goal Mode
            </button>
            <button
              onClick={() => setScanMode('enjoyment')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                scanMode === 'enjoyment'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>😌</span>
              Enjoyment Mode
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {scanMode === 'goal'
              ? 'Strict, health-focused recommendations'
              : 'Flavor-focused, relaxed recommendations'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">{error}</p>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />

        {!uploadedImage && (
          <div className="space-y-3">
            {!cameraError && (
              <button
                onClick={handleScan}
                disabled={isScanning}
                className={`w-full ${
                  scanMode === 'goal'
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 shadow-emerald-600/30'
                    : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 shadow-amber-500/30'
                } disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]`}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    Scan Menu
                  </>
                )}
              </button>
            )}

            <button
              onClick={triggerFileUpload}
              disabled={isScanning}
              className={`w-full bg-white border-2 border-gray-200 ${
                scanMode === 'goal'
                  ? 'hover:border-emerald-400 hover:bg-emerald-50'
                  : 'hover:border-amber-400 hover:bg-amber-50'
              } disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]`}
            >
              <Upload className="w-5 h-5" />
              Upload Menu Image
            </button>
          </div>
        )}

        {uploadedImage && !isScanning && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Menu Image Ready</p>
                  <p className="text-xs text-emerald-700">Ready to analyze your menu</p>
                </div>
                <button
                  onClick={clearUploadedImage}
                  className="w-8 h-8 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border-2 border-emerald-300">
                <img
                  src={uploadedImage}
                  alt="Menu preview"
                  className="w-full h-32 object-cover"
                />
              </div>
            </div>
            <button
              onClick={handleScan}
              className={`w-full ${
                scanMode === 'goal'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
              } text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]`}
            >
              <Scan className="w-5 h-5" />
              Analyze Menu
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-4">
          Point camera at a menu or upload an image to get AI-powered dish recommendations
        </p>
      </div>
    </div>
  );
}

```

### File: src/components/MyBlueprint.tsx

```typescript
import { useState } from 'react';
import { FileText, Check, X, Plus } from 'lucide-react';
import type { ComprehensiveUserProfile, DietType, AllergyType, GoalType } from '../types';

interface MyBlueprintProps {
  profile: ComprehensiveUserProfile;
  onSave: (profile: ComprehensiveUserProfile) => void;
}

const DIET_OPTIONS: DietType[] = ['Omnivore', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'];
const ALLERGY_OPTIONS: AllergyType[] = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Soy'];
const GOAL_OPTIONS: GoalType[] = ['Weight Loss', 'Muscle Gain', 'Maintenance'];
const TEXTURE_OPTIONS = ['Crispy', 'Crunchy', 'Soft', 'Chewy', 'Creamy', 'Smooth', 'Tender', 'Firm'];

export function MyBlueprint({ profile, onSave }: MyBlueprintProps) {
  const [editedProfile, setEditedProfile] = useState<ComprehensiveUserProfile>(profile);
  const [newDislike, setNewDislike] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const toggleDiet = (diet: DietType) => {
    setEditedProfile(prev => ({
      ...prev,
      coreProfile: {
        ...prev.coreProfile,
        diets: prev.coreProfile.diets.includes(diet)
          ? prev.coreProfile.diets.filter(d => d !== diet)
          : [...prev.coreProfile.diets, diet]
      }
    }));
    setIsSaved(false);
  };

  const toggleAllergy = (allergy: AllergyType) => {
    setEditedProfile(prev => ({
      ...prev,
      coreProfile: {
        ...prev.coreProfile,
        allergies: prev.coreProfile.allergies.includes(allergy)
          ? prev.coreProfile.allergies.filter(a => a !== allergy)
          : [...prev.coreProfile.allergies, allergy]
      }
    }));
    setIsSaved(false);
  };

  const toggleGoal = (goal: GoalType) => {
    setEditedProfile(prev => ({
      ...prev,
      coreProfile: {
        ...prev.coreProfile,
        goals: prev.coreProfile.goals.includes(goal)
          ? prev.coreProfile.goals.filter(g => g !== goal)
          : [...prev.coreProfile.goals, goal]
      }
    }));
    setIsSaved(false);
  };

  const toggleTexturePreference = (texture: string) => {
    setEditedProfile(prev => ({
      ...prev,
      tasteProfile: {
        ...prev.tasteProfile,
        texturePreferences: prev.tasteProfile.texturePreferences.includes(texture)
          ? prev.tasteProfile.texturePreferences.filter(t => t !== texture)
          : [...prev.tasteProfile.texturePreferences, texture]
      }
    }));
    setIsSaved(false);
  };

  const addDislike = () => {
    if (newDislike.trim()) {
      setEditedProfile(prev => ({
        ...prev,
        dislikes: [...prev.dislikes, newDislike.trim()]
      }));
      setNewDislike('');
      setIsSaved(false);
    }
  };

  const removeDislike = (dislike: string) => {
    setEditedProfile(prev => ({
      ...prev,
      dislikes: prev.dislikes.filter(d => d !== dislike)
    }));
    setIsSaved(false);
  };

  const handleSpicyToleranceChange = (value: number) => {
    setEditedProfile(prev => ({
      ...prev,
      tasteProfile: {
        ...prev.tasteProfile,
        spicyTolerance: value
      }
    }));
    setIsSaved(false);
  };

  const handleSweetVsSavoryChange = (value: number) => {
    setEditedProfile(prev => ({
      ...prev,
      tasteProfile: {
        ...prev.tasteProfile,
        sweetVsSavory: value
      }
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(editedProfile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          Diet Types
        </h2>
        <p className="text-sm text-gray-500 mb-4">Select all dietary preferences that apply</p>
        <div className="flex flex-wrap gap-2">
          {DIET_OPTIONS.map(diet => (
            <button
              key={diet}
              onClick={() => toggleDiet(diet)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                editedProfile.coreProfile.diets.includes(diet)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {diet}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Allergies</h2>
        <p className="text-sm text-gray-500 mb-4">Select all allergies</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_OPTIONS.map(allergy => (
            <button
              key={allergy}
              onClick={() => toggleAllergy(allergy)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                editedProfile.coreProfile.allergies.includes(allergy)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals</h2>
        <p className="text-sm text-gray-500 mb-4">Select all health goals</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(goal => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                editedProfile.coreProfile.goals.includes(goal)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Taste Preferences</h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Spicy Tolerance: {editedProfile.tasteProfile.spicyTolerance}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={editedProfile.tasteProfile.spicyTolerance}
              onChange={(e) => handleSpicyToleranceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Mild</span>
              <span>Very Spicy</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Sweet vs Savory: {editedProfile.tasteProfile.sweetVsSavory}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={editedProfile.tasteProfile.sweetVsSavory}
              onChange={(e) => handleSweetVsSavoryChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Sweet</span>
              <span>Savory</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Texture Preferences</h2>
        <p className="text-sm text-gray-500 mb-4">Select textures you enjoy</p>
        <div className="flex flex-wrap gap-2">
          {TEXTURE_OPTIONS.map(texture => (
            <button
              key={texture}
              onClick={() => toggleTexturePreference(texture)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                editedProfile.tasteProfile.texturePreferences.includes(texture)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {texture}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Specific Dislikes</h2>
        <p className="text-sm text-gray-500 mb-4">Add ingredients you avoid</p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newDislike}
            onChange={(e) => setNewDislike(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addDislike()}
            placeholder="e.g., Mushrooms, Cilantro"
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={addDislike}
            className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {editedProfile.dislikes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {editedProfile.dislikes.map(dislike => (
              <div
                key={dislike}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl"
              >
                <span className="text-sm font-medium text-red-900">{dislike}</span>
                <button
                  onClick={() => removeDislike(dislike)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-4 px-8 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          isSaved
            ? 'bg-green-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 active:scale-[0.98]'
        }`}
      >
        {isSaved ? (
          <>
            <Check className="w-5 h-5" />
            Saved!
          </>
        ) : (
          'Save Blueprint'
        )}
      </button>
    </div>
  );
}

```

### File: src/components/OnboardingScreen.tsx

```typescript
import { Sparkles, Utensils, ChevronRight } from 'lucide-react';

interface OnboardingScreenProps {
  onStart: () => void;
}

export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center">
            <Utensils className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          Digital Food Twin
        </h1>

        <p className="text-xl text-emerald-600 font-medium text-center mb-6">
          Your Personal Taste AI
        </p>

        <div className="max-w-sm text-center space-y-4 mb-12">
          <p className="text-gray-600 text-lg leading-relaxed">
            Discover dishes you'll love. We learn your unique taste profile to recommend
            the perfect meal, every time.
          </p>

          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">12</div>
              <div className="text-sm text-gray-500">Quick Swipes</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">AI</div>
              <div className="text-sm text-gray-500">Powered</div>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">100%</div>
              <div className="text-sm text-gray-500">Personalized</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-24">
        <button
          onClick={onStart}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-[0.98]"
        >
          Start My Profile
          <ChevronRight className="w-5 h-5" />
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Takes less than 60 seconds
        </p>
      </div>
    </div>
  );
}

```

### File: src/components/ProfileSettings.tsx

```typescript
import { useState } from 'react';
import { User, Check } from 'lucide-react';
import type { UserProfileSettings, DietType, AllergyType, GoalType } from '../types';

interface ProfileSettingsProps {
  initialSettings: UserProfileSettings;
  onSave: (settings: UserProfileSettings) => void;
}

const DIET_OPTIONS: DietType[] = ['Omnivore', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'];
const ALLERGY_OPTIONS: AllergyType[] = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Soy'];
const GOAL_OPTIONS: GoalType[] = ['Weight Loss', 'Muscle Gain', 'Maintenance'];

export function ProfileSettings({ initialSettings, onSave }: ProfileSettingsProps) {
  const [settings, setSettings] = useState<UserProfileSettings>(initialSettings);
  const [isSaved, setIsSaved] = useState(false);

  const handleDietChange = (diet: DietType) => {
    setSettings(prev => ({ ...prev, diet }));
    setIsSaved(false);
  };

  const handleAllergyToggle = (allergy: AllergyType) => {
    setSettings(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
    setIsSaved(false);
  };

  const handleGoalToggle = (goal: GoalType) => {
    setSettings(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>
        <p className="text-gray-500">Your hard constraints for food recommendations</p>
      </div>

      <div className="px-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Diet Type</h2>
          <p className="text-sm text-gray-500 mb-4">Select your dietary preference</p>

          <div className="space-y-2">
            {DIET_OPTIONS.map(diet => (
              <button
                key={diet}
                onClick={() => handleDietChange(diet)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                  settings.diet === diet
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <span className={`font-medium ${
                  settings.diet === diet ? 'text-emerald-900' : 'text-gray-700'
                }`}>
                  {diet}
                </span>
                {settings.diet === diet && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Allergies</h2>
          <p className="text-sm text-gray-500 mb-4">Select all that apply</p>

          <div className="space-y-2">
            {ALLERGY_OPTIONS.map(allergy => (
              <button
                key={allergy}
                onClick={() => handleAllergyToggle(allergy)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                  settings.allergies.includes(allergy)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <span className={`font-medium ${
                  settings.allergies.includes(allergy) ? 'text-emerald-900' : 'text-gray-700'
                }`}>
                  {allergy}
                </span>
                {settings.allergies.includes(allergy) && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals</h2>
          <p className="text-sm text-gray-500 mb-4">Select all that apply</p>

          <div className="space-y-2">
            {GOAL_OPTIONS.map(goal => (
              <button
                key={goal}
                onClick={() => handleGoalToggle(goal)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                  settings.goals.includes(goal)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <span className={`font-medium ${
                  settings.goals.includes(goal) ? 'text-emerald-900' : 'text-gray-700'
                }`}>
                  {goal}
                </span>
                {settings.goals.includes(goal) && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-4 px-8 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            isSaved
              ? 'bg-green-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 active:scale-[0.98]'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-5 h-5" />
              Saved!
            </>
          ) : (
            'Save Profile'
          )}
        </button>
      </div>
    </div>
  );
}

```

### File: src/components/RecommendationsView.tsx

```typescript
import { ArrowLeft, Sparkles, ChefHat } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { FoodItem } from '../types';

interface RecommendationsViewProps {
  recommendations: FoodItem[];
  apiRecommendations?: any;
  savoryPreference: number;
  spicyPreference: number;
  freshPreference: number;
  onBack: () => void;
}

export function RecommendationsView({
  apiRecommendations,
  onBack
}: RecommendationsViewProps) {
  const hasMarkdownOutput = apiRecommendations?.output && typeof apiRecommendations.output === 'string';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-24">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Matches</h1>
            <p className="text-sm text-gray-500">Based on your Food DNA</p>
          </div>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-emerald-100 text-sm">Menu analyzed successfully</p>
            <p className="text-white font-semibold">Personalized Recommendations</p>
          </div>
        </div>
      </div>

      {hasMarkdownOutput ? (
        <div className="px-6 pb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700">
              <ReactMarkdown>{apiRecommendations.output}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-8">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <p className="text-sm text-amber-900">No recommendations available. Please try scanning again.</p>
          </div>
        </div>
      )}

      <div className="px-6">
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              These recommendations are personalized based on your unique taste profile.
              The more you use Digital Food Twin, the better we understand your preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

```

### File: src/components/SwipeDeck.tsx

```typescript
import { useState, useRef, useEffect } from 'react';
import { Heart, X, ArrowLeft } from 'lucide-react';
import type { FoodItem } from '../types';

interface SwipeDeckProps {
  foods: FoodItem[];
  onSwipe: (food: FoodItem, liked: boolean) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function SwipeDeck({ foods, onSwipe, onComplete, onBack }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const currentFood = foods[currentIndex];
  const progress = ((currentIndex) / foods.length) * 100;

  useEffect(() => {
    if (currentIndex >= foods.length) {
      onComplete();
    }
  }, [currentIndex, foods.length, onComplete]);

  const handleSwipe = (liked: boolean) => {
    if (!currentFood) return;

    setSwipeDirection(liked ? 'right' : 'left');

    setTimeout(() => {
      onSwipe(currentFood, liked);
      setCurrentIndex((prev) => prev + 1);
      setSwipeDirection(null);
      setDragOffset(0);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0);
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0);
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  if (!currentFood) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
          <p className="text-gray-500">Building your taste profile...</p>
        </div>
      </div>
    );
  }

  const rotation = dragOffset * 0.1;
  const likeOpacity = Math.max(0, Math.min(1, dragOffset / 100));
  const dislikeOpacity = Math.max(0, Math.min(1, -dragOffset / 100));

  let cardTransform = `translateX(${dragOffset}px) rotate(${rotation}deg)`;
  if (swipeDirection === 'left') {
    cardTransform = 'translateX(-150%) rotate(-30deg)';
  } else if (swipeDirection === 'right') {
    cardTransform = 'translateX(150%) rotate(30deg)';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-500">
            {currentIndex + 1} of {foods.length}
          </span>
          <div className="w-10" />
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Would you eat this?
        </h2>

        <div
          className="relative w-full max-w-sm aspect-[3/4]"
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={cardRef}
            className="absolute inset-0 bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
            style={{
              transform: cardTransform,
              transition: swipeDirection || !isDragging ? 'transform 0.3s ease-out' : 'none',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div className="relative h-3/5">
              <img
                src={currentFood.image_url}
                alt={currentFood.name}
                className="w-full h-full object-cover"
                draggable={false}
              />

              <div
                className="absolute inset-0 bg-emerald-500 flex items-center justify-center transition-opacity"
                style={{ opacity: likeOpacity * 0.8 }}
              >
                <Heart className="w-24 h-24 text-white" fill="white" />
              </div>

              <div
                className="absolute inset-0 bg-red-500 flex items-center justify-center transition-opacity"
                style={{ opacity: dislikeOpacity * 0.8 }}
              >
                <X className="w-24 h-24 text-white" />
              </div>
            </div>

            <div className="p-5 h-2/5 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {currentFood.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentFood.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-24 pt-6">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => handleSwipe(false)}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-all active:scale-95"
          >
            <X className="w-8 h-8 text-red-500" />
          </button>

          <button
            onClick={() => handleSwipe(true)}
            className="w-20 h-20 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Heart className="w-10 h-10 text-white" fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

```

### File: src/data/foods.ts

```typescript
import type { FoodItem } from '../types';

export const LOCAL_FOODS: FoodItem[] = [
  {
    id: 'local-1',
    name: 'Classic Cheeseburger',
    image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['American', 'Juicy', 'Comfort'],
    savory_score: 90,
    spicy_score: 20,
    fresh_score: 25
  },
  {
    id: 'local-2',
    name: 'Vietnamese Pho',
    image_url: 'https://images.pexels.com/photos/1618898/pexels-photo-1618898.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Vietnamese', 'Aromatic', 'Warming'],
    savory_score: 75,
    spicy_score: 40,
    fresh_score: 70
  },
  {
    id: 'local-3',
    name: 'Fresh Sushi Platter',
    image_url: 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Japanese', 'Fresh', 'Delicate'],
    savory_score: 60,
    spicy_score: 15,
    fresh_score: 95
  },
  {
    id: 'local-4',
    name: 'Spicy Pad Thai',
    image_url: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Thai', 'Tangy', 'Noodles'],
    savory_score: 70,
    spicy_score: 65,
    fresh_score: 50
  },
  {
    id: 'local-5',
    name: 'Wood-Fired Pizza',
    image_url: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Italian', 'Cheesy', 'Crispy'],
    savory_score: 85,
    spicy_score: 15,
    fresh_score: 40
  },
  {
    id: 'local-6',
    name: 'Chicken Tacos',
    image_url: 'https://images.pexels.com/photos/2087748/pexels-photo-2087748.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Mexican', 'Zesty', 'Street Food'],
    savory_score: 75,
    spicy_score: 55,
    fresh_score: 60
  },
  {
    id: 'local-7',
    name: 'Butter Chicken Curry',
    image_url: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Indian', 'Creamy', 'Rich'],
    savory_score: 90,
    spicy_score: 60,
    fresh_score: 20
  },
  {
    id: 'local-8',
    name: 'Greek Salad Bowl',
    image_url: 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Greek', 'Light', 'Healthy'],
    savory_score: 40,
    spicy_score: 5,
    fresh_score: 100
  },
  {
    id: 'local-9',
    name: 'Korean Bibimbap',
    image_url: 'https://images.pexels.com/photos/5900742/pexels-photo-5900742.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['Korean', 'Colorful', 'Balanced'],
    savory_score: 70,
    spicy_score: 50,
    fresh_score: 75
  },
  {
    id: 'local-10',
    name: 'BBQ Ribs',
    image_url: 'https://images.pexels.com/photos/410648/pexels-photo-410648.jpeg?auto=compress&cs=tinysrgb&w=800',
    tags: ['BBQ', 'Smoky', 'Hearty'],
    savory_score: 95,
    spicy_score: 30,
    fresh_score: 10
  }
];

```

### File: src/index.css

```typescript
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }

  body {
    @apply antialiased;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
}

@layer utilities {
  .border-3 {
    border-width: 3px;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
}

```

### File: src/lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

```

### File: src/main.tsx

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

```

### File: src/types/index.ts

```typescript
export interface FoodItem {
  id: string;
  name: string;
  image_url: string;
  tags: string[];
  savory_score: number;
  spicy_score: number;
  fresh_score: number;
}

export interface UserProfile {
  id: string;
  onboarding_complete: boolean;
  savory_preference: number;
  spicy_preference: number;
  fresh_preference: number;
}

export interface FoodPreference {
  id: string;
  user_id: string;
  food_id: string;
  liked: boolean;
}

export type DietType = 'Omnivore' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Paleo';
export type AllergyType = 'Gluten' | 'Dairy' | 'Nuts' | 'Shellfish' | 'Soy';
export type GoalType = 'Weight Loss' | 'Muscle Gain' | 'Maintenance';

export interface CoreProfile {
  diets: DietType[];
  allergies: AllergyType[];
  goals: GoalType[];
}

export interface TasteProfile {
  spicyTolerance: number;
  texturePreferences: string[];
  sweetVsSavory: number;
}

export interface ComprehensiveUserProfile {
  coreProfile: CoreProfile;
  tasteProfile: TasteProfile;
  dislikes: string[];
}

export interface SwipeTag {
  category: 'taste' | 'texture' | 'cuisine' | 'temperature';
  value: string;
}

export type Screen = 'onboarding' | 'swipe' | 'dashboard' | 'scanner' | 'recommendations' | 'history';

```

### File: src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />

```

