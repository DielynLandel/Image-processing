/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { UploadIcon } from './icons';

interface CombinePanelProps {
  onApplyCombine: (sourceImage: File, prompt: string) => void;
  isLoading: boolean;
  insertionHotspot: { x: number, y: number } | null;
}

const CombinePanel: React.FC<CombinePanelProps> = ({ onApplyCombine, isLoading, insertionHotspot }) => {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (sourceImage) {
      const url = URL.createObjectURL(sourceImage);
      setSourceImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setSourceImageUrl(null);
  }, [sourceImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSourceImage(e.target.files[0]);
    }
  };

  const getInstruction = () => {
    if (!sourceImage) {
      return <><strong>Step 1:</strong> Upload an image containing the person/object to add.</>;
    }
    if (!insertionHotspot) {
      return <><strong>Step 2:</strong> Click a location on the main image to place them.</>;
    }
    return <><strong>Step 3:</strong> Describe how they should be added and click Generate.</>;
  };

  const canGenerate = !isLoading && sourceImage && insertionHotspot && !!prompt.trim();

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm text-center">
      <h3 className="text-xl font-bold text-gray-100">Combine Images</h3>
      <p className="text-md text-gray-400 max-w-2xl">
        Add a person or object from another image into your current photo.
      </p>
      
      <div className={`w-full max-w-lg text-lg p-4 rounded-md transition-colors duration-300 ${!insertionHotspot ? 'bg-blue-500/20 text-blue-200' : 'bg-green-500/20 text-green-200'}`}>
        {getInstruction()}
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <label htmlFor="source-image-upload" className="relative flex flex-col items-center justify-center w-48 h-32 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
          {sourceImageUrl ? (
            <img src={sourceImageUrl} alt="Source Preview" className="object-cover w-full h-full rounded-md" />
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
              <UploadIcon className="w-8 h-8 mb-2" />
              <p className="text-sm font-semibold">Upload Source</p>
            </div>
          )}
        </label>
        <input id="source-image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="w-full flex flex-col items-center gap-2 mt-2">
        <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'add this person next to the soldier'"
            className="w-full flex-grow bg-gray-800 border border-gray-700 text-gray-200 rounded-lg p-5 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !sourceImage || !insertionHotspot}
        />
        <button
          onClick={() => sourceImage && onApplyCombine(sourceImage, prompt)}
          disabled={!canGenerate}
          className="w-full max-w-xs mt-4 bg-gradient-to-br from-orange-600 to-amber-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-amber-800 disabled:to-amber-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Combining...' : 'Combine Images'}
        </button>
      </div>
    </div>
  );
};

export default CombinePanel;
