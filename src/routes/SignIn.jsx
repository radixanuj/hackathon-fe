import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchDirectory } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import Avatar from '../components/Avatar'
import { personMeta } from '../lib/format'

/**
 * Demo sign-in: pick yourself out of the roster, then the shared password.
 *
 * Typing searches real colleagues and you choose one, so we sign in the person
 * you meant rather than whoever happened to match the string — Sahar Khan and
 * Saif Khan are one keystroke apart. Picking somebody sends their id. A name
 * nobody on the roster answers to still works, and makes a profile on the spot.
 */
export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [chosen, setChosen] = useState(null)
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [password, setPassword] = useState('')
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
      await signIn(chosen ? { user_id: chosen.id } : { name: name.trim() }, password)
      navigate('/', { replace: true })
    } catch (caught) {
      setError(caught.fieldError?.('name') ?? caught.fieldError?.('password') ?? caught.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid min-h-screen [grid-template-columns:repeat(auto-fit,minmax(360px,1fr))]">
      {/* Left: the pitch, with the same drifting faces as Home. */}
      <div className="relative hidden overflow-hidden bg-acc p-[clamp(32px,5vw,64px)] text-on-acc md:block">
        <div className="absolute top-[-80px] right-[-80px] h-[320px] w-[320px] rounded-full border-2 border-current opacity-30" style={{ animation: 'floatC 14s ease-in-out infinite' }} />
        <div className="absolute right-[90px] bottom-[-120px] h-[240px] w-[240px] rounded-full bg-white/[.14]" />

        <div className="flex items-center gap-[10px]">
          <span className="block h-[26px] w-[26px] rounded-[9px] bg-inv" />
          <span className="font-display text-[19px] font-extrabold tracking-[-.02em] text-on-acc">
            Radix Connect
          </span>
        </div>

        <div className="relative mt-[18vh] max-w-[520px]">
          <h1 className="rx-display m-0 text-[clamp(36px,4.6vw,58px)] leading-[.99]">
            Ninety-eight people.
            <br />
            You've properly met
            <br />
            about eleven.
          </h1>
          <p className="m-0 mt-5 text-[19px] leading-[1.45] opacity-[.88]">
            Radix Connect is for the other eighty-seven — the ones you'd never be put in a meeting with.
          </p>
        </div>

        <div className="relative mt-16 flex gap-4">
          {['AS', 'MR', 'DV', 'MT'].map((face, index) => (
            <span
              key={face}
              className="grid h-[112px] w-[94px] place-items-center rounded-[20px] font-display text-[26px] font-extrabold text-ink shadow-[0_16px_36px_rgb(20_18_15/0.14)]"
              style={{
                background: ['#EFE6D8', '#E3E7DF', '#E7E4EE', '#F3DFD8'][index],
                animation: `${index % 2 ? 'floatB' : 'floatA'} ${8 + index}s ease-in-out infinite`,
              }}
            >
              {face}
            </span>
          ))}
        </div>
      </div>

      {/* Right: the form. */}
      <div className="flex items-center justify-center bg-white p-[clamp(24px,5vw,64px)]">
        <form onSubmit={onSubmit} className="w-full max-w-[420px]">
          <p className="m-0 mb-3 text-[13.5px] font-bold tracking-[.14em] text-acc-ink uppercase">
            Sign in
          </p>
          <h2 className="rx-display m-0 text-[clamp(32px,4vw,44px)]">Who are you?</h2>
          <p className="m-0 mt-3 mb-8 text-[17px] leading-[1.5] text-muted">
            Start typing and pick yourself out of the list, then the shared password. If we don't
            know you yet, we'll make you a profile.
          </p>

          <p className="rx-label">Your name</p>
          <div ref={box} className="relative mb-4">
            <input
              className="rx-input"
              placeholder="Type your name…"
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
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-[13px] border-none px-2.5 py-2 text-left transition-colors ${
                        index === active ? 'bg-tint' : 'bg-transparent'
                      }`}
                    >
                      <Avatar person={person} size={38} radius={12} />
                      <span className="min-w-0">
                        <span className="block truncate text-[15.5px] font-bold text-ink">
                          {person.name}
                        </span>
                        <span className="block truncate text-[13.5px] text-muted">
                          {person.job_title || personMeta(person) || 'At Radix'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="rx-label">Shared password</p>
          <input
            className="rx-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="m-0 mt-4 text-[15px] font-semibold text-[#B90F33]">{error}</p>}

          <button
            type="submit"
            disabled={pending || !name.trim() || !password}
            className="rx-btn rx-btn-acc mt-7 w-full rounded-ctl py-[17px] text-[17px]"
            style={{ minHeight: 54 }}
          >
            {pending ? 'Signing in…' : 'Let me in'}
          </button>
        </form>
      </div>
    </div>
  )
}
