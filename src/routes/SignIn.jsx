import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchDirectory } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import Avatar from '../components/Avatar'
import Logo from '../components/Logo'
import Texture from '../components/Texture'
import { personMeta } from '../lib/format'

/**
 * Demo sign-in: pick yourself out of the roster, no password prompt.
 *
 * Typing searches real colleagues and you choose one, so we sign in the person
 * you meant rather than whoever happened to match the string — Sahar Khan and
 * Saif Khan are one keystroke apart. Picking somebody sends their id. A name
 * nobody on the roster answers to still works, and makes a profile on the spot.
 *
 * The API still needs a password, so the shared demo one goes on the wire for
 * everyone. It comes from VITE_SHARED_PASSWORD when set, and falls back to the
 * seeded default so the app works out of the box.
 */
const SHARED_PASSWORD = import.meta.env.VITE_SHARED_PASSWORD || 'Radix123'

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [chosen, setChosen] = useState(null)
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const box = useRef(null)

  // Debounced, so a fast typist makes one request rather than one per letter.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(name.trim()), 180)
    return () => clearTimeout(timer)
  }, [name])

  const { data: people = [] } = useQuery({
    queryKey: ['directory', term],
    queryFn: () => searchDirectory(term),
    // Nothing to search on an empty box, and no point re-asking once chosen.
    enabled: open && term.length > 0 && !chosen,
    staleTime: 60_000,
  })

  // Close the list on an outside click, as the notification bell does.
  useEffect(() => {
    const onDown = (event) => {
      if (!box.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Clamped at render rather than reset in an effect: the results list changes
  // under the cursor as you type, and the highlight has to stay inside it.
  const active = Math.min(highlight, Math.max(0, people.length - 1))

  const choose = (person) => {
    setChosen(person)
    setName(person.name)
    setOpen(false)
    setError(null)
  }

  const retype = (value) => {
    setName(value)
    // Editing the name after choosing means they are no longer that person.
    setChosen(null)
    setOpen(true)
  }

  const onKeyDown = (event) => {
    if (!open || people.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((i) => (i + 1) % people.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((i) => (i - 1 + people.length) % people.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(people[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signIn(chosen ? { user_id: chosen.id } : { name: name.trim() }, SHARED_PASSWORD)
      navigate('/', { replace: true })
    } catch (caught) {
      setError(caught.fieldError?.('name') ?? caught.fieldError?.('password') ?? caught.message)
    } finally {
      setPending(false)
    }
  }

  const SIGN_IN_CHIPS = [
    'Ask someone for 30 minutes.',
    'Find the F1 crowd.',
    'Plan a trek.',
    'Start a book club.',
    'Meet someone you never would have.',
  ]

  return (
    <div
      className="grid min-h-screen bg-white [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]"
      style={{ animation: 'fade .4s both' }}
    >
      <Texture />

      {/* Left: the pitch. */}
      <div className="relative hidden overflow-hidden bg-acc p-[clamp(34px,5vw,68px)] text-on-acc md:flex md:flex-col md:justify-between md:gap-10">
        <div className="absolute top-[-90px] right-[-120px] h-[380px] w-[380px] rounded-full border-2 border-current opacity-[.26]" style={{ animation: 'floatC 17s ease-in-out infinite' }} />
        <div className="absolute bottom-[-120px] left-[-90px] h-[300px] w-[300px] rounded-full bg-white/[.12]" style={{ animation: 'floatB 14s ease-in-out infinite' }} />

        {/* Ink-on-accent would swallow half the mark, so it goes flat here. */}
        <Logo size={25} tone="mono" className="relative self-start text-on-acc" />

        <div className="relative max-w-[560px]">
          <p className="m-0 mb-4 text-[15px] font-bold tracking-[.16em] uppercase opacity-[.82]">
            In Real Life · Into Radix Life
          </p>
          <h1 className="rx-display m-0 text-[clamp(36px,5vw,64px)] leading-[1.02] tracking-[-.038em] text-pretty">
            <span className="block opacity-[.72]">
              Geography may shape <span className="italic">where</span> we sit.
            </span>
            <span className="block mt-[.12em]">
              It shouldn’t separate{' '}
              <span className="relative inline-block">
                <span
                  className="absolute right-[-.04em] left-[-.04em] bottom-[.05em] h-[.2em] origin-left bg-inv opacity-[.28]"
                  style={{ animation: 'drawUl 1s .35s cubic-bezier(.2,.9,.3,1) both' }}
                />
                <span className="relative">who we become</span>
              </span>{' '}
              together.
            </span>
          </h1>
        </div>

        <div className="relative flex max-w-[620px] flex-wrap gap-[11px]">
          {SIGN_IN_CHIPS.map((label) => (
            <span
              key={label}
              className="animate-pop rounded-full border-[1.5px] border-current px-5 py-3 text-[17px] font-semibold leading-[1.15] whitespace-nowrap"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Right: the form. */}
      <div className="flex items-center justify-center bg-white p-[clamp(34px,5vw,68px)]">
        <form onSubmit={onSubmit} className="relative z-[1] w-full max-w-[420px]" style={{ animation: 'rise .6s .1s both' }}>
          <h2 className="rx-display m-0 text-[clamp(30px,3.6vw,42px)] leading-[1.02]">Come in.</h2>
          <p className="m-0 mt-3 mb-[30px] text-[18.5px] leading-[1.5] text-muted">
            Pick your name and you're in. No passwords here.
          </p>

          <div ref={box} className="relative mb-4">
            <input
              className="rx-input min-h-[58px] rounded-[16px] px-[18px] py-[17px] text-[17px]"
              placeholder="Start typing your name…"
              // The canvas dropped the visible "Who are you?" label; a combobox
              // still needs a name, so it moves to the accessible layer.
              aria-label="Your name"
              value={name}
              onChange={(event) => retype(event.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={open && people.length > 0}
              aria-controls="directory-list"
              aria-autocomplete="list"
              autoComplete="off"
              autoFocus
              required
            />

            {chosen && (
              <span className="mt-2 flex items-center gap-2 text-[14.5px] font-semibold text-acc-ink">
                <Avatar person={chosen} size={22} radius={7} />
                Signing in as {chosen.name}
                {personMeta(chosen) && <span className="text-faint">· {personMeta(chosen)}</span>}
              </span>
            )}

            {open && !chosen && people.length > 0 && (
              <ul
                id="directory-list"
                role="listbox"
                className="absolute top-full right-0 left-0 z-20 mt-1.5 max-h-[280px] animate-bump list-none overflow-auto rounded-[18px] border border-edge bg-white p-1.5 shadow-[0_22px_50px_rgb(20_18_15/0.18)]"
              >
                {people.map((person, index) => (
                  <li key={person.id} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => choose(person)}
                      className={`flex min-h-[54px] w-full cursor-pointer items-center gap-[13px] rounded-xl border-none px-3 py-[11px] text-left transition-colors ${
                        index === active ? 'bg-cream' : 'bg-transparent'
                      }`}
                    >
                      <Avatar person={person} size={40} radius={12} />
                      <span className="min-w-0">
                        <span className="block truncate text-[16.5px] font-bold text-ink">
                          {person.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[14.5px] text-muted">
                          {person.job_title || personMeta(person) || 'At Radix'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="m-0 mt-4 text-[15px] font-semibold text-[#B90F33]">{error}</p>}

          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="rx-btn rx-btn-acc mt-3.5 w-full rounded-[16px] py-[18px] text-[17px] hover:[transform:scale(1.02)]"
            style={{ minHeight: 58 }}
          >
            {pending
              ? 'Signing in…'
              : chosen
                ? `Enter as ${chosen.name.split(' ')[0]}`
                : 'Enter IRL'}
          </button>

          <p className="m-0 mt-7 font-display text-[18px] font-extrabold tracking-[-.015em] text-ink">
            Built by Radicals, for Radicals
          </p>
        </form>
      </div>
    </div>
  )
}
