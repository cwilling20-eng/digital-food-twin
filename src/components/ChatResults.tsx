import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Loader2, ClipboardList, X, MapPin, AlertCircle, Wifi, WifiOff, Utensils, Users, UserPlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useGeolocation, type GeoLocation, type LocationStatus } from '../hooks/useGeolocation';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useMeals } from '../hooks/useMeals';
import { useFriends } from '../hooks/useFriends';
import { fetchUserFoodDNA, type UserFoodDNA } from '../utils/fetchUserFoodDNA';
import type { ComprehensiveUserProfile, DiningContext, FriendFoodDna } from '../types';
import { WEBHOOK_CHAT_URL } from '../config/api';
import { fetchNutritionEstimate, type NutritionEstimate as CachedNutritionEstimate } from '../utils/nutritionCache';
import { Toast, useErrorToast } from './ui/Toast';
import { MealNutritionInput, type MealNutritionData } from './diary/MealNutritionInput';

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
  userId: string;
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
          return { icon: <MapPin className="w-4 h-4" />, text: 'GPS', color: 'text-nm-success' };
        } else if (location?.source === 'network') {
          return { icon: <Wifi className="w-4 h-4" />, text: 'Network', color: 'text-nm-success' };
        } else if (location?.source === 'ip_fallback') {
          return { icon: <Wifi className="w-4 h-4" />, text: 'Approximate', color: 'text-amber-500' };
        }
        return { icon: <MapPin className="w-4 h-4" />, text: 'Located', color: 'text-nm-success' };
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

export function ChatResults({ initialAnalysis, userProfile, userId, onBack, diningContext, autoMessage, onLogMeal }: ChatResultsProps) {
  const { nutritionGoals, bodyMetrics } = useApp();
  const { user } = useAuth();
  const { location, status: locationStatus, statusMessage, error: locationError, requestLocation, clearError } = useGeolocation();
  const { addMeal, fetchTodayProgress: hookFetchTodayProgress } = useMeals(userId);
  const { loadAcceptedFriendsList, getFriendPublicProfile } = useFriends(userId);
  const autoMessageSentRef = useRef(false);

  const [foodDna, setFoodDna] = useState<UserFoodDNA | null>(null);
  const [foodDnaLoaded, setFoodDnaLoaded] = useState(false);
  const [groupDining, setGroupDining] = useState<DiningContext | null>(diningContext || null);
  const [friendsList, setFriendsList] = useState<FriendMatch[]>([]);
  const [friendFoodDna, setFriendFoodDna] = useState<FriendFoodDna[]>([]);
  const [friendFoodDnaLoaded, setFriendFoodDnaLoaded] = useState(false);
  const [friendAddedToast, setFriendAddedToast] = useState<string | null>(null);
  const [showAddFriendPrompt, setShowAddFriendPrompt] = useState<{ name: string; show: boolean } | null>(null);

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

  const defaultMessage = getGroupDiningMessage() || initialAnalysis || "Hi! I'm NomMigo, your food amigo. I can help you find lunch, track calories, or plan your next meal. What's on your mind?";

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
  const [showShareToast, setShowShareToast] = useState(false);
  const { errorMessage, showError, clearError: clearToastError } = useErrorToast();
  const [locationToast, setLocationToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
  
  // Nutrition estimation state
  const [nutritionEstimate, setNutritionEstimate] = useState<NutritionEstimate | null>(null);
  const [isEstimatingNutrition, setIsEstimatingNutrition] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const chatNutritionRef = useRef<MealNutritionData | null>(null);

  const loadFriendsList = useCallback(async () => {
    const friends = await loadAcceptedFriendsList();
    if (friends.length > 0) {
      setFriendsList(friends.map(f => ({
        id: f.id,
        displayName: f.displayName,
        username: null
      })));
    }
  }, [loadAcceptedFriendsList]);

  const loadFriendFoodDna = useCallback(async (friendIds: string[]) => {
    if (friendIds.length === 0) return;

    const dnaData: FriendFoodDna[] = [];

    for (const friendId of friendIds) {
      try {
        const profileData = await getFriendPublicProfile(friendId);

        const displayName = profileData?.display_name || profileData?.username || 'Friend';
        const sharesFoodDna = profileData?.share_food_dna ?? true;

        if (!sharesFoodDna) {
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

    setFriendFoodDna(dnaData);
    setFriendFoodDnaLoaded(true);
  }, [getFriendPublicProfile]);

  useEffect(() => {
    loadFriendsList();
  }, [loadFriendsList]);

  useEffect(() => {
    if (groupDining?.isGroupDining && groupDining.selectedFriendIds.length > 0) {
      loadFriendFoodDna(groupDining.selectedFriendIds);
    } else {
      setFriendFoodDnaLoaded(true);
    }
  }, [groupDining, loadFriendFoodDna]);

  useEffect(() => {
    const loadUserFoodDna = async () => {
      const id = user?.id || userId;
      if (!id) {
        console.warn("No user ID available for Food DNA fetch");
        setFoodDnaLoaded(true);
        return;
      }
      try {
        const dna = await fetchUserFoodDNA(id);
        if (dna) {
          setFoodDna(dna);
        } else {
          console.warn("No Food DNA found for user:", id);
        }
      } catch (error) {
        console.error("Error fetching user Food DNA:", error);
      } finally {
        setFoodDnaLoaded(true);
      }
    };
    loadUserFoodDna();
  }, [user?.id, userId]);

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

  // Handle meal name changes — no auto-estimation, just update state
  const handleMealNameChange = (value: string) => {
    setMealName(value);
    if (!value.trim()) {
      setNutritionEstimate(null);
    }
  };

  const fetchTodayProgress = useCallback(async () => {
    const result = await hookFetchTodayProgress();
    if (result) {
      setTodayProgress({
        calories_consumed: result.calories,
        protein_consumed: result.protein,
        carbs_consumed: result.carbs,
        fat_consumed: result.fat,
        meals_logged: result.mealsLogged,
      });
    }
  }, [hookFetchTodayProgress]);

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
    if (!messageText.trim() || isTyping) {
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
        user_id: userId,
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
        payload.diningContext = {
          isGroupDining: true,
          selectedFriendIds: groupDining.selectedFriendIds,
          selectedFriendNames: groupDining.selectedFriendNames,
          mealType: groupDining.mealType || 'dinner',
          cuisinePreference: groupDining.cuisinePreference || 'surprise_me',
          friendFoodDna: friendFoodDna
        };
      }

      const response = await fetch(WEBHOOK_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

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
  }, [isTyping, matchFriendName, addFriendToGroup, extractPossibleName, ensureLocation, userId, userProfile, foodDna, nutritionGoals, todayProgress, bodyMetrics, initialAnalysis, groupDining, friendFoodDna]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    const messageText = inputMessage.trim();
    setInputMessage('');
    sendMessage(messageText);
  };

  useEffect(() => {
    if (autoMessage && !autoMessageSentRef.current && foodDnaLoaded && friendFoodDnaLoaded) {
      autoMessageSentRef.current = true;
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
      const nd = chatNutritionRef.current;
      let totalNutrition = nd?.total ?? null;

      // If no nutrition at all, try one last fetch
      if (!totalNutrition) {
        setIsEstimatingNutrition(true);
        const fetched = await fetchNutritionEstimate(mealName.trim());
        if (fetched) totalNutrition = fetched;
        setIsEstimatingNutrition(false);
      }

      const result = await addMeal({
        meal_name: mealName.trim(),
        feeling: selectedFeeling,
        notes: notes.trim() || null,
        meal_type: selectedMealType || getMealTypeFromTime(),
        nutrition: totalNutrition ? {
          calories: totalNutrition.calories,
          protein_g: totalNutrition.protein_g,
          carbs_g: totalNutrition.carbs_g,
          fat_g: totalNutrition.fat_g,
          fiber_g: totalNutrition.fiber_g,
          sugar_g: totalNutrition.sugar_g,
          sodium_mg: totalNutrition.sodium_mg,
        } : null,
        quantity: nd?.quantity ?? 1,
        unit: nd?.unit ?? 'serving',
        nutrition_source: nd?.nutritionSource ?? 'estimated',
        per_unit_nutrition: nd?.perUnit ? {
          calories: nd.perUnit.calories,
          protein_g: nd.perUnit.protein_g,
          carbs_g: nd.perUnit.carbs_g,
          fat_g: nd.perUnit.fat_g,
          fiber_g: nd.perUnit.fiber_g,
          sugar_g: nd.perUnit.sugar_g,
          sodium_mg: nd.perUnit.sodium_mg,
        } : null,
      });

      if (result.error) {
        console.error('❌ Error saving meal log:', result.error);
        showError(`Failed to save meal log: ${result.error}`);
        return;
      }

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
      showError(`Failed to save meal log: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    chatNutritionRef.current = null;
  };

  const isLocating = ['requesting', 'acquiring_gps', 'falling_back'].includes(locationStatus);
  const isInputDisabled = isTyping || isLocating;

  return (
    <div className="h-screen bg-nm-bg flex flex-col overflow-hidden">
      {/* Error Toast */}
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          icon={<AlertCircle className="w-4 h-4 flex-shrink-0" />}
          onDismiss={clearToastError}
          duration={5000}
        />
      )}
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
      <div className="bg-nm-bg/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3 flex-shrink-0 z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-nm-text" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nm-signature to-nm-signature-light flex items-center justify-center text-white text-lg flex-shrink-0">
          😋
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-nm-text flex items-center gap-2">
            NomMigo
            <LocationIndicator status={locationStatus} location={location} />
          </h1>
          <p className="text-xs text-nm-text/40">Your food amigo</p>
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
          className="px-3 py-2 bg-gradient-to-br from-nm-signature to-nm-signature-light text-white text-sm font-bold rounded-full flex items-center gap-2 active:scale-95 transition-transform"
        >
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Log Meal</span>
        </button>
      </div>

      {/* Group Dining Banner */}
      {groupDining?.isGroupDining && groupDining.selectedFriendNames.length > 0 && (
        <div className="bg-gradient-to-r from-nm-signature to-nm-signature-light px-4 py-3 flex items-center gap-3 flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-52 space-y-4">
        {/* Empty state — shown when only the default greeting exists */}
        {messages.length <= 1 && !isTyping && (
          <div className="flex flex-col items-center justify-center py-12 select-none">
            <div className="text-8xl opacity-10 mb-6">😋</div>
            <p className="text-lg text-nm-text/40 text-center max-w-[260px] leading-relaxed">
              Scan a menu or ask me anything about food!
            </p>
          </div>
        )}

        {messages.map((message) => {
          // Show "Share to feed" on assistant messages that mention food/restaurants
          const showShare = message.role === 'assistant' && message.id !== '1' &&
            /restaurant|dish|menu|recommend|order|try|pick|calories|protein/i.test(message.content);

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`px-5 py-3.5 ${
                    message.role === 'user'
                      ? 'bg-nm-signature text-white rounded-[1.5rem] rounded-br-sm'
                      : 'bg-nm-surface-lowest text-nm-text rounded-[1.5rem] rounded-bl-sm shadow-nm-float'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-nm-text prose-headings:font-bold prose-headings:mb-2 prose-p:text-nm-text/80 prose-p:leading-relaxed prose-p:mb-3 prose-strong:text-nm-text prose-strong:font-bold prose-ul:text-nm-text/80 prose-ul:my-2 prose-ol:text-nm-text/80 prose-ol:my-2 prose-li:mb-1">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white/60' : 'text-nm-text/30'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {showShare && (
                  <button
                    onClick={() => { setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2500); }}
                    className="mt-1.5 ml-1 text-nm-signature text-sm font-bold hover:opacity-80 transition-opacity"
                  >
                    Share to feed
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-nm-surface-lowest rounded-[1.5rem] rounded-bl-sm px-5 py-3.5 shadow-nm-float">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-nm-signature rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-nm-signature/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-nm-signature/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-28 left-0 right-0 bg-nm-bg/80 backdrop-blur-xl px-4 py-3 z-40 safe-area-inset max-w-md mx-auto">
        {isLocating && (
          <div className="flex items-center justify-center gap-2 mb-2 px-4 py-2 bg-nm-surface rounded-full animate-fade-in">
            <MapPin className="w-4 h-4 flex-shrink-0 animate-pulse text-nm-signature" />
            <span className="text-xs font-bold text-nm-text/60">
              {statusMessage || 'Acquiring location...'}
            </span>
          </div>
        )}

        <div className="flex items-end gap-2 max-w-md mx-auto">
          <div className="flex-1 bg-nm-surface-high rounded-full px-5 py-3 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={initialAnalysis ? "Ask a follow-up question..." : "Type your message..."}
              disabled={isInputDisabled}
              className="flex-1 bg-transparent outline-none text-sm text-nm-text placeholder-nm-text/30 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isInputDisabled}
            className="w-12 h-12 bg-nm-signature hover:opacity-90 disabled:bg-nm-surface-high disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all active:scale-95"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-nm-surface-lowest rounded-[2rem] shadow-nm-float max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-nm-surface-lowest px-8 py-5 flex items-center justify-between rounded-t-[2rem]">
              <h2 className="text-xl font-bold text-nm-text flex items-center gap-2">
                <Utensils className="w-5 h-5 text-nm-signature" />
                Log Meal
              </h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
              >
                <X className="w-5 h-5 text-nm-text/40" />
              </button>
            </div>

            <div className="px-8 pb-8 space-y-5">
              {/* Meal Name Input */}
              <div>
                <label htmlFor="meal-name" className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">
                  What did you eat?
                </label>
                <input
                  id="meal-name"
                  type="text"
                  value={mealName}
                  onChange={(e) => handleMealNameChange(e.target.value)}
                  placeholder="e.g., Spicy Thai Basil Chicken with Rice"
                  className="w-full px-5 py-3.5 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all text-sm"
                />
              </div>

              {/* Quantity, unit, estimation, manual override */}
              <MealNutritionInput
                mealName={mealName}
                initialNutrition={nutritionEstimate}
                onChange={(data) => { chatNutritionRef.current = data; }}
              />

              {/* Meal Type Selector */}
              <div>
                <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-3">
                  Meal type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type.label}
                      onClick={() => setSelectedMealType(type.label)}
                      className={`flex flex-col items-center justify-center p-3 rounded-[2rem] transition-all active:scale-95 ${
                        selectedMealType === type.label
                          ? 'bg-nm-signature text-white shadow-nm-float'
                          : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                      }`}
                    >
                      <span className="text-2xl mb-1">{type.emoji}</span>
                      <span className="text-xs font-bold text-center leading-tight">
                        {type.display}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feeling Selector */}
              <div>
                <label className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-3">
                  How do you feel after eating?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {FEELINGS.map((feeling) => (
                    <button
                      key={feeling.label}
                      onClick={() => setSelectedFeeling(feeling.label)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-[1.5rem] transition-all active:scale-95 ${
                        selectedFeeling === feeling.label
                          ? 'bg-nm-signature text-white shadow-nm-float'
                          : 'bg-nm-surface text-nm-text hover:bg-nm-surface-high'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{feeling.emoji}</span>
                      <span className="text-[10px] font-bold text-center leading-tight">
                        {feeling.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-nm-label-md text-nm-text/60 uppercase tracking-wider mb-2">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional thoughts about this meal?"
                  rows={2}
                  className="w-full px-5 py-3.5 bg-nm-surface-high rounded-[1.5rem] text-nm-text placeholder:text-nm-text/30 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all text-sm resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveMealLog}
                disabled={!mealName.trim() || !selectedFeeling || isSaving}
                className="w-full py-4 bg-gradient-to-br from-nm-signature to-nm-signature-light disabled:opacity-40 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 active:scale-95 shadow-nm-float"
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
                      <span className="text-white/70 font-normal">
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
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">Meal logged! I'll remember this for your recommendations.</span>
        </div>
      )}

      {/* Share to Feed Toast */}
      {showShareToast && (
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 bg-nm-text text-white px-6 py-3 rounded-full shadow-nm-float z-50 flex items-center gap-2 animate-fade-in">
          <span className="text-sm font-bold">Sharing to feed coming soon!</span>
        </div>
      )}
    </div>
  );
}
