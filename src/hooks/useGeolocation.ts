import { useState, useCallback, useRef } from 'react';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'acquiring_gps'
  | 'falling_back'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout';

export interface GeoLocation {
  lat: number;
  long: number;
  accuracy: number;
  source: 'gps' | 'network' | 'cached' | 'ip_fallback';
}

export interface UseGeolocationResult {
  location: GeoLocation | null;
  status: LocationStatus;
  statusMessage: string;
  error: string | null;
  requestLocation: () => Promise<GeoLocation | null>;
  clearError: () => void;
}

// Status messages for UI feedback
const STATUS_MESSAGES: Record<LocationStatus, string> = {
  idle: '',
  requesting: 'Requesting location access...',
  acquiring_gps: 'Acquiring GPS signal...',
  falling_back: 'Using approximate location...',
  success: 'Location acquired',
  denied: 'Location access denied',
  unavailable: 'Location unavailable',
  timeout: 'Location request timed out'
};

/**
 * Bulletproof geolocation hook with cascading fallback strategy:
 * 1. High accuracy (GPS) - 8 second timeout
 * 2. Low accuracy (Cell/WiFi) - 5 second timeout
 * 3. Cached position (up to 5 minutes old)
 * 4. IP-based fallback (optional)
 */
export function useGeolocation(): UseGeolocationResult {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const cachedLocationRef = useRef<GeoLocation | null>(null);
  const lastSuccessTimeRef = useRef<number>(0);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Attempt to get position with specific options
   */
  const tryGetPosition = (
    options: PositionOptions
  ): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator) || !navigator.geolocation) {
        console.warn('⚠️ Geolocation API not available');
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.warn(`⚠️ Geolocation timed out after ${options.timeout}ms`);
        resolve(null);
      }, (options.timeout || 10000) + 1000); // Extra 1s buffer

      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(position);
          },
          (err) => {
            clearTimeout(timeoutId);
            console.warn(`⚠️ Geolocation error (${err.code}): ${err.message}`);
            resolve(null);
          },
          options
        );
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('❌ Geolocation API exception:', err);
        resolve(null);
      }
    });
  };

  /**
   * Convert GeolocationPosition to our GeoLocation format
   */
  const toGeoLocation = (
    position: GeolocationPosition,
    source: GeoLocation['source']
  ): GeoLocation => ({
    lat: position.coords.latitude,
    long: position.coords.longitude,
    accuracy: position.coords.accuracy,
    source
  });

  /**
   * Strategy 1: High accuracy (GPS) - Best for outdoor/mobile
   */
  const tryHighAccuracy = async (): Promise<GeoLocation | null> => {
    setStatus('acquiring_gps');

    const position = await tryGetPosition({
      enableHighAccuracy: true,
      timeout: 8000,      // 8 seconds for GPS lock
      maximumAge: 0       // Force fresh position
    });

    if (position && position.coords.accuracy < 100) {
      const loc = toGeoLocation(position, 'gps');
      return loc;
    }

    // GPS got a position but accuracy is poor - still return it
    if (position) {
      const loc = toGeoLocation(position, 'gps');
      return loc;
    }

    return null;
  };

  /**
   * Strategy 2: Low accuracy (Cell/WiFi) - Faster, works indoors
   */
  const tryLowAccuracy = async (): Promise<GeoLocation | null> => {
    setStatus('falling_back');

    const position = await tryGetPosition({
      enableHighAccuracy: false,
      timeout: 5000,      // 5 seconds is plenty for network location
      maximumAge: 60000   // Accept positions up to 1 minute old
    });

    if (position) {
      const loc = toGeoLocation(position, 'network');
      return loc;
    }

    return null;
  };

  /**
   * Strategy 3: Cached position - Use recent location if available
   */
  const tryCachedPosition = async (): Promise<GeoLocation | null> => {
    // Check our internal cache first (from previous successful request)
    const cacheAge = Date.now() - lastSuccessTimeRef.current;
    if (cachedLocationRef.current && cacheAge < 300000) { // 5 minutes
      return { ...cachedLocationRef.current, source: 'cached' };
    }

    // Try browser's cached position
    const position = await tryGetPosition({
      enableHighAccuracy: false,
      timeout: 1000,       // Quick check
      maximumAge: 300000   // Accept positions up to 5 minutes old
    });

    if (position) {
      const loc = toGeoLocation(position, 'cached');
      return loc;
    }

    return null;
  };

  /**
   * Strategy 4: IP-based fallback using free API
   * Only use this as absolute last resort - accuracy is city-level
   */
  const tryIpFallback = async (): Promise<GeoLocation | null> => {
    try {
      // Using ipapi.co - free tier, no API key needed
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.latitude && data.longitude) {
        const loc: GeoLocation = {
          lat: data.latitude,
          long: data.longitude,
          accuracy: 10000, // ~10km accuracy for IP geolocation
          source: 'ip_fallback'
        };
        return loc;
      }
    } catch (err) {
      console.error('❌ IP geolocation failed:', err);
    }

    return null;
  };

  /**
   * Main request function - cascading strategy
   */
  const requestLocation = useCallback(async (): Promise<GeoLocation | null> => {
    setError(null);
    setStatus('requesting');

    // Check if geolocation is supported at all
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Geolocation is not supported by this browser');
      return null;
    }

    // Check permission state if available (not supported in all browsers)
    try {
      const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
      if (permissionStatus?.state === 'denied') {
        setStatus('denied');
        setError('Location access was denied. Please enable location in your browser settings.');
        return null;
      }
    } catch {
      // Permission API not supported, continue anyway
    }

    let result: GeoLocation | null = null;

    // Strategy 1: High accuracy GPS
    result = await tryHighAccuracy();
    if (result) {
      setLocation(result);
      setStatus('success');
      cachedLocationRef.current = result;
      lastSuccessTimeRef.current = Date.now();
      return result;
    }

    // Strategy 2: Low accuracy network
    result = await tryLowAccuracy();
    if (result) {
      setLocation(result);
      setStatus('success');
      cachedLocationRef.current = result;
      lastSuccessTimeRef.current = Date.now();
      return result;
    }

    // Strategy 3: Cached position
    result = await tryCachedPosition();
    if (result) {
      setLocation(result);
      setStatus('success');
      return result;
    }

    // Strategy 4: IP-based fallback (optional - remove if you don't want this)
    result = await tryIpFallback();
    if (result) {
      setLocation(result);
      setStatus('success');
      return result;
    }

    // All strategies failed
    setStatus('unavailable');
    setError('Unable to determine your location. Please check your device settings.');
    return null;

  }, []);

  return {
    location,
    status,
    statusMessage: STATUS_MESSAGES[status],
    error,
    requestLocation,
    clearError
  };
}

export default useGeolocation;
