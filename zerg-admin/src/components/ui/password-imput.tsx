"use client"

import * as React from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "cn"

export const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)

        return (
            <div className="relative">

                <Lock className="absolute left-2 top-1.5 h-4 w-4 text-white pointer-events-none" />

                <Input
                    type={showPassword ? "text" : "password"}

                    className={cn("pl-8 pr-8", className)}
                    ref={ref}
                    {...props}
                />

                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4 text-white" />
                    ) : (
                        <Eye className="h-4 w-4 text-white" />
                    )}
                </button>
            </div>
        )
    }
)
PasswordInput.displayName = "PasswordInput"