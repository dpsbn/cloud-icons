"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      // Check localStorage first
      const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null

      if (storedTheme) {
        setTheme(storedTheme)
      } else {
        // Check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(prefersDark ? "dark" : "light")
      }
    }
  }, [])

  // Apply theme changes to document
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement

      // Remove both classes first
      root.classList.remove("light", "dark")

      // Add the current theme class
      root.classList.add(theme)

      // Store in localStorage
      localStorage.setItem("theme", theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" data-testid="moon-icon" />
      ) : (
        <Sun className="h-5 w-5" data-testid="sun-icon" />
      )}
    </Button>
  )
}
