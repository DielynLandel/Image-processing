/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface ExpandPanelProps {
  onApplyExpansion: (aspectRatio: number, prompt: string) => void;
  isLoading: boolean;
}

type AspectRatio = '16:9' | '32:9' | '9:16' | '4:3' | '3:4' | '1:1';

const aspects: { name: AspectRatio; value: number }[] = [
  { name: '16:9', value: 16 / 9 },
  { name: '32:9', value: 32 / 9 },
  { name: '9:16', value: 9 / 16 },
  { name: '4:3', value: 4 / 3 },
  { name: '3:4', value: 3 / 4 },
  { name: '1:1', value: 1 },
];

const ExpandPanel: React.FC<ExpandPanelProps> = ({ onApplyExpansion, isLoading }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('16:9');
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    const selectedAspect = aspects.find(a => a.name === activeAspect);
    if (selectedAspect) {
      onApplyExpansion(selectedAspect.value, prompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">Expand Canvas</h3>
      <p className="text-sm text-gray-400 -mt-2">Choose a new aspect ratio and describe what to add.</p>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-sm font-medium text-gray-400">Target Aspect Ratio:</span>
        {aspects.map(({ name }) => (
          <button
            key={name}
            onClick={() => setActiveAspect(name)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
              activeAspect === name 
              ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20' 
              : 'bg-white/10 hover:bg-white/20 text-gray-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Optional: describe the new content (e.g., 'a sandy beach')"
        className="mt-2 w-full flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60 text-base"
        disabled={isLoading}
      />

      <button
        onClick={handleApply}
        disabled={isLoading}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        Apply Expansion
      </button>
    </div>
  );
};

export default ExpandPanel;