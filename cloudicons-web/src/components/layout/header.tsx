import Image from "next/image"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  return (
    <header className='container mx-auto px-4 py-6'>
      <div className='flex justify-between items-center'>
        {/* Logo */}
        <div className='flex items-center space-x-2'>
          <Image src='/logo.png' alt='Cloud Icons' width={50} height={50} />
          <h1 className='text-2xl font-bold text-blue-600 dark:text-blue-400'>Cloud Icons</h1>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  )
}
