// Vision Intelligence Agent - OCR and Image Analysis
import { mediaService } from '../services/mediaService';
import { AgentResult, ExtractedScreenshot } from '../types';

interface VisionAgentOutput {
    screenshots: ExtractedScreenshot[];
    allLocations: string[];
    allHashtags: string[];
    platforms: string[];
}

class VisionAgent {
    name = 'Vision Intelligence Agent';
    description = 'Extracts text, locations, and metadata from travel screenshots using OCR and image analysis';

    async process(images: { buffer: Buffer; filename: string }[]): Promise<AgentResult<VisionAgentOutput>> {
        console.log(`[${this.name}] Processing ${images.length} screenshots...`);
        const startTime = Date.now();

        try {
            const result = await mediaService.batchAnalyze(images);

            if (!result.success || !result.data) {
                return {
                    success: false,
                    error: result.error || 'Failed to analyze screenshots',
                    processingTime: Date.now() - startTime
                };
            }

            const screenshots = result.data;

            // Aggregate data from all screenshots
            const allLocations = [...new Set(screenshots.flatMap(s => s.locations))];
            const allHashtags = [...new Set(screenshots.flatMap(s => s.hashtags))];
            const platforms = [...new Set(screenshots.map(s => s.platform).filter(Boolean))];

            console.log(`[${this.name}] Extracted ${allLocations.length} locations, ${allHashtags.length} hashtags`);

            return {
                success: true,
                data: {
                    screenshots,
                    allLocations,
                    allHashtags,
                    platforms: platforms as string[]
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
}

export const visionAgent = new VisionAgent();
export default VisionAgent;
