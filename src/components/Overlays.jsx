import { createContext, useContext, useMemo, useState } from 'react'
import PeoplePickerModal from './PeoplePickerModal'
import ProfileModal from './ProfileModal'
import SessionRequestModal from './SessionRequestModal'

const OverlayContext = createContext(null)

/**
 * The profile sheet, the "everybody you could ask" list and the request sheet
 * are reachable from nearly every card, so they live once at the root rather
 * than in each screen.
 *
 * They also stack: the picker opens over a page, a profile can open over the
 * picker, and choosing somebody replaces both with the request sheet.
 */
export function OverlayProvider({ children }) {
  const [profileId, setProfileId] = useState(null)
  const [picker, setPicker] = useState(null)
  const [request, setRequest] = useState(null)

  const value = useMemo(
    () => ({
      openProfile: (id) => setProfileId(id),
      closeProfile: () => setProfileId(null),
      /**
       * person: a user summary; topic: what prompted the ask.
       * options.kind: knowledge | mentoring | coaching — which sheet to draw.
       */
      openRequest: (person, topic, options = {}) => {
        setProfileId(null)
        setPicker(null)
        setRequest({
          person,
          topic: topic || 'A first conversation',
          kind: options.kind ?? 'knowledge',
        })
      },
      closeRequest: () => setRequest(null),
      /** config: { kind, title, intent, filters, topic } — see PeoplePickerModal. */
      openPeople: (config) => setPicker(config),
      closePeople: () => setPicker(null),
    }),
    [],
  )

  return (
    <OverlayContext.Provider value={value}>
      {children}

      {picker && (
        <PeoplePickerModal
          {...picker}
          onClose={value.closePeople}
          onProfile={value.openProfile}
          onPick={(person, topic) => value.openRequest(person, topic, { kind: picker.kind })}
        />
      )}

      {profileId && (
        <ProfileModal
          userId={profileId}
          onClose={value.closeProfile}
          // Over the picker when it opened from there, rather than behind it.
          zIndex={picker ? 150 : 110}
        />
      )}

      {request && (
        <SessionRequestModal
          person={request.person}
          topic={request.topic}
          kind={request.kind}
          onClose={value.closeRequest}
        />
      )}
    </OverlayContext.Provider>
  )
}

export const useOverlays = () => useContext(OverlayContext)
