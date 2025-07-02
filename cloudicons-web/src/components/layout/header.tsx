import Image from "next/image"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  return (
    <header className='container mx-auto px-4 py-6'>
      <div className='flex justify-between items-center'>
        {/* Logo */}
        <div className='flex items-center'>
          <Image
            src='/logo.svg'
            alt='Cloud Icons'
            width={254}
            height={15}
            priority
            className="invert dark:invert-0"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  )
}
