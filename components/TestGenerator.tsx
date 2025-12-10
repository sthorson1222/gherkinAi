import React, { useState, useRef } from 'react';
import { generateGherkin } from '../services/geminiService';
import { GeneratedFeature } from '../types';
import { Sparkles, Save, Copy, RefreshCw, AlertCircle, Upload, X, Zap, Image as ImageIcon, FileText, Code } from 'lucide-react';

interface TestGeneratorProps {
  onSaveFeature: (feature: GeneratedFeature) => void;
}

export const TestGenerator: React.FC<TestGeneratorProps> = ({ onSaveFeature }) => {
  const [userStory, setUserStory] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [featureOutput, setFeatureOutput] = useState('');
  const [stepsOutput, setStepsOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'feature' | 'steps'>('feature');

  const [error, setError] = useState<string | null>(null);
  
  // New features state
  const [selectedImage, setSelectedImage] = useState<{base64: string, mimeType: string, preview: string} | null>(null);
  const [useFastMode, setUseFastMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // result is "data:image/jpeg;base64,..."
        const base64Content = result.split(',')[1];
        const mimeType = result.split(';')[0].split(':')[1];
        
        setSelectedImage({
          base64: base64Content,
          mimeType: mimeType,
          preview: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!userStory.trim() && !selectedImage) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateGherkin({
        userStory,
        context,
        imageBase64: selectedImage?.base64,
        mimeType: selectedImage?.mimeType,
        useFastMode
      });
      setFeatureOutput(result.feature);
      setStepsOutput(result.steps);
      setActiveTab('feature');
    } catch (e) {
      setError("Failed to generate content. Please check your API key or connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!featureOutput) return;
    const titleMatch = featureOutput.match(/Feature:\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Feature';
    
    onSaveFeature({
      id: Date.now().toString(),
      title,
      content: featureOutput,
      stepsCode: stepsOutput,
      createdAt: new Date().toISOString(),
    });
    
    alert('Feature and Steps saved to library!');
  };

  const currentOutput = activeTab === 'feature' ? featureOutput : stepsOutput;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Section */}
      <div className="flex flex-col gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm flex-1 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">1</span>
              Define Requirements
            </h2>
            
            {/* Fast Mode Toggle */}
            <button
              onClick={() => setUseFastMode(!useFastMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                useFastMode 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/50' 
                  : 'bg-slate-700 text-slate-400 border-transparent hover:border-slate-500'
              }`}
              title="Uses gemini-2.5-flash-lite for lower latency"
            >
              <Zap size={14} className={useFastMode ? "fill-amber-400" : ""} />
              Fast Mode
            </button>
          </div>
          
          <label className="block text-sm font-medium text-slate-300 mb-2">User Story / Acceptance Criteria</label>
          <textarea
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm"
            placeholder="As a user, I want to login so that I can access my dashboard..."
            value={userStory}
            onChange={(e) => setUserStory(e.target.value)}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Technical Context (Optional)</label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="e.g., The login button id is #login-btn"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          {/* Image Upload Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
              <span>UI Mockup / Screenshot (Optional)</span>
              {selectedImage && (
                <span className="text-xs text-purple-400 font-normal">Using gemini-3-pro-preview</span>
              )}
            </label>
            
            {!selectedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:bg-slate-700/20 cursor-pointer transition-all"
              >
                <Upload size={24} className="mb-2" />
                <span className="text-sm">Click to upload UI image</span>
                <span className="text-xs text-slate-600 mt-1">Supports PNG, JPEG, WEBP</span>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-slate-600 group">
                <img src={selectedImage.preview} alt="Upload preview" className="w-full h-48 object-cover opacity-80" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={clearImage}
                     className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded flex items-center gap-1">
                   <ImageIcon size={12} /> Image Analysis Active
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!userStory && !selectedImage)}
            className={`mt-6 w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              isGenerating || (!userStory && !selectedImage)
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            {isGenerating ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <Sparkles size={20} />
            )}
            {isGenerating ? 'Generating...' : 'Generate with Gemini'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>
      </div>

      {/* Output Section */}
      <div className="flex flex-col gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">2</span>
              Generated Assets
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => navigator.clipboard.writeText(currentOutput)}
                disabled={!currentOutput}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                title="Copy to Clipboard"
              >
                <Copy size={18} />
              </button>
              <button 
                onClick={handleSave}
                disabled={!featureOutput}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-slate-700 mb-0">
             <button
                onClick={() => setActiveTab('feature')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'feature' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
             >
                <FileText size={14} /> Feature (Gherkin)
             </button>
             <button
                onClick={() => setActiveTab('steps')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'steps' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
             >
                <Code size={14} /> Steps (Typescript)
             </button>
          </div>

          <div className="flex-1 relative bg-slate-950 rounded-b-lg border-x border-b border-slate-700 mt-0">
            <textarea
              className={`absolute inset-0 w-full h-full bg-transparent p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none ${
                 activeTab === 'feature' ? 'text-green-400' : 'text-blue-300'
              }`}
              value={currentOutput}
              onChange={(e) => activeTab === 'feature' ? setFeatureOutput(e.target.value) : setStepsOutput(e.target.value)}
              placeholder={activeTab === 'feature' ? "# Gherkin..." : "// Typescript Steps..."}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};