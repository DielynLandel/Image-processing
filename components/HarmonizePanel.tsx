/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface HarmonizePanelProps {
  onApplyHarmonize: (prompt: string) => void;
  isLoading: boolean;
  foregroundHotspot: { x: number, y: number } | null;
  backgroundHotspot: { x: number, y: number } | null;
  onResetPoints: () => void;
}

const HarmonizePanel: React.FC<HarmonizePanelProps> = ({ onApplyHarmonize, isLoading, foregroundHotspot, backgroundHotspot, onResetPoints }) => {
  const [prompt, setPrompt] = useState('');

  const getInstruction = () => {
    if (!foregroundHotspot) {
      return <><strong>Step 1:</strong> Click the main object/person to integrate.</>;
    }
    if (!backgroundHotspot) {
      return <><strong>Step 2:</strong> Click the background area.</>;
    }
    return <><strong>Ready!</strong> You can now integrate the image.</>;
  }

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm text-center">
      <h3 className="text-xl font-bold text-gray-100">Integrate Image</h3>
      <p className="text-md text-gray-400 max-w-2xl">
        Make a pasted object look natural. Select a point on the foreground object and a point on the background. The AI will then blend them seamlessly.
      </p>
      
      <div className={`w-full max-w-lg text-lg p-4 rounded-md transition-colors duration-300 ${!backgroundHotspot ? 'bg-blue-500/20 text-blue-200' : 'bg-green-500/20 text-green-200'}`}>
        {getInstruction()}
      </div>

      <div className="w-full flex items-center gap-2 mt-2">
        <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional: Add details (e.g., 'make the lighting dramatic')"
            className="flex-grow bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-5 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
        />
        <button
            onClick={onResetPoints}
            disabled={isLoading || (!foregroundHotspot && !backgroundHotspot)}
            className="bg-white/10 border border-white/20 text-gray-200 font-semibold py-5 px-6 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 active:scale-95 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear selected points"
        >
            Reset Points
        </button>
      </div>
      
      <button
        onClick={() => onApplyHarmonize(prompt)}
        disabled={isLoading || !foregroundHotspot || !backgroundHotspot}
        className="w-full max-w-xs mt-4 bg-gradient-to-br from-cyan-600 to-teal-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-teal-800 disabled:to-teal-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? 'Integrating...' : 'Integrate Image'}
      </button>
    </div>
  );
};

export default HarmonizePanel;