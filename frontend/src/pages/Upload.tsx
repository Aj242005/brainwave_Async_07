import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload as UploadIcon,
    X,
    Compass,
    ChevronLeft,
    ChevronRight,
    Wallet,
    Users,
    Sparkles,
    MapPin
} from 'lucide-react';
import { createTripPlan } from '../services/api';
import type { TripPreferences } from '../types';

interface UploadProps {
    onSessionCreated: (sessionId: string) => void;
}

const travelStyles = [
    { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
    { id: 'relaxation', label: 'Relaxation', emoji: '🏖️' },
    { id: 'culture', label: 'Culture', emoji: '🏛️' },
    { id: 'food', label: 'Food', emoji: '🍜' },
    { id: 'luxury', label: 'Luxury', emoji: '✨' },
    { id: 'budget', label: 'Budget', emoji: '💰' },
];

const companions = [
    { id: 'solo', label: 'Solo', emoji: '🧍' },
    { id: 'partner', label: 'Partner', emoji: '💑' },
    { id: 'friends', label: 'Friends', emoji: '👥' },
    { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
];

function Upload({ onSessionCreated }: UploadProps) {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [step, setStep] = useState<'upload' | 'preferences'>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [preferences, setPreferences] = useState<TripPreferences>({
        budget: 500,
        currency: 'USD',
        companions: 'solo',
        travelStyle: ['culture', 'food'],
    });
    const [destination, setDestination] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = [...files, ...acceptedFiles].slice(0, 15);
        setFiles(newFiles);

        // Create previews
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => {
            prev.forEach(url => URL.revokeObjectURL(url));
            return newPreviews;
        });
    }, [files]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        maxFiles: 15,
    });

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setFiles(files.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const toggleStyle = (styleId: string) => {
        setPreferences(prev => ({
            ...prev,
            travelStyle: prev.travelStyle.includes(styleId)
                ? prev.travelStyle.filter(s => s !== styleId)
                : [...prev.travelStyle, styleId]
        }));
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            setError('Please upload at least one screenshot');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { sessionId } = await createTripPlan(files, preferences, destination || undefined);
            onSessionCreated(sessionId);
            navigate('/plan');
        } catch (err: any) {
            setError(err.message || 'Failed to start planning. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-8 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <button
                        onClick={() => step === 'preferences' ? setStep('upload') : navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>
                    <div className="flex items-center gap-3">
                        <Compass className="w-6 h-6 text-[#667eea]" />
                        <span className="font-semibold">Compass</span>
                    </div>
                </motion.div>

                {/* Progress Steps */}
                <motion.div
                    className="flex items-center justify-center gap-4 mb-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-white' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'upload' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-white/10'
                            }`}>1</div>
                        <span className="hidden sm:inline">Upload</span>
                    </div>
                    <div className="w-12 h-px bg-white/20"></div>
                    <div className={`flex items-center gap-2 ${step === 'preferences' ? 'text-white' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'preferences' ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-white/10'
                            }`}>2</div>
                        <span className="hidden sm:inline">Preferences</span>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {step === 'upload' ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold mb-2">Upload Your Screenshots</h1>
                                <p className="text-gray-400">
                                    Add travel posts from Instagram, TikTok, or anywhere (up to 15)
                                </p>
                            </div>

                            {/* Upload Zone */}
                            <div
                                {...getRootProps()}
                                className={`upload-zone mb-6 ${isDragActive ? 'active' : ''}`}
                            >
                                <input {...getInputProps()} />
                                <UploadIcon className="w-12 h-12 mx-auto mb-4 text-[#667eea]" />
                                <p className="text-lg font-medium mb-2">
                                    {isDragActive ? 'Drop your screenshots here' : 'Drag & drop screenshots here'}
                                </p>
                                <p className="text-gray-400 text-sm">or click to browse</p>
                            </div>

                            {/* Preview Grid */}
                            {previews.length > 0 && (
                                <motion.div
                                    className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-8"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {previews.map((preview, i) => (
                                        <motion.div
                                            key={i}
                                            className="relative aspect-square rounded-xl overflow-hidden group"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <img
                                                src={preview}
                                                alt={`Screenshot ${i + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            <div className="flex justify-center">
                                <motion.button
                                    className="btn-primary flex items-center gap-2"
                                    onClick={() => files.length > 0 && setStep('preferences')}
                                    disabled={files.length === 0}
                                    whileHover={{ scale: files.length > 0 ? 1.05 : 1 }}
                                    whileTap={{ scale: files.length > 0 ? 0.95 : 1 }}
                                    style={{ opacity: files.length > 0 ? 1 : 0.5 }}
                                >
                                    Continue
                                    <ChevronRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preferences"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold mb-2">Tell Us About Your Trip</h1>
                                <p className="text-gray-400">
                                    Help us personalize your itinerary
                                </p>
                            </div>

                            <div className="space-y-8 max-w-2xl mx-auto">
                                {/* Destination */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                        <MapPin className="w-4 h-4 text-[#667eea]" />
                                        Destination (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="e.g., Tokyo, Japan"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#667eea] focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* Budget Slider */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                        <Wallet className="w-4 h-4 text-[#667eea]" />
                                        Daily Budget
                                    </label>
                                    <div className="glass rounded-xl p-6">
                                        <div className="text-center mb-4">
                                            <span className="text-4xl font-bold gradient-text">${preferences.budget}</span>
                                            <span className="text-gray-400 ml-2">/ day</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="1000"
                                            step="25"
                                            value={preferences.budget}
                                            onChange={(e) => setPreferences({ ...preferences, budget: parseInt(e.target.value) })}
                                            className="budget-slider"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                                            <span>$50</span>
                                            <span>$1000+</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Companions */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                        <Users className="w-4 h-4 text-[#667eea]" />
                                        Who's Coming?
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {companions.map((c) => (
                                            <motion.button
                                                key={c.id}
                                                onClick={() => setPreferences({ ...preferences, companions: c.id as any })}
                                                className={`p-4 rounded-xl text-center transition-all ${preferences.companions === c.id
                                                    ? 'bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border-[#667eea]'
                                                    : 'bg-white/5 border-white/10'
                                                    } border`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span className="text-2xl block mb-1">{c.emoji}</span>
                                                <span className="text-sm">{c.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Travel Style */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-3">
                                        <Sparkles className="w-4 h-4 text-[#667eea]" />
                                        Travel Style (Select multiple)
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {travelStyles.map((style) => (
                                            <motion.button
                                                key={style.id}
                                                onClick={() => toggleStyle(style.id)}
                                                className={`p-4 rounded-xl text-center transition-all ${preferences.travelStyle.includes(style.id)
                                                    ? 'bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border-[#667eea]'
                                                    : 'bg-white/5 border-white/10'
                                                    } border`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span className="text-2xl block mb-1">{style.emoji}</span>
                                                <span className="text-sm">{style.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Submit */}
                                <motion.button
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: loading ? 1 : 0.98 }}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Create My Itinerary
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default Upload;
