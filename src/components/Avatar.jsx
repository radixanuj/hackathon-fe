import { avatarColor, initials, personPhoto } from '../lib/format'

/** The rounded-square tile used everywhere a person appears — photo when we
 * have one, initials otherwise. */
export default function Avatar({ person, size = 66, radius = 19, className = '', style }) {
  const name = person?.name
  const photo = personPhoto(person)
  const shared = {
    width: size,
    height: size,
    borderRadius: radius,
    ...style,
  }

  if (photo) {
    return (
      <img
        src={photo}
        alt={name ?? ''}
        className={`block flex-none object-cover ${className}`}
        style={shared}
      />
    )
  }

  return (
    <span
      className={`grid flex-none place-items-center font-display font-extrabold ${className}`}
      style={{
        ...shared,
        fontSize: Math.round(size * 0.36),
        background: avatarColor(name ?? person?.id),
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
      {people.map((person, index) => {
        const photo = personPhoto(person)
        const shared = {
          width: size,
          height: size,
          borderRadius: 999,
          marginLeft: index === 0 ? 0 : -9,
        }
        if (photo) {
          return (
            <img
              key={person?.id ?? index}
              src={photo}
              alt={person?.name ?? ''}
              className="block border-[2.5px] border-white object-cover"
              style={shared}
            />
          )
        }
        return (
          <span
            key={person?.id ?? index}
            className="grid place-items-center border-[2.5px] border-white font-bold"
            style={{
              ...shared,
              fontSize: size * 0.37,
              background: avatarColor(person?.name ?? index),
            }}
          >
            {initials(person?.name)}
          </span>
        )
      })}
    </div>
  )
}
