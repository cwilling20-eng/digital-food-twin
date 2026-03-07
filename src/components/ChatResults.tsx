import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Loader2, ClipboardList, X, MapPin, AlertCircle, Wifi, WifiOff, Utensils, Users, UserPlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { useGeolocation, type GeoLocation, type LocationStatus } from '../hooks/useGeolocation';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserFoodDNA, type UserFoodDNA } from '../utils/fetchUserFoodDNA';
import type { ComprehensiveUserProfile, DiningContext, FriendFoodDna, PublicProfile } from '../types';

const N8N_WEBHOOK_URL = 'https://exponentmarketing.app.n8n.cloud/webhook/chat';
const N8N_NUTRITION_URL = 'https://exponentmarketing.app.n8n.cloud/webhook/estimate-nutrition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TodayProgress {
  calories_consumed: number;
  protein_consumed: number;
  carbs_consumed: number;
  fat_consumed: number;
  meals_logged: number;
}

interface ChatResultsProps {
  initialAnalysis?: string;
  userProfile: ComprehensiveUserProfile;
  deviceId: string;
  onBack: () => void;
  diningContext?: DiningContext;
  autoMessage?: string;
  onLogMeal?: () => void;
}

interface FriendMatch {
  id: string;
  displayName: string;
  username: string | null;
}

interface NutritionEstimate {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}

type Feeling = 'Energized' | 'Satisfied' | 'Bloated' | 'Regret' | 'Hungry';
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const FEELINGS: { label: Feeling; emoji: string }[] = [
  { label: 'Energized', emoji: '⚡️' },
  { label: 'Satisfied', emoji: '🙂' },
  { label: 'Bloated', emoji: '🎈' },
  { label: 'Regret', emoji: '🤢' },
  { label: 'Hungry', emoji: '🤤' }
];

const MEAL_TYPES: { label: MealType; emoji: string; display: string }[] = [
  { label: 'breakfast', emoji: '🌅', display: 'Breakfast' },
  { label: 'lunch', emoji: '☀️', display: 'Lunch' },
  { label: 'dinner', emoji: '🌙', display: 'Dinner' },
  { label: 'snack', emoji: '🍿', display: 'Snack' }
];

function getMealTypeFromTime(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 17) return 'snack';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'snack';
}

// Toast component for location feedback
interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  onDismiss?: () => void;
}

function Toast({ message, type, icon, onDismiss }: ToastProps) {
  const bgColors = {
    info: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600'
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 ${bgColors[type]} text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-down max-w-[90vw]`}>
      {icon}
      <span className="text-sm font-medium">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 hover:bg-white/20 rounded-full p-1">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Location status indicator component
function LocationIndicator({ status, location }: { status: LocationStatus; location: GeoLocation | null }) {
  if (status === 'idle' && !location) return null;

  const getStatusDisplay = () => {
    switch (status) {
      case 'requesting':
        return { icon: <MapPin className="w-4 h-4 animate-pulse" />, text: 'Requesting...', color: 'text-blue-500' };
      case 'acquiring_gps':
        return { icon: <MapPin className="w-4 h-4 animate-bounce" />, text: 'GPS...', color: 'text-blue-500' };
      case 'falling_back':
        return { icon: <Wifi className="w-4 h-4 animate-pulse" />, text: 'Network...', color: 'text-amber-500' };
      case 'success':
        if (location?.source === 'gps') {
          return { icon: <MapPin className="w-4 h-4" />, text: 'GPS', color: 'text-emerald-500' };
        } else if (location?.source === 'network') {
          return { icon: <Wifi className="w-4 h-4" />, text: 'Network', color: 'text-emerald-500' };
        } else if (location?.source === 'ip_fallback') {
          return { icon: <Wifi className="w-4 h-4" />, text: 'Approximate', color: 'text-amber-500' };
        }
        return { icon: <MapPin className="w-4 h-4" />, text: 'Located', color: 'text-emerald-500' };
      case 'denied':
        return { icon: <WifiOff className="w-4 h-4" />, text: 'Denied', color: 'text-red-500' };
      case 'unavailable':
      case 'timeout':
        return { icon: <AlertCircle className="w-4 h-4" />, text: 'Unavailable', color: 'text-red-500' };
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  return (
    <div className={`flex items-center gap-1 ${display.color}`} title={location ? `${location.lat.toFixed(4)}, ${location.long.toFixed(4)} (±${Math.round(location.accuracy)}m)` : ''}>
      {display.icon}
      <span className="text-xs font-medium">{display.text}</span>
    </div>
  );
}

// Nutrition Preview Card Component
function NutritionPreview({ 
  nutrition, 
  isLoading, 
  mealName 
}: { 
  nutrition: NutritionEstimate | null; 
  isLoading: boolean;
  mealName: string;
}) {
  if (!mealName.trim()) return null;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-center gap-2 text-emerald-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Estimating nutrition...</span>
        </div>
      </div>
    );
  }

  if (!nutrition) return null;

  const confidenceColors = {
    low: 'text-amber-600 bg-amber-50',
    medium: 'text-emerald-600 bg-emerald-50',
    high: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Estimated Nutrition</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColors[nutrition.confidence]}`}>
          {nutrition.confidence} confidence
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{nutrition.calories}</div>
          <div className="text-xs text-gray-500">Calories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{nutrition.protein_g}g</div>
          <div className="text-xs text-gray-500">Protein</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{nutrition.carbs_g}g</div>
          <div className="text-xs text-gray-500">Carbs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-rose-600">{nutrition.fat_g}g</div>
          <div className="text-xs text-gray-500">Fat</div>
        </div>
      </div>

      {nutrition.notes && (
        <p className="text-xs text-gray-500 mt-3 italic">{nutrition.notes}</p>
      )}
    </div>
  );
}

export function ChatResults({ initialAnalysis, userProfile, deviceId, onBack, diningContext, autoMessage, onLogMeal }: ChatResultsProps) {
  console.log("ChatResults mounted with props:", { autoMessage, diningContext });
  const { nutritionGoals, bodyMetrics } = useApp();
  const { user } = useAuth();
  const { location, status: locationStatus, statusMessage, error: locationError, requestLocation, clearError } = useGeolocation();
  const autoMessageSentRef = useRef(false);

  const [foodDna, setFoodDna] = useState<UserFoodDNA | null>(null);
  const [foodDnaLoaded, setFoodDnaLoaded] = useState(false);
  const [groupDining, setGroupDining] = useState<DiningContext | null>(diningContext || null);
  const [friendsList, setFriendsList] = useState<FriendMatch[]>([]);
  const [friendFoodDna, setFriendFoodDna] = useState<FriendFoodDna[]>([]);
  const [friendFoodDnaLoaded, setFriendFoodDnaLoaded] = useState(false);
  const [friendAddedToast, setFriendAddedToast] = useState<string | null>(null);
  const [showAddFriendPrompt, setShowAddFriendPrompt] = useState<{ name: string; show: boolean } | null>(null);
  const hasInitializedRef = useRef(false);

  const getGroupDiningMessage = () => {
    if (!groupDining?.isGroupDining || groupDining.selectedFriendNames.length === 0) {
      return null;
    }
    const names = groupDining.selectedFriendNames;
    const mealType = groupDining.mealType || 'dinner';
    if (names.length === 1) {
      return `Hi! I'm finding ${mealType} spots for you and ${names[0]}. I'll consider both of your food preferences to find the perfect match!`;
    }
    const lastPerson = names[names.length - 1];
    const otherPeople = names.slice(0, -1).join(', ');
    return `Hi! I'm finding ${mealType} spots for you, ${otherPeople}, and ${lastPerson}. I'll consider everyone's food preferences to find the perfect match!`;
  };

  const defaultMessage = getGroupDiningMessage() || initialAnalysis || "Hi! I'm your Food Concierge. I can help you find lunch, track calories, or plan your next meal. What's on your mind?";

  const [todayProgress, setTodayProgress] = useState<TodayProgress>({
    calories_consumed: 0, protein_consumed: 0, carbs_consumed: 0, fat_consumed: 0, meals_logged: 0
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: defaultMessage,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMealToast, setShowMealToast] = useState(false);
  const [locationToast, setLocationToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  
  // Nutrition estimation state
  const [nutritionEstimate, setNutritionEstimate] = useState<NutritionEstimate | null>(null);
  const [isEstimatingNutrition, setIsEstimatingNutrition] = useState(false);
  const nutritionDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const loadFriendsList = useCallback(async () => {
    const { data: friendsData } = await supabase
      .from('user_friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${deviceId},friend_id.eq.${deviceId}`)
      .eq('status', 'accepted');

    if (!friendsData || friendsData.length === 0) return;

    const friendIds = friendsData.map(f => f.user_id === deviceId ? f.friend_id : f.user_id);

    const { data: profiles } = await supabase
      .from('user_public_profiles')
      .select('id, display_name, username')
      .in('id', friendIds);

    if (profiles) {
      setFriendsList(profiles.map(p => ({
        id: p.id,
        displayName: p.display_name || `User ${p.id.slice(0, 6)}`,
        username: p.username
      })));
    }
  }, [deviceId]);

  const loadFriendFoodDna = useCallback(async (friendIds: string[]) => {
    if (friendIds.length === 0) return;

    console.log("Loading Food DNA for friends:", friendIds);
    const dnaData: FriendFoodDna[] = [];

    for (const friendId of friendIds) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_public_profiles')
          .select('id, display_name, username, share_food_dna')
          .eq('id', friendId)
          .maybeSingle();

        console.log(`Profile for friend ${friendId}:`, { profileData, profileError });

        const displayName = profileData?.display_name || profileData?.username || 'Friend';
        const sharesFoodDna = profileData?.share_food_dna ?? true;

        if (!sharesFoodDna) {
          console.log(`Friend ${displayName} does not share Food DNA`);
          dnaData.push({
            userId: friendId,
            displayName,
            shared: false,
            favoriteCuisines: [],
            restrictions: [],
            allergies: []
          });
          continue;
        }

        const fullFoodDna = await fetchUserFoodDNA(friendId);

        if (fullFoodDna) {
          dnaData.push({
            userId: friendId,
            displayName,
            shared: true,
            foodDna: fullFoodDna,
            favoriteCuisines: Object.keys(fullFoodDna.cuisineExpertise),
            restrictions: fullFoodDna.dietaryConstraints.restrictions,
            allergies: fullFoodDna.dietaryConstraints.allergies
          });
          console.log(`Loaded Food DNA for ${displayName}:`, fullFoodDna);
        } else {
          dnaData.push({
            userId: friendId,
            displayName,
            shared: true,
            favoriteCuisines: [],
            restrictions: [],
            allergies: []
          });
        }
      } catch (error) {
        console.error(`Error loading Food DNA for friend ${friendId}:`, error);
      }
    }

    console.log("Friend Food DNA loaded:", dnaData);
    setFriendFoodDna(dnaData);
    setFriendFoodDnaLoaded(true);
  }, []);

  useEffect(() => {
    loadFriendsList();
  }, [loadFriendsList]);

  useEffect(() => {
    console.log("Group dining useEffect triggered:", {
      isGroupDining: groupDining?.isGroupDining,
      selectedFriendIds: groupDining?.selectedFriendIds
    });
    if (groupDining?.isGroupDining && groupDining.selectedFriendIds.length > 0) {
      console.log("Calling loadFriendFoodDna with:", groupDining.selectedFriendIds);
      loadFriendFoodDna(groupDining.selectedFriendIds);
    } else {
      setFriendFoodDnaLoaded(true);
    }
  }, [groupDining, loadFriendFoodDna]);

  useEffect(() => {
    const loadUserFoodDna = async () => {
      console.log("loadUserFoodDna called - user?.id:", user?.id, "deviceId:", deviceId);
      const userId = user?.id || deviceId;
      if (!userId) {
        console.warn("No user ID available for Food DNA fetch");
        setFoodDnaLoaded(true);
        return;
      }
      console.log("Fetching Food DNA for user:", userId);
      try {
        const dna = await fetchUserFoodDNA(userId);
        console.log("fetchUserFoodDNA returned:", dna);
        if (dna) {
          setFoodDna(dna);
          console.log("Food DNA set in state:", dna);
        } else {
          console.warn("No Food DNA found for user:", userId);
        }
      } catch (error) {
        console.error("Error fetching user Food DNA:", error);
      } finally {
        setFoodDnaLoaded(true);
      }
    };
    loadUserFoodDna();
  }, [user?.id, deviceId]);

  const matchFriendName = useCallback((text: string): FriendMatch | null => {
    const lowerText = text.toLowerCase();
    for (const friend of friendsList) {
      const displayLower = friend.displayName.toLowerCase();
      const firstName = displayLower.split(' ')[0];
      if (lowerText.includes(displayLower) || lowerText.includes(firstName)) {
        const isAlreadyAdded = groupDining?.selectedFriendIds.includes(friend.id);
        if (!isAlreadyAdded) {
          return friend;
        }
      }
    }
    return null;
  }, [friendsList, groupDining]);

  const addFriendToGroup = useCallback((friend: FriendMatch) => {
    setGroupDining(prev => {
      if (!prev) {
        return {
          isGroupDining: true,
          selectedFriendIds: [friend.id],
          selectedFriendNames: [friend.displayName]
        };
      }
      return {
        ...prev,
        isGroupDining: true,
        selectedFriendIds: [...prev.selectedFriendIds, friend.id],
        selectedFriendNames: [...prev.selectedFriendNames, friend.displayName]
      };
    });
    setFriendAddedToast(friend.displayName);
    setTimeout(() => setFriendAddedToast(null), 3000);
    loadFriendFoodDna([friend.id]);
  }, [loadFriendFoodDna]);

  const extractPossibleName = useCallback((text: string): string | null => {
    const patterns = [
      /with\s+(\w+)/i,
      /invite\s+(\w+)/i,
      /add\s+(\w+)/i,
      /include\s+(\w+)/i,
      /bring\s+(\w+)/i,
      /(\w+)\s+is coming/i,
      /(\w+)\s+is joining/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1];
        const excludeWords = ['me', 'us', 'you', 'them', 'a', 'the', 'my', 'your', 'our', 'this', 'that', 'it'];
        if (!excludeWords.includes(name.toLowerCase())) {
          return name;
        }
      }
    }
    return null;
  }, []);

  // Debounced nutrition estimation
  const estimateNutrition = useCallback(async (meal: string) => {
    if (!meal.trim() || meal.length < 3) {
      setNutritionEstimate(null);
      return;
    }

    setIsEstimatingNutrition(true);

    try {
      const response = await fetch(N8N_NUTRITION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_name: meal.trim() })
      });

      if (!response.ok) throw new Error('Failed to estimate nutrition');

      const data = await response.json();
      
      // Handle array response (n8n sometimes wraps in array)
      const nutrition = Array.isArray(data) ? data[0] : data;
      setNutritionEstimate(nutrition);
    } catch (error) {
      console.error('Nutrition estimation error:', error);
      setNutritionEstimate(null);
    } finally {
      setIsEstimatingNutrition(false);
    }
  }, []);

  // Handle meal name changes with debounce
  const handleMealNameChange = (value: string) => {
    setMealName(value);
    
    // Clear previous debounce
    if (nutritionDebounceRef.current) {
      clearTimeout(nutritionDebounceRef.current);
    }

    // Reset nutrition if cleared
    if (!value.trim()) {
      setNutritionEstimate(null);
      return;
    }

    // Debounce nutrition estimation (500ms)
    nutritionDebounceRef.current = setTimeout(() => {
      estimateNutrition(value);
    }, 500);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (nutritionDebounceRef.current) {
        clearTimeout(nutritionDebounceRef.current);
      }
    };
  }, []);

  const fetchTodayProgress = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('estimated_calories, protein_g, carbs_g, fat_g')
      .eq('user_id', deviceId)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (error) {
      console.error('Error fetching today meals:', error);
      return;
    }

    const progress: TodayProgress = {
      calories_consumed: 0, protein_consumed: 0, carbs_consumed: 0, fat_consumed: 0, meals_logged: data?.length || 0
    };

    for (const meal of data || []) {
      progress.calories_consumed += meal.estimated_calories || 0;
      progress.protein_consumed += meal.protein_g || 0;
      progress.carbs_consumed += meal.carbs_g || 0;
      progress.fat_consumed += meal.fat_g || 0;
    }

    setTodayProgress(progress);
  }, [deviceId]);

  useEffect(() => {
    fetchTodayProgress();
  }, [fetchTodayProgress]);

  const ensureLocation = useCallback(async (): Promise<GeoLocation | null> => {
    if (location && locationStatus === 'success') {
      return location;
    }

    const result = await requestLocation();

    if (result) {
      if (result.source === 'gps') {
        setLocationToast({ message: `GPS location acquired (±${Math.round(result.accuracy)}m)`, type: 'success' });
      } else if (result.source === 'network') {
        setLocationToast({ message: 'Using network location', type: 'success' });
      } else if (result.source === 'ip_fallback') {
        setLocationToast({ message: 'Using approximate location (city-level)', type: 'warning' });
      }
    } else {
      setLocationToast({ message: 'Location unavailable - results may vary', type: 'warning' });
    }

    setTimeout(() => setLocationToast(null), 3000);
    return result;
  }, [location, locationStatus, requestLocation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (locationError) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [locationError, clearError]);

  const sendMessage = useCallback(async (messageText: string) => {
    console.log("sendMessage called with:", messageText, "isTyping:", isTyping);
    if (!messageText.trim() || isTyping) {
      console.log("sendMessage early return - empty or typing");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    const matchedFriend = matchFriendName(messageText);
    if (matchedFriend) {
      addFriendToGroup(matchedFriend);
      const friendAddedMessage: Message = {
        id: (Date.now() + 0.5).toString(),
        role: 'assistant',
        content: `I found **${matchedFriend.displayName}** in your friends - I'll include their food preferences in my recommendations!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, friendAddedMessage]);
    } else {
      const possibleName = extractPossibleName(messageText);
      if (possibleName) {
        setShowAddFriendPrompt({ name: possibleName, show: true });
      }
    }

    const coords = await ensureLocation();
    setIsTyping(true);

    try {
      const payload: Record<string, unknown> = {
        chatInput: messageText,
        sessionId: sessionIdRef.current,
        device_id: deviceId,
        userProfile: foodDna || userProfile,
        foodDna: foodDna,
        nutritionStatus: {
          goals: {
            calorie_goal: nutritionGoals.calorieGoal,
            protein_goal: nutritionGoals.proteinGoal,
            carbs_goal: nutritionGoals.carbsGoal,
            fat_goal: nutritionGoals.fatGoal,
          },
          todayProgress: {
            calories_consumed: Math.round(todayProgress.calories_consumed),
            protein_consumed: Math.round(todayProgress.protein_consumed),
            carbs_consumed: Math.round(todayProgress.carbs_consumed),
            fat_consumed: Math.round(todayProgress.fat_consumed),
            meals_logged: todayProgress.meals_logged,
          },
          remaining: {
            calories: Math.max(0, nutritionGoals.calorieGoal - todayProgress.calories_consumed),
            protein: Math.max(0, nutritionGoals.proteinGoal - todayProgress.protein_consumed),
            carbs: Math.max(0, nutritionGoals.carbsGoal - todayProgress.carbs_consumed),
            fat: Math.max(0, nutritionGoals.fatGoal - todayProgress.fat_consumed),
          },
          bodyStats: {
            current_weight: bodyMetrics.currentWeight,
            goal_weight: bodyMetrics.goalWeight,
          },
        },
        userLocation: {
          lat: coords?.lat ?? null,
          long: coords?.long ?? null,
          accuracy: coords?.accuracy ?? null,
          source: coords?.source ?? null
        },
        lat: coords?.lat ?? null,
        long: coords?.long ?? null,
        menuContext: initialAnalysis || null
      };

      if (groupDining?.isGroupDining) {
        console.log("Building dining context with:", {
          selectedFriendIds: groupDining.selectedFriendIds,
          selectedFriendNames: groupDining.selectedFriendNames,
          friendFoodDnaState: friendFoodDna
        });
        payload.diningContext = {
          isGroupDining: true,
          selectedFriendIds: groupDining.selectedFriendIds,
          selectedFriendNames: groupDining.selectedFriendNames,
          mealType: groupDining.mealType || 'dinner',
          cuisinePreference: groupDining.cuisinePreference || 'surprise_me',
          friendFoodDna: friendFoodDna
        };
      }

      console.log("Making API request to:", N8N_WEBHOOK_URL);
      console.log("Payload foodDna:", foodDna);
      console.log("Payload diningContext:", payload.diningContext);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log("API response status:", response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

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
  }, [isTyping, matchFriendName, addFriendToGroup, extractPossibleName, ensureLocation, deviceId, userProfile, foodDna, nutritionGoals, todayProgress, bodyMetrics, initialAnalysis, groupDining, friendFoodDna]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    const messageText = inputMessage.trim();
    setInputMessage('');
    sendMessage(messageText);
  };

  useEffect(() => {
    console.log("useEffect for autoMessage triggered:", {
      autoMessage,
      alreadySent: autoMessageSentRef.current,
      foodDnaLoaded,
      friendFoodDnaLoaded
    });
    if (autoMessage && !autoMessageSentRef.current && foodDnaLoaded && friendFoodDnaLoaded) {
      autoMessageSentRef.current = true;
      console.log("Sending autoMessage now that data is loaded:", autoMessage);
      console.log("Current foodDna:", foodDna);
      console.log("Current friendFoodDna:", friendFoodDna);
      sendMessage(autoMessage);
    }
  }, [autoMessage, sendMessage, foodDnaLoaded, friendFoodDnaLoaded, foodDna, friendFoodDna]);

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
      const mealLogData: any = {
        user_id: deviceId,
        meal_name: mealName.trim(),
        feeling: selectedFeeling,
        notes: notes.trim() || null,
        meal_type: selectedMealType || getMealTypeFromTime()
      };

      // Add nutrition data if available
      if (nutritionEstimate) {
        mealLogData.estimated_calories = nutritionEstimate.calories;
        mealLogData.protein_g = nutritionEstimate.protein_g;
        mealLogData.carbs_g = nutritionEstimate.carbs_g;
        mealLogData.fat_g = nutritionEstimate.fat_g;
        mealLogData.fiber_g = nutritionEstimate.fiber_g;
        mealLogData.sugar_g = nutritionEstimate.sugar_g;
        mealLogData.sodium_mg = nutritionEstimate.sodium_mg;
      }

      console.log('💾 Saving meal to Supabase:', mealLogData);

      const { error } = await supabase
        .from('meal_logs')
        .insert(mealLogData);

      if (error) {
        console.error('❌ Error saving meal log:', error);
        alert(`Failed to save meal log: ${error.message}`);
        return;
      }

      console.log('Meal log saved successfully');
      fetchTodayProgress();

      setShowLogModal(false);
      setMealName('');
      setSelectedFeeling(null);
      setSelectedMealType(null);
      setNotes('');
      setNutritionEstimate(null);
      setShowMealToast(true);

      setTimeout(() => setShowMealToast(false), 3000);
    } catch (error) {
      console.error('❌ Exception saving meal log:', error);
      alert(`Failed to save meal log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset modal state when closing
  const handleCloseModal = () => {
    setShowLogModal(false);
    setMealName('');
    setSelectedFeeling(null);
    setSelectedMealType(null);
    setNotes('');
    setNutritionEstimate(null);
  };

  const isLocating = ['requesting', 'acquiring_gps', 'falling_back'].includes(locationStatus);
  const isInputDisabled = isTyping || isLocating;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Location Toast */}
      {locationToast && (
        <Toast 
          message={locationToast.message} 
          type={locationToast.type}
          icon={<MapPin className="w-4 h-4 flex-shrink-0" />}
          onDismiss={() => setLocationToast(null)}
        />
      )}

      {/* Location Error Toast */}
      {locationError && (
        <Toast 
          message={locationError} 
          type="error"
          icon={<AlertCircle className="w-4 h-4 flex-shrink-0" />}
          onDismiss={clearError}
        />
      )}

      {/* Friend Added Toast */}
      {friendAddedToast && (
        <Toast
          message={`${friendAddedToast}'s preferences added to search!`}
          type="success"
          icon={<UserPlus className="w-4 h-4 flex-shrink-0" />}
          onDismiss={() => setFriendAddedToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Food Twin Assistant
            <LocationIndicator status={locationStatus} location={location} />
          </h1>
          <p className="text-xs text-gray-500">AI-powered recommendations</p>
        </div>
        <button
          onClick={() => {
            if (onLogMeal) {
              onLogMeal();
            } else {
              setSelectedMealType(getMealTypeFromTime());
              setShowLogModal(true);
            }
          }}
          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Log Meal</span>
        </button>
      </div>

      {/* Group Dining Banner */}
      {groupDining?.isGroupDining && groupDining.selectedFriendNames.length > 0 && (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">
              Finding restaurants for you{groupDining.selectedFriendNames.length > 0 && (
                <> and {groupDining.selectedFriendNames.join(', ')}</>
              )}
            </p>
            <p className="text-white/80 text-xs">
              {friendFoodDna.length > 0
                ? `Considering ${friendFoodDna.length} friend's food preferences`
                : 'Add more friends by mentioning their name'}
            </p>
          </div>
        </div>
      )}

      {/* Add Friend Prompt */}
      {showAddFriendPrompt?.show && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between flex-shrink-0 animate-slide-down">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              I don't see "{showAddFriendPrompt.name}" in your friends list
            </p>
          </div>
          <button
            onClick={() => setShowAddFriendPrompt(null)}
            className="text-amber-600 hover:text-amber-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-44 space-y-4">
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

      {/* Input Area */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 safe-area-inset max-w-md mx-auto">
        {isLocating && (
          <div className="flex items-center justify-center gap-2 mb-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg animate-fade-in border border-blue-100">
            <MapPin className="w-4 h-4 flex-shrink-0 animate-pulse text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              {statusMessage || 'Acquiring location...'}
            </span>
          </div>
        )}
        
        <div className="flex items-end gap-2 max-w-md mx-auto">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={initialAnalysis ? "Ask a follow-up question..." : "Type your message..."}
              disabled={isInputDisabled}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isInputDisabled}
            className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors active:scale-95"
          >
            {isLocating ? (
              <MapPin className="w-5 h-5 text-white animate-pulse" />
            ) : isTyping ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Log Meal Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-500" />
                Log Meal
              </h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Meal Name Input */}
              <div>
                <label htmlFor="meal-name" className="block text-sm font-medium text-gray-700 mb-2">
                  What did you eat?
                </label>
                <input
                  id="meal-name"
                  type="text"
                  value={mealName}
                  onChange={(e) => handleMealNameChange(e.target.value)}
                  placeholder="e.g., Spicy Thai Basil Chicken with Rice"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                />
              </div>

              {/* Nutrition Preview */}
              <NutritionPreview 
                nutrition={nutritionEstimate}
                isLoading={isEstimatingNutrition}
                mealName={mealName}
              />

              {/* Meal Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Meal type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type.label}
                      onClick={() => setSelectedMealType(type.label)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        selectedMealType === type.label
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl mb-1">{type.emoji}</span>
                      <span className="text-xs text-gray-700 font-medium text-center leading-tight">
                        {type.display}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feeling Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How do you feel after eating?
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

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional thoughts about this meal?"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Save Button */}
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
                  <>
                    Save Meal
                    {nutritionEstimate && (
                      <span className="text-emerald-200 font-normal">
                        ({nutritionEstimate.calories} cal)
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal Saved Toast */}
      {showMealToast && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-medium">Meal logged! I'll remember this for your recommendations.</span>
        </div>
      )}
    </div>
  );
}
