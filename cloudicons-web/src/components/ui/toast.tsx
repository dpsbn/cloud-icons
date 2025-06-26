"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const bgColor = type === "success" 
    ? "bg-green-500" 
    : type === "error" 
      ? "bg-red-500" 
      : "bg-blue-500"
  
  return createPortal(
    <div 
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-up`}
      role="alert"
    >
      {message}
    </div>,
    document.body
  )
}

// Toast manager to handle multiple toasts
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([])
  
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }
  
  // Component to render all active toasts
  const ToastContainer = () => {
    if (typeof window === "undefined") return null
    
    return createPortal(
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`${
              toast.type === "success" 
                ? "bg-green-500" 
                : toast.type === "error" 
                  ? "bg-red-500" 
                  : "bg-blue-500"
            } text-white px-4 py-2 rounded-md shadow-lg animate-fade-in-up`}
            role="alert"
          >
            {toast.message}
          </div>
        ))}
      </div>,
      document.body
    )
  }
  
  return { showToast, ToastContainer }
}