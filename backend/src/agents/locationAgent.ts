// Location Intelligence Agent - Geo-enrichment and coordinate fetching
import { mapsService } from '../services/mapsService';
import { AgentResult, Location } from '../types';

interface LocationEnrichmentOutput {
    enrichedLocations: Location[];
    destinationCenter: { lat: number; lng: number };
    destinationName: string;
}

class LocationAgent {
    name = 'Location Intelligence Agent';
    description = 'Enriches location data with coordinates, addresses, opening hours, and price estimates';

    async process(locations: Location[]): Promise<AgentResult<LocationEnrichmentOutput>> {
        console.log(`[${this.name}] Enriching ${locations.length} locations...`);
        const startTime = Date.now();

        const enrichedLocations: Location[] = [];
        const allCoordinates: { lat: number; lng: number }[] = [];

        for (const location of locations) {
            try {
                if (location.id && location.id.startsWith('mock-')) {
                    // Already has mock data, add estimated costs
                    const enriched = {
                        ...location,
                        estimatedCost: this.estimateCost(location.type, location.priceLevel),
                        currency: 'USD'
                    };
                    enrichedLocations.push(enriched);
                    if (location.coordinates) {
                        allCoordinates.push(location.coordinates);
                    }
                } else {
                    // Fetch additional details from Google Places
                    const details = await mapsService.getPlaceDetails(location.id);

                    if (details.success && details.data) {
                        const enriched: Location = {
                            ...location,
                            address: details.data.address || location.address,
                            coordinates: details.data.coordinates || location.coordinates,
                            openingHours: details.data.openingHours,
                            photos: details.data.photos || location.photos,
                            estimatedCost: this.estimateCost(location.type, location.priceLevel),
                            currency: 'USD'
                        };
                        enrichedLocations.push(enriched);

                        if (enriched.coordinates) {
                            allCoordinates.push(enriched.coordinates);
                        }
                    } else {
                        enrichedLocations.push({
                            ...location,
                            estimatedCost: this.estimateCost(location.type, location.priceLevel),
                            currency: 'USD'
                        });
                    }
                }
            } catch (error) {
                // Keep original location if enrichment fails
                enrichedLocations.push({
                    ...location,
                    estimatedCost: this.estimateCost(location.type, location.priceLevel),
                    currency: 'USD'
                });
            }
        }

        // Calculate destination center (centroid of all locations)
        const destinationCenter = this.calculateCentroid(allCoordinates);
        const destinationName = await this.inferDestinationName(enrichedLocations);

        console.log(`[${this.name}] Enriched ${enrichedLocations.length} locations`);

        return {
            success: true,
            data: {
                enrichedLocations,
                destinationCenter,
                destinationName
            },
            processingTime: Date.now() - startTime
        };
    }

    private estimateCost(type: Location['type'], priceLevel?: number): number {
        const baseCosts: Record<Location['type'], number> = {
            restaurant: 25,
            attraction: 15,
            activity: 40,
            accommodation: 100,
            viewpoint: 0,
            market: 20,
            temple: 5,
            cafe: 15,
            other: 10
        };

        const base = baseCosts[type] || 15;
        const multiplier = priceLevel ? priceLevel : 2;
        return base * (multiplier / 2);
    }

    private calculateCentroid(coordinates: { lat: number; lng: number }[]): { lat: number; lng: number } {
        if (coordinates.length === 0) {
            return { lat: 35.6762, lng: 139.6503 }; // Default to Tokyo
        }

        const sum = coordinates.reduce(
            (acc, coord) => ({
                lat: acc.lat + coord.lat,
                lng: acc.lng + coord.lng
            }),
            { lat: 0, lng: 0 }
        );

        return {
            lat: sum.lat / coordinates.length,
            lng: sum.lng / coordinates.length
        };
    }

    private async inferDestinationName(locations: Location[]): Promise<string> {
        // Extract common city/region from addresses
        const addresses = locations.map(l => l.address).filter(Boolean);

        if (addresses.length === 0) return 'Unknown Destination';

        // Simple heuristic: find most common city name
        const cityPatterns = addresses.map(addr => {
            const parts = addr!.split(',').map(p => p.trim());
            return parts.length > 1 ? parts[parts.length - 2] : parts[0];
        });

        const cityCount = cityPatterns.reduce((acc, city) => {
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostCommon = Object.entries(cityCount)
            .sort((a, b) => b[1] - a[1])[0];

        return mostCommon ? mostCommon[0] : 'Unknown Destination';
    }
}

export const locationAgent = new LocationAgent();
export default LocationAgent;
