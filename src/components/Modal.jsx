import { useEffect } from 'react'

/** Backdrop + sheet, closing on Escape, backdrop click and the ✕. */
export default function Modal({ onClose, maxWidth = 760, children, zIndex = 110, showClose = true }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    // Stop the page behind from scrolling under the sheet.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div className="rx-backdrop" style={{ zIndex }} onClick={onClose} role="presentation">
      <div
        className="rx-sheet"
        style={{ maxWidth }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {showClose && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-[42px] w-[42px] cursor-pointer rounded-full border-[1.5px] border-edge bg-white text-[17px] transition-colors hover:border-ink"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
