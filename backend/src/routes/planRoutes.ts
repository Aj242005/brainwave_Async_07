// API Routes for Compass Travel Planner
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { orchestrator } from '../agents/orchestrator';
import { TripPreferences } from '../types';

const router = Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 15 // Max 15 files
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Store processing status for polling
const processingStatus = new Map<string, any>();

// Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'Compass API', version: '1.0.0' });
});

// Create trip planning session
router.post('/plan', upload.array('screenshots', 15), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No screenshots provided. Please upload at least one image.'
            });
        }

        // Parse preferences
        const preferences: TripPreferences = {
            budget: parseFloat(req.body.budget) || 500,
            currency: req.body.currency || 'USD',
            companions: req.body.companions || 'solo',
            travelStyle: req.body.travelStyle
                ? JSON.parse(req.body.travelStyle)
                : ['culture', 'food'],
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            startTime: req.body.startTime || '09:00',
            endTime: req.body.endTime || '21:00'
        };

        const destination = req.body.destination;

        // Generate session ID
        const sessionId = `session-${Date.now()}`;

        // Initialize status
        processingStatus.set(sessionId, {
            stage: 'uploading',
            progress: 5,
            message: 'Starting processing...'
        });

        // Set up status callback
        orchestrator.setStatusCallback((status) => {
            processingStatus.set(sessionId, status);
        });

        // Prepare images
        const images = files.map(file => ({
            buffer: file.buffer,
            filename: file.originalname
        }));

        // Process asynchronously
        const resultPromise = orchestrator.process(images, preferences, destination);

        // Return session ID immediately for polling
        res.json({
            success: true,
            sessionId,
            message: `Processing ${files.length} screenshots...`,
            pollEndpoint: `/api/plan/${sessionId}/status`
        });

        // Wait for processing to complete and store result
        const result = await resultPromise;
        processingStatus.set(sessionId, {
            ...processingStatus.get(sessionId),
            result
        });

    } catch (error: any) {
        console.error('Planning error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process screenshots'
        });
    }
});

// Poll processing status
router.get('/plan/:sessionId/status', (req: Request, res: Response) => {
    const sessionId = req.params.sessionId as string;
    const status = processingStatus.get(sessionId);

    if (!status) {
        return res.status(404).json({
            success: false,
            error: 'Session not found'
        });
    }

    res.json({
        success: true,
        ...status
    });
});

// Get itinerary result
router.get('/plan/:sessionId/result', (req: Request, res: Response) => {
    const sessionId = req.params.sessionId as string;
    const status = processingStatus.get(sessionId);

    if (!status) {
        return res.status(404).json({
            success: false,
            error: 'Session not found'
        });
    }

    if (!status.result) {
        return res.status(202).json({
            success: true,
            message: 'Still processing...',
            stage: status.stage,
            progress: status.progress
        });
    }

    res.json(status.result);
});

// Demo endpoint - returns sample itinerary
router.get('/demo', async (req: Request, res: Response) => {
    const sampleItinerary = {
        success: true,
        data: {
            itinerary: {
                id: 'demo-itinerary-1',
                name: 'Tokyo Adventure',
                destination: 'Tokyo, Japan',
                days: [
                    {
                        date: '2024-03-01',
                        dayNumber: 1,
                        title: 'Day 1: Culture & Discovery',
                        locations: [
                            {
                                location: {
                                    id: 'loc-1',
                                    name: 'Senso-ji Temple',
                                    address: 'Asakusa, Tokyo',
                                    type: 'attraction',
                                    rating: 4.6,
                                    estimatedCost: 0,
                                    verified: true
                                },
                                startTime: '09:00',
                                endTime: '10:30',
                                duration: 90,
                                travelTime: 0,
                                tips: ['✨ Visit early to avoid crowds', '📸 Great photo opportunities']
                            },
                            {
                                location: {
                                    id: 'loc-2',
                                    name: 'Nakamise Shopping Street',
                                    address: 'Asakusa, Tokyo',
                                    type: 'market',
                                    rating: 4.4,
                                    estimatedCost: 20,
                                    verified: true
                                },
                                startTime: '10:45',
                                endTime: '12:00',
                                duration: 75,
                                travelTime: 15,
                                tips: ['💵 Bring cash for vendors', '🍡 Try traditional snacks']
                            },
                            {
                                location: {
                                    id: 'loc-3',
                                    name: 'Tokyo Skytree',
                                    address: 'Sumida, Tokyo',
                                    type: 'viewpoint',
                                    rating: 4.5,
                                    estimatedCost: 25,
                                    verified: true
                                },
                                startTime: '13:00',
                                endTime: '14:30',
                                duration: 90,
                                travelTime: 20,
                                tips: ['🎫 Book tickets online', '🌅 Best views at sunset']
                            }
                        ],
                        totalCost: 45,
                        totalDistance: 3.5
                    }
                ],
                totalBudget: 45,
                preferences: {
                    budget: 200,
                    currency: 'USD',
                    companions: 'solo',
                    travelStyle: ['culture', 'food']
                },
                createdAt: new Date().toISOString(),
                mapUrl: 'https://www.google.com/maps/dir/35.7148,139.7967/35.7108,139.7971/35.7100,139.8107'
            },
            processingReport: {
                totalTime: 3500,
                agentTimes: {
                    vision: 450,
                    socialProof: 620,
                    location: 350,
                    vibe: 280,
                    clustering: 180,
                    budget: 220,
                    time: 150,
                    itinerary: 320
                },
                locationsFound: 8,
                locationsVerified: 6,
                clustersCreated: 2
            }
        }
    };

    res.json(sampleItinerary);
});

// Export itinerary in different formats
router.get('/plan/:sessionId/export/:format', (req: Request, res: Response) => {
    const sessionId = req.params.sessionId as string;
    const format = req.params.format as string;
    const status = processingStatus.get(sessionId);

    if (!status?.result?.data?.itinerary) {
        return res.status(404).json({
            success: false,
            error: 'Itinerary not found'
        });
    }

    const itinerary = status.result.data.itinerary;

    switch (format) {
        case 'json':
            res.setHeader('Content-Disposition', `attachment; filename=compass-itinerary.json`);
            res.json(itinerary);
            break;

        case 'text':
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename=compass-itinerary.txt`);
            res.send(formatItineraryAsText(itinerary));
            break;

        default:
            res.status(400).json({ error: 'Unsupported format. Use json or text.' });
    }
});

function formatItineraryAsText(itinerary: any): string {
    let output = `🧭 COMPASS ITINERARY\n`;
    output += `${'='.repeat(40)}\n\n`;
    output += `📍 ${itinerary.name}\n`;
    output += `📅 Destination: ${itinerary.destination}\n`;
    output += `💰 Budget: $${itinerary.totalBudget}\n\n`;

    for (const day of itinerary.days) {
        output += `\n${'─'.repeat(40)}\n`;
        output += `${day.title}\n`;
        output += `📅 ${day.date}\n`;
        output += `${'─'.repeat(40)}\n\n`;

        for (const item of day.locations) {
            output += `⏰ ${item.startTime} - ${item.endTime}\n`;
            output += `📍 ${item.location.name}\n`;
            output += `   ${item.location.address}\n`;
            if (item.location.estimatedCost > 0) {
                output += `   💵 ~$${item.location.estimatedCost}\n`;
            }
            if (item.tips?.length > 0) {
                output += `   💡 ${item.tips[0]}\n`;
            }
            output += '\n';
        }
    }

    if (itinerary.mapUrl) {
        output += `\n🗺️ View Route: ${itinerary.mapUrl}\n`;
    }

    return output;
}

export default router;
