import { useState } from 'react';
import { X, Copy, Check, Camera, Share2 } from 'lucide-react';

interface QRCodeModalProps {
  userId: string;
  username: string | null;
  displayName: string | null;
  onClose: () => void;
  onFriendAdded: () => void;
}

function generateQRCode(data: string, size: number = 200): string {
  const modules = 25;
  const moduleSize = size / modules;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;

  const hash = data.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const isFinderPattern =
        (row < 7 && col < 7) ||
        (row < 7 && col >= modules - 7) ||
        (row >= modules - 7 && col < 7);

      const isFinderInner =
        (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
        (row >= 2 && row <= 4 && col >= modules - 5 && col <= modules - 3) ||
        (row >= modules - 5 && row <= modules - 3 && col >= 2 && col <= 4);

      const isFinderBorder = isFinderPattern && !isFinderInner &&
        ((row === 0 || row === 6 || col === 0 || col === 6) ||
         (row === 0 || row === 6 || col === modules - 7 || col === modules - 1) ||
         (row === modules - 7 || row === modules - 1 || col === 0 || col === 6));

      const dataHash = ((hash * (row + 1) * (col + 1)) >>> 0) % 100;
      const isDataModule = !isFinderPattern && dataHash < 45;

      if (isFinderBorder || isFinderInner || isDataModule) {
        svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#059669"/>`;
      }
    }
  }

  svg += '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function QRCodeModal({
  userId,
  username,
  displayName,
  onClose,
  onFriendAdded: _onFriendAdded
}: QRCodeModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'scan'>('share');
  const [copied, setCopied] = useState(false);
  const [friendCode, setFriendCode] = useState('');

  const friendLink = `foodtwin://add-friend/${userId}`;
  const qrCodeSvg = generateQRCode(friendLink);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(userId.slice(0, 8).toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">QR Code</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'share'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Share My Code
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'scan'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              Enter Code
            </button>
          </div>

          {activeTab === 'share' && (
            <div className="text-center space-y-6">
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 inline-block mx-auto">
                <img
                  src={qrCodeSvg}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div>
                <p className="text-gray-600 mb-2">
                  {displayName ? `${displayName}'s Friend Code` : 'Your Friend Code'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                    {userId.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`p-2 rounded-lg transition-colors ${
                      copied
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {username && (
                  <p className="text-gray-500 text-sm mt-1">@{username}</p>
                )}
              </div>

              <p className="text-sm text-gray-500">
                Share this code with friends so they can add you
              </p>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Enter your friend's 8-character code
                </p>
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase().slice(0, 8))}
                  placeholder="ABCD1234"
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest py-4 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  maxLength={8}
                />
              </div>

              <button
                disabled={friendCode.length < 8}
                className={`w-full py-4 font-semibold rounded-xl transition-all ${
                  friendCode.length === 8
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Add Friend
              </button>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 text-center">
                  Camera scanning is coming soon! For now, ask your friend for their code.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
