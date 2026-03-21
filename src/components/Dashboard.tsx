import { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronRight, MapPin, Clock, Calendar, UserPlus, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../contexts/AppContext';
import { useUI } from '../contexts/UIContext';
import { useMeals } from '../hooks/useMeals';
import { useWaterLogs } from '../hooks/useWaterLogs';
import { useFriends } from '../hooks/useFriends';
import { NomMigoCard } from './ui/NomMigoCard';
import { MealCard } from './ui/MealCard';
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
  carbs: number;
  fat: number;
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

function getSuggestedMeal(): string {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 11) return 'brunch';
  if (hour < 14) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'late-night';
}

/** Map meal_type from DB to display labels */
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  brunch: 'Brunch',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  'late-night': 'Late Night',
};

/** Expected meal slots based on time of day */
function getExpectedMealSlots(): { type: string; label: string }[] {
  const hour = new Date().getHours();
  const slots = [{ type: 'breakfast', label: 'Breakfast' }];
  if (hour >= 11) slots.push({ type: 'lunch', label: 'Lunch' });
  if (hour >= 15) slots.push({ type: 'snack', label: 'Snack' });
  if (hour >= 17) slots.push({ type: 'dinner', label: 'Dinner' });
  return slots;
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
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-nm-bg rounded-t-[2rem] max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-nm-bg px-6 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nm-text">Find a Restaurant</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <X className="w-5 h-5 text-nm-text/50" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 pb-40 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-nm-text mb-3">Who's Dining?</h3>
            <div className="flex gap-3">
              <button
                onClick={() => { setDining('solo'); setSelectedFriends([]); }}
                className={`flex-1 py-3 px-4 rounded-full font-medium transition-all ${
                  dining === 'solo'
                    ? 'bg-nm-signature text-white'
                    : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                }`}
              >
                Just Me
              </button>
              <button
                onClick={() => setDining('group')}
                className={`flex-1 py-3 px-4 rounded-full font-medium transition-all ${
                  dining === 'group'
                    ? 'bg-nm-signature text-white'
                    : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
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
                        ? 'bg-nm-signature text-white'
                        : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                    }`}
                  >
                    {friend.displayName}
                  </button>
                ))}
              </div>
            )}
            {dining === 'group' && friends.length === 0 && (
              <p className="mt-3 text-sm text-nm-text/50">No friends added yet. Add friends to plan group dining!</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-nm-text mb-3">What Meal?</h3>
            <div className="flex flex-wrap gap-2">
              {MEAL_OPTIONS.map(meal => (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedMeal === meal.id
                      ? 'bg-nm-signature text-white'
                      : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                  }`}
                >
                  {meal.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-nm-text mb-3">What Cuisine?</h3>
            <div className="grid grid-cols-4 gap-2">
              {CUISINE_OPTIONS.map(cuisine => (
                <button
                  key={cuisine.id}
                  onClick={() => setSelectedCuisine(cuisine.id === selectedCuisine ? null : cuisine.id)}
                  className={`p-3 rounded-nm flex flex-col items-center gap-1 transition-all ${
                    selectedCuisine === cuisine.id
                      ? 'bg-nm-signature text-white'
                      : 'bg-nm-surface hover:bg-nm-surface-high'
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
                className={`flex-1 py-3 px-4 rounded-full font-medium transition-all ${
                  selectedCuisine === 'surprise'
                    ? 'bg-nm-accent text-nm-text'
                    : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                }`}
              >
                Surprise Me
              </button>
              <button
                onClick={() => setSelectedCuisine('decide')}
                className={`flex-1 py-3 px-4 rounded-full font-medium transition-all ${
                  selectedCuisine === 'decide'
                    ? 'bg-nm-accent text-nm-text'
                    : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                }`}
              >
                Help Decide
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-nm-bg px-6 py-4">
          <button
            onClick={handleSearch}
            className="w-full py-4 bg-gradient-to-r from-nm-signature to-nm-signature-light text-white font-extrabold rounded-full transition-all shadow-nm-float active:scale-[0.98]"
          >
            {dining === 'solo' ? 'Find My Perfect Spot' : 'Find Our Perfect Spot'}
          </button>
          {selectedFriends.length > 0 && (
            <p className="text-center text-xs text-nm-text/40 mt-2">
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
  const { openQuickAddWith } = useUI();
  const [nutritionData, setNutritionData] = useState<NutritionData>({ calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 });
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<DiningEvent[]>([]);
  const [showFinder, setShowFinder] = useState(false);

  const firstName = userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1);

  const { meals, fetchMealsForDate, fetchTodayProgress } = useMeals(userId);
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
      carbs: Math.round(progress?.carbs || 0),
      fat: Math.round(progress?.fat || 0),
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
    fetchMealsForDate(new Date());
  }, [loadNutritionData, loadFriends, loadUpcomingEvents, fetchMealsForDate]);

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

  // Build meal card data: show logged meals + empty slots for expected meals not yet logged
  const expectedSlots = getExpectedMealSlots();
  const loggedTypes = new Set(meals.map(m => m.meal_type?.toLowerCase()));

  /*
   * Render — translating design/home-dashboard.html directly.
   * Stitch main: pt-24 px-6 max-w-2xl mx-auto space-y-10
   * We get pt from sticky AppHeader, so just use space-y-10.
   */
  return (
    <div className="px-6 max-w-2xl mx-auto space-y-10 pb-40">

      {/* ── Hero Greeting ── Stitch line 114-118: section > h1.text-[2.5rem].leading-tight.font-extrabold.tracking-tight */}
      <section>
        <h1 className="text-[2.5rem] leading-tight font-extrabold tracking-tight text-nm-text">
          Hey {firstName}! <br />Ready to nom?
        </h1>
      </section>

      {/* ── Daily Calorie Summary ── Stitch lines 120-158: section.space-y-6 */}
      <section className="space-y-6">
        {/* Stitch: div.bg-surface-container-low.rounded-lg.p-8.soft-brutalist-shadow.relative.overflow-hidden */}
        <button
          onClick={() => onNavigate('nutrition')}
          className="w-full bg-nm-surface-low rounded-[2rem] p-8 shadow-[0_40px_60px_-15px_rgba(255,107,107,0.08)] relative overflow-hidden text-left"
        >
          <div className="relative z-10">
            {/* Stitch: p.text-on-surface-variant.font-bold.text-sm.uppercase.tracking-widest.mb-2 */}
            <p className="text-nm-text/50 font-bold text-sm uppercase tracking-widest mb-2">Calories Remaining</p>
            {/* Stitch: span.text-7xl.font-black.tracking-tighter + span.text-xl.font-bold */}
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black tracking-tighter text-nm-text">{caloriesRemaining.toLocaleString()}</span>
              <span className="text-xl font-bold text-nm-text/50">kcal</span>
            </div>
            {/* Stitch: mt-8 > h-6 progress bar > flex justify-between mt-3 */}
            <div className="mt-8">
              <div className="h-6 w-full bg-nm-surface-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-nm-signature to-nm-signature-light rounded-full transition-all duration-500"
                  style={{ width: `${caloriePercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-3 px-1">
                <span className="text-xs font-bold text-nm-signature uppercase">{nutritionData.calories.toLocaleString()} Eaten</span>
                <span className="text-xs font-bold text-nm-text/50 uppercase">Goal: {nutritionGoals.calorieGoal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Stitch Macros: grid grid-cols-3 gap-4. Protein=bg-primary, Carbs=bg-secondary-container, Fat=bg-surface-container-lowest */}
        <div className="grid grid-cols-3 gap-4">
          {/* Protein: coral bg, white text */}
          <div className="bg-nm-signature text-white p-5 rounded-[2rem] flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{nutritionData.protein}g</span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Protein</span>
          </div>
          {/* Carbs: mango bg, dark text */}
          <div className="bg-nm-accent text-nm-text p-5 rounded-[2rem] flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{nutritionData.carbs}g</span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Carbs</span>
          </div>
          {/* Fat: white bg, dark text */}
          <div className="bg-white text-nm-text p-5 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
            <span className="text-2xl font-black">{nutritionData.fat}g</span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Fat</span>
          </div>
        </div>
      </section>

      {/* ── AI Recommendation ── Stitch lines 159-187 */}
      <section>
        {/* TODO: Connect to real AI recommendation data when available */}
        <NomMigoCard
          dishName="Miso-Glazed Salmon Bowl"
          description="Perfect protein hit for your muscle recovery goals today."
          badges={['420 kcal', 'High Protein']}
          ctaLabel="Log this Nom"
          onCtaClick={() => {
            openQuickAddWith({
              mealName: 'Miso-Glazed Salmon Bowl',
              calories: 420,
              protein: 38,
              carbs: 42,
              fat: 12,
            });
          }}
        />
      </section>

      {/* ── Today's Meals ── Stitch lines 189-229: section.space-y-4 */}
      <section className="space-y-4">
        {/* Stitch: flex justify-between items-end px-1 */}
        <div className="flex justify-between items-end px-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-nm-text">Today's Meals</h2>
          <button onClick={() => onNavigate('diary')} className="text-xs font-bold uppercase tracking-widest text-nm-signature">View All</button>
        </div>
        {/* Stitch: flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar */}
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6" style={{ scrollbarWidth: 'none' }}>
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              mealType={MEAL_TYPE_LABELS[meal.meal_type || ''] || meal.meal_type || 'Meal'}
              mealName={meal.meal_name}
              calories={meal.estimated_calories || 0}
              onClick={() => onNavigate('diary')}
            />
          ))}
          {/* Empty state cards for expected meals not yet logged */}
          {expectedSlots
            .filter(slot => !loggedTypes.has(slot.type))
            .map(slot => (
              <button
                key={slot.type}
                onClick={() => onNavigate('diary')}
                className="min-w-[180px] bg-white rounded-[2rem] p-4 shrink-0 text-left border-dashed border-2 border-nm-signature/20 space-y-3"
              >
                <div className="w-full h-32 rounded-[2rem] bg-nm-surface-low flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-nm-text/10">add_circle</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-nm-text/50 uppercase tracking-widest block mb-1">{slot.label}</span>
                  <h4 className="font-extrabold text-sm text-nm-text/30">Not logged yet</h4>
                  <p className="text-sm font-bold text-nm-signature mt-1">Log {slot.label}</p>
                </div>
              </button>
            ))}
        </div>
      </section>

      {/* ── Discovery Card ── Stitch lines 231-248: bg-secondary-container text-on-secondary-container rounded-lg p-8 flex justify-between items-center */}
      <section>
        <button
          onClick={() => setShowFinder(true)}
          className="w-full bg-nm-accent text-nm-text rounded-[2rem] p-8 flex justify-between items-center relative overflow-hidden text-left"
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[160px]">restaurant</span>
          </div>
          <div className="relative z-10 max-w-[60%]">
            <h2 className="text-2xl font-black leading-tight">Tired of cooking?</h2>
            <p className="text-sm font-bold opacity-80 mt-2">Find a restaurant that fits your macro goals near you.</p>
            <span className="inline-block mt-6 px-6 py-3 bg-nm-text text-nm-accent rounded-full text-xs font-black uppercase tracking-widest">
              Explore Places
            </span>
          </div>
          <div className="w-24 h-24 bg-nm-text/10 rounded-full flex items-center justify-center relative z-10">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          </div>
        </button>
      </section>

      {/* ── Upcoming Events ── */}
      {upcomingEvents.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-nm-text px-1">Upcoming Plans</h2>
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              className="bg-nm-surface-lowest rounded-nm p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-nm-text">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-nm-text/50">
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
                    <p className="text-sm text-nm-signature font-medium mt-1">
                      {event.restaurantName}
                    </p>
                  ) : (
                    <p className="text-sm text-nm-accent mt-1">Still deciding on a restaurant</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-nm-text/30" />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Friend Requests ── */}
      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold text-nm-text px-1">Friend Requests</h2>
          {pendingRequests.map(request => (
            <div
              key={request.id}
              className="bg-nm-surface-lowest rounded-nm p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-nm-surface rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-nm-signature" />
                  </div>
                  <div>
                    <p className="font-bold text-nm-text">{request.displayName}</p>
                    <p className="text-sm text-nm-text/50">wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFriendRequest(request.id, true)}
                    className="w-9 h-9 bg-nm-surface rounded-full flex items-center justify-center hover:bg-nm-surface-high transition-colors"
                  >
                    <Check className="w-5 h-5 text-nm-signature" />
                  </button>
                  <button
                    onClick={() => handleFriendRequest(request.id, false)}
                    className="w-9 h-9 bg-nm-surface-high rounded-full flex items-center justify-center hover:bg-nm-surface-highest transition-colors"
                  >
                    <X className="w-5 h-5 text-nm-text/50" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Group Dinner CTA (when no events) ── */}
      {upcomingEvents.length === 0 && (
        <section>
          <button
            onClick={() => setShowFinder(true)}
            className="w-full bg-nm-surface-low rounded-nm p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-nm-surface rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-nm-signature" />
              </div>
              <div className="text-left">
                <p className="font-bold text-nm-text">Plan a group dinner?</p>
                <p className="text-sm text-nm-text/50">Find the perfect spot for everyone</p>
              </div>
            </div>
          </button>
        </section>
      )}

      {/* Restaurant Finder Sheet */}
      <RestaurantFinderSheet
        isOpen={showFinder}
        onClose={() => setShowFinder(false)}
        friends={friends}
        onSearch={handleRestaurantSearch}
      />
    </div>
  );
}
