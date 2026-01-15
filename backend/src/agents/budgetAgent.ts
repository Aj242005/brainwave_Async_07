// Budget Calculator Agent
import { chatService } from '../services/chatService';
import { AgentResult, Location, TripPreferences } from '../types';

interface BudgetBreakdown {
    food: number;
    activities: number;
    transport: number;
    accommodation: number;
    misc: number;
    total: number;
}

interface BudgetOptimization {
    keep: { location: Location; reason: string }[];
    replace: { original: Location; alternative: string; savings: number }[];
    remove: { location: Location; reason: string }[];
}

interface BudgetOutput {
    breakdown: BudgetBreakdown;
    isOverBudget: boolean;
    overageAmount: number;
    optimization?: BudgetOptimization;
    adjustedLocations?: Location[];
}

class BudgetAgent {
    name = 'Budget Calculator Agent';
    description = 'Calculates trip costs, identifies budget issues, and suggests optimizations';

    async process(
        locations: Location[],
        preferences: TripPreferences,
        numDays: number = 1
    ): Promise<AgentResult<BudgetOutput>> {
        console.log(`[${this.name}] Calculating budget for ${locations.length} locations...`);
        const startTime = Date.now();

        try {
            // Step 1: Calculate breakdown
            const breakdown = this.calculateBreakdown(locations, numDays);

            // Step 2: Check if over budget
            const isOverBudget = breakdown.total > preferences.budget;
            const overageAmount = Math.max(0, breakdown.total - preferences.budget);

            let optimization: BudgetOptimization | undefined;
            let adjustedLocations: Location[] | undefined;

            // Step 3: If over budget, generate optimization suggestions
            if (isOverBudget) {
                console.log(`[${this.name}] Over budget by ${overageAmount} ${preferences.currency}`);

                const optimizationResult = await this.optimizeBudget(
                    locations,
                    breakdown.total,
                    preferences.budget
                );

                if (optimizationResult.success && optimizationResult.data) {
                    optimization = optimizationResult.data;
                    adjustedLocations = this.applyOptimization(locations, optimization);
                }
            }

            console.log(`[${this.name}] Total cost: ${breakdown.total} ${preferences.currency}`);

            return {
                success: true,
                data: {
                    breakdown,
                    isOverBudget,
                    overageAmount,
                    optimization,
                    adjustedLocations
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

    private calculateBreakdown(locations: Location[], numDays: number): BudgetBreakdown {
        const breakdown: BudgetBreakdown = {
            food: 0,
            activities: 0,
            transport: 0,
            accommodation: 0,
            misc: 0,
            total: 0
        };

        for (const location of locations) {
            const cost = location.estimatedCost || this.estimateCost(location);

            switch (location.type) {
                case 'restaurant':
                    breakdown.food += cost;
                    break;
                case 'accommodation':
                    breakdown.accommodation += cost * numDays;
                    break;
                case 'attraction':
                case 'activity':
                    breakdown.activities += cost;
                    break;
                case 'market':
                    breakdown.misc += cost;
                    break;
                default:
                    breakdown.misc += cost;
            }
        }

        // Estimate transport (roughly 15% of activities)
        breakdown.transport = Math.round(breakdown.activities * 0.15);

        // Add misc buffer (10%)
        breakdown.misc += Math.round((breakdown.food + breakdown.activities) * 0.1);

        breakdown.total =
            breakdown.food +
            breakdown.activities +
            breakdown.transport +
            breakdown.accommodation +
            breakdown.misc;

        return breakdown;
    }

    private estimateCost(location: Location): number {
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

        const base = baseCosts[location.type] || 15;
        const multiplier = location.priceLevel || 2;
        return base * (multiplier / 2);
    }

    private async optimizeBudget(
        locations: Location[],
        currentTotal: number,
        targetBudget: number
    ): Promise<AgentResult<BudgetOptimization>> {
        // Use Chat API for smart suggestions
        const result = await chatService.optimizeBudget(locations, currentTotal, targetBudget);

        if (result.success && result.data) {
            try {
                const parsed = this.parseOptimizationResponse(result.data.answer);
                return { success: true, data: parsed };
            } catch {
                // Fallback to simple optimization
                return { success: true, data: this.simpleOptimization(locations, currentTotal, targetBudget) };
            }
        }

        return { success: true, data: this.simpleOptimization(locations, currentTotal, targetBudget) };
    }

    private parseOptimizationResponse(answer: string): BudgetOptimization {
        // Try to parse JSON from response
        const jsonMatch = answer.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                keep: parsed.keep || [],
                replace: parsed.replace || [],
                remove: parsed.remove || []
            };
        }
        throw new Error('Could not parse optimization response');
    }

    private simpleOptimization(
        locations: Location[],
        currentTotal: number,
        targetBudget: number
    ): BudgetOptimization {
        const optimization: BudgetOptimization = {
            keep: [],
            replace: [],
            remove: []
        };

        const overage = currentTotal - targetBudget;
        let savings = 0;

        // Sort by cost descending to find expensive items to cut
        const sorted = [...locations].sort((a, b) =>
            (b.estimatedCost || 0) - (a.estimatedCost || 0)
        );

        for (const location of sorted) {
            const cost = location.estimatedCost || 0;

            if (savings >= overage) {
                optimization.keep.push({
                    location,
                    reason: 'Within budget after adjustments'
                });
                continue;
            }

            // Check if this is a high-cost item that can be replaced
            if (location.priceLevel && location.priceLevel >= 3 && location.type === 'restaurant') {
                optimization.replace.push({
                    original: location,
                    alternative: 'Local eatery with similar cuisine',
                    savings: Math.round(cost * 0.5)
                });
                savings += Math.round(cost * 0.5);
            } else if (location.type === 'activity' && cost > 50) {
                optimization.replace.push({
                    original: location,
                    alternative: 'Free/cheaper alternative nearby',
                    savings: Math.round(cost * 0.7)
                });
                savings += Math.round(cost * 0.7);
            } else if (cost > 30 && locations.length > 5) {
                optimization.remove.push({
                    location,
                    reason: 'Lowest priority based on ratings and distance'
                });
                savings += cost;
            } else {
                optimization.keep.push({
                    location,
                    reason: 'Good value'
                });
            }
        }

        return optimization;
    }

    private applyOptimization(
        locations: Location[],
        optimization: BudgetOptimization
    ): Location[] {
        const removeIds = new Set(optimization.remove.map(r => r.location.id));
        return locations.filter(l => !removeIds.has(l.id));
    }
}

export const budgetAgent = new BudgetAgent();
export default BudgetAgent;
