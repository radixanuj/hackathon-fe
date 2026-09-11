import { createContext, useContext, useMemo, useState } from 'react'
import ProfileModal from './ProfileModal'
import SessionRequestModal from './SessionRequestModal'

const OverlayContext = createContext(null)

/**
 * The profile sheet and the "30 minutes with" sheet are reachable from nearly
 * every card, so they live once at the root rather than in each screen.
 */
export function OverlayProvider({ children }) {
  const [profileId, setProfileId] = useState(null)
  const [request, setRequest] = useState(null)

  const value = useMemo(
    () => ({
      openProfile: (id) => setProfileId(id),
      closeProfile: () => setProfileId(null),
      // person: a user summary; topic: what prompted the ask.
      openRequest: (person, topic) => {
        setProfileId(null)
        setRequest({ person, topic: topic || 'A first conversation' })
      },
      closeRequest: () => setRequest(null),
    }),
    [],
  )

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {profileId && <ProfileModal userId={profileId} onClose={value.closeProfile} />}
      {request && (
        <SessionRequestModal
          person={request.person}
          topic={request.topic}
          onClose={value.closeRequest}
        />
      )}
    </OverlayContext.Provider>
  )
}

export const useOverlays = () => useContext(OverlayContext)
