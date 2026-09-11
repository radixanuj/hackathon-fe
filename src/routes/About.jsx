import { useNavigate } from 'react-router-dom'

export default function About() {
  const navigate = useNavigate()

  return (
    <section className="animate-rise pt-14">
      <div className="relative max-w-[780px]">
        <div
          className="absolute top-[-26px] left-[-120px] z-0 h-60 w-60 rounded-full bg-tint"
          style={{ animation: 'floatC 13s ease-in-out infinite' }}
        />
        <div className="relative z-[1]">
          <p className="m-0 mb-[14px] text-[15px] font-semibold tracking-[.12em] text-acc-ink uppercase">
            What's IRL
          </p>
          <h1 className="rx-display m-0 text-[clamp(38px,5.4vw,60px)] leading-none text-pretty">
            Radix has ridiculously interesting people.
          </h1>
        </div>
      </div>

      <div className="relative z-[1] mt-11 grid items-start gap-10 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <div className="flex max-w-[620px] flex-col gap-[22px]">
          <p className="m-0 text-[20px] leading-[1.55] text-ink text-pretty">
            Big thinkers. Sharp leaders. Deep experts. Sports fanatics. Weekend hikers. Art lovers.
            Book hoarders. People who know things you want to know, and care about things you never
            knew they cared about too.
          </p>
          <p className="rx-title m-0 text-[27px] font-bold tracking-[-.02em] leading-[1.2]">
            There's just one problem.
          </p>
          <p className="m-0 text-[18.5px] leading-[1.6] text-muted text-pretty">
            Too many of us are still names on project plans. Faces in Zoom boxes. People somewhere
            on the other side of a time zone.
          </p>
          <p className="rx-title m-0 text-[27px] font-bold tracking-[-.02em] text-acc-ink">
            Not anymore.
          </p>
        </div>

        <div className="rounded-card bg-acc p-[30px_34px] text-on-acc shadow-[0_18px_44px_rgb(20_18_15/0.14)]">
          <p className="rx-display m-0 text-[34px] font-extrabold leading-[1.12]">
            Meet IRL.
            <br />
            In Real Life.
            <br />
            Into Radix Life.
          </p>
        </div>
      </div>

      <div className="mt-11 grid gap-[22px] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <article className="rounded-[22px] bg-sand p-7">
          <p className="m-0 text-[18.5px] leading-[1.6] text-pretty">
            Ask Neha for 30 minutes of mentoring. Get Parag to explain that data science model
            without making your brain hurt. Set up a quick coaching session with Suman. Get a book
            recommendation from Sandy, or the inside story from Anu on how abuse mitigation actually
            works.
          </p>
          <p className="m-0 mt-[18px] text-base font-bold text-acc-ink">And that's just the start.</p>
        </article>
        <article className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-edge-soft bg-white p-7">
          <p className="m-0 text-[18.5px] leading-[1.6] text-pretty">
            Ask the question you were afraid was too dumb. Pull together a task force and crack a
            problem nobody has solved yet.
          </p>
          <p className="m-0 text-[18.5px] leading-[1.6] text-muted text-pretty">
            Find the F1 crowd. Plan a trek. Recommend a movie. Send out an impromptu "Anyone up for
            a drink after work?"
          </p>
        </article>
      </div>

      <div className="mt-11 flex max-w-[780px] flex-col gap-[22px] border-t border-line pt-9">
        <p className="m-0 text-[20px] leading-[1.55] text-pretty">
          IRL takes what Radix already has — smart, curious, wonderfully different people — and
          makes it available to everyone. It's real connection, made possible digitally. Built by
          us, for us — beyond roles, meetings, and geos.
        </p>
        <p className="rx-title m-0 text-[29px] font-bold leading-[1.25] tracking-[-.025em] text-pretty">
          Because when people know each other, they learn more. Create more. Care more.
        </p>
        <p className="m-0 text-[18.5px] leading-[1.6] text-muted text-pretty">
          And teams that care about each other can achieve extraordinary things.
        </p>
        <p className="m-0 text-[18.5px] leading-[1.6] text-muted text-pretty">
          People will come and go. The knowledge, relationships, and culture we create can outlast
          us all.
        </p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          <button onClick={() => navigate('/people')} className="rx-btn rx-btn-acc rx-btn-lg">
            Explore Radix
          </button>
          <button onClick={() => navigate('/')} className="rx-btn rx-btn-ghost rx-btn-lg">
            Back home
          </button>
        </div>
      </div>
    </section>
  )
}
