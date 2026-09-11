import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../theme/ThemeProvider'

/**
 * Demo sign-in: a name and one shared password. An unknown name creates a
 * profile on the spot, so anyone can sign in and land on their quest.
 */
export default function SignIn() {
  const { signIn } = useAuth()
  const { shuffle } = useTheme()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signIn(name.trim(), password)
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

        <button onClick={shuffle} title="Shuffle the colour of the day" className="flex cursor-pointer items-center gap-[10px] border-none bg-transparent p-0">
          <span className="block h-[26px] w-[26px] rounded-[9px] bg-inv" />
          <span className="font-display text-[19px] font-extrabold tracking-[-.02em] text-on-acc">
            Radix Connect
          </span>
        </button>

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
            Your name and the shared password. If we don't know you yet, we'll make you a profile.
          </p>

          <p className="rx-label">Your name</p>
          <input
            className="rx-input mb-4"
            placeholder="Anuj Maurya"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />

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
