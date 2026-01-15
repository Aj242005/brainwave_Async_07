import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Compass,
    ChevronRight,
    Camera,
    MapPin,
    Sparkles,
    Calendar,
    ArrowRight
} from 'lucide-react';

const features = [
    {
        icon: Camera,
        title: 'Upload',
        desc: 'Drop your travel screenshots'
    },
    {
        icon: Sparkles,
        title: 'AI Magic',
        desc: '8 agents analyze everything'
    },
    {
        icon: MapPin,
        title: 'Verified',
        desc: 'Real places, real ratings'
    },
    {
        icon: Calendar,
        title: 'Itinerary',
        desc: 'Get your perfect plan'
    }
];

function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%)' }}>
            {/* Subtle background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-8 py-5">
                    <div className="flex items-center justify-between">
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Compass className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-slate-800">Compass</span>
                        </motion.div>

                        <motion.button
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
                            onClick={() => navigate('/upload')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            Get Started
                        </motion.button>
                    </div>
                </div>
            </nav>

            {/* Hero - Super spacious */}
            <section className="pt-48 pb-32 px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-8">
                            <Sparkles className="w-4 h-4" />
                            8 AI Agents
                        </span>
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        Screenshots to
                        <br />
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            itineraries
                        </span>
                    </motion.h1>

                    <motion.p
                        className="text-xl text-slate-500 max-w-xl mx-auto mb-12 leading-relaxed"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        Upload your saved travel inspo. Get a complete trip plan in seconds.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <button
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transition-all hover:-translate-y-1 inline-flex items-center gap-3"
                            onClick={() => navigate('/upload')}
                        >
                            Start Planning
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* How it works - Minimal */}
            <section className="py-32 px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-white shadow-lg shadow-slate-100 flex items-center justify-center mx-auto mb-5">
                                    <feature.icon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="font-semibold text-slate-800 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA - Clean */}
            <section className="py-32 px-8">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-16 text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                            Ready to explore?
                        </h2>
                        <p className="text-slate-500 text-lg mb-10">
                            Your next adventure is just a few screenshots away.
                        </p>
                        <button
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-lg font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
                            onClick={() => navigate('/upload')}
                        >
                            Get Started Free
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer className="py-12 px-8 border-t border-slate-100">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Compass className="w-4 h-4" />
                        <span className="text-sm">Compass</span>
                    </div>
                    <span className="text-sm text-slate-400">Made with AI</span>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
