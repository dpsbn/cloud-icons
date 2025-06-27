import { useToast as useShadcnToast } from "@/components/ui/use-toast"

type ToastType = 'success' | 'error' | 'info' | 'warning'

/**
 * A standardized hook for showing toast notifications
 * This provides a consistent interface for all toast notifications in the app
 */
export function useToast() {
  const { toast } = useShadcnToast()

  const showToast = (
    message: string, 
    type: ToastType = 'info', 
    title?: string
  ) => {
    toast({
      title: title || type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === 'error' || type === 'warning' ? 'destructive' : 'default',
    })
  }

  return {
    showToast,
    toast, // Also expose the original toast function for more complex use cases
  }
}