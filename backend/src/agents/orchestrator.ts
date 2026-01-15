// Agent Orchestrator - Coordinates all 8 agents
import { visionAgent } from './visionAgent';
import { socialProofAgent } from './socialProofAgent';
import { locationAgent } from './locationAgent';
import { vibeAgent } from './vibeAgent';
import { clusteringAgent } from './clusteringAgent';
import { budgetAgent } from './budgetAgent';
import { timeAgent } from './timeAgent';
import { itineraryAgent } from './itineraryAgent';
import { AgentResult, TripPreferences, Itinerary, ProcessingStatus } from '../types';

type StatusCallback = (status: ProcessingStatus) => void;

interface OrchestratorResult {
    itinerary: Itinerary;
    processingReport: {
        totalTime: number;
        agentTimes: Record<string, number>;
        locationsFound: number;
        locationsVerified: number;
        clustersCreated: number;
    };
}

class AgentOrchestrator {
    private statusCallback?: StatusCallback;

    setStatusCallback(callback: StatusCallback) {
        this.statusCallback = callback;
    }

    private updateStatus(
        stage: ProcessingStatus['stage'],
        progress: number,
        message: string,
        currentAgent?: string
    ) {
        if (this.statusCallback) {
            this.statusCallback({ stage, progress, message, currentAgent });
        }
        console.log(`[Orchestrator] ${stage}: ${message} (${progress}%)`);
    }

    async process(
        images: { buffer: Buffer; filename: string }[],
        preferences: TripPreferences,
        destination?: string
    ): Promise<AgentResult<OrchestratorResult>> {
        const startTime = Date.now();
        const agentTimes: Record<string, number> = {};

        try {
            // Stage 1: Vision Intelligence Agent - Extract from screenshots
            this.updateStatus('extracting', 10, 'Analyzing screenshots...', 'Vision Intelligence');
            const visionResult = await visionAgent.process(images);
            agentTimes['vision'] = visionResult.processingTime || 0;

            if (!visionResult.success || !visionResult.data) {
                throw new Error(visionResult.error || 'Vision extraction failed');
            }

            const { allLocations, allHashtags } = visionResult.data;
            console.log(`[Orchestrator] Extracted ${allLocations.length} locations from ${images.length} images`);

            // Stage 2: Social Proof Validator Agent - Verify locations
            this.updateStatus('validating', 25, 'Verifying locations...', 'Social Proof Validator');
            const socialResult = await socialProofAgent.process(allLocations, destination);
            agentTimes['socialProof'] = socialResult.processingTime || 0;

            if (!socialResult.success || !socialResult.data) {
                throw new Error(socialResult.error || 'Location validation failed');
            }

            const { validatedLocations, invalidLocations } = socialResult.data;
            console.log(`[Orchestrator] Verified ${validatedLocations.length}/${allLocations.length} locations`);

            if (validatedLocations.length === 0) {
                throw new Error('No valid locations found. Please try different screenshots.');
            }

            // Stage 3: Location Intelligence Agent - Enrich with details
            this.updateStatus('validating', 40, 'Enriching location data...', 'Location Intelligence');
            const locationResult = await locationAgent.process(validatedLocations);
            agentTimes['location'] = locationResult.processingTime || 0;

            if (!locationResult.success || !locationResult.data) {
                throw new Error(locationResult.error || 'Location enrichment failed');
            }

            const { enrichedLocations, destinationName } = locationResult.data;

            // Stage 4: Vibe Matching Agent - Analyze trip style
            this.updateStatus('validating', 50, 'Analyzing trip vibes...', 'Vibe Matching');
            const vibeResult = await vibeAgent.process(enrichedLocations, allHashtags, preferences);
            agentTimes['vibe'] = vibeResult.processingTime || 0;

            // Filter out incompatible locations if needed
            let finalLocations = enrichedLocations;
            if (vibeResult.success && vibeResult.data) {
                const { incompatibleLocations } = vibeResult.data;
                if (incompatibleLocations.length > 0 && enrichedLocations.length > incompatibleLocations.length) {
                    finalLocations = enrichedLocations.filter(l => !incompatibleLocations.includes(l.id));
                    console.log(`[Orchestrator] Filtered ${incompatibleLocations.length} incompatible locations`);
                }
            }

            // Stage 5: Clustering & Route Optimizer Agent
            this.updateStatus('clustering', 60, 'Grouping nearby locations...', 'Clustering & Route Optimizer');
            const clusterResult = await clusteringAgent.process(finalLocations);
            agentTimes['clustering'] = clusterResult.processingTime || 0;

            if (!clusterResult.success || !clusterResult.data) {
                throw new Error(clusterResult.error || 'Clustering failed');
            }

            const { clusters, optimizedOrder, totalDistance } = clusterResult.data;
            console.log(`[Orchestrator] Created ${clusters.length} clusters, total distance: ${totalDistance}km`);

            // Stage 6: Budget Calculator Agent
            this.updateStatus('optimizing', 70, 'Calculating budget...', 'Budget Calculator');
            const numDays = Math.max(1, Math.ceil(finalLocations.length / 5)); // ~5 locations per day
            const budgetResult = await budgetAgent.process(finalLocations, preferences, numDays);
            agentTimes['budget'] = budgetResult.processingTime || 0;

            if (!budgetResult.success || !budgetResult.data) {
                throw new Error(budgetResult.error || 'Budget calculation failed');
            }

            const { breakdown, isOverBudget, adjustedLocations } = budgetResult.data;
            const budgetLocations = adjustedLocations || finalLocations;

            // Stage 7: Time Orchestrator Agent
            this.updateStatus('optimizing', 80, 'Creating optimal schedule...', 'Time Orchestrator');
            const timeResult = await timeAgent.process(clusters, budgetLocations, preferences, numDays);
            agentTimes['time'] = timeResult.processingTime || 0;

            if (!timeResult.success || !timeResult.data) {
                throw new Error(timeResult.error || 'Scheduling failed');
            }

            const { schedules, warnings, suggestions } = timeResult.data;

            // Stage 8: Itinerary Writer Agent
            this.updateStatus('generating', 90, 'Writing your itinerary...', 'Itinerary Writer');
            const itineraryResult = await itineraryAgent.process({
                locations: budgetLocations,
                clusters,
                schedules,
                preferences,
                destinationName: destination || destinationName,
                budgetBreakdown: breakdown
            });
            agentTimes['itinerary'] = itineraryResult.processingTime || 0;

            if (!itineraryResult.success || !itineraryResult.data) {
                throw new Error(itineraryResult.error || 'Itinerary generation failed');
            }

            // Complete!
            this.updateStatus('complete', 100, 'Your itinerary is ready!', undefined);

            const totalTime = Date.now() - startTime;
            console.log(`[Orchestrator] Complete! Total time: ${totalTime}ms`);

            return {
                success: true,
                data: {
                    itinerary: itineraryResult.data,
                    processingReport: {
                        totalTime,
                        agentTimes,
                        locationsFound: allLocations.length,
                        locationsVerified: validatedLocations.length,
                        clustersCreated: clusters.length
                    }
                },
                processingTime: totalTime
            };
        } catch (error: any) {
            this.updateStatus('error', 0, error.message, undefined);
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }
}

export const orchestrator = new AgentOrchestrator();
export default AgentOrchestrator;
