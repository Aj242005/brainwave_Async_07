// Clustering & Route Optimizer Agent
import { mapsService } from '../services/mapsService';
import { AgentResult, Location, ClusterGroup } from '../types';

interface ClusteringOutput {
    clusters: ClusterGroup[];
    optimizedOrder: Location[];
    totalDistance: number;
    mapUrl: string;
}

class ClusteringAgent {
    name = 'Clustering & Route Optimizer Agent';
    description = 'Groups nearby locations into clusters and optimizes travel routes';

    async process(locations: Location[]): Promise<AgentResult<ClusteringOutput>> {
        console.log(`[${this.name}] Clustering ${locations.length} locations...`);
        const startTime = Date.now();

        if (locations.length === 0) {
            return {
                success: false,
                error: 'No locations to cluster',
                processingTime: Date.now() - startTime
            };
        }

        try {
            // Step 1: Cluster locations by proximity
            const clusters = this.clusterByProximity(locations);
            console.log(`[${this.name}] Created ${clusters.length} clusters`);

            // Step 2: Optimize order within each cluster
            for (const cluster of clusters) {
                cluster.locations = await this.optimizeClusterOrder(cluster.locations);
            }

            // Step 3: Optimize cluster order
            const orderedClusters = this.optimizeClusterSequence(clusters);

            // Step 4: Flatten to get overall optimized order
            const optimizedOrder = orderedClusters.flatMap(c => c.locations);

            // Step 5: Calculate total distance
            const totalDistance = await this.calculateTotalDistance(optimizedOrder);

            // Step 6: Generate map URL
            const mapUrl = mapsService.generateMapsUrl(optimizedOrder);

            return {
                success: true,
                data: {
                    clusters: orderedClusters,
                    optimizedOrder,
                    totalDistance,
                    mapUrl
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

    private clusterByProximity(locations: Location[]): ClusterGroup[] {
        // Simple k-means-like clustering
        const clusters: ClusterGroup[] = [];
        const assigned = new Set<string>();
        const CLUSTER_RADIUS_KM = 3; // 3km radius for walkable clusters

        for (const location of locations) {
            if (assigned.has(location.id) || !location.coordinates) continue;

            // Start a new cluster
            const cluster: ClusterGroup = {
                id: `cluster-${clusters.length + 1}`,
                name: `Area ${clusters.length + 1}`,
                centroid: location.coordinates,
                locations: [location],
                suggestedDuration: this.estimateDuration(location)
            };
            assigned.add(location.id);

            // Find nearby locations
            for (const other of locations) {
                if (assigned.has(other.id) || !other.coordinates) continue;

                const distance = this.haversineDistance(
                    location.coordinates,
                    other.coordinates
                );

                if (distance <= CLUSTER_RADIUS_KM) {
                    cluster.locations.push(other);
                    cluster.suggestedDuration += this.estimateDuration(other);
                    assigned.add(other.id);
                }
            }

            // Update centroid
            cluster.centroid = this.calculateCentroid(cluster.locations);

            // Name the cluster based on first location
            cluster.name = this.generateClusterName(cluster.locations);

            clusters.push(cluster);
        }

        return clusters;
    }

    private async optimizeClusterOrder(locations: Location[]): Promise<Location[]> {
        if (locations.length <= 2) return locations;

        // Simple greedy nearest-neighbor algorithm
        const ordered: Location[] = [locations[0]];
        const remaining = new Set(locations.slice(1));

        while (remaining.size > 0) {
            const current = ordered[ordered.length - 1];
            let nearest: Location | null = null;
            let nearestDist = Infinity;

            for (const loc of remaining) {
                if (current.coordinates && loc.coordinates) {
                    const dist = this.haversineDistance(current.coordinates, loc.coordinates);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = loc;
                    }
                }
            }

            if (nearest) {
                ordered.push(nearest);
                remaining.delete(nearest);
            } else {
                // No coordinates available, add remaining in original order
                ordered.push(...Array.from(remaining));
                break;
            }
        }

        return ordered;
    }

    private optimizeClusterSequence(clusters: ClusterGroup[]): ClusterGroup[] {
        if (clusters.length <= 2) return clusters;

        // Greedy nearest-neighbor for clusters
        const ordered: ClusterGroup[] = [clusters[0]];
        const remaining = new Set(clusters.slice(1));

        while (remaining.size > 0) {
            const current = ordered[ordered.length - 1];
            let nearest: ClusterGroup | null = null;
            let nearestDist = Infinity;

            for (const cluster of remaining) {
                const dist = this.haversineDistance(current.centroid, cluster.centroid);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = cluster;
                }
            }

            if (nearest) {
                ordered.push(nearest);
                remaining.delete(nearest);
            }
        }

        return ordered;
    }

    private async calculateTotalDistance(locations: Location[]): Promise<number> {
        let total = 0;

        for (let i = 0; i < locations.length - 1; i++) {
            const current = locations[i];
            const next = locations[i + 1];

            if (current.coordinates && next.coordinates) {
                total += this.haversineDistance(current.coordinates, next.coordinates);
            }
        }

        return Math.round(total * 100) / 100; // Round to 2 decimal places
    }

    private estimateDuration(location: Location): number {
        // Estimated visit duration in minutes
        const durations: Record<Location['type'], number> = {
            restaurant: 75,
            attraction: 90,
            activity: 120,
            accommodation: 0,
            viewpoint: 30,
            market: 60,
            temple: 60,
            cafe: 45,
            other: 45
        };
        return durations[location.type] || 45;
    }

    private generateClusterName(locations: Location[]): string {
        if (locations.length === 0) return 'Unknown Area';

        // Use the most prominent location name or extract neighborhood
        const firstLocation = locations[0];
        const address = firstLocation.address || firstLocation.name;

        // Try to extract neighborhood/area from address
        const parts = address.split(',').map(p => p.trim());
        if (parts.length > 2) {
            return parts[1]; // Usually the neighborhood
        }

        return firstLocation.name.split(' ').slice(0, 2).join(' ') + ' Area';
    }

    private calculateCentroid(locations: Location[]): { lat: number; lng: number } {
        const validCoords = locations
            .filter(l => l.coordinates)
            .map(l => l.coordinates!);

        if (validCoords.length === 0) {
            return { lat: 0, lng: 0 };
        }

        const sum = validCoords.reduce(
            (acc, coord) => ({
                lat: acc.lat + coord.lat,
                lng: acc.lng + coord.lng
            }),
            { lat: 0, lng: 0 }
        );

        return {
            lat: sum.lat / validCoords.length,
            lng: sum.lng / validCoords.length
        };
    }

    private haversineDistance(
        coord1: { lat: number; lng: number },
        coord2: { lat: number; lng: number }
    ): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLon = this.toRad(coord2.lng - coord1.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

export const clusteringAgent = new ClusteringAgent();
export default ClusteringAgent;
