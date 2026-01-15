// Time Orchestrator Agent - Schedule optimization
import { AgentResult, Location, ClusterGroup, TripPreferences } from '../types';

interface TimeSlot {
    locationId: string;
    startTime: string;
    endTime: string;
    duration: number;
    travelTime: number;
    isOptimalTime: boolean;
    notes?: string;
}

interface DaySchedule {
    date: string;
    slots: TimeSlot[];
    totalDuration: number;
    restBreaks: number;
}

interface TimeOrchestratorOutput {
    schedules: DaySchedule[];
    warnings: string[];
    suggestions: string[];
}

class TimeAgent {
    name = 'Time Orchestrator Agent';
    description = 'Schedules locations with optimal timing, considering opening hours, peak crowds, and travel time';

    private readonly DEFAULT_START_TIME = '09:00';
    private readonly DEFAULT_END_TIME = '21:00';
    private readonly MEAL_TIMES = {
        breakfast: { start: 7, end: 10 },
        lunch: { start: 12, end: 14 },
        dinner: { start: 18, end: 21 }
    };

    async process(
        clusters: ClusterGroup[],
        locations: Location[],
        preferences: TripPreferences,
        numDays: number
    ): Promise<AgentResult<TimeOrchestratorOutput>> {
        console.log(`[${this.name}] Creating schedule for ${numDays} days...`);
        const startTime = Date.now();

        try {
            const schedules: DaySchedule[] = [];
            const warnings: string[] = [];
            const suggestions: string[] = [];

            // Get all locations in optimized order from clusters
            const orderedLocations = clusters.flatMap(c => c.locations);

            // Distribute locations across days
            const locationsPerDay = Math.ceil(orderedLocations.length / numDays);

            for (let day = 0; day < numDays; day++) {
                const dayLocations = orderedLocations.slice(
                    day * locationsPerDay,
                    (day + 1) * locationsPerDay
                );

                if (dayLocations.length === 0) continue;

                const schedule = this.createDaySchedule(
                    dayLocations,
                    day,
                    preferences
                );

                schedules.push(schedule);

                // Check for issues
                if (schedule.totalDuration > 10 * 60) {
                    warnings.push(`Day ${day + 1} is quite packed (${Math.round(schedule.totalDuration / 60)} hours). Consider moving some activities.`);
                }
            }

            // Add general suggestions
            if (orderedLocations.some(l => l.type === 'viewpoint')) {
                suggestions.push('Viewpoints are best visited during golden hour (sunrise/sunset) for the best experience.');
            }

            if (orderedLocations.filter(l => l.type === 'restaurant').length > 3) {
                suggestions.push('Consider booking restaurants in advance, especially for dinner.');
            }

            console.log(`[${this.name}] Created ${schedules.length} day schedules`);

            return {
                success: true,
                data: {
                    schedules,
                    warnings,
                    suggestions
                },
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

    private createDaySchedule(
        locations: Location[],
        dayIndex: number,
        preferences: TripPreferences
    ): DaySchedule {
        const slots: TimeSlot[] = [];
        const startHour = preferences.startTime
            ? parseInt(preferences.startTime.split(':')[0])
            : 9;

        let currentTime = startHour * 60; // Convert to minutes from midnight
        let restBreaks = 0;

        // Sort locations by optimal visit time
        const sortedLocations = this.sortByOptimalTime(locations);

        for (let i = 0; i < sortedLocations.length; i++) {
            const location = sortedLocations[i];
            const duration = this.estimateVisitDuration(location);
            const travelTime = i > 0 ? this.estimateTravelTime(sortedLocations[i - 1], location) : 0;

            // Add travel time
            currentTime += travelTime;

            // Check if we need a rest break (every 3 hours)
            if (i > 0 && i % 3 === 0 && slots.length > 0) {
                currentTime += 20; // 20-minute break
                restBreaks++;
            }

            // Adjust for meal times
            const mealAdjustment = this.adjustForMealTime(location, currentTime);
            if (mealAdjustment.adjust) {
                currentTime = mealAdjustment.newTime;
            }

            const slot: TimeSlot = {
                locationId: location.id,
                startTime: this.minutesToTime(currentTime),
                endTime: this.minutesToTime(currentTime + duration),
                duration,
                travelTime,
                isOptimalTime: this.isOptimalVisitTime(location, currentTime),
                notes: this.generateTimeNotes(location, currentTime)
            };

            slots.push(slot);
            currentTime += duration;
        }

        // Calculate date
        const baseDate = preferences.startDate
            ? new Date(preferences.startDate)
            : new Date();
        baseDate.setDate(baseDate.getDate() + dayIndex);

        return {
            date: baseDate.toISOString().split('T')[0],
            slots,
            totalDuration: currentTime - startHour * 60,
            restBreaks
        };
    }

    private sortByOptimalTime(locations: Location[]): Location[] {
        // Sort to place time-sensitive locations at their optimal times
        return locations.sort((a, b) => {
            const aTime = this.getOptimalStartTime(a);
            const bTime = this.getOptimalStartTime(b);
            return aTime - bTime;
        });
    }

    private getOptimalStartTime(location: Location): number {
        // Return optimal start time in minutes from midnight
        switch (location.type) {
            case 'viewpoint':
                return 17 * 60; // 5 PM for sunset
            case 'market':
                return 10 * 60; // 10 AM, early for freshness
            case 'restaurant':
                if (location.name.toLowerCase().includes('breakfast')) return 8 * 60;
                if (location.name.toLowerCase().includes('dinner')) return 19 * 60;
                return 12 * 60; // Default to lunch
            case 'attraction':
                return 9 * 60; // Early to avoid crowds
            default:
                return 11 * 60; // Mid-morning default
        }
    }

    private estimateVisitDuration(location: Location): number {
        const durations: Record<Location['type'], number> = {
            restaurant: 75,
            attraction: 90,
            activity: 120,
            accommodation: 0,
            viewpoint: 45,
            market: 60,
            temple: 60,
            cafe: 45,
            other: 45
        };
        return durations[location.type] || 45;
    }

    private estimateTravelTime(from: Location, to: Location): number {
        if (!from.coordinates || !to.coordinates) return 20;

        const distance = this.haversineDistance(from.coordinates, to.coordinates);

        // Assume average speed of 15 km/h in city (walking + transit waits)
        const timeHours = distance / 15;
        return Math.max(10, Math.round(timeHours * 60)); // Minimum 10 minutes
    }

    private adjustForMealTime(
        location: Location,
        currentTime: number
    ): { adjust: boolean; newTime: number } {
        if (location.type !== 'restaurant') return { adjust: false, newTime: currentTime };

        const hour = Math.floor(currentTime / 60);

        // If it's a restaurant and we're close to meal time, align to it
        if (hour >= 11 && hour < 12) {
            return { adjust: true, newTime: 12 * 60 }; // Move to noon for lunch
        }
        if (hour >= 17 && hour < 18) {
            return { adjust: true, newTime: 18 * 60 }; // Move to 6 PM for dinner
        }

        return { adjust: false, newTime: currentTime };
    }

    private isOptimalVisitTime(location: Location, currentTime: number): boolean {
        const hour = Math.floor(currentTime / 60);

        switch (location.type) {
            case 'viewpoint':
                return hour >= 16 && hour <= 19; // Golden hour
            case 'attraction':
                return hour >= 9 && hour <= 11; // Before crowds
            case 'market':
                return hour >= 8 && hour <= 11; // Fresh produce
            case 'restaurant':
                return (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21);
            default:
                return true;
        }
    }

    private generateTimeNotes(location: Location, currentTime: number): string | undefined {
        const hour = Math.floor(currentTime / 60);

        if (location.type === 'viewpoint' && hour >= 16 && hour <= 18) {
            return '🌅 Perfect for sunset views';
        }
        if (location.type === 'attraction' && hour >= 9 && hour <= 10) {
            return '✨ Best time - fewer crowds';
        }
        if (location.type === 'market' && hour >= 8 && hour <= 10) {
            return '🌿 Freshest produce available';
        }
        if (location.type === 'restaurant') {
            return '🍽️ Consider making a reservation';
        }

        return undefined;
    }

    private minutesToTime(minutes: number): string {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    private haversineDistance(
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
}

export const timeAgent = new TimeAgent();
export default TimeAgent;
