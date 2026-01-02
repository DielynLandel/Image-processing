/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ReframePanelProps {
  onApplyReframe: (prompt: string) => void;
  isLoading: boolean;
}

const presets = [
  { 
    name: 'Over-the-Shoulder', 
    prompt: `Re-render from an over-the-shoulder third-person video game perspective. The camera is very close behind the subject's left shoulder, looking forward.` 
  },
  { 
    name: 'Low Angle', 
    prompt: `A dramatic shot from a low angle in front, with the camera looking up at the subject.` 
  },
  {
    name: "Worm's-eye View",
    prompt: `Re-render the image from an extreme low-angle, wide-angle perspective, as if the camera is placed on the floor very close to the main subject, looking up.`
  },
  { 
    name: 'Top-Down View', 
    prompt: `A shot from directly above, also known as a "bird's-eye view".` 
  },
  { 
    name: 'Dutch Angle', 
    prompt: `A shot with the camera tilted to create a sense of unease or disorientation.` 
  },
  {
    name: 'Side View',
    prompt: `A shot from the side, at eye level, showing the subject in profile.`
  },
  {
    name: 'Full Body',
    prompt: `A full-body shot from the front at eye level.`
  },
  {
    name: 'Close-up',
    prompt: `A close-up shot of the subject's face at eye level.`
  }
];


const ReframePanel: React.FC<ReframePanelProps> = ({ onApplyReframe, isLoading }) => {

  const handleApply = (prompt: string) => {
    if (prompt.trim() && !isLoading) {
      onApplyReframe(prompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm text-center">
      <h3 className="text-xl font-bold text-gray-100">Change Camera Angle</h3>
      <p className="text-md text-gray-400 max-w-2xl">
        Choose a preset camera angle. The subject will remain unchanged.
      </p>
      
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handleApply(preset.prompt)}
            disabled={isLoading}
            className="w-full text-center bg-white/10 border border-transparent text-gray-200 font-semibold py-4 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/20 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReframePanel;