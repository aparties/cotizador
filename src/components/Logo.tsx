"use client";

import React from "react";

/**
 * High-Visibility Bicode Control Logo - Simplified for Digital Screens.
 * This version prioritizes clarity and a clean "Skiz" aesthetic while maintaining
 * the core brand identity: Circular Border, Pulse Wave, and Flag.
 */
export default function Logo({ className = "w-10 h-10", color = "#57cc99" }: { className?: string, color?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Base Container - Deep dark green circle to anchor the brand */}
      <circle cx="50" cy="50" r="48" fill="#0b241c" />
      
      {/* 2. Main Branding Border - Thick and clear */}
      <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="5" fill="none" />

      {/* 3. The Central Pulse (Digital Wave) - Precise and centered */}
      <path 
        d="M25 50 H33 V42 H41 V58 H50 V42 H59 V58 H67 V50 H75" 
        stroke={color} 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />

      {/* 4. Peruvian Flag Symbol - Centered at the top, clear and balanced */}
      <g transform="translate(42, 14)">
        <rect x="0" y="0" width="5" height="10" fill="#FF0000" rx="0.5" />
        <rect x="5" y="0" width="6" height="10" fill="#FFFFFF" />
        <rect x="11" y="0" width="5" height="10" fill="#FF0000" rx="0.5" />
      </g>

      {/* 5. Clean, Legible Branding Text - Using straight-aligned labels for maximum clarity */}
      <text 
        x="50" 
        y="36" 
        fill="white" 
        fontSize="12" 
        fontWeight="900" 
        textAnchor="middle" 
        style={{ letterSpacing: '0.1em' }}
      >
        BICODE
      </text>

      <text 
        x="50" 
        y="72" 
        fill="white" 
        fontSize="10" 
        fontWeight="800" 
        textAnchor="middle" 
        style={{ letterSpacing: '0.15em' }}
      >
        CONTROL
      </text>

      {/* TM indicator */}
      <text 
        x="47" 
        y="55" 
        fill={color} 
        fontSize="4" 
        fontWeight="bold" 
        opacity="0.6"
      >
        TM
      </text>
    </svg>
  );
}

