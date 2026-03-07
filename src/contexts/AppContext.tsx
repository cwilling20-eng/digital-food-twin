import { createContext, useContext, useState, ReactNode } from 'react';
import type { NutritionGoals } from '../types';
import type { BodyMetrics } from '../utils/nutritionCalc';
import { DEFAULT_BODY_METRICS } from '../utils/nutritionCalc';

const DEFAULT_GOALS: NutritionGoals = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  waterGoal: 8,
};

interface Location {
  lat: number;
  lng: number;
}

interface AppContextType {
  location: Location | null;
  requestLocation: () => void;
  locationError: string | null;
  nutritionGoals: NutritionGoals;
  setNutritionGoals: (goals: NutritionGoals) => void;
  bodyMetrics: BodyMetrics;
  setBodyMetrics: (metrics: BodyMetrics) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetrics>({ ...DEFAULT_BODY_METRICS });

  const requestLocation = () => {
    if (!('geolocation' in navigator) || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError(null);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          } catch (err) {
            console.error('Error setting location:', err);
            setLocationError('Failed to process location');
          }
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case 1:
              errorMessage = 'Location permission denied';
              break;
            case 2:
              errorMessage = 'Location information unavailable';
              break;
            case 3:
              errorMessage = 'Location request timed out';
              break;
          }
          setLocationError(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Geolocation API error:', err);
      setLocationError('Geolocation API failed');
    }
  };

  return (
    <AppContext.Provider value={{
      location, requestLocation, locationError,
      nutritionGoals, setNutritionGoals,
      bodyMetrics, setBodyMetrics,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
