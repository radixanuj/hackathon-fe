import { useSearchParams } from 'react-router-dom'
import EventsTab from './community/EventsTab'
import GroupsTab from './community/GroupsTab'
import LearnTab from './community/LearnTab'
import StoriesTab from './community/StoriesTab'

const TABS = [
  { key: 'groups', label: 'Groups', Panel: GroupsTab },
  { key: 'learn', label: 'Learn & Share', Panel: LearnTab },
  { key: 'events', label: 'Events', Panel: EventsTab },
  { key: 'stories', label: 'Stories', Panel: StoriesTab },
]

export default function Community() {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = TABS.find((tab) => tab.key === searchParams.get('tab')) ?? TABS[0]
  const { Panel } = active

  return (
    <section className="animate-rise pt-[52px]">
      <h1 className="rx-display m-0 mb-[26px] text-[clamp(36px,5vw,58px)]">Community</h1>

      <div className="flex flex-wrap gap-1.5 border-b border-line pb-0.5">
        {TABS.map((tab) => {
          const on = tab.key === active.key
          return (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key })}
              className="relative cursor-pointer rounded-t-xl border-none bg-transparent px-4 pt-3 pb-4 text-[17px] transition-colors hover:bg-cream"
            >
              <span className={on ? 'font-bold text-ink' : 'font-semibold text-faint'}>{tab.label}</span>
              {on && <span className="absolute right-4 -bottom-0.5 left-4 h-[3px] animate-bump rounded-[3px] bg-acc" />}
            </button>
          )
        })}
      </div>

      <Panel />
    </section>
  )
}
