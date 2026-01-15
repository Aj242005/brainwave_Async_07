import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Compass,
    CheckCircle2,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { getPlanStatus, getDemoItinerary } from '../services/api';

interface PlanProps {
    sessionId?: string;
    onItineraryReady: (itinerary: any) => void;
}

const agents = [
    { id: 'vision', name: 'Vision Intelligence', icon: '👁️' },
    { id: 'socialProof', name: 'Social Proof Validator', icon: '✅' },
    { id: 'location', name: 'Location Intelligence', icon: '📍' },
    { id: 'vibe', name: 'Vibe Matching', icon: '✨' },
    { id: 'clustering', name: 'Route Optimizer', icon: '🗺️' },
    { id: 'budget', name: 'Budget Calculator', icon: '💰' },
    { id: 'time', name: 'Time Orchestrator', icon: '⏰' },
    { id: 'itinerary', name: 'Itinerary Writer', icon: '📝' },
];

const stageToAgentIndex: Record<string, number> = {
    'uploading': 0,
    'extracting': 0,
    'validating': 2,
    'clustering': 4,
    'optimizing': 5,
    'generating': 7,
    'complete': 8,
    'error': -1
};

function Plan({ sessionId, onItineraryReady }: PlanProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isDemo = searchParams.get('demo') === 'true';

    const [status, setStatus] = useState({
        stage: 'extracting' as string,
        progress: 0,
        message: 'Starting...',
        currentAgent: 'Vision Intelligence'
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isDemo) {
            // Demo mode - simulate processing then load demo data
            simulateDemoProcessing();
            return;
        }

        if (!sessionId) {
            navigate('/upload');
            return;
        }

        // Poll for status
        const pollInterval = setInterval(async () => {
            try {
                const result = await getPlanStatus(sessionId);
                setStatus({
                    stage: result.stage,
                    progress: result.progress,
                    message: result.message,
                    currentAgent: result.currentAgent || ''
                });

                if (result.stage === 'complete' && result.result?.data) {
                    clearInterval(pollInterval);
                    onItineraryReady(result.result.data.itinerary);
                    navigate('/itinerary');
                } else if (result.stage === 'error') {
                    clearInterval(pollInterval);
                    setError(result.message);
                }
            } catch (err: any) {
                console.error('Polling error:', err);
            }
        }, 1000);

        return () => clearInterval(pollInterval);
    }, [sessionId, isDemo, navigate, onItineraryReady]);

    const simulateDemoProcessing = async () => {
        const stages = [
            { stage: 'extracting', progress: 15, message: 'Reading screenshots...', agent: 'Vision Intelligence' },
            { stage: 'validating', progress: 35, message: 'Verifying locations...', agent: 'Social Proof Validator' },
            { stage: 'validating', progress: 50, message: 'Enriching details...', agent: 'Location Intelligence' },
            { stage: 'clustering', progress: 60, message: 'Analyzing vibes...', agent: 'Vibe Matching' },
            { stage: 'clustering', progress: 70, message: 'Optimizing routes...', agent: 'Route Optimizer' },
            { stage: 'optimizing', progress: 80, message: 'Calculating budget...', agent: 'Budget Calculator' },
            { stage: 'optimizing', progress: 88, message: 'Scheduling activities...', agent: 'Time Orchestrator' },
            { stage: 'generating', progress: 95, message: 'Writing itinerary...', agent: 'Itinerary Writer' },
        ];

        for (const s of stages) {
            setStatus({
                stage: s.stage,
                progress: s.progress,
                message: s.message,
                currentAgent: s.agent
            });
            await new Promise(r => setTimeout(r, 800));
        }

        try {
            const demo = await getDemoItinerary();
            if (demo.data?.itinerary) {
                setStatus({ stage: 'complete', progress: 100, message: 'Ready!', currentAgent: '' });
                await new Promise(r => setTimeout(r, 500));
                onItineraryReady(demo.data.itinerary);
                navigate('/itinerary');
            }
        } catch (err) {
            setError('Failed to load demo. Please try again.');
        }
    };

    const currentAgentIndex = stageToAgentIndex[status.stage] ?? 0;

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
            <div className="max-w-2xl w-full">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <motion.div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center"
                        animate={{ rotate: status.stage === 'complete' ? 0 : 360 }}
                        transition={{ duration: 2, repeat: status.stage === 'complete' ? 0 : Infinity, ease: 'linear' }}
                    >
                        <Compass className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold mb-2">
                        {status.stage === 'complete' ? 'Your Itinerary is Ready!' : 'Creating Your Adventure'}
                    </h1>
                    <p className="text-gray-400">{status.message}</p>
                </motion.div>

                {error ? (
                    <motion.div
                        className="glass rounded-2xl p-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                        <h3 className="text-xl font-semibold mb-2 text-red-400">Something went wrong</h3>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/upload')}
                        >
                            Try Again
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="glass rounded-2xl p-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Progress Bar */}
                        <div className="mb-8">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Progress</span>
                                <span className="font-medium">{status.progress}%</span>
                            </div>
                            <div className="progress-bar">
                                <motion.div
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${status.progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Agent List */}
                        <div className="space-y-3">
                            {agents.map((agent, i) => {
                                const isComplete = i < currentAgentIndex;
                                const isActive = i === currentAgentIndex && status.stage !== 'complete';

                                return (
                                    <motion.div
                                        key={agent.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isActive
                                            ? 'bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border border-[#667eea]/50'
                                            : isComplete
                                                ? 'bg-green-500/10 border border-green-500/30'
                                                : 'bg-white/5 border border-white/5'
                                            }`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <span className="text-2xl">{agent.icon}</span>
                                        <div className="flex-1">
                                            <div className={`font-medium ${isActive ? 'text-white' : isComplete ? 'text-green-400' : 'text-gray-400'}`}>
                                                {agent.name}
                                            </div>
                                        </div>
                                        <div>
                                            {isComplete ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                            ) : isActive ? (
                                                <Loader2 className="w-5 h-5 text-[#667eea] animate-spin" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {status.stage === 'complete' && (
                            <motion.div
                                className="mt-8 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/itinerary')}
                                >
                                    View My Itinerary
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Plan;
