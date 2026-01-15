import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Compass,
    MapPin,
    Clock,
    Wallet,
    Navigation,
    Download,
    Share2,
    ChevronLeft,
    Star,
    Camera,
    Utensils,
    TreePine,
    ShoppingBag,
    Building
} from 'lucide-react';
import type { Itinerary as ItineraryType, ItineraryItem } from '../types';

interface ItineraryProps {
    itinerary?: ItineraryType;
}

const typeIcons: Record<string, React.ReactNode> = {
    restaurant: <Utensils className="w-4 h-4" />,
    attraction: <Camera className="w-4 h-4" />,
    viewpoint: <TreePine className="w-4 h-4" />,
    market: <ShoppingBag className="w-4 h-4" />,
    accommodation: <Building className="w-4 h-4" />,
    activity: <Star className="w-4 h-4" />,
    other: <MapPin className="w-4 h-4" />,
};

const travelModeIcons: Record<string, string> = {
    walking: '🚶',
    transit: '🚇',
    driving: '🚗',
};

function Itinerary({ itinerary }: ItineraryProps) {
    const navigate = useNavigate();

    if (!itinerary) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Compass className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold mb-2">No Itinerary Found</h2>
                    <p className="text-gray-400 mb-6">Start by uploading your travel screenshots</p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/upload')}
                    >
                        Create Itinerary
                    </button>
                </div>
            </div>
        );
    }

    const handleExport = (format: 'json' | 'text') => {
        const content = format === 'json'
            ? JSON.stringify(itinerary, null, 2)
            : generateTextItinerary(itinerary);

        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compass-itinerary.${format === 'json' ? 'json' : 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateTextItinerary = (it: ItineraryType): string => {
        let output = `🧭 COMPASS ITINERARY\n${'='.repeat(40)}\n\n`;
        output += `📍 ${it.name}\n`;
        output += `🌍 ${it.destination}\n`;
        output += `💰 Total Budget: $${it.totalBudget}\n\n`;

        for (const day of it.days) {
            output += `\n${'─'.repeat(40)}\n${day.title}\n📅 ${day.date}\n${'─'.repeat(40)}\n\n`;
            for (const item of day.locations) {
                output += `⏰ ${item.startTime} - ${item.endTime}\n`;
                output += `📍 ${item.location.name}\n`;
                if (item.location.address) output += `   ${item.location.address}\n`;
                if (item.location.estimatedCost) output += `   💵 ~$${item.location.estimatedCost}\n`;
                if (item.tips?.[0]) output += `   💡 ${item.tips[0]}\n`;
                output += '\n';
            }
        }
        if (it.mapUrl) output += `\n🗺️ View Route: ${it.mapUrl}\n`;
        return output;
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="glass-dark sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Back</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <Compass className="w-6 h-6 text-[#667eea]" />
                            <span className="font-semibold">Compass</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleExport('text')}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="Download"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="Share"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero */}
            <motion.div
                className="px-6 py-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{itinerary.name}</h1>
                <div className="flex items-center justify-center gap-6 text-gray-400">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#667eea]" />
                        {itinerary.destination}
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#667eea]" />
                        {itinerary.days.length} {itinerary.days.length === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[#667eea]" />
                        ${itinerary.totalBudget}
                    </div>
                </div>

                {itinerary.mapUrl && (
                    <motion.a
                        href={itinerary.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-[#667eea]/20 to-[#764ba2]/20 border border-[#667eea]/50 hover:border-[#667eea] transition-colors"
                        whileHover={{ scale: 1.02 }}
                    >
                        <Navigation className="w-5 h-5 text-[#667eea]" />
                        Open in Google Maps
                    </motion.a>
                )}
            </motion.div>

            {/* Days */}
            <div className="max-w-4xl mx-auto px-6">
                {itinerary.days.map((day, dayIndex) => (
                    <motion.div
                        key={dayIndex}
                        className="mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dayIndex * 0.1 }}
                    >
                        {/* Day Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center font-bold text-lg">
                                {day.dayNumber}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{day.title}</h2>
                                <p className="text-gray-400 text-sm">{day.date} • ${day.totalCost} • {day.totalDistance.toFixed(1)}km</p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="ml-6 border-l-2 border-white/10">
                            {day.locations.map((item, itemIndex) => (
                                <LocationCard
                                    key={itemIndex}
                                    item={item}
                                    isLast={itemIndex === day.locations.length - 1}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 glass-dark">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        Created with Compass • 8 AI Agents
                    </div>
                    <button
                        className="btn-primary py-2 px-6 text-sm"
                        onClick={() => navigate('/upload')}
                    >
                        Plan Another Trip
                    </button>
                </div>
            </div>
        </div>
    );
}

function LocationCard({ item, isLast }: { item: ItineraryItem; isLast: boolean }) {
    return (
        <motion.div
            className={`relative pl-8 ${isLast ? '' : 'pb-6'}`}
            whileHover={{ x: 4 }}
        >
            {/* Timeline Dot */}
            <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] border-4 border-[#0a0a0f]" />

            {/* Travel Time */}
            {item.travelTime && item.travelTime > 0 && (
                <div className="absolute -left-16 top-0 text-xs text-gray-500 flex items-center gap-1">
                    <span>{travelModeIcons[item.travelMode || 'walking']}</span>
                    <span>{item.travelTime}m</span>
                </div>
            )}

            {/* Card */}
            <div className="card">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#667eea]">
                        {typeIcons[item.location.type] || typeIcons.other}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold">{item.location.name}</h3>
                            <span className="text-sm text-gray-400">{item.startTime} – {item.endTime}</span>
                        </div>

                        {item.location.address && (
                            <p className="text-sm text-gray-400 mb-2">{item.location.address}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                            {item.location.rating && (
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    {item.location.rating}
                                </span>
                            )}
                            {item.location.estimatedCost !== undefined && item.location.estimatedCost > 0 && (
                                <span className="text-gray-400">~${item.location.estimatedCost}</span>
                            )}
                            <span className="text-gray-400">{item.duration} min</span>
                        </div>

                        {item.tips && item.tips.length > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-[#667eea]/10 border border-[#667eea]/20">
                                <p className="text-sm text-[#a5b4fc]">{item.tips[0]}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default Itinerary;
