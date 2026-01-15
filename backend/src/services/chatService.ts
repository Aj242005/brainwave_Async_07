// OnDemand Chat API Service - Multi-Agent Support
import axios from 'axios';
import { AgentResult } from '../types';
import { AgentType, getAgentConfig, ONDEMAND_AGENTS } from '../config/agents.config';

const ONDEMAND_API_BASE = 'https://api.on-demand.io/chat/v1';

interface ChatResponse {
    sessionId: string;
    answer: string;
    responseCompleted: boolean;
}

class ChatService {
    private apiKey: string;
    private sessions: Map<string, string> = new Map(); // agentType -> sessionId

    constructor() {
        this.apiKey = process.env.ONDEMAND_API_KEY || '';
    }

    // Create a session for a specific agent
    async createSession(agentType?: AgentType): Promise<string> {
        try {
            const response = await axios.post(
                `${ONDEMAND_API_BASE}/sessions`,
                {
                    pluginIds: [],
                    externalUserId: `compass-${agentType || 'default'}-${Date.now()}`
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    }
                }
            );
            const sessionId = response.data.data.id;
            if (agentType) {
                this.sessions.set(agentType, sessionId);
            }
            return sessionId;
        } catch (error: any) {
            console.error('Failed to create chat session:', error.message);
            throw error;
        }
    }

    // Call a specific OnDemand agent
    async callAgent(
        agentType: AgentType,
        query: string,
        context?: Record<string, any>
    ): Promise<AgentResult<ChatResponse>> {
        const config = getAgentConfig(agentType);

        // Get or create session for this agent
        let sessionId = this.sessions.get(agentType);
        if (!sessionId) {
            sessionId = await this.createSession(agentType);
        }

        console.log(`[ChatService] Calling ${config.name}...`);

        try {
            // Build the full query with context if provided
            const fullQuery = context
                ? `${query}\n\nContext:\n${JSON.stringify(context, null, 2)}`
                : query;

            const response = await axios.post(
                `${ONDEMAND_API_BASE}/sessions/${sessionId}/query`,
                {
                    endpointId: config.endpointId,
                    query: fullQuery,
                    pluginIds: config.pluginIds.length > 0 ? config.pluginIds : undefined,
                    responseMode: 'sync'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    }
                }
            );

            return {
                success: true,
                data: {
                    sessionId,
                    answer: response.data.data.answer,
                    responseCompleted: response.data.data.responseCompleted
                }
            };
        } catch (error: any) {
            console.error(`[ChatService] ${config.name} error:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Agent-Specific Methods
    // ═══════════════════════════════════════════════════════════════════════════

    // Vision Agent - Analyze screenshot content
    async analyzeScreenshot(imageDescription: string): Promise<AgentResult<any>> {
        const query = `Analyze this travel screenshot and extract:
1. Location names (restaurants, attractions, places)
2. Hashtags or tags
3. Platform source (Instagram, TikTok, etc.)
4. Any pricing or rating information

Screenshot content: ${imageDescription}

Respond in JSON format with: { locations: string[], hashtags: string[], platform: string, ratings: any[], prices: any[] }`;

        return this.callAgent('vision', query);
    }

    // Validator Agent - Verify locations are real
    async validateLocations(locations: string[], destination?: string): Promise<AgentResult<any>> {
        const query = `Validate these travel locations${destination ? ` in ${destination}` : ''}:

Locations: ${locations.join(', ')}

For each location, determine:
1. Is it a real place? (verified: true/false)
2. Type (restaurant, attraction, market, temple, cafe, viewpoint, etc.)
3. Approximate rating (1-5)
4. Price level (1-4, where 1=budget, 4=luxury)

Respond in JSON format: { validatedLocations: [{ name, verified, type, rating, priceLevel }], invalidLocations: string[] }`;

        return this.callAgent('validator', query);
    }

    // Location Agent - Enrich with coordinates and details
    async enrichLocations(locations: any[]): Promise<AgentResult<any>> {
        const query = `Provide detailed information for these travel locations:

${JSON.stringify(locations, null, 2)}

For each location, provide:
1. Full address
2. Approximate coordinates (lat, lng)
3. Opening hours (if applicable)
4. Estimated visit duration in minutes
5. Best time to visit

Respond in JSON format: { enrichedLocations: [{ name, address, coordinates: {lat, lng}, openingHours, duration, bestTime }] }`;

        return this.callAgent('location', query);
    }

    // Vibe Agent - Analyze trip style
    async analyzeVibes(locations: string[], hashtags: string[], preferences?: any): Promise<AgentResult<any>> {
        const query = `Analyze these travel locations and hashtags to determine the trip vibe:

Locations: ${locations.join(', ')}
Hashtags: ${hashtags.join(', ')}
${preferences ? `User preferences: ${JSON.stringify(preferences)}` : ''}

Classify the overall trip as:
1. Aesthetic type: luxury, budget, local, touristy, or hidden-gem
2. Ambiance: romantic, family-friendly, adventure, relaxed, or vibrant
3. Suggested travel style: culture, food, relaxation, adventure, or mixed
4. Which locations match/mismatch the overall vibe

Respond in JSON format: { aesthetic, ambiance, travelStyle, matchingLocations: string[], mismatchingLocations: string[], reasoning }`;

        return this.callAgent('vibe', query);
    }

    // Budget Agent - Calculate and optimize costs
    async calculateBudget(locations: any[], preferences: any): Promise<AgentResult<any>> {
        const query = `Calculate travel budget for this trip:

Locations:
${JSON.stringify(locations.map(l => ({ name: l.name, type: l.type, priceLevel: l.priceLevel })), null, 2)}

User Budget: ${preferences.budget} ${preferences.currency}
Travel Style: ${preferences.travelStyle?.join(', ')}
Companions: ${preferences.companions}

Provide:
1. Estimated cost breakdown (food, activities, transport, misc)
2. Total estimated cost
3. Is it within budget?
4. If over budget, suggestions to reduce costs

Respond in JSON format: { breakdown: { food, activities, transport, misc, total }, isWithinBudget, suggestions: string[] }`;

        return this.callAgent('budget', query);
    }

    // Time Agent - Create optimal schedule
    async createSchedule(locations: any[], preferences: any, numDays: number): Promise<AgentResult<any>> {
        const query = `Create an optimal ${numDays}-day schedule for these locations:

Locations:
${JSON.stringify(locations.map(l => ({ name: l.name, type: l.type, duration: l.duration || 60 })), null, 2)}

Preferences:
- Start time: ${preferences.startTime || '09:00'}
- End time: ${preferences.endTime || '21:00'}
- Travel style: ${preferences.travelStyle?.join(', ')}

Create a schedule that:
1. Groups nearby locations together
2. Places restaurants at appropriate meal times
3. Visits viewpoints during golden hour
4. Includes travel time between locations
5. Allows rest breaks

Respond in JSON format: { days: [{ dayNumber, date, slots: [{ locationName, startTime, endTime, duration, travelTime, tips }] }] }`;

        return this.callAgent('time', query);
    }

    // Writer Agent - Generate itinerary
    async generateItinerary(
        locations: any[],
        preferences: any,
        schedule: any,
        destination: string
    ): Promise<AgentResult<any>> {
        const query = `Generate a beautifully formatted travel itinerary:

Destination: ${destination}
Locations: ${JSON.stringify(locations.map(l => l.name))}
Schedule: ${JSON.stringify(schedule)}
Budget: ${preferences.budget} ${preferences.currency}
Style: ${preferences.travelStyle?.join(', ')}

Create an itinerary with:
1. Catchy trip name
2. Day-by-day breakdown with timing
3. Pro tips for each location
4. Local insights and hidden gems
5. Estimated costs per activity
6. Photo opportunities

Respond in JSON format matching our Itinerary type structure.`;

        return this.callAgent('writer', query);
    }

    // Budget optimization with AI suggestions
    async optimizeBudget(
        locations: any[],
        currentTotal: number,
        targetBudget: number
    ): Promise<AgentResult<any>> {
        const query = `Help optimize this travel budget:

Current locations with costs:
${JSON.stringify(locations.map(l => ({ name: l.name, type: l.type, cost: l.estimatedCost })), null, 2)}

Current Total: ${currentTotal}
Target Budget: ${targetBudget}

Suggest which locations to:
1. Keep (essential/best value)
2. Replace with budget-friendly alternatives
3. Remove if necessary

Respond in JSON format: { keep: [{name, reason}], replace: [{original, alternative, savings}], remove: [{name, reason}] }`;

        return this.callAgent('budget', query);
    }

    // Legacy method for backward compatibility
    async sendMessage(query: string, sessionId?: string): Promise<AgentResult<ChatResponse>> {
        // Default to writer agent for general queries
        return this.callAgent('writer', query);
    }
}

export const chatService = new ChatService();
export default ChatService;
