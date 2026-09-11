import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Logo from './Logo'
import NotificationBell from './NotificationBell'
import Texture from './Texture'

// Five tabs, as the canvas ships them. Home has no tab of its own — the logo
// is the way back, which is why it carries the home label.
const NAV = [
  { to: '/people', label: "Who's Who" },
  { to: '/connect', label: 'Pick a Brain' },
  { to: '/community', label: 'Find Your Crowd' },
  { to: '/about', label: "What's IRL" },
  { to: '/me', label: 'Me' },
]

export default function AppShell({ children }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Texture />

      <header className="sticky top-0 z-[60] border-b border-line bg-white/[.88] backdrop-blur-[16px]">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-4 px-[22px] py-[13px]">
          <button
            onClick={() => navigate('/')}
            className="flex flex-none cursor-pointer items-center border-none bg-transparent p-0 text-ink"
            aria-label="IRL — home"
          >
            <Logo size={25} />
          </button>

          {/* The sign-in line, carried into the shell so the mark keeps its
              promise on every page. A rule down its left edge rather than a
              separate bar, so it reads as a continuation of the logo. */}
          <span className="flex-none border-l border-edge-soft pl-[14px] text-[14px] font-bold tracking-[-.01em] whitespace-nowrap text-muted">
            Built by Radicals, for Radicals
          </span>

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

          {/* A 40px circle to sit beside the bell, as the canvas pairs them. */}
          <button
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="grid h-10 w-10 flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-edge bg-white text-[17px] leading-none hover:-translate-y-0.5 hover:border-ink"
            style={{ transition: 'border-color .2s, translate .2s' }}
          >
            ⏻
          </button>
        </div>
      </header>

      {/* Sits above the fixed texture, as the canvas stacks them. */}
      <main className="relative z-[1] mx-auto max-w-[1220px] px-[22px] pb-[140px]">{children}</main>
    </div>
  )
}
