// OnDemand Agent Configuration
// All agent endpoints and plugin IDs are loaded from environment variables

export type AgentType =
    | 'vision'
    | 'validator'
    | 'location'
    | 'vibe'
    | 'budget'
    | 'time'
    | 'writer';

export interface AgentConfig {
    name: string;
    description: string;
    endpointId: string;
    pluginIds: string[];
}

// Agent configurations loaded from .env
export const ONDEMAND_AGENTS: Record<AgentType, AgentConfig> = {
    vision: {
        name: 'Vision Intelligence Agent',
        description: 'Analyzes screenshots to extract locations, hashtags, and travel information',
        endpointId: process.env.VISION_AGENT_ENDPOINT || 'predefined-openai-gpt4o',
        pluginIds: (process.env.VISION_AGENT_PLUGINS || '').split(',').filter(Boolean),
    },
    validator: {
        name: 'Social Proof Validator Agent',
        description: 'Validates locations by checking reviews and social proof',
        endpointId: process.env.VALIDATOR_AGENT_ENDPOINT || 'predefined-openai-gpt4o',
        pluginIds: (process.env.VALIDATOR_AGENT_PLUGINS || '').split(',').filter(Boolean),
    },
    location: {
        name: 'Location Intelligence Agent',
        description: 'Enriches location data with coordinates, addresses, and details',
        endpointId: process.env.LOCATION_AGENT_ENDPOINT || 'predefined-openai-gpt4o',
        pluginIds: (process.env.LOCATION_AGENT_PLUGINS || '').split(',').filter(Boolean),
    },
    vibe: {
        name: 'Vibe Matching Agent',
        description: 'Analyzes trip vibe and matches locations to travel style',
        endpointId: process.env.VIBE_AGENT_ENDPOINT || 'predefined-openai-gpt4o',
        pluginIds: (process.env.VIBE_AGENT_PLUGINS || '').split(',').filter(Boolean),
    },
    budget: {
        name: 'Budget Calculator Agent',
        description: 'Calculates costs and provides budget optimization',
        endpointId: process.env.BUDGET_AGENT_ENDPOINT || 'predefined-openai-gpt4o',
        pluginIds: (process.env.BUDGET_AGENT_PLUGINS || '').split(',').filter(Boolean),
    },
    time: {
        name: 'Time Orchestrator Agent',
        description: 'Creates optimal schedules with perfect timing',
        endpointId: process.env.TIME_AGENT_ENDPOINT || 'predefined-openai-gpt4o',
        pluginIds: (process.env.TIME_AGENT_PLUGINS || '').split(',').filter(Boolean),
    },
    writer: {
        name: 'Itinerary Writer Agent',
        description: 'Generates beautifully formatted travel itineraries',
        endpointId: process.env.WRITER_AGENT_ENDPOINT || 'predefined-openai-gpt4o',
        pluginIds: (process.env.WRITER_AGENT_PLUGINS || '').split(',').filter(Boolean),
    },
};

// Helper to get agent config
export function getAgentConfig(agentType: AgentType): AgentConfig {
    return ONDEMAND_AGENTS[agentType];
}

// Check if agents are configured
export function isAgentConfigured(agentType: AgentType): boolean {
    const config = ONDEMAND_AGENTS[agentType];
    return config.pluginIds.length > 0 || config.endpointId !== 'predefined-openai-gpt4o';
}

// Log configured agents on startup
export function logAgentStatus(): void {
    console.log('\n📦 OnDemand Agent Status:');
    for (const [type, config] of Object.entries(ONDEMAND_AGENTS)) {
        const hasPlugins = config.pluginIds.length > 0;
        const status = hasPlugins ? '✅' : '⚠️ (using default)';
        console.log(`   ${status} ${config.name}`);
        if (hasPlugins) {
            console.log(`      └─ Plugins: ${config.pluginIds.join(', ')}`);
        }
    }
    console.log('');
}
