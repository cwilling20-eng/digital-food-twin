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
        svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#FF6B6B"/>`;
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
      <div className="absolute bottom-0 left-0 right-0 bg-nm-surface-lowest rounded-[2rem] rounded-b-none max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-nm-surface-lowest px-8 pt-5 pb-4 rounded-t-[2rem]">
          <div className="w-10 h-1 bg-nm-surface-high rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nm-text">QR Code</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-nm-surface transition-colors"
            >
              <X className="w-5 h-5 text-nm-text/40" />
            </button>
          </div>
        </div>

        <div className="px-8 py-4">
          {/* Tab toggle */}
          <div className="flex p-1.5 bg-nm-surface-high rounded-full mb-6">
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'share'
                  ? 'bg-nm-surface-lowest text-nm-text shadow-nm-float'
                  : 'text-nm-text/60 hover:text-nm-text'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Share My Code
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'scan'
                  ? 'bg-nm-surface-lowest text-nm-text shadow-nm-float'
                  : 'text-nm-text/60 hover:text-nm-text'
              }`}
            >
              <Camera className="w-4 h-4" />
              Enter Code
            </button>
          </div>

          {activeTab === 'share' && (
            <div className="text-center space-y-6">
              <div className="bg-nm-surface-lowest p-5 rounded-[2rem] inline-block mx-auto shadow-nm-float">
                <img
                  src={qrCodeSvg}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div>
                <p className="text-nm-text/60 mb-2">
                  {displayName ? `${displayName}'s Friend Code` : 'Your Friend Code'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-black text-nm-text tracking-wider">
                    {userId.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`p-2.5 rounded-full transition-colors active:scale-95 ${
                      copied
                        ? 'bg-nm-success/10 text-nm-success'
                        : 'bg-nm-surface text-nm-text/60 hover:bg-nm-surface-high'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                {username && (
                  <p className="text-nm-text/40 text-sm mt-1">@{username}</p>
                )}
              </div>

              <p className="text-sm text-nm-text/40">
                Share this code with friends so they can add you
              </p>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-nm-text/60 mb-4">
                  Enter your friend's 8-character code
                </p>
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase().slice(0, 8))}
                  placeholder="ABCD1234"
                  className="w-full text-center text-2xl font-mono font-black tracking-widest py-4 bg-nm-surface-high rounded-full text-nm-text placeholder:text-nm-text/20 focus:outline-none focus:bg-nm-surface-lowest focus:ring-2 focus:ring-nm-signature/40 transition-all"
                  maxLength={8}
                />
              </div>

              <button
                disabled={friendCode.length < 8}
                className={`w-full py-4 font-bold rounded-full transition-all active:scale-95 ${
                  friendCode.length === 8
                    ? 'bg-gradient-to-br from-nm-signature to-nm-signature-light text-white shadow-nm-float'
                    : 'bg-nm-surface-high text-nm-text/30 cursor-not-allowed'
                }`}
              >
                Add Friend
              </button>

              <div className="bg-nm-surface rounded-[2rem] p-5">
                <p className="text-sm text-nm-text/60 text-center">
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
