import React, { useId } from 'react';

interface LogoProps {
  /** Size variant for the logo or numeric pixel dimension */
  size?: 'sm' | 'md' | 'lg' | 'hero' | number;
  /** Toggle Hindi tagline visibility */
  showTaglines?: boolean;
  /** Toggle English bottom banner pill */
  showEnglishPill?: boolean;
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Inline horizontal layout for navigation bars */
  horizontal?: boolean;
  /** Render only the graphic icon emblem without text */
  iconOnly?: boolean;
}

export const YojanaSetuLogo: React.FC<LogoProps> = ({
  size = 'md',
  showTaglines = true,
  showEnglishPill = true,
  className = '',
  horizontal = false,
  iconOnly = false,
}) => {
  // Generate unique prefix per instance to prevent SVG gradient ID collisions in DOM
  const rawId = useId();
  const idPrefix = rawId.replace(/[^a-zA-Z0-9-_]/g, '');

  const rainbowArchId = `${idPrefix}-rainbowArchGrad`;
  const sproutGradId = `${idPrefix}-sproutGrad`;
  const navyFigureGradId = `${idPrefix}-navyFigureGrad`;
  const greenFigureGradId = `${idPrefix}-greenFigureGrad`;

  // Resolve size key safely
  const resolvedSizeKey: 'sm' | 'md' | 'lg' | 'hero' =
    typeof size === 'number'
      ? size <= 32
        ? 'sm'
        : size <= 48
        ? 'md'
        : size <= 96
        ? 'lg'
        : 'hero'
      : size === 'sm' || size === 'md' || size === 'lg' || size === 'hero'
      ? size
      : 'md';

  // Scale profiles for stacked layout
  const stackedConfigMap = {
    sm: {
      maxWidth: 160,
      titleText: 'text-lg',
      taglineText: 'text-[9px]',
      pillText: 'text-[8px] py-1 px-2',
      dotSize: 'w-1.5 h-1.5',
    },
    md: {
      maxWidth: 240,
      titleText: 'text-2xl',
      taglineText: 'text-xs',
      pillText: 'text-[10px] py-1.5 px-3',
      dotSize: 'w-2 h-2',
    },
    lg: {
      maxWidth: 340,
      titleText: 'text-3xl',
      taglineText: 'text-sm',
      pillText: 'text-xs py-2 px-4',
      dotSize: 'w-2.5 h-2.5',
    },
    hero: {
      maxWidth: 440,
      titleText: 'text-4xl',
      taglineText: 'text-base',
      pillText: 'text-sm py-2.5 px-5',
      dotSize: 'w-3 h-3',
    },
  };

  const stackedConfig = stackedConfigMap[resolvedSizeKey] || stackedConfigMap.md;

  // Scale profiles for horizontal layout
  const horizontalConfigMap = {
    sm: { iconSize: 'w-8 h-8', titleText: 'text-base', taglineText: 'text-[9px]' },
    md: { iconSize: 'w-12 h-12', titleText: 'text-xl', taglineText: 'text-[11px]' },
    lg: { iconSize: 'w-16 h-16', titleText: 'text-2xl', taglineText: 'text-xs' },
    hero: { iconSize: 'w-20 h-20', titleText: 'text-3xl', taglineText: 'text-sm' },
  };

  const horizontalConfig = horizontalConfigMap[resolvedSizeKey] || horizontalConfigMap.md;

  // SVG Graphics Component
  const GraphicSvg = (
    <svg
      viewBox="0 0 500 360"
      className="w-full h-auto drop-shadow-sm"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Top Arch Gradient: Orange -> Yellow -> Green */}
        <linearGradient id={rainbowArchId} x1="0%" y1="100%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="65%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>

        {/* Left Citizen & Bridge Gradient */}
        <linearGradient id={navyFigureGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E6156" />
          <stop offset="100%" stopColor="#14453D" />
        </linearGradient>

        {/* Right Citizen Gradient */}
        <linearGradient id={greenFigureGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>

        {/* Sprout Plant Gradient */}
        <linearGradient id={sproutGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1E6156" />
          <stop offset="100%" stopColor="#14453D" />
        </linearGradient>
      </defs>

      {/* 1. Top Rainbow Arc */}
      <path
        d="M 60 260 A 190 190 0 0 1 440 260"
        stroke={`url(#${rainbowArchId})`}
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* 2. Top Central Sprout Emblem */}
      <ellipse cx="250" cy="98" rx="8" ry="16" fill={`url(#${sproutGradId})`} />
      <path
        d="M 246 112 C 230 102 225 84 238 84 C 248 84 250 102 246 112 Z"
        fill={`url(#${sproutGradId})`}
      />
      <path
        d="M 254 112 C 270 102 275 84 262 84 C 252 84 250 102 254 112 Z"
        fill={`url(#${sproutGradId})`}
      />
      <path
        d="M 242 124 C 220 120 216 104 230 100 C 242 100 246 116 242 124 Z"
        fill={`url(#${sproutGradId})`}
      />
      <path
        d="M 258 124 C 280 120 284 104 270 100 C 258 100 254 116 258 124 Z"
        fill={`url(#${sproutGradId})`}
      />
      <circle cx="250" cy="130" r="4.5" fill="#14453D" />

      {/* 3. Left Figure */}
      <circle cx="165" cy="170" r="18" fill="#1E6156" />
      <path
        d="M 165 195 C 190 195 220 170 250 162 C 235 178 200 205 180 220 C 160 235 140 265 105 285 C 95 290 85 270 95 255 C 115 225 140 195 165 195 Z"
        fill="#1E6156"
      />
      <path
        d="M 120 230 C 135 200 165 190 200 180 C 225 173 245 165 250 162 C 240 175 220 190 190 205 C 160 220 140 250 125 280 C 115 280 110 255 120 230 Z"
        fill="#14453D"
      />

      {/* 4. Right Figure */}
      <circle cx="335" cy="170" r="18" fill="#16A34A" />
      <path
        d="M 335 195 C 310 195 280 170 250 162 C 265 178 300 205 320 220 C 340 235 360 265 395 285 C 405 290 415 270 405 255 C 385 225 360 195 335 195 Z"
        fill="#16A34A"
      />
      <path
        d="M 380 230 C 365 200 335 190 300 180 C 275 173 255 165 250 162 C 260 175 280 190 310 205 C 340 220 360 250 375 280 C 385 280 390 255 380 230 Z"
        fill="#15803D"
      />

      {/* 5. Center Bridge Structure */}
      <path
        d="M 100 310 C 180 310 210 240 250 240 C 290 240 320 310 400 310 L 400 290 C 320 290 290 215 250 215 C 210 215 180 290 100 290 Z"
        fill="#14453D"
      />
      <path
        d="M 140 315 C 190 315 215 255 250 255 C 285 255 310 315 360 315 Z"
        fill="#FFFFFF"
      />

      {/* Bridge Roadway Deck */}
      <rect x="150" y="248" width="200" height="8" rx="2" fill="#14453D" />

      {/* Suspension Towers and Vertical Cable Stays */}
      <line x1="250" y1="188" x2="250" y2="248" stroke="#14453D" strokeWidth="6" strokeLinecap="round" />
      <line x1="210" y1="215" x2="210" y2="248" stroke="#14453D" strokeWidth="4" strokeLinecap="round" />
      <line x1="290" y1="215" x2="290" y2="248" stroke="#14453D" strokeWidth="4" strokeLinecap="round" />

      {/* Suspension Diagonal Cables */}
      <line x1="250" y1="190" x2="160" y2="248" stroke="#14453D" strokeWidth="3" />
      <line x1="250" y1="190" x2="190" y2="248" stroke="#14453D" strokeWidth="2.5" />
      <line x1="250" y1="190" x2="220" y2="248" stroke="#14453D" strokeWidth="2.5" />
      <line x1="250" y1="190" x2="340" y2="248" stroke="#14453D" strokeWidth="3" />
      <line x1="250" y1="190" x2="310" y2="248" stroke="#14453D" strokeWidth="2.5" />
      <line x1="250" y1="190" x2="280" y2="248" stroke="#14453D" strokeWidth="2.5" />

      {/* Vertical suspension hangers below road deck */}
      <line x1="175" y1="256" x2="175" y2="296" stroke="#14453D" strokeWidth="2.5" />
      <line x1="205" y1="256" x2="205" y2="272" stroke="#14453D" strokeWidth="2.5" />
      <line x1="295" y1="256" x2="295" y2="272" stroke="#14453D" strokeWidth="2.5" />
      <line x1="325" y1="256" x2="325" y2="296" stroke="#14453D" strokeWidth="2.5" />

      {/* 6. Left Circular Emblem: Government Building */}
      <circle cx="105" cy="265" r="42" stroke="#14453D" strokeWidth="9" fill="#FFFFFF" />
      <path d="M 97 236 C 97 228 113 228 113 236 Z" fill="#14453D" />
      <line x1="105" y1="228" x2="105" y2="222" stroke="#14453D" strokeWidth="2" />
      <path d="M 105 222 L 112 225 L 105 228 Z" fill="#14453D" />
      <path d="M 88 245 L 105 236 L 122 245 Z" fill="#14453D" />
      <rect x="90" y="247" width="4" height="22" fill="#14453D" rx="1" />
      <rect x="97" y="247" width="4" height="22" fill="#14453D" rx="1" />
      <rect x="104" y="247" width="4" height="22" fill="#14453D" rx="1" />
      <rect x="111" y="247" width="4" height="22" fill="#14453D" rx="1" />
      <rect x="118" y="247" width="4" height="22" fill="#14453D" rx="1" />
      <rect x="85" y="270" width="40" height="4" fill="#14453D" rx="1" />
      <rect x="82" y="275" width="46" height="5" fill="#14453D" rx="1" />

      {/* 7. Right Circular Emblem: Rupee & Helping Hand */}
      <circle cx="395" cy="265" r="42" stroke="#16A34A" strokeWidth="9" fill="#FFFFFF" />
      <text
        x="395"
        y="256"
        textAnchor="middle"
        fontSize="30"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#16A34A"
      >
        ₹
      </text>
      <path
        d="M 372 278 C 382 284 395 286 408 284 C 416 282 422 276 422 270 C 420 270 414 274 406 276 C 396 278 386 276 376 270 C 372 268 368 274 372 278 Z"
        fill="#16A34A"
      />
      <path
        d="M 368 272 C 378 280 395 288 416 282 L 416 288 C 395 294 376 288 365 277 Z"
        fill="#15803D"
      />
    </svg>
  );

  // Icon-only mode (emblem without text)
  if (iconOnly) {
    const iconDimension = typeof size === 'number' ? `${size}px` : undefined;
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${
          iconDimension ? '' : horizontalConfig.iconSize
        } ${className}`}
        style={iconDimension ? { width: iconDimension, height: iconDimension } : undefined}
        role="img"
        aria-label="Yojana Setu Emblem"
      >
        {GraphicSvg}
      </div>
    );
  }

  // Horizontal Layout (for Navbars / Headers)
  if (horizontal) {
    return (
      <div
        className={`inline-flex items-center gap-3 select-none ${className}`}
        role="banner"
        aria-label="Yojana Setu Logo"
      >
        <div className={`${horizontalConfig.iconSize} shrink-0 flex items-center justify-center`}>
          {GraphicSvg}
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 leading-tight">
            <span className={`font-black tracking-tight text-[#14453D] dark:text-[#F0F4F2] ${horizontalConfig.titleText}`}>
              YOJANA
            </span>
            <span className={`font-black tracking-tight text-[#16A34A] dark:text-[#4ADE80] ${horizontalConfig.titleText}`}>
              SETU
            </span>
          </div>
          {showTaglines && (
            <span
              className={`font-bold text-[#14453D] dark:text-[#9EB0A7] tracking-tight mt-0.5 whitespace-nowrap ${horizontalConfig.taglineText}`}
              style={{ fontFamily: "'Noto Sans Devanagari', 'Segoe UI', system-ui, sans-serif" }}
            >
              सही योजना • सही सहायता • सही रास्ता
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full Stacked Layout
  return (
    <div
      className={`flex flex-col items-center text-center select-none ${className}`}
      style={{ maxWidth: stackedConfig.maxWidth, width: '100%' }}
      role="banner"
      aria-label="Yojana Setu Logo"
    >
      {/* 1. Graphic Illustration */}
      <div className="w-full px-1">{GraphicSvg}</div>

      {/* 2. Brand Name: YOJANA SETU */}
      <div className="mt-2 flex items-center justify-center gap-1.5 font-black tracking-wider leading-none">
        <span className={`${stackedConfig.titleText} text-[#14453D] dark:text-[#F0F4F2] font-extrabold`}>
          YOJANA
        </span>
        <span className={`${stackedConfig.titleText} text-[#16A34A] dark:text-[#4ADE80] font-extrabold`}>
          SETU
        </span>
      </div>

      {/* 3. Divider Line with Central Accent Node */}
      <div className="w-full flex items-center justify-center my-1.5 px-2">
        <div className="h-[2px] flex-1 bg-[#14453D] dark:bg-[#2A7567] rounded-full" />
        <div className={`${stackedConfig.dotSize} mx-1.5 rounded-full bg-[#14453D] dark:bg-[#4ADE80] shrink-0`} />
        <div className="h-[2px] flex-1 bg-[#16A34A] dark:bg-[#4ADE80] rounded-full" />
      </div>

      {/* 4. Tagline in Hindi */}
      {showTaglines && (
        <div
          className={`${stackedConfig.taglineText} font-bold text-[#14453D] dark:text-[#9EB0A7] tracking-normal whitespace-nowrap`}
          style={{ fontFamily: "'Noto Sans Devanagari', 'Segoe UI', system-ui, sans-serif" }}
        >
          सही योजना <span className="text-[#16A34A] dark:text-[#4ADE80] mx-0.5">•</span> सही सहायता{' '}
          <span className="text-[#16A34A] dark:text-[#4ADE80] mx-0.5">•</span> सही रास्ता
        </div>
      )}

      {/* 5. English Tagline Pill */}
      {showEnglishPill && (
        <div className="mt-2 w-full">
          <div
            className={`bg-[#14453D] dark:bg-[#1A5348] text-white ${stackedConfig.pillText} font-extrabold tracking-wider uppercase rounded-full shadow-sm text-center leading-tight`}
          >
            YOUR BRIDGE TO GOVERNMENT SCHEMES
          </div>
        </div>
      )}
    </div>
  );
};