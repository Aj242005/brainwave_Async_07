import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Plan from './pages/Plan'
import Itinerary from './pages/Itinerary'

function App() {
  const [sessionData, setSessionData] = useState<{
    sessionId?: string;
    itinerary?: any;
  }>({});

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="bg-animated">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/upload"
          element={
            <Upload
              onSessionCreated={(sessionId) => setSessionData({ ...sessionData, sessionId })}
            />
          }
        />
        <Route
          path="/plan"
          element={
            <Plan
              sessionId={sessionData.sessionId}
              onItineraryReady={(itinerary) => setSessionData({ ...sessionData, itinerary })}
            />
          }
        />
        <Route
          path="/itinerary"
          element={<Itinerary itinerary={sessionData.itinerary} />}
        />
      </Routes>
    </div>
  )
}

export default App
