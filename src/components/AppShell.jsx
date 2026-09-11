import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeProvider'
import Logo from './Logo'
import NotificationBell from './NotificationBell'

const NAV = [
  { to: '/people', label: "Who's Who" },
  { to: '/connect', label: 'Pick a Brain' },
  { to: '/community', label: 'Find Your Crowd' },
  { to: '/me', label: 'Me' },
  { to: '/about', label: "What's IRL" },
]

export default function AppShell({ children }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { shuffle } = useTheme()

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <header className="sticky top-0 z-[60] border-b border-line bg-white/[.88] backdrop-blur-[16px]">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-4 px-[22px] py-[13px]">
          <button
            onClick={() => navigate('/')}
            className="flex cursor-pointer items-center border-none bg-transparent p-0 text-ink"
            aria-label="IRL — home"
          >
            <Logo size={25} />
          </button>

          <nav className="ml-auto flex flex-wrap gap-[2px]">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="relative">
                {({ isActive }) => (
                  <span className="relative block cursor-pointer rounded-xl px-[15px] pt-[10px] pb-[13px] text-[15.5px] transition-colors hover:bg-sand">
                    <span className={isActive ? 'font-bold text-acc-ink' : 'font-semibold text-muted'}>
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="absolute right-[15px] bottom-[5px] left-[15px] h-[3px] animate-bump rounded-[3px] bg-acc" />
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <NotificationBell />

          <button
            onClick={shuffle}
            title="Shuffle the colour of the day"
            className="grid h-10 w-10 flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-edge bg-white transition-transform duration-[400ms] ease-[cubic-bezier(.2,1.3,.3,1)] hover:rotate-[120deg] hover:scale-[1.06] hover:border-acc-soft"
          >
            <span className="block h-[15px] w-[15px] rounded-full bg-acc" />
          </button>

          <button
            onClick={signOut}
            className="cursor-pointer border-none bg-transparent text-[14.5px] font-semibold text-faint transition-colors hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1220px] px-[22px] pb-[140px]">{children}</main>
    </div>
  )
}
