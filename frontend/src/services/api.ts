// API Service for Compass Frontend
import axios from 'axios';
import type { TripPreferences, ProcessingStatus, PlanResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
});

export async function createTripPlan(
    screenshots: File[],
    preferences: TripPreferences,
    destination?: string
): Promise<{ sessionId: string }> {
    const formData = new FormData();

    screenshots.forEach((file) => {
        formData.append('screenshots', file);
    });

    formData.append('budget', preferences.budget.toString());
    formData.append('currency', preferences.currency);
    formData.append('companions', preferences.companions);
    formData.append('travelStyle', JSON.stringify(preferences.travelStyle));

    if (preferences.startDate) formData.append('startDate', preferences.startDate);
    if (preferences.endDate) formData.append('endDate', preferences.endDate);
    if (destination) formData.append('destination', destination);

    const response = await api.post('/api/plan', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return { sessionId: response.data.sessionId };
}

export async function getPlanStatus(sessionId: string): Promise<ProcessingStatus & { result?: PlanResponse }> {
    const response = await api.get(`/api/plan/${sessionId}/status`);
    return response.data;
}

export async function getPlanResult(sessionId: string): Promise<PlanResponse> {
    const response = await api.get(`/api/plan/${sessionId}/result`);
    return response.data;
}

export async function getDemoItinerary(): Promise<PlanResponse> {
    const response = await api.get('/api/demo');
    return response.data;
}

export async function exportItinerary(sessionId: string, format: 'json' | 'text'): Promise<Blob> {
    const response = await api.get(`/api/plan/${sessionId}/export/${format}`, {
        responseType: 'blob',
    });
    return response.data;
}
