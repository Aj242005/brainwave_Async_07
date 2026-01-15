// Compass Travel Planner - Backend Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import planRoutes from './routes/planRoutes';
import { logAgentStatus } from './config/agents.config';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://compass-travel.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', planRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Compass Travel Planner API',
        version: '1.0.0',
        description: 'Transform your travel screenshots into optimized itineraries',
        endpoints: {
            health: 'GET /api/health',
            plan: 'POST /api/plan (multipart/form-data with screenshots)',
            status: 'GET /api/plan/:sessionId/status',
            result: 'GET /api/plan/:sessionId/result',
            demo: 'GET /api/demo',
            export: 'GET /api/plan/:sessionId/export/:format'
        },
        agents: [
            'Vision Intelligence Agent',
            'Social Proof Validator Agent',
            'Location Intelligence Agent',
            'Vibe Matching Agent',
            'Clustering & Route Optimizer Agent',
            'Budget Calculator Agent',
            'Time Orchestrator Agent',
            'Itinerary Writer Agent'
        ]
    });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🧭 COMPASS Travel Planner API                          ║
║                                                          ║
║   Server running on http://localhost:${PORT}               ║
║                                                          ║
║   8 AI Agents Ready:                                     ║
║   ├── Vision Intelligence                                ║
║   ├── Social Proof Validator                             ║
║   ├── Location Intelligence                              ║
║   ├── Vibe Matching                                      ║
║   ├── Clustering & Route Optimizer                       ║
║   ├── Budget Calculator                                  ║
║   ├── Time Orchestrator                                  ║
║   └── Itinerary Writer                                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);

    // Log OnDemand agent configuration status
    logAgentStatus();
});

export default app;
