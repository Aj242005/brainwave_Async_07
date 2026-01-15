// Types for the Compass travel planning application

export interface Location {
    id: string;
    name: string;
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    type: 'restaurant' | 'attraction' | 'activity' | 'accommodation' | 'viewpoint' | 'market' | 'temple' | 'cafe' | 'other';
    rating?: number;
    priceLevel?: 1 | 2 | 3 | 4;
    estimatedCost?: number;
    currency?: string;
    openingHours?: string[];
    photos?: string[];
    source?: string;
    verified: boolean;
    vibeScore?: VibeScore;
}

export interface VibeScore {
    aesthetic: 'luxury' | 'budget' | 'local' | 'touristy' | 'hidden-gem';
    ambiance: 'romantic' | 'family-friendly' | 'adventure' | 'relaxed' | 'vibrant';
    crowdLevel?: 'low' | 'medium' | 'high';
}

export interface ExtractedScreenshot {
    id: string;
    imageUrl: string;
    extractedText: string[];
    locations: string[];
    hashtags: string[];
    platform?: 'instagram' | 'tiktok' | 'youtube' | 'other';
    confidence: number;
}

export interface TripPreferences {
    budget: number;
    currency: string;
    companions: 'solo' | 'partner' | 'friends' | 'family';
    travelStyle: ('adventure' | 'relaxation' | 'culture' | 'food' | 'luxury' | 'budget')[];
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
}

export interface DayItinerary {
    date: string;
    dayNumber: number;
    title: string;
    locations: ItineraryItem[];
    totalCost: number;
    totalDistance: number;
}

export interface ItineraryItem {
    location: Location;
    startTime: string;
    endTime: string;
    duration: number;
    travelTime?: number;
    travelMode?: 'walking' | 'driving' | 'transit';
    notes?: string;
    tips?: string[];
}

export interface Itinerary {
    id: string;
    name: string;
    destination: string;
    days: DayItinerary[];
    totalBudget: number;
    preferences: TripPreferences;
    createdAt: string;
    mapUrl?: string;
}

export interface ClusterGroup {
    id: string;
    name: string;
    centroid: { lat: number; lng: number };
    locations: Location[];
    suggestedDuration: number;
}

export interface AgentResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    processingTime?: number;
}

export interface PlanningRequest {
    screenshots: Express.Multer.File[];
    preferences: TripPreferences;
    destination?: string;
}

export interface ProcessingStatus {
    stage: 'uploading' | 'extracting' | 'validating' | 'clustering' | 'optimizing' | 'generating' | 'complete' | 'error';
    progress: number;
    message: string;
    currentAgent?: string;
}
