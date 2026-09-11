import { useSearchParams } from 'react-router-dom'
import BuddyPanel from './connect/BuddyPanel'
import CoffeePanel from './connect/CoffeePanel'
import MeetupPanel from './connect/MeetupPanel'
import MentoringPanel from './connect/MentoringPanel'
import OfficeHoursPanel from './connect/OfficeHoursPanel'

const TABS = [
  { key: 'meetup', label: 'Blind Meetup', Panel: MeetupPanel },
  { key: 'buddy', label: 'Buddy', Panel: BuddyPanel },
  { key: 'office-hours', label: 'Office Hours', Panel: OfficeHoursPanel },
  { key: 'coffee', label: 'Coffee & Lunch', Panel: CoffeePanel },
  { key: 'mentoring', label: 'Mentoring', Panel: MentoringPanel },
]

export default function Connect() {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = TABS.find((tab) => tab.key === searchParams.get('tab')) ?? TABS[0]
  const { Panel } = active

  return (
    <section className="animate-rise pt-[52px]">
      <h1 className="rx-display m-0 text-[clamp(36px,5vw,58px)]">Pick a Brain</h1>
      <p className="m-0 mt-4 mb-[26px] max-w-[640px] text-[18.5px] leading-[1.5] text-muted text-pretty">
        Thirty minutes. One interesting person. Who knows where it could lead? Get matched with
        someone new or ask a colleague for mentoring, coaching, advice or a quick knowledge session.
      </p>

      <div className="mb-8 flex flex-wrap gap-1.5 border-b border-line pb-0.5">
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
