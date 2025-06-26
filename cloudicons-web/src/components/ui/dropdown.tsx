"use client"

import { createContext, useContext, useState } from "react"
import { createPortal } from "react-dom"

// Create context for dropdown state
const DropdownContext = createContext<{
  isOpen: boolean
  toggle: () => void
  close: () => void
}>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

interface DropdownProps {
  children: React.ReactNode
}

export function Dropdown({ children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const toggle = () => setIsOpen(prev => !prev)
  const close = () => setIsOpen(false)
  
  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownTriggerProps {
  children: React.ReactNode
}

export function DropdownTrigger({ children }: DropdownTriggerProps) {
  const { toggle } = useContext(DropdownContext)
  
  return (
    <div onClick={toggle} className="cursor-pointer">
      {children}
    </div>
  )
}

interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const { isOpen, close } = useContext(DropdownContext)
  
  if (!isOpen) return null
  
  // Use portal to render the menu at the root level
  return createPortal(
    <div 
      className="fixed inset-0 z-50" 
      onClick={close}
    >
      <div 
        className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="py-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

interface DropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
}

export function DropdownItem({ children, onClick }: DropdownItemProps) {
  const { close } = useContext(DropdownContext)
  
  const handleClick = () => {
    if (onClick) onClick()
    close()
  }
  
  return (
    <div
      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
      onClick={handleClick}
    >
      {children}
    </div>
  )
}