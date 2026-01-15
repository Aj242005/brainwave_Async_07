// API Types for Compass Frontend

export interface Location {
    id: string;
    name: string;
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    type: 'restaurant' | 'attraction' | 'activity' | 'accommodation' | 'viewpoint' | 'market' | 'other';
    rating?: number;
    priceLevel?: 1 | 2 | 3 | 4;
    estimatedCost?: number;
    currency?: string;
    photos?: string[];
    verified: boolean;
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

export interface DayItinerary {
    date: string;
    dayNumber: number;
    title: string;
    locations: ItineraryItem[];
    totalCost: number;
    totalDistance: number;
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

export interface TripPreferences {
    budget: number;
    currency: string;
    companions: 'solo' | 'partner' | 'friends' | 'family';
    travelStyle: string[];
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
}

export interface ProcessingStatus {
    stage: 'uploading' | 'extracting' | 'validating' | 'clustering' | 'optimizing' | 'generating' | 'complete' | 'error';
    progress: number;
    message: string;
    currentAgent?: string;
}

export interface PlanResponse {
    success: boolean;
    sessionId?: string;
    message?: string;
    error?: string;
    data?: {
        itinerary: Itinerary;
        processingReport: {
            totalTime: number;
            agentTimes: Record<string, number>;
            locationsFound: number;
            locationsVerified: number;
            clustersCreated: number;
        };
    };
}
