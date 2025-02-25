"use client";
import React from "react";
import { cn } from "../lib/utils"; // Assuming this utility exists in your project

type SpotlightProps = {
  className?: string;
  fill?: string;
};

export const Spotlight = ({
  className,
  fill = "rgba(255, 147, 0, 0.3)", // Default orange sunlight color
}: SpotlightProps = {}) => {
  return (
    <svg
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[10] h-[169%] w-[138%] lg:w-[84%] opacity-0 top-0 left-0",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="100" // Reduced for a sharper beam
            result="effect1_foregroundBlur_1065_8"
          />
        </filter>
      </defs>
    </svg>
  );
};