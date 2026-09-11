import { useSearchParams } from 'react-router-dom'
import AskTeachTab from './community/AskTeachTab'
import ChallengesTab from './community/ChallengesTab'
import EventsTab from './community/EventsTab'
import GroupsTab from './community/GroupsTab'
import LearnTab from './community/LearnTab'
import StoriesTab from './community/StoriesTab'

// Four of the six pillars live behind these tabs, so the page header belongs to
// whichever one is open rather than to "Community" as a whole.
const CROWD = {
  pillar: 'Find Your Crowd',
  blurb:
    'Somewhere at Radix, someone else is almost certainly obsessed with the same thing you are. ' +
    'Find your people around F1, cricket, books, running, movies, AI — or start a crowd of your own.',
}
const SHARING = {
  pillar: 'Worth Sharing',
  blurb:
    'Found an app, tool, hack, podcast, book or idea that more people should know about? Drop it ' +
    'here. Explore what others are recommending, or share an experience and let people ask you anything.',
}
const PLANS = {
  pillar: 'Make Plans',
  blurb:
    `Turn "we should do this sometime" into "who's in?" Plan a trek, dinner, movie, museum ` +
    'visit, Sunday run, game night or workshop — and let people join.',
}
const QUESTS = {
  pillar: 'Side Quests',
  blurb:
    `Your colleagues do some pretty remarkable things when they're not in meetings. Discover the ` +
    'marathons, treks, travels, new skills, strange hobbies and unexpected stories behind the ' +
    'people you work with.',
}

const TABS = [
  { key: 'groups', label: 'Groups', ...CROWD, Panel: GroupsTab },
  { key: 'challenges', label: 'Challenges', ...CROWD, Panel: ChallengesTab },
  { key: 'learn', label: 'Learn & Share', ...SHARING, Panel: LearnTab },
  { key: 'ask-teach', label: 'Ask & Teach', ...SHARING, Panel: AskTeachTab },
  { key: 'events', label: 'Events', ...PLANS, Panel: EventsTab },
  { key: 'stories', label: 'Stories', ...QUESTS, Panel: StoriesTab },
]

export default function Community() {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = TABS.find((tab) => tab.key === searchParams.get('tab')) ?? TABS[0]
  const { Panel } = active

  return (
    <section className="animate-rise pt-[52px]">
      <h1 className="rx-display m-0 text-[clamp(36px,5vw,58px)]">{active.pillar}</h1>
      <p className="m-0 mt-4 mb-[26px] max-w-[640px] text-[18.5px] leading-[1.5] text-muted text-pretty">
        {active.blurb}
      </p>

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
