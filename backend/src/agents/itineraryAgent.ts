// Itinerary Writer Agent - Generate final formatted itinerary
import { chatService } from '../services/chatService';
import { mapsService } from '../services/mapsService';
import {
    AgentResult,
    Location,
    ClusterGroup,
    TripPreferences,
    Itinerary,
    DayItinerary,
    ItineraryItem
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ItineraryWriterInput {
    locations: Location[];
    clusters: ClusterGroup[];
    schedules: any[];
    preferences: TripPreferences;
    destinationName: string;
    budgetBreakdown: any;
}

class ItineraryAgent {
    name = 'Itinerary Writer Agent';
    description = 'Generates beautifully formatted itineraries with pro tips and local insights';

    async process(input: ItineraryWriterInput): Promise<AgentResult<Itinerary>> {
        console.log(`[${this.name}] Generating itinerary...`);
        const startTime = Date.now();

        try {
            const { locations, clusters, schedules, preferences, destinationName, budgetBreakdown } = input;

            // Create day-by-day itinerary
            const days: DayItinerary[] = [];

            for (let i = 0; i < schedules.length; i++) {
                const schedule = schedules[i];
                const dayLocations = this.getLocationsForDay(locations, schedule.slots);

                const dayItinerary = await this.createDayItinerary(
                    schedule,
                    dayLocations,
                    i + 1,
                    preferences
                );

                days.push(dayItinerary);
            }

            // Generate map URL for the entire trip
            const mapUrl = mapsService.generateMapsUrl(locations);

            // Create the final itinerary
            const itinerary: Itinerary = {
                id: uuidv4(),
                name: `${destinationName} Adventure`,
                destination: destinationName,
                days,
                totalBudget: budgetBreakdown?.total || this.calculateTotalBudget(days),
                preferences,
                createdAt: new Date().toISOString(),
                mapUrl
            };

            // Try to enhance with AI-generated insights
            const enhancedItinerary = await this.enhanceWithInsights(itinerary);

            console.log(`[${this.name}] Created ${days.length}-day itinerary`);

            return {
                success: true,
                data: enhancedItinerary,
                processingTime: Date.now() - startTime
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    private getLocationsForDay(locations: Location[], slots: any[]): Location[] {
        const locationMap = new Map(locations.map(l => [l.id, l]));
        return slots
            .map((slot: any) => locationMap.get(slot.locationId))
            .filter((l): l is Location => l !== undefined);
    }

    private async createDayItinerary(
        schedule: any,
        locations: Location[],
        dayNumber: number,
        preferences: TripPreferences
    ): Promise<DayItinerary> {
        const items: ItineraryItem[] = [];
        let totalCost = 0;
        let totalDistance = 0;

        for (let i = 0; i < schedule.slots.length; i++) {
            const slot = schedule.slots[i];
            const location = locations[i];

            if (!location) continue;

            const item: ItineraryItem = {
                location,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: slot.duration,
                travelTime: slot.travelTime,
                travelMode: this.determineTravelMode(slot.travelTime),
                notes: slot.notes,
                tips: this.generateTips(location, slot)
            };

            items.push(item);
            totalCost += location.estimatedCost || 0;

            if (i > 0 && locations[i - 1]?.coordinates && location.coordinates) {
                totalDistance += this.calculateDistance(
                    locations[i - 1].coordinates!,
                    location.coordinates
                );
            }
        }

        return {
            date: schedule.date,
            dayNumber,
            title: this.generateDayTitle(locations, dayNumber),
            locations: items,
            totalCost,
            totalDistance: Math.round(totalDistance * 100) / 100
        };
    }

    private determineTravelMode(travelTime: number): 'walking' | 'driving' | 'transit' {
        if (travelTime <= 15) return 'walking';
        if (travelTime <= 30) return 'transit';
        return 'driving';
    }

    private generateTips(location: Location, slot: any): string[] {
        const tips: string[] = [];

        // Time-based tips
        if (slot.isOptimalTime) {
            tips.push('✨ You\'re visiting at the optimal time!');
        }

        // Type-based tips
        switch (location.type) {
            case 'restaurant':
                tips.push('📱 Check if reservations are available');
                if (location.priceLevel && location.priceLevel >= 3) {
                    tips.push('👔 Smart casual dress code recommended');
                }
                break;
            case 'attraction':
                tips.push('🎫 Buy tickets online to skip queues');
                tips.push('📸 Bring a camera!');
                break;
            case 'temple':
            case 'viewpoint':
                tips.push('👟 Wear comfortable walking shoes');
                break;
            case 'market':
                tips.push('💵 Bring cash for small vendors');
                tips.push('🛍️ Great for souvenirs');
                break;
        }

        // Rating-based tips
        if (location.rating && location.rating >= 4.5) {
            tips.push('⭐ Highly rated by visitors');
        }

        return tips.slice(0, 3); // Max 3 tips per location
    }

    private generateDayTitle(locations: Location[], dayNumber: number): string {
        const types = locations.map(l => l.type);

        if (types.filter(t => t === 'restaurant').length >= 2) {
            return `Day ${dayNumber}: Culinary Exploration`;
        }
        if (types.includes('attraction') && types.includes('viewpoint')) {
            return `Day ${dayNumber}: Sights & Scenery`;
        }
        if (types.filter(t => t === 'activity').length >= 2) {
            return `Day ${dayNumber}: Adventure Day`;
        }
        if (types.includes('market') || types.includes('attraction')) {
            return `Day ${dayNumber}: Culture & Discovery`;
        }

        return `Day ${dayNumber}: Explore & Experience`;
    }

    private async enhanceWithInsights(itinerary: Itinerary): Promise<Itinerary> {
        try {
            // Use Chat API for local insights (optional enhancement)
            const result = await chatService.sendMessage(
                `For a trip to ${itinerary.destination}, give me 3 essential local tips that tourists often miss. Keep each tip to one sentence.`
            );

            if (result.success && result.data) {
                // Could add insights to itinerary if needed
                // For now, we return as-is
            }
        } catch {
            // Enhancement is optional, continue without it
        }

        return itinerary;
    }

    private calculateTotalBudget(days: DayItinerary[]): number {
        return days.reduce((sum, day) => sum + day.totalCost, 0);
    }

    private calculateDistance(
        coord1: { lat: number; lng: number },
        coord2: { lat: number; lng: number }
    ): number {
        const R = 6371;
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Export formats
    formatAsText(itinerary: Itinerary): string {
        let output = `# ${itinerary.name}\n\n`;
        output += `📍 Destination: ${itinerary.destination}\n`;
        output += `💰 Estimated Budget: $${itinerary.totalBudget}\n\n`;

        for (const day of itinerary.days) {
            output += `## ${day.title}\n`;
            output += `📅 ${day.date}\n\n`;

            for (const item of day.locations) {
                output += `### ${item.startTime} - ${item.location.name}\n`;
                output += `⏱️ Duration: ${item.duration} min\n`;
                if (item.location.estimatedCost) {
                    output += `💵 Est. Cost: $${item.location.estimatedCost}\n`;
                }
                if (item.tips && item.tips.length > 0) {
                    output += `💡 Tips:\n`;
                    item.tips.forEach(tip => {
                        output += `   - ${tip}\n`;
                    });
                }
                output += '\n';
            }
        }

        if (itinerary.mapUrl) {
            output += `\n🗺️ View Route: ${itinerary.mapUrl}\n`;
        }

        return output;
    }

    formatAsJSON(itinerary: Itinerary): string {
        return JSON.stringify(itinerary, null, 2);
    }
}

export const itineraryAgent = new ItineraryAgent();
export default ItineraryAgent;
