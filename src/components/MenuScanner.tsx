import { useState, useEffect, useRef } from 'react';
import { Camera, Scan, Loader2, Upload, Image, AlertCircle, X } from 'lucide-react';
import type { ComprehensiveUserProfile } from '../types';

interface MenuScannerProps {
  onScanComplete: (recommendations: any) => void;
  comprehensiveProfile: ComprehensiveUserProfile;
  scanMode: 'goal' | 'enjoyment';
  setScanMode: (mode: 'goal' | 'enjoyment') => void;
  userId: string;
}

import { WEBHOOK_SCANNER_URL } from '../config/api';

export function MenuScanner({ onScanComplete, comprehensiveProfile, scanMode, setScanMode, userId }: MenuScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(true);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      let capturedImage = uploadedImage;

      if (!capturedImage && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          capturedImage = canvas.toDataURL('image/jpeg', 0.9);
        }
      }

      const requestBody = {
        menuImage: capturedImage || null,
        userProfile: {
          coreProfile: {
            diets: comprehensiveProfile.coreProfile.diets,
            allergies: comprehensiveProfile.coreProfile.allergies,
            goals: comprehensiveProfile.coreProfile.goals
          },
          tasteProfile: {
            spicyTolerance: comprehensiveProfile.tasteProfile.spicyTolerance,
            texturePreferences: comprehensiveProfile.tasteProfile.texturePreferences,
            sweetVsSavory: comprehensiveProfile.tasteProfile.sweetVsSavory
          },
          dislikes: comprehensiveProfile.dislikes || [],
          favoriteFoods: comprehensiveProfile.favoriteFoods || []
        },
        mode: scanMode,
        userId: userId
      };

      const response = await fetch(WEBHOOK_SCANNER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Brain is still waking up! Please try again.');
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Brain is still waking up! Please try again.');
      }

      let extractedContent = null;

      if (Array.isArray(data) && data.length > 0 && data[0].output && typeof data[0].output === 'string' && data[0].output.trim() !== '') {
        extractedContent = data[0].output;
      } else if (data && typeof data === 'object' && data.output && typeof data.output === 'string' && data.output.trim() !== '') {
        extractedContent = data.output;
      } else if (Array.isArray(data) && data.length > 0 && data[0].recommendations) {
        extractedContent = data[0].recommendations;
      } else if (data && typeof data === 'object' && data.recommendations) {
        extractedContent = data.recommendations;
      }

      if (!extractedContent) {
        console.error('No valid content found in response. Checked: data[0].output, data.output, data[0].recommendations, data.recommendations');
        throw new Error('Brain is still waking up! Please try again.');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const normalizedData = {
        output: typeof extractedContent === 'string' ? extractedContent : null,
        recommendations: Array.isArray(extractedContent) ? extractedContent : null,
        rawData: data
      };

      onScanComplete(normalizedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brain is still waking up! Please try again.');
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPG or PNG image file.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-20">
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Scanner</h1>
        <p className="text-gray-500">Scan or upload a menu for personalized recommendations</p>
      </div>

      <div className="px-6">
        <div className="bg-black rounded-3xl overflow-hidden aspect-[4/3] relative mb-6">
          {uploadedImage ? (
            <img
              src={uploadedImage}
              alt="Uploaded menu"
              className="w-full h-full object-cover"
            />
          ) : cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-center text-sm">
                Camera not available. Use the options below.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-64">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
                </div>
              </div>
            </>
          )}

          {isScanning && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
              <p className="text-white font-semibold text-lg mb-2">Analyzing Menu</p>
              <p className="text-emerald-200 text-sm">Getting your personalized recommendations...</p>
            </div>
          )}
        </div>

        <div className="mb-6 bg-white rounded-2xl p-2 border-2 border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScanMode('goal')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                scanMode === 'goal'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>🎯</span>
              Goal Mode
            </button>
            <button
              onClick={() => setScanMode('enjoyment')}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                scanMode === 'enjoyment'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>😌</span>
              Enjoyment Mode
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            {scanMode === 'goal'
              ? 'Strict, health-focused recommendations'
              : 'Flavor-focused, relaxed recommendations'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">{error}</p>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />

        {!uploadedImage && (
          <div className="space-y-3">
            {!cameraError && (
              <button
                onClick={handleScan}
                disabled={isScanning}
                className={`w-full ${
                  scanMode === 'goal'
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 shadow-emerald-600/30'
                    : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 shadow-amber-500/30'
                } disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]`}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    Scan Menu
                  </>
                )}
              </button>
            )}

            <button
              onClick={triggerFileUpload}
              disabled={isScanning}
              className={`w-full bg-white border-2 border-gray-200 ${
                scanMode === 'goal'
                  ? 'hover:border-emerald-400 hover:bg-emerald-50'
                  : 'hover:border-amber-400 hover:bg-amber-50'
              } disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]`}
            >
              <Upload className="w-5 h-5" />
              Upload Menu Image
            </button>
          </div>
        )}

        {uploadedImage && !isScanning && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Menu Image Ready</p>
                  <p className="text-xs text-emerald-700">Ready to analyze your menu</p>
                </div>
                <button
                  onClick={clearUploadedImage}
                  className="w-8 h-8 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border-2 border-emerald-300">
                <img
                  src={uploadedImage}
                  alt="Menu preview"
                  className="w-full h-32 object-cover"
                />
              </div>
            </div>
            <button
              onClick={handleScan}
              className={`w-full ${
                scanMode === 'goal'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
              } text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]`}
            >
              <Scan className="w-5 h-5" />
              Analyze Menu
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-4">
          Point camera at a menu or upload an image to get AI-powered dish recommendations
        </p>
      </div>
    </div>
  );
}
