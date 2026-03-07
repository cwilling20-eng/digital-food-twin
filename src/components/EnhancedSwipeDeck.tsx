import { useState } from 'react';
import { X, Heart, ChevronLeft, Flame, Cookie, Fish, Salad, Tag, ImageOff, UtensilsCrossed } from 'lucide-react';
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

function EnhancedFoodImage({ src, alt, className = 'w-full h-full object-cover' }: { src: string; alt: string; className?: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <div className="relative w-full h-full">
      {status === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <UtensilsCrossed className="w-12 h-12 text-gray-400" />
        </div>
      )}
      {status === 'error' ? (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center gap-2">
          <ImageOff className="w-10 h-10 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  );
}

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
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <EnhancedFoodImage src={pendingFood.image_url} alt={pendingFood.name} className="w-16 h-16 rounded-xl object-cover" />
          </div>
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
              <EnhancedFoodImage src={currentFood.image_url} alt={currentFood.name} />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                <h2 className="text-3xl font-bold text-white mb-2">{currentFood.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {currentFood.tags?.map(tag => (
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
