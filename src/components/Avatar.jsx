import { avatarColor, initials } from '../lib/format'

/** The rounded-square initial tile used everywhere a person appears. */
export default function Avatar({ person, size = 66, radius = 19, className = '', style }) {
  const name = person?.name
  return (
    <span
      className={`grid flex-none place-items-center font-display font-extrabold ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.round(size * 0.36),
        background: avatarColor(name ?? person?.id),
        ...style,
      }}
    >
      {initials(name)}
    </span>
  )
}

/** Overlapping row of small circles, for "N joining". */
export function AvatarStack({ people = [], size = 34 }) {
  return (
    <div className="flex">
      {people.map((person, index) => (
        <span
          key={person?.id ?? index}
          className="grid place-items-center border-[2.5px] border-white font-bold"
          style={{
            width: size,
            height: size,
            borderRadius: 999,
            marginLeft: index === 0 ? 0 : -9,
            fontSize: size * 0.37,
            background: avatarColor(person?.name ?? index),
          }}
        >
          {initials(person?.name)}
        </span>
      ))}
    </div>
  )
}
