import { useState, useRef, useCallback } from 'react';
import { Heart, X, ArrowLeft, SkipForward, UtensilsCrossed, ImageOff } from 'lucide-react';
import type { FoodItem } from '../types';

interface SwipeDeckProps {
  foods: FoodItem[];
  onSwipe: (food: FoodItem, liked: boolean) => void;
  onComplete: () => void;
  onBack: () => void;
}

const PLACEHOLDER_BG = 'bg-gradient-to-br from-gray-200 to-gray-300';

function FoodImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className="relative w-full h-full">
      {status === 'loading' && (
        <div className={`absolute inset-0 ${PLACEHOLDER_BG} animate-pulse flex items-center justify-center`}>
          <UtensilsCrossed className="w-12 h-12 text-gray-400" />
        </div>
      )}
      {status === 'error' ? (
        <div className={`absolute inset-0 ${PLACEHOLDER_BG} flex flex-col items-center justify-center gap-2`}>
          <ImageOff className="w-10 h-10 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
          draggable={false}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  );
}

export function SwipeDeck({ foods, onSwipe, onComplete, onBack }: SwipeDeckProps) {
  const [snapshot] = useState(() => [...foods]);
  const total = snapshot.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const currentFood = currentIndex < total ? snapshot[currentIndex] : null;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;

  const advanceCard = useCallback((liked: boolean) => {
    if (isAnimating || !currentFood) return;
    setIsAnimating(true);

    try {
      onSwipe(currentFood, liked);
    } catch (err) {
      console.error('Error in onSwipe callback:', err);
    }

    setSwipeDirection(liked ? 'right' : 'left');

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSwipeDirection(null);
      setDragOffset(0);
      setIsAnimating(false);

      if (nextIndex >= total) {
        setShowCompletion(true);
        setTimeout(() => {
          try {
            onComplete();
          } catch (err) {
            console.error('Error in onComplete callback:', err);
          }
        }, 1500);
      }
    }, 300);
  }, [isAnimating, currentFood, currentIndex, total, onSwipe, onComplete]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isAnimating) return;
    const diff = e.touches[0].clientX - startX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 100) {
      advanceCard(dragOffset > 0);
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isAnimating) return;
    const diff = e.clientX - startX.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragOffset) > 100) {
      advanceCard(dragOffset > 0);
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

  const handleSkip = () => {
    try {
      onComplete();
    } catch (err) {
      console.error('Error in skip/complete:', err);
    }
  };

  if (showCompletion || (!currentFood && currentIndex >= total)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Heart className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
          <p className="text-gray-500">Building your taste profile...</p>
          <div className="mt-6">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentFood) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No foods to show</p>
          <button onClick={handleSkip} className="text-emerald-600 font-medium">
            Continue to Dashboard
          </button>
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

  const isAllergen = currentFood.id.startsWith('allergen-');

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
            {currentIndex + 1} of {total}
          </span>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip</span>
          </button>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1 text-center">
          {isAllergen ? 'Are you allergic to this?' : 'Would you eat this?'}
        </h2>
        {isAllergen && (
          <p className="text-sm text-amber-600 mb-4 text-center">
            Swipe left if you have an allergy or intolerance
          </p>
        )}
        {!isAllergen && <div className="mb-5" />}

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
              <FoodImage src={currentFood.image_url} alt={currentFood.name} />

              <div
                className="absolute inset-0 bg-emerald-500 flex items-center justify-center transition-opacity pointer-events-none"
                style={{ opacity: likeOpacity * 0.8 }}
              >
                <Heart className="w-24 h-24 text-white" fill="white" />
              </div>

              <div
                className="absolute inset-0 bg-red-500 flex items-center justify-center transition-opacity pointer-events-none"
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
                {currentFood.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      isAllergen
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
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
            onClick={() => advanceCard(false)}
            disabled={isAnimating}
            className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <X className="w-8 h-8 text-red-500" />
          </button>

          <button
            onClick={() => advanceCard(true)}
            disabled={isAnimating}
            className="w-20 h-20 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <Heart className="w-10 h-10 text-white" fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
