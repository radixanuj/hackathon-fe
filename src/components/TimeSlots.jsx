export default function TimeSlots({ slots, value, onChange, size = 'md' }) {
  const large = size === 'md'
  const shape = large ? 'min-h-[50px] px-5 text-base' : 'min-h-[40px] px-3 text-[14px]'
  return (
    <div className="flex flex-wrap gap-[9px]">
      {slots.map((slot) => (
        <button
          key={slot.value}
          onClick={() => onChange(slot.value)}
          className={`rx-btn rounded-[14px] ${shape} ${
            value === slot.value ? 'rx-btn-acc' : 'rx-btn-ghost font-semibold'
          }`}
        >
          {slot.label}
        </button>
      ))}
    </div>
  )
}
