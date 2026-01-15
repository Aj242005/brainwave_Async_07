// Social Proof Validator Agent - Verify locations and ratings
import { mapsService } from '../services/mapsService';
import { AgentResult, Location } from '../types';

interface ValidationResult {
    locationName: string;
    verified: boolean;
    status: 'open' | 'closed' | 'unknown';
    rating?: number;
    reviewCount?: number;
    warnings: string[];
    alternatives?: string[];
}

interface SocialProofOutput {
    validatedLocations: Location[];
    invalidLocations: ValidationResult[];
    overallConfidence: number;
}

class SocialProofAgent {
    name = 'Social Proof Validator Agent';
    description = 'Validates extracted locations against Google Places, checks ratings, and identifies closed or overhyped spots';

    async process(
        locationNames: string[],
        destination?: string
    ): Promise<AgentResult<SocialProofOutput>> {
        console.log(`[${this.name}] Validating ${locationNames.length} locations...`);
        const startTime = Date.now();

        const validatedLocations: Location[] = [];
        const invalidLocations: ValidationResult[] = [];
        let successCount = 0;

        for (const name of locationNames) {
            try {
                const searchResult = await mapsService.searchPlace(name, destination);

                if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
                    const place = searchResult.data[0];

                    // Check for potential issues
                    const warnings: string[] = [];

                    if (place.rating && place.rating < 3.5) {
                        warnings.push('Low rating - may not be worth visiting');
                    }

                    const location: Location = {
                        id: place.placeId,
                        name: place.name,
                        address: place.address,
                        coordinates: place.coordinates,
                        type: this.classifyType(place.types),
                        rating: place.rating,
                        priceLevel: place.priceLevel as any,
                        photos: place.photos,
                        verified: true,
                        source: 'google_places'
                    };

                    validatedLocations.push(location);
                    successCount++;
                    console.log(`[${this.name}] ✓ Verified: ${name}`);
                } else {
                    invalidLocations.push({
                        locationName: name,
                        verified: false,
                        status: 'unknown',
                        warnings: ['Location not found or may have closed'],
                        alternatives: []
                    });
                    console.log(`[${this.name}] ✗ Not found: ${name}`);
                }
            } catch (error: any) {
                invalidLocations.push({
                    locationName: name,
                    verified: false,
                    status: 'unknown',
                    warnings: [`Verification failed: ${error.message}`]
                });
            }
        }

        const overallConfidence = locationNames.length > 0
            ? successCount / locationNames.length
            : 0;

        return {
            success: true,
            data: {
                validatedLocations,
                invalidLocations,
                overallConfidence
            },
            processingTime: Date.now() - startTime
        };
    }

    private classifyType(types: string[]): Location['type'] {
        if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
        if (types.includes('lodging') || types.includes('hotel')) return 'accommodation';
        if (types.includes('museum') || types.includes('tourist_attraction')) return 'attraction';
        if (types.includes('park') || types.includes('natural_feature')) return 'viewpoint';
        if (types.includes('shopping_mall') || types.includes('store')) return 'market';
        if (types.includes('gym') || types.includes('spa')) return 'activity';
        return 'other';
    }
}

export const socialProofAgent = new SocialProofAgent();
export default SocialProofAgent;
