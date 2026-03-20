import { useState, useEffect, useCallback } from 'react';
import {
  Sun, Moon, Cloud, Utensils, Dna, Target, Users, ChevronRight,
  Droplets, Flame, Beef, X, MapPin, Clock, Calendar, UserPlus, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { useMeals } from '../hooks/useMeals';
import { useWaterLogs } from '../hooks/useWaterLogs';
import { useFriends } from '../hooks/useFriends';
import type { Screen, DiningContext } from '../types';

interface DashboardProps {
  userId: string;
  userEmail: string;
  onNavigate: (screen: Screen) => void;
  onScan: () => void;
  onFindRestaurant: (diningContext: DiningContext, autoMessage: string) => void;
}

interface NutritionData {
  calories: number;
  protein: number;
  water: number;
}

interface Friend {
  id: string;
  friendId: string;
  displayName: string;
  status: string;
}

interface DiningEvent {
  id: string;
  title: string;
  plannedDate: string;
  plannedTime: string;
  restaurantName: string | null;
  status: string;
  participantCount: number;
}

const CUISINE_OPTIONS = [
  { id: 'japanese', emoji: '🍣', label: 'Japanese' },
  { id: 'mexican', emoji: '🌮', label: 'Mexican' },
  { id: 'italian', emoji: '🍝', label: 'Italian' },
  { id: 'bbq', emoji: '🍖', label: 'BBQ' },
  { id: 'chinese', emoji: '🥡', label: 'Chinese' },
  { id: 'thai', emoji: '🍜', label: 'Thai' },
  { id: 'indian', emoji: '🍛', label: 'Indian' },
  { id: 'american', emoji: '🍔', label: 'American' },
  { id: 'mediterranean', emoji: '🥗', label: 'Mediterranean' },
  { id: 'pizza', emoji: '🍕', label: 'Pizza' },
  { id: 'steakhouse', emoji: '🥩', label: 'Steakhouse' },
  { id: 'seafood', emoji: '🦐', label: 'Seafood' }
];

const MEAL_OPTIONS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'brunch', label: 'Brunch' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'late-night', label: 'Late Night' }
];

function getTimeBasedGreeting(): { greeting: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: 'Good morning', icon: <Sun className="w-5 h-5 text-amber-500" /> };
  if (hour < 17) return { greeting: 'Good afternoon', icon: <Sun className="w-5 h-5 text-orange-500" /> };
  if (hour < 21) return { greeting: 'Good evening', icon: <Moon className="w-5 h-5 text-blue-500" /> };
  return { greeting: 'Good night', icon: <Moon className="w-5 h-5 text-indigo-500" /> };
}

function getSuggestedMeal(): string {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 11) return 'brunch';
  if (hour < 14) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'late-night';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function NutritionRing({
  value,
  max,
  size,
  strokeWidth,
  color,
  icon,
  label
}: {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  icon: React.ReactNode;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 mt-1.5">{label}</span>
      <span className="text-xs text-gray-400">{value}/{max}</span>
    </div>
  );
}

interface SearchParams {
  dining: string;
  meal: string;
  cuisine: string | null;
  friendIds: string[];
  friendNames: string[];
}

function RestaurantFinderSheet({
  isOpen,
  onClose,
  friends,
  onSearch
}: {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onSearch: (params: SearchParams) => void;
}) {
  const [dining, setDining] = useState<'solo' | 'group'>('solo');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedMeal, setSelectedMeal] = useState(getSuggestedMeal());
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSearch = () => {
    const selectedFriendObjects = friends.filter(f => selectedFriends.includes(f.friendId));
    onSearch({
      dining,
      meal: selectedMeal,
      cuisine: selectedCuisine,
      friendIds: selectedFriends,
      friendNames: selectedFriendObjects.map(f => f.displayName)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Find a Restaurant</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Who's Dining?</h3>
            <div className="flex gap-3">
              <button
                onClick={() => { setDining('solo'); setSelectedFriends([]); }}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  dining === 'solo'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Just Me
              </button>
              <button
                onClick={() => setDining('group')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  dining === 'group'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                With Friends
              </button>
            </div>
            {dining === 'group' && friends.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => toggleFriend(friend.friendId)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedFriends.includes(friend.friendId)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {friend.displayName}
                  </button>
                ))}
              </div>
            )}
            {dining === 'group' && friends.length === 0 && (
              <p className="mt-3 text-sm text-gray-500">No friends added yet. Add friends to plan group dining!</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">What Meal?</h3>
            <div className="flex flex-wrap gap-2">
              {MEAL_OPTIONS.map(meal => (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedMeal === meal.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {meal.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">What Cuisine?</h3>
            <div className="grid grid-cols-4 gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <button
                  key={cuisine.id}
                  onClick={() => setSelectedCuisine(cuisine.id === selectedCuisine ? null : cuisine.id)}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    selectedCuisine === cuisine.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{cuisine.emoji}</span>
                  <span className="text-xs font-medium">{cuisine.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setSelectedCuisine('surprise')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  selectedCuisine === 'surprise'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                ✨ Surprise Me
              </button>
              <button
                onClick={() => setSelectedCuisine('decide')}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  selectedCuisine === 'decide'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                🤔 Help Decide
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSearch}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 active:scale-[0.98]"
          >
            {dining === 'solo' ? 'Find My Perfect Spot' : 'Find Our Perfect Spot'}
          </button>
          {selectedFriends.length > 0 && (
            <p className="text-center text-xs text-gray-500 mt-2">
              We'll find a place that works for everyone's taste
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ userId, userEmail, onNavigate, onScan: _onScan, onFindRestaurant }: DashboardProps) {
  const { nutritionGoals } = useApp();
  const [nutritionData, setNutritionData] = useState<NutritionData>({ calories: 0, protein: 0, water: 0 });
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DiningEvent[]>([]);
  const [showFinder, setShowFinder] = useState(false);

  const { greeting, icon } = getTimeBasedGreeting();
  const firstName = userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1);

  const { fetchTodayProgress } = useMeals(userId);
  const { fetchTodayWater } = useWaterLogs(userId);
  const {
    loadFriends: hookLoadFriends,
    handleRequest: hookHandleRequest,
  } = useFriends(userId);

  const loadNutritionData = useCallback(async () => {
    if (!userId) return;

    const [progress, water] = await Promise.all([
      fetchTodayProgress(),
      fetchTodayWater(),
    ]);

    setNutritionData({
      calories: progress?.calories || 0,
      protein: Math.round(progress?.protein || 0),
      water: water || 0,
    });
  }, [userId, fetchTodayProgress, fetchTodayWater]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;

    const result = await hookLoadFriends();

    const accepted: Friend[] = result.accepted.map(f => ({
      id: f.id,
      friendId: f.friendId,
      displayName: f.profile.displayName || `Friend ${f.friendId.slice(0, 6)}`,
      status: f.status,
    }));

    const pending: Friend[] = result.incoming.map(f => ({
      id: f.id,
      friendId: f.friendId,
      displayName: f.profile.displayName || `Friend ${f.friendId.slice(0, 6)}`,
      status: f.status,
    }));

    setFriends(accepted);
    setPendingRequests(pending);
  }, [userId, hookLoadFriends]);

  const loadUpcomingEvents = useCallback(async () => {
    if (!userId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('dining_events')
        .select(`
          id,
          title,
          planned_date,
          planned_time,
          selected_restaurant_name,
          status
        `)
        .eq('creator_id', userId)
        .gte('planned_date', today.toISOString().split('T')[0])
        .order('planned_date', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error loading dining events:', error);
        setUpcomingEvents([]);
        return;
      }

      if (data) {
        setUpcomingEvents(data.map(e => ({
          id: e.id,
          title: e.title,
          plannedDate: e.planned_date,
          plannedTime: e.planned_time,
          restaurantName: e.selected_restaurant_name,
          status: e.status,
          participantCount: 0
        })));
      }
    } catch (err) {
      console.error('Error loading dining events:', err);
      setUpcomingEvents([]);
    }
  }, [userId]);

  useEffect(() => {
    loadNutritionData();
    loadFriends();
    loadUpcomingEvents();
  }, [loadNutritionData, loadFriends, loadUpcomingEvents]);

  const handleFriendRequest = async (requestId: string, accept: boolean) => {
    await hookHandleRequest(requestId, accept);
    loadFriends();
  };

  const handleRestaurantSearch = (params: SearchParams) => {
    const isGroupDining = params.friendIds.length > 0;
    const isSurprise = params.cuisine === 'surprise';
    const isHelpDecide = params.cuisine === 'decide';
    const cuisinePreference = isSurprise || isHelpDecide || !params.cuisine
      ? 'surprise_me'
      : params.cuisine;

    const diningContext: DiningContext = {
      isGroupDining,
      selectedFriendIds: params.friendIds,
      selectedFriendNames: params.friendNames,
      mealType: params.meal as DiningContext['mealType'],
      cuisinePreference
    };

    let autoMessage = '';
    const cuisineLabel = CUISINE_OPTIONS.find(c => c.id === params.cuisine)?.label;

    if (isGroupDining) {
      const friendNames = params.friendNames.join(' and ');
      if (isHelpDecide) {
        autoMessage = `Help me decide what to eat for ${params.meal} with ${friendNames} - I'm not sure what we're in the mood for. Ask us a few questions to narrow it down.`;
      } else if (isSurprise) {
        autoMessage = `Recommend a restaurant for ${params.meal} based on my Food DNA that works for me and ${friendNames}`;
      } else {
        autoMessage = `Find a ${cuisineLabel} restaurant for ${params.meal} for me and ${friendNames}`;
      }
    } else {
      if (isHelpDecide) {
        autoMessage = `Help me decide what to eat for ${params.meal} - I'm not sure what I'm in the mood for. Ask me a few questions to narrow it down.`;
      } else if (isSurprise) {
        autoMessage = `Recommend a restaurant for ${params.meal} based on my Food DNA`;
      } else {
        autoMessage = `Find me a ${cuisineLabel} restaurant for ${params.meal} nearby`;
      }
    }

    onFindRestaurant(diningContext, autoMessage);
  };

  const caloriesRemaining = Math.max(0, nutritionGoals.calorieGoal - nutritionData.calories);
  const caloriePercentage = Math.round((nutritionData.calories / nutritionGoals.calorieGoal) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-gray-600 text-sm">{formatDate(new Date())}</span>
          </div>
          <Cloud className="w-5 h-5 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {firstName}!
        </h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <button
          onClick={() => onNavigate('nutrition')}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today's Progress</h2>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex justify-around items-end">
            <NutritionRing
              value={nutritionData.calories}
              max={nutritionGoals.calorieGoal}
              size={80}
              strokeWidth={8}
              color="#f97316"
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              label="Calories"
            />
            <NutritionRing
              value={nutritionData.protein}
              max={nutritionGoals.proteinGoal}
              size={70}
              strokeWidth={7}
              color="#10b981"
              icon={<Beef className="w-4 h-4 text-emerald-500" />}
              label="Protein"
            />
            <NutritionRing
              value={nutritionData.water}
              max={nutritionGoals.waterGoal}
              size={60}
              strokeWidth={6}
              color="#3b82f6"
              icon={<Droplets className="w-4 h-4 text-blue-500" />}
              label="Water"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{caloriesRemaining}</span> calories remaining
              <span className="text-gray-400 ml-2">({caloriePercentage}% to goal)</span>
            </p>
          </div>
        </button>

        <button
          onClick={() => setShowFinder(true)}
          className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-lg shadow-emerald-500/25 text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Find a Restaurant</h2>
                <p className="text-emerald-100 text-sm">Personalized picks just for you</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-white/90 text-sm">Tap to get started</span>
              <ChevronRight className="w-4 h-4 text-white/70" />
            </div>
          </div>
        </button>

        <div>
          <h2 className="font-semibold text-gray-900 mb-3 px-1">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => onNavigate('diary')}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Food Log</span>
            </button>
            <button
              onClick={() => onNavigate('food-dna')}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Dna className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Food DNA</span>
            </button>
            <button
              onClick={() => onNavigate('my-goals')}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">My Goals</span>
            </button>
            <button
              onClick={() => onNavigate('friends')}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xs font-medium text-gray-700">Friends</span>
            </button>
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3 px-1">Upcoming Plans</h2>
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(event.plannedDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {event.plannedTime && (
                          <>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{event.plannedTime}</span>
                          </>
                        )}
                      </div>
                      {event.restaurantName ? (
                        <p className="text-sm text-emerald-600 font-medium mt-1">
                          {event.restaurantName}
                        </p>
                      ) : (
                        <p className="text-sm text-amber-600 mt-1">Still deciding on a restaurant</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3 px-1">Friend Requests</h2>
            <div className="space-y-2">
              {pendingRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.displayName}</p>
                        <p className="text-sm text-gray-500">wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFriendRequest(request.id, true)}
                        className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"
                      >
                        <Check className="w-5 h-5 text-emerald-600" />
                      </button>
                      <button
                        onClick={() => handleFriendRequest(request.id, false)}
                        className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length === 0 && (
          <button
            onClick={() => setShowFinder(true)}
            className="w-full bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-4 border border-emerald-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-emerald-900">Plan a group dinner?</p>
                <p className="text-sm text-emerald-700">Find the perfect spot for everyone</p>
              </div>
            </div>
          </button>
        )}
      </div>

      <RestaurantFinderSheet
        isOpen={showFinder}
        onClose={() => setShowFinder(false)}
        friends={friends}
        onSearch={handleRestaurantSearch}
      />
    </div>
  );
}
