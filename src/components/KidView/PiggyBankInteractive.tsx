import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { playCoinSound, playFanfareSound } from '../../utils/audio';
import { Sparkles, Heart } from 'lucide-react';

interface PiggyBankInteractiveProps {
  cashBalance: number;
  savingsBalance: number;
  girlName: string;
  themeColor?: string;
}

export const PiggyBankInteractive: React.FC<PiggyBankInteractiveProps> = ({
  cashBalance,
  savingsBalance,
  girlName,
}) => {
  const [isWiggling, setIsWiggling] = useState(false);
  const [coinsFed, setCoinsFed] = useState<number[]>([]);
  const [moodText, setMoodText] = useState('Feed me a coin! 🪙');

  const handlePiggyClick = () => {
    setIsWiggling(true);
    playCoinSound();

    // Trigger floating coin animation
    const coinId = Date.now();
    setCoinsFed(prev => [...prev.slice(-4), coinId]);

    const happyMessages = [
      'Oink oink! Thank you! 🐷✨',
      'Cha-ching! Good saver! 💖',
      'Yum! More coins! 🪙',
      `You're doing great, ${girlName}! 🌟`,
      'Piggy power! 🚀',
    ];
    setMoodText(happyMessages[Math.floor(Math.random() * happyMessages.length)]);

    // Occasional sweet confetti
    if (Math.random() > 0.6) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF69B4', '#FFD700', '#00FFFF', '#FF85A2', '#A78BFA'],
      });
      playFanfareSound();
    }

    setTimeout(() => {
      setIsWiggling(false);
    }, 500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50/60 to-pink-50/50 rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
      {/* Decorative background sparkles */}
      <div className="absolute top-3 left-4 text-pink-300 opacity-60 animate-pulse-gentle">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="absolute top-4 right-5 text-amber-300 opacity-60 animate-float-soft">
        <Heart className="w-5 h-5 fill-current" />
      </div>

      {/* Floating Animated Coins into Piggy Slot */}
      <div className="relative h-12 w-full flex justify-center items-center pointer-events-none">
        {coinsFed.map((id) => (
          <div
            key={id}
            className="absolute text-2xl animate-coin-fall"
            style={{
              left: `calc(50% + ${(Math.random() - 0.5) * 40}px)`,
              top: '-10px',
            }}
          >
            🪙
          </div>
        ))}
      </div>

      {/* Interactive Piggy SVG */}
      <div
        onClick={handlePiggyClick}
        className={`relative cursor-pointer transition-transform duration-300 select-none ${
          isWiggling ? 'scale-110 rotate-3' : 'hover:scale-105 active:scale-95'
        }`}
        title="Tap the piggy to drop a coin!"
      >
        <svg
          width="160"
          height="140"
          viewBox="0 0 160 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Piggy Ears */}
          <path
            d="M40 38 C32 15, 20 22, 28 42 Z"
            fill="#F472B6"
            stroke="#DB2777"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M37 36 C32 24, 25 28, 30 40 Z"
            fill="#FBCFE8"
          />

          <path
            d="M105 38 C113 15, 125 22, 117 42 Z"
            fill="#F472B6"
            stroke="#DB2777"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M108 36 C113 24, 120 28, 115 40 Z"
            fill="#FBCFE8"
          />

          {/* Piggy Legs */}
          <rect x="42" y="102" width="16" height="20" rx="8" fill="#F472B6" stroke="#DB2777" strokeWidth="3" />
          <rect x="88" y="102" width="16" height="20" rx="8" fill="#F472B6" stroke="#DB2777" strokeWidth="3" />

          {/* Curly Tail */}
          <path
            d="M132 82 C146 80, 150 68, 142 62 C135 56, 134 70, 148 68"
            stroke="#DB2777"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Main Piggy Body */}
          <ellipse
            cx="75"
            cy="75"
            rx="60"
            ry="48"
            fill="url(#piggyGradient)"
            stroke="#DB2777"
            strokeWidth="3.5"
          />

          {/* Coin Slot on Back */}
          <rect
            x="64"
            y="28"
            width="22"
            height="5"
            rx="2.5"
            fill="#831843"
          />

          {/* Blush Cheeks */}
          <circle cx="44" cy="82" r="9" fill="#FDA4AF" opacity="0.8" />
          <circle cx="106" cy="82" r="9" fill="#FDA4AF" opacity="0.8" />

          {/* Cute Eyes with Sparkles */}
          <circle cx="53" cy="65" r="5" fill="#1F2937" />
          <circle cx="51.5" cy="63" r="1.8" fill="white" />
          <circle cx="97" cy="65" r="5" fill="#1F2937" />
          <circle cx="95.5" cy="63" r="1.8" fill="white" />

          {/* Happy Snout */}
          <rect
            x="58"
            y="68"
            width="34"
            height="26"
            rx="13"
            fill="#FBCFE8"
            stroke="#DB2777"
            strokeWidth="2.5"
          />
          {/* Nostrils */}
          <ellipse cx="69" cy="81" rx="3.5" ry="5" fill="#BE185D" />
          <ellipse cx="81" cy="81" rx="3.5" ry="5" fill="#BE185D" />

          {/* SVG Gradients */}
          <defs>
            <linearGradient id="piggyGradient" x1="20" y1="30" x2="130" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F9A8D4" />
              <stop offset="0.6" stopColor="#F472B6" />
              <stop offset="1" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Small badge prompt */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white/95 px-3 py-0.5 rounded-full border border-pink-200 text-[11px] font-bold text-pink-600 shadow-xs whitespace-nowrap">
          Tap me! 👆
        </div>
      </div>

      {/* Piggy Speech Bubble */}
      <div className="mt-4 text-center">
        <p className="font-heading font-semibold text-sm text-slate-700 bg-white/80 px-4 py-1.5 rounded-2xl border border-pink-100 shadow-2xs inline-block">
          {moodText}
        </p>
      </div>
    </div>
  );
};
