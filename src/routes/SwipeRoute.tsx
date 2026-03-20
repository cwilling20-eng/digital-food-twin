import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { SwipeDeck } from '../components/SwipeDeck';
import { ONBOARDING_FOODS } from '../data/foods';
import type { FoodItem } from '../types';

export function SwipeRoute() {
  const navigate = useNavigate();
  const { profile, saveProfile } = useProfile();
  const [likedFoods, setLikedFoods] = useState<FoodItem[]>([]);

  const handleSwipe = (food: FoodItem, liked: boolean) => {
    if (liked) {
      setLikedFoods(prev => [...prev, food]);
    }
    saveProfile({
      ...profile,
      swipedFoods: [...profile.swipedFoods, food.id],
    });
  };

  const handleComplete = () => {
    const totalLiked = likedFoods.length;
    if (totalLiked === 0) {
      saveProfile({
        ...profile,
        onboardingComplete: true,
        savoryPreference: 50,
        spicyPreference: 50,
        freshPreference: 50,
      });
    } else {
      saveProfile({
        ...profile,
        onboardingComplete: true,
        savoryPreference: Math.round(likedFoods.reduce((s, f) => s + f.savory_score, 0) / totalLiked),
        spicyPreference: Math.round(likedFoods.reduce((s, f) => s + f.spicy_score, 0) / totalLiked),
        freshPreference: Math.round(likedFoods.reduce((s, f) => s + f.fresh_score, 0) / totalLiked),
      });
    }
    navigate('/profile/food-dna');
  };

  return (
    <SwipeDeck
      foods={ONBOARDING_FOODS}
      onSwipe={handleSwipe}
      onComplete={handleComplete}
      onBack={() => navigate('/onboarding')}
    />
  );
}
