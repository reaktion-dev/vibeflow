"use client";

import React from "react";

export interface VibeflowLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "mark" | "mark-sliced-arms" | "mark-minimal" | "full" | "wordmark" | "badge";
  size?: number | string;
  className?: string;
  theme?: "auto" | "light" | "dark";
  primaryColor?: string; // Color for the orange slash (defaults to #EB4D26 or #FF5526)
  secondaryColor?: string; // Color for the dark/light glyph (defaults to currentColor)
}

/**
 * Vibeflow Brand Logo Component
 * High-precision SVG logo inspired by modernist geometric typography.
 */
export function VibeflowLogo({
  variant = "mark",
  size = 32,
  className = "",
  theme = "auto",
  primaryColor,
  secondaryColor,
  ...props
}: VibeflowLogoProps) {
  const orange = primaryColor ?? "#EB4D26";
  const darkColor = secondaryColor ?? (theme === "dark" ? "#F1F5F9" : theme === "light" ? "#383226" : "currentColor");

  if (variant === "badge") {
    return (
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <defs>
          <linearGradient id="vf-badge-blue-dark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="60%" stopColor="#060A17" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="vf-badge-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5526" />
            <stop offset="100%" stopColor="#E63F18" />
          </linearGradient>
          <filter id="vf-badge-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#020617" floodOpacity="0.8" />
          </filter>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#vf-badge-blue-dark-bg)" stroke="#1E293B" strokeWidth="2.5" />
        <g transform="translate(68, 68) scale(1.5625)" filter="url(#vf-badge-shadow)">
          <path d="M34 48H66L110 192H78L34 48Z" fill="url(#vf-badge-orange)" />
          <path d="M110 192V80L142 48H198V80H142V116H184V144H142V192H110Z" fill="#F1F5F9" />
        </g>
      </svg>
    );
  }

  if (variant === "mark-sliced-arms") {
    return (
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        {/* Left Orange Diagonal Slash (V) */}
        <path d="M34 48H66L110 192H78L34 48Z" fill={orange} />
        {/* Right Stem with Aerodynamic Sliced Arms (F) */}
        <path d="M110 192V48H206L182 80H142V116H188L167 144H142V192H110Z" fill={darkColor} />
      </svg>
    );
  }

  if (variant === "mark-minimal") {
    return (
      <svg
        viewBox="0 0 240 240"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <path d="M34 48H66L110 192H78L34 48Z" fill={orange} />
        <path d="M110 192V48H198V80H142V116H184V144H142V192H110Z" fill={darkColor} />
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <svg
        viewBox="0 0 460 120"
        width={typeof size === "number" ? size * 3.83 : size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        {/* VF Monogram Mark */}
        <g transform="translate(4, 8) scale(0.68)">
          <path d="M34 48H66L110 192H78L34 48Z" fill={orange} />
          <path d="M110 192V80L142 48H198V80H142V116H184V144H142V192H110Z" fill={darkColor} />
        </g>

        {/* Wordmark Typography */}
        <g transform="translate(156, 38)" fill={darkColor}>
          {/* V */}
          <path d="M0 0H16L38 72H22L0 0Z" fill={orange} />
          <path d="M38 72V0H54V72H38Z" fill={darkColor} />
          
          {/* I */}
          <rect x="68" y="0" width="16" height="72" />
          
          {/* B */}
          <path d="M96 0H124C134 0 142 7 142 17C142 24 137 30 130 33C139 36 145 43 145 54C145 64 136 72 125 72H96V0ZM112 15V28H122C126 28 129 25 129 21.5C129 18 126 15 122 15H112ZM112 43V57H124C128.5 57 131.5 54 131.5 50C131.5 46 128.5 43 124 43H112Z" />

          {/* E */}
          <path d="M157 0H193V15H173V28H189V43H173V57H193V72H157V0Z" />

          {/* F */}
          <path d="M205 72V16L221 0H249V15H221V28H244V43H221V72H205Z" />

          {/* L */}
          <path d="M261 0H277V57H297V72H261V0Z" />

          {/* O */}
          <path d="M325 0C346 0 361 16 361 36C361 56 346 72 325 72C304 72 289 56 289 36C289 16 304 0 325 0ZM325 16C314 16 305 25 305 36C305 47 314 56 325 56C336 56 345 47 345 36C345 25 336 16 325 16Z" />

          {/* W */}
          <path d="M373 0H389L399 44L409 0H425L435 44L445 0H461L444 72H428L417 28L406 72H390L373 0Z" />
        </g>
      </svg>
    );
  }

  if (variant === "wordmark") {
    return (
      <svg
        viewBox="0 0 340 80"
        width={typeof size === "number" ? size * 4.25 : size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <g transform="translate(4, 4)" fill={darkColor}>
          {/* V (Orange slash + dark stem) */}
          <path d="M0 0H16L38 72H22L0 0Z" fill={orange} />
          <path d="M38 72V0H54V72H38Z" fill={darkColor} />
          
          {/* E */}
          <path d="M66 0H102V15H82V28H98V43H82V57H102V72H66V0Z" />

          {/* N / F */}
          <path d="M114 72V16L130 0H158V15H130V28H153V43H130V72H114Z" />

          {/* L */}
          <path d="M170 0H186V57H206V72H170V0Z" />

          {/* O */}
          <path d="M234 0C255 0 270 16 270 36C270 56 255 72 234 72C213 72 198 56 198 36C198 16 213 0 234 0ZM234 16C223 16 214 25 214 36C214 47 223 56 234 56C245 56 254 47 254 36C254 25 245 16 234 16Z" />

          {/* W */}
          <path d="M282 0H298L308 44L318 0H334L344 44L354 0H370L353 72H337L326 28L315 72H299L282 0Z" />
        </g>
      </svg>
    );
  }

  // Default: "mark" (Iconic Sliced Monogram)
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Left Orange Diagonal Slash (V) */}
      <path d="M34 48H66L110 192H78L34 48Z" fill={orange} />
      
      {/* Right "F" Stem with Signature 45° Sliced Top */}
      <path d="M110 192V80L142 48H198V80H142V116H184V144H142V192H110Z" fill={darkColor} />
    </svg>
  );
}

export default VibeflowLogo;
