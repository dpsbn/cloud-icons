"use client"

import * as React from "react"
import { type ToastActionElement } from "./toast"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

const TOAST_LIMIT = 1

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback(({
    title,
    description,
    action,
    variant = "default",
  }: Omit<Toast, "id">) => {
    setToasts((currentToasts) => {
      const id = Math.random().toString()
      const newToast = { id, title, description, action, variant }

      // Remove oldest toast if we exceed the limit
      const nextToasts = [
        ...currentToasts,
        newToast,
      ].slice(-TOAST_LIMIT)

      return nextToasts
    })
  }, [])

  const dismiss = React.useCallback((toastId: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    )
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}