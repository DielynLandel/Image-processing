/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface EnhancePanelProps {
  onApplyEnhancement: (prompt: string) => void;
  isLoading: boolean;
  isAreaSelected: boolean;
}

const EnhancePanel: React.FC<EnhancePanelProps> = ({ onApplyEnhancement, isLoading, isAreaSelected }) => {
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    onApplyEnhancement(prompt);
  };

  const instruction = isAreaSelected 
    ? 'Great! Now you can add an optional description or apply the enhancement.' 
    : 'Drag on the image to select an area to enhance.';

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm text-center">
      <h3 className="text-xl font-bold text-gray-100">Enhance Details</h3>
      <p className="text-md text-gray-400 max-w-2xl">
        {instruction}
      </p>
      
      <div className="w-full flex flex-col items-center gap-4 mt-2">
        <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isAreaSelected ? "Optional: guide the AI (e.g., 'focus on the faces')" : "First, select an area on the image"}
            className="w-full flex-grow bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-5 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !isAreaSelected}
        />
        <button
          onClick={handleApply}
          disabled={isLoading || !isAreaSelected}
          className="w-full max-w-xs mt-2 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-indigo-800 disabled:to-indigo-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Enhancing...' : 'Enhance Details'}
        </button>
      </div>
    </div>
  );
};

export default EnhancePanel;