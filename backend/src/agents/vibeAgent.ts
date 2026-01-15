// Vibe Matching Agent - Analyze trip aesthetics and style
import { chatService } from '../services/chatService';
import { AgentResult, Location, VibeScore, TripPreferences } from '../types';

interface VibeAnalysisOutput {
    overallVibe: VibeScore;
    locationVibes: Map<string, VibeScore>;
    styleRecommendations: string[];
    incompatibleLocations: string[];
}

class VibeAgent {
    name = 'Vibe Matching Agent';
    description = 'Analyzes trip aesthetics, matches locations to user preferences, and identifies incompatible venues';

    async process(
        locations: Location[],
        hashtags: string[],
        preferences?: TripPreferences
    ): Promise<AgentResult<VibeAnalysisOutput>> {
        console.log(`[${this.name}] Analyzing vibes for ${locations.length} locations...`);
        const startTime = Date.now();

        try {
            // Use Chat API to analyze vibes
            const locationNames = locations.map(l => l.name);
            const vibeAnalysis = await chatService.analyzeVibes(locationNames, hashtags);

            let overallVibe: VibeScore;
            const locationVibes = new Map<string, VibeScore>();
            const incompatibleLocations: string[] = [];

            if (vibeAnalysis.success && vibeAnalysis.data) {
                try {
                    // Parse AI response
                    const parsed = this.parseVibeResponse(vibeAnalysis.data.answer);
                    overallVibe = {
                        aesthetic: parsed.aesthetic || 'local',
                        ambiance: parsed.ambiance || 'relaxed'
                    };
                } catch {
                    overallVibe = this.inferVibeFromData(locations, hashtags);
                }
            } else {
                overallVibe = this.inferVibeFromData(locations, hashtags);
            }

            // Assign vibes to individual locations
            for (const location of locations) {
                const vibe = this.inferLocationVibe(location);
                locationVibes.set(location.id, vibe);

                // Check compatibility with preferences
                if (preferences && !this.isCompatible(vibe, preferences)) {
                    incompatibleLocations.push(location.id);
                }
            }

            // Generate style recommendations
            const styleRecommendations = this.generateRecommendations(
                overallVibe,
                locations,
                preferences
            );

            console.log(`[${this.name}] Overall vibe: ${overallVibe.aesthetic} / ${overallVibe.ambiance}`);

            return {
                success: true,
                data: {
                    overallVibe,
                    locationVibes,
                    styleRecommendations,
                    incompatibleLocations
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

    private parseVibeResponse(answer: string): any {
        // Try to extract JSON from the response
        const jsonMatch = answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return {};
    }

    private inferVibeFromData(locations: Location[], hashtags: string[]): VibeScore {
        // Simple heuristic-based vibe inference
        const hashtagStr = hashtags.join(' ').toLowerCase();

        let aesthetic: VibeScore['aesthetic'] = 'local';
        let ambiance: VibeScore['ambiance'] = 'relaxed';

        // Check hashtags for clues
        if (hashtagStr.includes('luxury') || hashtagStr.includes('premium')) {
            aesthetic = 'luxury';
        } else if (hashtagStr.includes('budget') || hashtagStr.includes('cheap')) {
            aesthetic = 'budget';
        } else if (hashtagStr.includes('hidden') || hashtagStr.includes('secret')) {
            aesthetic = 'hidden-gem';
        }

        if (hashtagStr.includes('romantic') || hashtagStr.includes('couple')) {
            ambiance = 'romantic';
        } else if (hashtagStr.includes('family') || hashtagStr.includes('kids')) {
            ambiance = 'family-friendly';
        } else if (hashtagStr.includes('adventure') || hashtagStr.includes('hiking')) {
            ambiance = 'adventure';
        } else if (hashtagStr.includes('party') || hashtagStr.includes('nightlife')) {
            ambiance = 'vibrant';
        }

        return { aesthetic, ambiance };
    }

    private inferLocationVibe(location: Location): VibeScore {
        let aesthetic: VibeScore['aesthetic'] = 'local';
        let ambiance: VibeScore['ambiance'] = 'relaxed';
        let crowdLevel: VibeScore['crowdLevel'] = 'medium';

        // Infer from price level
        if (location.priceLevel === 4) {
            aesthetic = 'luxury';
        } else if (location.priceLevel === 1) {
            aesthetic = 'budget';
        }

        // Infer from type
        switch (location.type) {
            case 'attraction':
                crowdLevel = 'high';
                break;
            case 'restaurant':
                ambiance = location.priceLevel && location.priceLevel > 2 ? 'romantic' : 'relaxed';
                break;
            case 'activity':
                ambiance = 'adventure';
                break;
            case 'viewpoint':
                ambiance = 'romantic';
                crowdLevel = 'low';
                break;
            case 'market':
                ambiance = 'vibrant';
                aesthetic = 'local';
                break;
        }

        return { aesthetic, ambiance, crowdLevel };
    }

    private isCompatible(vibe: VibeScore, preferences: TripPreferences): boolean {
        // Check if location vibe matches user preferences
        const style = preferences.travelStyle || [];

        // Family trips shouldn't have vibrant nightlife spots
        if (preferences.companions === 'family' && vibe.ambiance === 'vibrant') {
            return false;
        }

        // Budget travelers shouldn't have luxury spots (unless specifically chosen)
        if (style.includes('budget') && vibe.aesthetic === 'luxury') {
            return false;
        }

        return true;
    }

    private generateRecommendations(
        overallVibe: VibeScore,
        locations: Location[],
        preferences?: TripPreferences
    ): string[] {
        const recommendations: string[] = [];

        if (overallVibe.aesthetic === 'luxury' && preferences?.travelStyle?.includes('budget')) {
            recommendations.push(
                'Your screenshots show luxury venues but you prefer budget travel. Consider filtering for local alternatives.'
            );
        }

        const restaurantCount = locations.filter(l => l.type === 'restaurant').length;
        const attractionCount = locations.filter(l => l.type === 'attraction').length;

        if (restaurantCount > attractionCount * 2) {
            recommendations.push(
                'This looks like a food-focused trip! Consider adding cultural attractions for variety.'
            );
        }

        if (locations.length > 8 && preferences?.companions === 'family') {
            recommendations.push(
                'With family, consider reducing locations per day. We recommend 4-5 max for a relaxed pace.'
            );
        }

        return recommendations;
    }
}

export const vibeAgent = new VibeAgent();
export default VibeAgent;
