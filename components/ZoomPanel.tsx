
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';

interface ZoomPanelProps {
  onApplyZoom: (prompt: string) => void;
  isLoading: boolean;
}

type LensAngle = 'Standard' | 'Wide' | 'Ultra-wide';

const MIN_ZOOM = -2;
const MAX_ZOOM = 3;

const zoomLevelDescriptions: { [key: number]: string } = {
  [MAX_ZOOM]: 'Macro Detail Focus',
  [2]: 'High-Resolution Center Study',
  [1]: 'Focal Magnification',
  [0]: 'Standard Calibration',
  [-1]: 'Wide-Field Context',
  [MIN_ZOOM]: 'Global Scene Panorama',
};

const zoomPrompts: { [key: number]: string } = {
    [3]: 'Execute 400% magnification. Focus on microscopic surface details and high-frequency textures of the central subject ROI.',
    [2]: 'Execute 200% magnification. Magnify central anatomical structures and resolve fine surface patterns.',
    [1]: 'Execute 150% focal length extension. Center perspective on primary anatomical features with high fidelity.',
    [0]: 'Maintain current standard photographic framing and perspective projection.',
    [-1]: 'Execute 75% focal length reduction. Synthesize surrounding environmental metadata to provide broader spatial context.',
    [-2]: 'Execute 50% wide-angle projection. Reconstruct a global panorama encompassing the complete scene and environment.',
};

const lensAngles: LensAngle[] = ['Standard', 'Wide', 'Ultra-wide'];

const ZoomPanel: React.FC<ZoomPanelProps> = ({ onApplyZoom, isLoading }) => {
  const [zoomLevel, setZoomLevel] = useState(0);
  const [lensAngle, setLensAngle] = useState<LensAngle>('Standard');

  const currentDescription = useMemo(() => zoomLevelDescriptions[zoomLevel], [zoomLevel]);

  const handleApply = () => {
    const basePrompt = zoomPrompts[zoomLevel];
    const angleModifier = lensAngle !== 'Standard' ? ` Use an ${lensAngle.toLowerCase()} lens distortion profile.` : '';
    onApplyZoom(`${basePrompt}${angleModifier}`);
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-100">Optical Zoom Control</h3>
        <p className="text-md text-gray-400 mt-1">Adjust the virtual focal length and lens characteristics.</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-400">Magnification Level</span>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-500/30">
            {currentDescription}
          </span>
        </div>
        
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={1}
          value={zoomLevel}
          onChange={(e) => setZoomLevel(parseInt(e.target.value))}
          disabled={isLoading}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        
        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
          <span>WIDE (0.5x)</span>
          <span>1.0x</span>
          <span>MACRO (4.0x)</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        <span className="text-sm font-medium text-gray-400">Lens Profile</span>
        <div className="flex gap-2 w-full">
          {lensAngles.map((angle) => (
            <button
              key={angle}
              onClick={() => setLensAngle(angle)}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-md text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                lensAngle === angle
                  ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-gray-700'
              }`}
            >
              {angle}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {isLoading ? 'Simulating Optics...' : 'Apply Zoom'}
      </button>

      <p className="text-[11px] text-gray-500 italic max-w-sm text-center">
        Note: High magnification on human subjects may trigger safety filters. If blocked, try a lower magnification level.
      </p>
    </div>
  );
};

export default ZoomPanel;
