import { useMemo, useState } from 'react'
import { buildDays, buildTimes } from '../lib/slots'

/**
 * Day first, then a time on that day.
 *
 * The API takes a single `proposed_at`, so this hands back one ISO string —
 * the two rows are only a way of getting to it without a date picker.
 */
export default function SlotPicker({ value, onChange, days = 6 }) {
  const dayList = useMemo(() => buildDays(days), [days])

  // Which day the times below belong to. It follows `value` when the sheet
  // opens with one already chosen, and is otherwise the first working day.
  const [dayKey, setDayKey] = useState(() => {
    const chosen = value ? new Date(value) : null
    const match = chosen && dayList.find((day) => sameDay(day.date, chosen))
    return (match ?? dayList[0]).key
  })

  const day = dayList.find((item) => item.key === dayKey) ?? dayList[0]
  const times = useMemo(() => buildTimes(day), [day])

  function pickDay(next) {
    setDayKey(next.key)
    // Keep the hour the person already settled on, on the new day.
    const chosen = value ? new Date(value) : null
    const sameHour = chosen
      ? buildTimes(next).find((time) => new Date(time.value).getHours() === chosen.getHours())
      : null
    onChange((sameHour ?? buildTimes(next)[0]).value)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {dayList.map((item) => {
          const on = item.key === day.key
          return (
            <button
              key={item.key}
              onClick={() => pickDay(item)}
              className={`min-h-[58px] cursor-pointer rounded-[14px] border-[1.5px] px-[15px] py-2 text-center transition-transform duration-200 ease-[cubic-bezier(.2,1.4,.3,1)] ${
                on
                  ? 'border-ink bg-ink text-white'
                  : 'border-edge-soft bg-white text-ink hover:-translate-y-0.5 hover:border-ink'
              }`}
            >
              <span className="block text-[14.5px] font-bold">{item.label}</span>
              <span className={`block text-[13px] ${on ? 'opacity-75' : 'text-muted'}`}>{item.sub}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-[10px] flex flex-wrap gap-2">
        {times.map((time) => (
          <button
            key={time.value}
            onClick={() => onChange(time.value)}
            disabled={time.past}
            className={`rx-btn min-h-[44px] rounded-[13px] px-[15px] text-[15px] ${
              value === time.value ? 'rx-btn-acc' : 'rx-btn-ghost font-semibold'
            }`}
          >
            {time.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const sameDay = (a, b) => a.toDateString() === b.toDateString()
