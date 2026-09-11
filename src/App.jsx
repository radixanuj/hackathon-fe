import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import AppShell from './components/AppShell'
import { OverlayProvider } from './components/Overlays'
import Community from './routes/Community'
import Connect from './routes/Connect'
import Home from './routes/Home'
import Me from './routes/Me'
import Notifications from './routes/Notifications'
import People from './routes/People'
import SignIn from './routes/SignIn'

function Protected() {
  return (
    <OverlayProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/people" element={<People />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/community" element={<Community />} />
          <Route path="/me" element={<Me />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </OverlayProvider>
  )
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth()

  // Hold the first paint while a stored token is verified, so we don't flash
  // the sign-in screen at someone who is already signed in.
  if (isLoading) return null

  return (
    <Routes>
      <Route path="/sign-in" element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />} />
      <Route
        path="*"
        element={isAuthenticated ? <Protected /> : <Navigate to="/sign-in" replace />}
      />
    </Routes>
  )
}
