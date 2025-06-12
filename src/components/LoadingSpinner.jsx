// src/components/LoadingSpinner.jsx
import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-12 h-12 animate-spin rounded-full border-4 border-t-transparent border-brand text-center">
        <span className="text-2xl font-bold text-brand animate-pulse absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
          M
        </span>
      </div>
    </div>
  );
}
