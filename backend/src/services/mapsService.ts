// Google Maps API Service
import axios from 'axios';
import { AgentResult, Location } from '../types';

const MAPS_API_BASE = 'https://maps.googleapis.com/maps/api';

interface PlaceDetails {
    placeId: string;
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    rating?: number;
    priceLevel?: number;
    types: string[];
    openingHours?: string[];
    photos?: string[];
}

interface DistanceResult {
    origin: string;
    destination: string;
    distance: number;
    duration: number;
    mode: 'walking' | 'driving' | 'transit';
}

class MapsService {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    }

    async searchPlace(query: string, location?: string): Promise<AgentResult<PlaceDetails[]>> {
        try {
            const searchQuery = location ? `${query} ${location}` : query;

            const response = await axios.get(`${MAPS_API_BASE}/place/textsearch/json`, {
                params: {
                    query: searchQuery,
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                throw new Error(`Places API error: ${response.data.status}`);
            }

            const places = response.data.results?.slice(0, 5).map((place: any) => ({
                placeId: place.place_id,
                name: place.name,
                address: place.formatted_address,
                coordinates: place.geometry?.location,
                rating: place.rating,
                priceLevel: place.price_level,
                types: place.types || [],
                photos: place.photos?.map((p: any) => this.getPhotoUrl(p.photo_reference))
            })) || [];

            return { success: true, data: places };
        } catch (error: any) {
            console.warn('Maps API failed, using mock data:', error.message);
            return this.mockPlaceSearch(query);
        }
    }

    async getPlaceDetails(placeId: string): Promise<AgentResult<PlaceDetails>> {
        try {
            const response = await axios.get(`${MAPS_API_BASE}/place/details/json`, {
                params: {
                    place_id: placeId,
                    fields: 'name,formatted_address,geometry,rating,price_level,opening_hours,photos,types',
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Place details error: ${response.data.status}`);
            }

            const place = response.data.result;
            return {
                success: true,
                data: {
                    placeId,
                    name: place.name,
                    address: place.formatted_address,
                    coordinates: place.geometry?.location,
                    rating: place.rating,
                    priceLevel: place.price_level,
                    types: place.types || [],
                    openingHours: place.opening_hours?.weekday_text,
                    photos: place.photos?.slice(0, 3).map((p: any) => this.getPhotoUrl(p.photo_reference))
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async getDistanceMatrix(
        origins: { lat: number; lng: number }[],
        destinations: { lat: number; lng: number }[],
        mode: 'walking' | 'driving' | 'transit' = 'driving'
    ): Promise<AgentResult<DistanceResult[]>> {
        try {
            const originStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
            const destStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

            const response = await axios.get(`${MAPS_API_BASE}/distancematrix/json`, {
                params: {
                    origins: originStr,
                    destinations: destStr,
                    mode,
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Distance Matrix error: ${response.data.status}`);
            }

            const results: DistanceResult[] = [];
            response.data.rows.forEach((row: any, i: number) => {
                row.elements.forEach((element: any, j: number) => {
                    if (element.status === 'OK') {
                        results.push({
                            origin: response.data.origin_addresses[i],
                            destination: response.data.destination_addresses[j],
                            distance: element.distance.value,
                            duration: element.duration.value,
                            mode
                        });
                    }
                });
            });

            return { success: true, data: results };
        } catch (error: any) {
            console.warn('Distance Matrix failed, using estimates:', error.message);
            return this.mockDistanceMatrix(origins, destinations, mode);
        }
    }

    async getDirections(
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number },
        waypoints?: { lat: number; lng: number }[],
        mode: 'walking' | 'driving' | 'transit' = 'driving'
    ): Promise<AgentResult<any>> {
        try {
            const waypointStr = waypoints?.map(w => `${w.lat},${w.lng}`).join('|');

            const response = await axios.get(`${MAPS_API_BASE}/directions/json`, {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    waypoints: waypointStr ? `optimize:true|${waypointStr}` : undefined,
                    mode,
                    key: this.apiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Directions error: ${response.data.status}`);
            }

            return {
                success: true,
                data: {
                    routes: response.data.routes,
                    optimizedOrder: response.data.routes[0]?.waypoint_order
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    generateMapsUrl(locations: Location[]): string {
        if (locations.length === 0) return '';

        const waypoints = locations
            .filter(l => l.coordinates)
            .map(l => `${l.coordinates!.lat},${l.coordinates!.lng}`)
            .join('/');

        return `https://www.google.com/maps/dir/${waypoints}`;
    }

    private getPhotoUrl(photoReference: string): string {
        return `${MAPS_API_BASE}/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${this.apiKey}`;
    }

    private mockPlaceSearch(query: string): AgentResult<PlaceDetails[]> {
        // Mock data for demo purposes
        const mockPlaces: Record<string, PlaceDetails[]> = {
            default: [
                {
                    placeId: 'mock-1',
                    name: query,
                    address: '123 Travel Street, Tokyo, Japan',
                    coordinates: { lat: 35.6762 + Math.random() * 0.1, lng: 139.6503 + Math.random() * 0.1 },
                    rating: 4.2 + Math.random() * 0.6,
                    priceLevel: Math.floor(Math.random() * 3) + 1,
                    types: ['establishment', 'point_of_interest'],
                    photos: []
                }
            ]
        };

        return { success: true, data: mockPlaces.default };
    }

    private mockDistanceMatrix(
        origins: { lat: number; lng: number }[],
        destinations: { lat: number; lng: number }[],
        mode: string
    ): AgentResult<DistanceResult[]> {
        const results: DistanceResult[] = [];

        origins.forEach((origin, i) => {
            destinations.forEach((dest, j) => {
                const distance = this.haversineDistance(origin, dest);
                const speedKmh = mode === 'walking' ? 5 : mode === 'transit' ? 30 : 40;
                const duration = (distance / speedKmh) * 3600;

                results.push({
                    origin: `Location ${i + 1}`,
                    destination: `Location ${j + 1}`,
                    distance: Math.round(distance * 1000),
                    duration: Math.round(duration),
                    mode: mode as any
                });
            });
        });

        return { success: true, data: results };
    }

    private haversineDistance(
        coord1: { lat: number; lng: number },
        coord2: { lat: number; lng: number }
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLon = this.toRad(coord2.lng - coord1.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

export const mapsService = new MapsService();
export default MapsService;
