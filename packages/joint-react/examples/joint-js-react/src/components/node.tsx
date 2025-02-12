import { PropsWithChildren } from 'react'
import { compose } from '../compose'

interface Props extends PropsWithChildren {
  className?: string
}

export function Node({ children, className }: Props) {
  return (
    <section
      className={compose(
        // Use one of your custom colors here:
        'bg-primary text-primaryText py-6 px-4 inline-flex flex-col items-center justify-center',

        // The polygon clip path for the “ticket” corners:
        '[clip-path:polygon(0_10%,10%_0,90%_0,100%_10%,100%_90%,90%_100%,10%_100%,0_90%)]',

        // If you want a different color, just swap 'bg-primary' for 'bg-secondary', etc.
        className
      )}
    >
      {children}
    </section>
  )
}
