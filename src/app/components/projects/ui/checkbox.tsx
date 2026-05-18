import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-gray-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)/50] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--brand-accent)] data-[state=checked]:bg-[var(--brand-accent)] data-[state=checked]:text-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
