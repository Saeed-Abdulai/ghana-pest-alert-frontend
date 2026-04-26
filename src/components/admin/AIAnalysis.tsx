// ============================================================================
// AI ANALYSIS COMPONENT
// Interface for generating AI-powered pest analysis using GPT-4o-mini
// Allows users to identify pests, analyze problems, and get recommendations
// ============================================================================

import React, { useState } from 'react';
import {
  Bot, Search, Leaf, MapPin, AlertTriangle,
  Loader2, CheckCircle, Copy, Send, Sparkles,
  ImagePlus, X
} from 'lucide-react';
import { aiApi, alertsApi } from '@/services/backendApi';
import { supabase } from '@/lib/supabase';
import { GHANA_REGIONS, GHANA_CROPS, COMMON_PESTS } from '@/types';

type AnalysisType = 'identify' | 'analyze' | 'recommend';

const AIAnalysis: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('identify');
  const [pestName, setPestName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [alertCreated, setAlertCreated] = useState(false);
  const [result, setResult] = useState<{
    content: string;
    confidence: number;
    timestamp: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);

  const toggleCrop = (crop: string) => {
    setSelectedCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `alert-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('alert-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw new Error('Failed to upload image');
    const { data: urlData } = supabase.storage
      .from('alert-images')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');
    setResult(null);
    setAlertCreated(false);

    try {
      const response = await aiApi.analyze({
        analysisType,
        pestName: analysisType !== 'identify' ? pestName : undefined,
        symptoms: analysisType === 'identify' ? symptoms : undefined,
        affectedCrops: selectedCrops.length > 0 ? selectedCrops : undefined,
        region: selectedRegion || undefined,
      });

      if (response.success) {
        setResult({
          content: response.generatedContent,
          confidence: Math.round(response.confidenceScore * 100),
          timestamp: response.timestamp,
        });
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createAlertFromResult = async () => {
    if (!result) return;
    setIsCreatingAlert(true);
    setError('');
    try {
      let imageUrl = '';
      if (imageFile) {
        setImageUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } catch {
          setError('Failed to upload image.');
          setIsCreatingAlert(false);
          setImageUploading(false);
          return;
        }
        setImageUploading(false);
      }

      const response = await alertsApi.create({
        title: `AI Analysis: ${pestName || 'Pest Identification'} - ${selectedRegion || 'Ghana'}`,
        pest_name: pestName || 'Unknown',
        affected_crops: selectedCrops,
        severity: 'medium',
        description: result.content.substring(0, 500),
        symptoms: analysisType === 'identify' ? symptoms : '',
        preventive_measures: '',
        control_measures: '',
        affected_regions: selectedRegion ? [selectedRegion] : [],
        source: 'ai_generated',
        ai_confidence_score: result.confidence / 100,
        ...(imageUrl && { image_url: imageUrl }),
      });

      if (response.success) {
        setAlertCreated(true);
        removeImage();
        setTimeout(() => setAlertCreated(false), 4000);
      }
    } catch (err: any) {
      setError('Failed to create alert. Please try again.');
    } finally {
      setIsCreatingAlert(false);
      setImageUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Pest Analysis</h1>
        <p className="text-gray-500 mt-1">
          Use GPT-4o-mini to identify pests, analyze problems, and generate recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Input form */}
        <div className="space-y-6">

          {/* Analysis type selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Type</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setAnalysisType('identify')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  analysisType === 'identify'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Search className={`w-6 h-6 mx-auto mb-2 ${
                  analysisType === 'identify' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className={`font-medium text-sm ${
                  analysisType === 'identify' ? 'text-green-700' : 'text-gray-700'
                }`}>Identify</p>
                <p className="text-xs text-gray-500 mt-1">From symptoms</p>
              </button>

              <button
                onClick={() => setAnalysisType('analyze')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  analysisType === 'analyze'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${
                  analysisType === 'analyze' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <p className={`font-medium text-sm ${
                  analysisType === 'analyze' ? 'text-blue-700' : 'text-gray-700'
                }`}>Analyze</p>
                <p className="text-xs text-gray-500 mt-1">Known pest</p>
              </button>

              <button
                onClick={() => setAnalysisType('recommend')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  analysisType === 'recommend'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Sparkles className={`w-6 h-6 mx-auto mb-2 ${
                  analysisType === 'recommend' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <p className={`font-medium text-sm ${
                  analysisType === 'recommend' ? 'text-purple-700' : 'text-gray-700'
                }`}>Recommend</p>
                <p className="text-xs text-gray-500 mt-1">Get solutions</p>
              </button>
            </div>
          </div>

          {/* Input fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {analysisType === 'identify' ? 'Describe Symptoms' : 'Pest Information'}
            </h2>

            {analysisType === 'identify' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observed Symptoms
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe what you see on the crops... e.g., Yellow spots on leaves, wilting plants, small holes in stems, presence of caterpillars"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Pest Name
                  </label>
                  <select
                    value={pestName}
                    onChange={(e) => setPestName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Select a pest...</option>
                    {COMMON_PESTS.map(pest => (
                      <option key={pest} value={pest}>{pest}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or type custom pest name
                  </label>
                  <input
                    type="text"
                    value={pestName}
                    onChange={(e) => setPestName(e.target.value)}
                    placeholder="Enter pest or disease name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Context */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Context (Optional)</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Leaf className="w-4 h-4 inline mr-1" />
                Affected Crops
              </label>
              <div className="flex flex-wrap gap-2">
                {GHANA_CROPS.slice(0, 10).map(crop => (
                  <button
                    key={crop}
                    onClick={() => toggleCrop(crop)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCrops.includes(crop)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select region (optional)</option>
                {GHANA_REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (analysisType === 'identify' ? !symptoms.trim() : !pestName.trim())}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" />
                Run AI Analysis
              </>
            )}
          </button>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right column - Results */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Analysis Result</h2>
              {result && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {result.confidence}% confidence
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Result content */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {result.content}
                  </pre>
                </div>

                {/* Validation notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Requires Validation</p>
                    <p className="text-xs text-amber-700 mt-1">
                      This AI-generated content must be reviewed by an extension officer before being sent to farmers.
                    </p>
                  </div>
                </div>

                {/* Image upload for AI alert */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ImagePlus className="w-4 h-4" />
                    Add Pest Image to Alert (Optional)
                  </label>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                      <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">Click to upload pest image</p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                  {imageUploading && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-purple-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading image...
                    </div>
                  )}
                </div>

                {/* Success message */}
                {alertCreated && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Alert created and added to validation queue. An officer will review it before publishing.
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={createAlertFromResult}
                    disabled={isCreatingAlert || alertCreated || imageUploading}
                    className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingAlert || imageUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {imageUploading ? 'Uploading...' : 'Creating...'}
                      </>
                    ) : alertCreated ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Alert Created!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Create Alert
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Generated at {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500">
                  {isAnalyzing
                    ? 'AI is analyzing your request...'
                    : 'Run an analysis to see AI-generated results here'
                  }
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Results will include pest information, symptoms, and control measures
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;