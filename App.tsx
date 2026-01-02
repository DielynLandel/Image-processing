
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateExpandedImage, generateHarmonizedImage, generateEnhancedImage, generateReframedImage, generateCombinedImage, generateZoomedImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import ExpandPanel from './components/ExpandPanel';
import HarmonizePanel from './components/HarmonizePanel';
import EnhancePanel from './components/EnhancePanel';
import ReframePanel from './components/ReframePanel';
import CombinePanel from './components/CombinePanel';
import ZoomPanel from './components/ZoomPanel';
import { UndoIcon, RedoIcon, EyeIcon, UserIcon, MagicWandIcon, SunIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

type Tab = 'retouch' | 'integrate' | 'combine' | 'adjust' | 'reframe' | 'enhance' | 'filters' | 'crop' | 'expand' | 'zoom';

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  
  // State for different interaction modes
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  
  const [foregroundHotspot, setForegroundHotspot] = useState<{ x: number, y: number } | null>(null);
  const [backgroundHotspot, setBackgroundHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayForegroundHotspot, setDisplayForegroundHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayBackgroundHotspot, setDisplayBackgroundHotspot] = useState<{ x: number, y: number } | null>(null);

  // Crop states
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();

  // Enhance crop states
  const [enhanceCrop, setEnhanceCrop] = useState<Crop>();
  const [completedEnhanceCrop, setCompletedEnhanceCrop] = useState<PixelCrop>();

  const [isComparing, setIsComparing] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const clearInteractionPoints = useCallback(() => {
    setEditHotspot(null);
    setDisplayHotspot(null);
    setForegroundHotspot(null);
    setBackgroundHotspot(null);
    setDisplayForegroundHotspot(null);
    setDisplayBackgroundHotspot(null);
    setEnhanceCrop(undefined);
    setCompletedEnhanceCrop(undefined);
  }, []);

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
    clearInteractionPoints();
  }, [history, historyIndex, clearInteractionPoints]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    clearInteractionPoints();
  }, [clearInteractionPoints]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }
    
    if (!prompt.trim()) {
        setError('Please enter a description for your edit.');
        return;
    }

    if (!editHotspot) {
        setError('Please click on the image to select an area to edit.');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to generate the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply a filter to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the filter. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the adjustment. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyReframe = useCallback(async (cameraAnglePrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to reframe.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const reframedImageUrl = await generateReframedImage(currentImage, cameraAnglePrompt);
        const newImageFile = dataURLtoFile(reframedImageUrl, `reframed-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to reframe the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyZoom = useCallback(async (zoomPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply zoom to.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const zoomedImageUrl = await generateZoomedImage(currentImage, zoomPrompt);
        const newImageFile = dataURLtoFile(zoomedImageUrl, `zoomed-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply zoom. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyEnhancement = useCallback(async (enhancementPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an enhancement to.');
      return;
    }
    if (!completedEnhanceCrop || completedEnhanceCrop.width === 0) {
        setError('Please select an area on the image to enhance.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const enhancedImageUrl = await generateEnhancedImage(currentImage, enhancementPrompt, completedEnhanceCrop);
        const newImageFile = dataURLtoFile(enhancedImageUrl, `enhanced-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to apply the enhancement. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, completedEnhanceCrop]);
  
  const handleApplyExpansion = useCallback(async (aspectRatio: number, userPrompt: string) => {
    if (!currentImage) {
        setError('No image loaded to expand.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const image = new Image();
        const imageUrl = URL.createObjectURL(currentImage);
        image.src = imageUrl;
        await new Promise<void>((resolve, reject) => {
            image.onload = () => { URL.revokeObjectURL(imageUrl); resolve(); };
            image.onerror = (err) => { URL.revokeObjectURL(imageUrl); reject(err); };
        });

        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;
        const originalAspect = originalWidth / originalHeight;

        let finalWidth: number, finalHeight: number;
        if (originalAspect > aspectRatio) {
            finalWidth = originalWidth;
            finalHeight = Math.round(originalWidth / aspectRatio);
        } else {
            finalHeight = originalHeight;
            finalWidth = Math.round(originalHeight * aspectRatio);
        }

        const MODEL_MAX_DIM = 2048;
        let scaleFactor = 1.0;
        if (finalWidth > MODEL_MAX_DIM || finalHeight > MODEL_MAX_DIM) {
            if (finalWidth > finalHeight) {
                scaleFactor = MODEL_MAX_DIM / finalWidth;
            } else {
                scaleFactor = MODEL_MAX_DIM / finalHeight;
            }
        }
        
        const modelCanvasWidth = Math.round(finalWidth * scaleFactor);
        const modelCanvasHeight = Math.round(finalHeight * scaleFactor);
        const scaledOriginalWidth = Math.round(originalWidth * scaleFactor);
        const scaledOriginalHeight = Math.round(originalHeight * scaleFactor);

        const modelCanvas = document.createElement('canvas');
        modelCanvas.width = modelCanvasWidth;
        modelCanvas.height = modelCanvasHeight;
        const modelCtx = modelCanvas.getContext('2d');
        if (!modelCtx) throw new Error("Could not create canvas context for model.");
        
        modelCtx.fillStyle = 'white';
        modelCtx.fillRect(0, 0, modelCanvasWidth, modelCanvasHeight);
        modelCtx.imageSmoothingQuality = 'high';

        const dxModel = (modelCanvasWidth - scaledOriginalWidth) / 2;
        const dyModel = (modelCanvasHeight - scaledOriginalHeight) / 2;
        modelCtx.drawImage(image, dxModel, dyModel, scaledOriginalWidth, scaledOriginalHeight);

        const paddedDataUrlForModel = modelCanvas.toDataURL('image/png');
        const paddedImageFileForModel = dataURLtoFile(paddedDataUrlForModel, `padded-for-model-${Date.now()}.png`);
        
        const expandedImageDataUrl = await generateExpandedImage(paddedImageFileForModel, userPrompt);
        
        const newImageFile = dataURLtoFile(expandedImageDataUrl, `expanded-final-${Date.now()}.png`);
        addImageToHistory(newImageFile);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to expand the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
}, [currentImage, addImageToHistory]);

const handleApplyHarmonize = useCallback(async (userPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to harmonize.');
      return;
    }
    if (!foregroundHotspot || !backgroundHotspot) {
        setError('Please select a foreground object and a background point.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const harmonizedImageUrl = await generateHarmonizedImage(currentImage, userPrompt, foregroundHotspot, backgroundHotspot);
        const newImageFile = dataURLtoFile(harmonizedImageUrl, `harmonized-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to harmonize the image. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, foregroundHotspot, backgroundHotspot]);

  const handleApplyCombine = useCallback(async (sourceImage: File, userPrompt: string) => {
    if (!currentImage) {
      setError('No destination image loaded.');
      return;
    }
    if (!editHotspot) {
        setError('Please select a location on the destination image.');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const combinedImageUrl = await generateCombinedImage(currentImage, sourceImage, userPrompt, editHotspot);
        const newImageFile = dataURLtoFile(combinedImageUrl, `combined-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to combine images. ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory, editHotspot]);

  const handleApplyCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
        setError('Please select an area to crop.');
        return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setError('Could not process the crop.');
        return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );
    
    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);

  }, [completedCrop, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      clearInteractionPoints();
    }
  }, [canUndo, historyIndex, clearInteractionPoints]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      clearInteractionPoints();
    }
  }, [canRedo, historyIndex, clearInteractionPoints]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      clearInteractionPoints();
    }
  }, [history, clearInteractionPoints]);

  const handleUploadNew = useCallback(() => {
      setHistory([]);
      setHistoryIndex(-1);
      setError(null);
      setPrompt('');
      clearInteractionPoints();
  }, [clearInteractionPoints]);

  const handleDownload = useCallback(() => {
      if (currentImage) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(currentImage);
          link.download = `edited-${currentImage.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
      }
  }, [currentImage]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    if (activeTab === 'retouch' || activeTab === 'combine') {
        setDisplayHotspot({ x: offsetX, y: offsetY });
        setEditHotspot({ x: originalX, y: originalY });
    } else if (activeTab === 'integrate') {
        if (!foregroundHotspot || (foregroundHotspot && backgroundHotspot)) {
            setDisplayForegroundHotspot({ x: offsetX, y: offsetY });
            setForegroundHotspot({ x: originalX, y: originalY });
            setDisplayBackgroundHotspot(null);
            setBackgroundHotspot(null);
        } else if (!backgroundHotspot) {
            setDisplayBackgroundHotspot({ x: offsetX, y: offsetY });
            setBackgroundHotspot({ x: originalX, y: originalY });
        }
    }
  };
  
  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab);
    clearInteractionPoints();
  }

  const renderContent = () => {
    if (error) {
       return (
           <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
            <p className="text-md text-red-400">{error}</p>
            <button
                onClick={() => setError(null)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
              >
                Try Again
            </button>
          </div>
        );
    }
    
    if (!currentImageUrl) {
      return <StartScreen onFileSelect={handleFileSelect} />;
    }

    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
        <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700 backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <button onClick={handleUndo} disabled={!canUndo} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors" title="Undo">
                <UndoIcon className="w-6 h-6" />
             </button>
             <button onClick={handleRedo} disabled={!canRedo} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors" title="Redo">
                <UndoIcon className="w-6 h-6 rotate-180" />
             </button>
             <div className="h-6 w-px bg-gray-700 mx-2" />
             <button 
                onMouseDown={() => setIsComparing(true)} 
                onMouseUp={() => setIsComparing(false)}
                onMouseLeave={() => setIsComparing(false)}
                disabled={!canUndo}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
             >
                <EyeIcon className="w-4 h-4" />
                Hold to Compare
             </button>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Reset</button>
             <button onClick={handleUploadNew} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">New Image</button>
             <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">Download</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-700 shadow-2xl min-h-[400px] flex items-center justify-center">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in">
                            <Spinner />
                            <p className="text-blue-400 font-bold text-lg animate-pulse">Processing with AI...</p>
                        </div>
                    )}
                    
                    {activeTab === 'crop' || activeTab === 'enhance' ? (
                        <ReactCrop 
                            crop={activeTab === 'crop' ? crop : enhanceCrop} 
                            onChange={(_, percentCrop) => activeTab === 'crop' ? setCrop(percentCrop) : setEnhanceCrop(percentCrop)} 
                            onComplete={(c) => activeTab === 'crop' ? setCompletedCrop(c) : setCompletedEnhanceCrop(c)}
                            aspect={activeTab === 'crop' ? aspect : undefined}
                            className="max-h-[70vh]"
                        >
                            <img 
                                ref={imgRef}
                                src={(isComparing && originalImageUrl) ? originalImageUrl : currentImageUrl!} 
                                alt="Editing" 
                                className="max-w-full block" 
                            />
                        </ReactCrop>
                    ) : (
                        <div className="relative cursor-crosshair">
                            <img 
                                ref={imgRef}
                                src={(isComparing && originalImageUrl) ? originalImageUrl : currentImageUrl!} 
                                alt="Editing" 
                                className="max-w-full max-h-[70vh] block"
                                onClick={handleImageClick}
                            />
                            {/* Display Interaction Points */}
                            {displayHotspot && (activeTab === 'retouch' || activeTab === 'combine') && (
                                <div className="absolute w-6 h-6 border-2 border-white rounded-full bg-blue-500/50 shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping" style={{ left: displayHotspot.x, top: displayHotspot.y }} />
                            )}
                            {displayForegroundHotspot && activeTab === 'integrate' && (
                                <div className="absolute w-6 h-6 border-2 border-white rounded-full bg-blue-500/50 shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ left: displayForegroundHotspot.x, top: displayForegroundHotspot.y }}>
                                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-blue-500 px-1 rounded whitespace-nowrap">Subject</div>
                                </div>
                            )}
                            {displayBackgroundHotspot && activeTab === 'integrate' && (
                                <div className="absolute w-6 h-6 border-2 border-white rounded-full bg-green-500/50 shadow-lg pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ left: displayBackgroundHotspot.x, top: displayBackgroundHotspot.y }}>
                                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-green-500 px-1 rounded whitespace-nowrap">Back</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                   {(['retouch', 'integrate', 'combine', 'adjust', 'reframe', 'enhance', 'filters', 'crop', 'expand', 'zoom'] as Tab[]).map((tab) => (
                       <button
                           key={tab}
                           onClick={() => handleTabSwitch(tab)}
                           className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                       >
                           {tab}
                       </button>
                   ))}
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                {activeTab === 'retouch' && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm animate-fade-in">
                        <h3 className="text-xl font-bold text-white mb-2">Smart Retouch</h3>
                        <p className="text-sm text-gray-400 mb-6">Click a point on the image and describe the change.</p>
                        <div className="space-y-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., 'change shirt color to red' or 'remove this object'"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !prompt.trim() || !editHotspot}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                            >
                                Generate Edit
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
                {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />}
                {activeTab === 'crop' && <CropPanel onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop} />}
                {activeTab === 'expand' && <ExpandPanel onApplyExpansion={handleApplyExpansion} isLoading={isLoading} />}
                {activeTab === 'integrate' && <HarmonizePanel onApplyHarmonize={handleApplyHarmonize} isLoading={isLoading} foregroundHotspot={foregroundHotspot} backgroundHotspot={backgroundHotspot} onResetPoints={clearInteractionPoints} />}
                {activeTab === 'enhance' && <EnhancePanel onApplyEnhancement={handleApplyEnhancement} isLoading={isLoading} isAreaSelected={!!completedEnhanceCrop} />}
                {activeTab === 'reframe' && <ReframePanel onApplyReframe={handleApplyReframe} isLoading={isLoading} />}
                {activeTab === 'combine' && <CombinePanel onApplyCombine={handleApplyCombine} isLoading={isLoading} insertionHotspot={editHotspot} />}
                {activeTab === 'zoom' && <ZoomPanel onApplyZoom={handleApplyZoom} isLoading={isLoading} />}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
