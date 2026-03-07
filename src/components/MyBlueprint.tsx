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
  const [editedProfile, setEditedProfile] = useState<ComprehensiveUserProfile>(() => ({
    coreProfile: {
      diets: profile.coreProfile?.diets || [],
      allergies: profile.coreProfile?.allergies || [],
      goals: profile.coreProfile?.goals || []
    },
    tasteProfile: {
      spicyTolerance: profile.tasteProfile?.spicyTolerance ?? 5,
      texturePreferences: profile.tasteProfile?.texturePreferences || [],
      sweetVsSavory: profile.tasteProfile?.sweetVsSavory ?? 5
    },
    dislikes: profile.dislikes || [],
    favoriteFoods: profile.favoriteFoods || []
  }));
  const [newDislike, setNewDislike] = useState('');
  const [newFavorite, setNewFavorite] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const toggleDiet = (diet: DietType) => {
    setEditedProfile(prev => {
      const currentDiets = prev.coreProfile?.diets || [];
      return {
        ...prev,
        coreProfile: {
          ...prev.coreProfile,
          diets: currentDiets.includes(diet)
            ? currentDiets.filter(d => d !== diet)
            : [...currentDiets, diet]
        }
      };
    });
    setIsSaved(false);
  };

  const toggleAllergy = (allergy: AllergyType) => {
    setEditedProfile(prev => {
      const currentAllergies = prev.coreProfile?.allergies || [];
      return {
        ...prev,
        coreProfile: {
          ...prev.coreProfile,
          allergies: currentAllergies.includes(allergy)
            ? currentAllergies.filter(a => a !== allergy)
            : [...currentAllergies, allergy]
        }
      };
    });
    setIsSaved(false);
  };

  const toggleGoal = (goal: GoalType) => {
    setEditedProfile(prev => {
      const currentGoals = prev.coreProfile?.goals || [];
      return {
        ...prev,
        coreProfile: {
          ...prev.coreProfile,
          goals: currentGoals.includes(goal)
            ? currentGoals.filter(g => g !== goal)
            : [...currentGoals, goal]
        }
      };
    });
    setIsSaved(false);
  };

  const toggleTexturePreference = (texture: string) => {
    setEditedProfile(prev => {
      const currentTextures = prev.tasteProfile?.texturePreferences || [];
      return {
        ...prev,
        tasteProfile: {
          ...prev.tasteProfile,
          texturePreferences: currentTextures.includes(texture)
            ? currentTextures.filter(t => t !== texture)
            : [...currentTextures, texture]
        }
      };
    });
    setIsSaved(false);
  };

  const addDislike = () => {
    if (newDislike.trim()) {
      setEditedProfile(prev => ({
        ...prev,
        dislikes: [...(prev.dislikes || []), newDislike.trim()]
      }));
      setNewDislike('');
      setIsSaved(false);
    }
  };

  const removeDislike = (dislike: string) => {
    setEditedProfile(prev => ({
      ...prev,
      dislikes: (prev.dislikes || []).filter(d => d !== dislike)
    }));
    setIsSaved(false);
  };

  const addFavorite = () => {
    if (newFavorite.trim()) {
      setEditedProfile(prev => ({
        ...prev,
        favoriteFoods: [...(prev.favoriteFoods || []), newFavorite.trim()]
      }));
      setNewFavorite('');
      setIsSaved(false);
    }
  };

  const removeFavorite = (favorite: string) => {
    setEditedProfile(prev => ({
      ...prev,
      favoriteFoods: (prev.favoriteFoods || []).filter(f => f !== favorite)
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
                (editedProfile.coreProfile?.diets || []).includes(diet)
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
                (editedProfile.coreProfile?.allergies || []).includes(allergy)
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
                (editedProfile.coreProfile?.goals || []).includes(goal)
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Favorite Foods</h2>
        <p className="text-sm text-gray-500 mb-4">Add your favorite foods to prioritize them in recommendations</p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newFavorite}
            onChange={(e) => setNewFavorite(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addFavorite()}
            placeholder="e.g., Sushi, Tacos, Ribeye"
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={addFavorite}
            className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {editedProfile.favoriteFoods && editedProfile.favoriteFoods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {editedProfile.favoriteFoods.map(favorite => (
              <div
                key={favorite}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <span className="text-sm font-medium text-amber-900">{favorite}</span>
                <button
                  onClick={() => removeFavorite(favorite)}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
                (editedProfile.tasteProfile?.texturePreferences || []).includes(texture)
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
