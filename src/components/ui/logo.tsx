
import * as React from "react"
import { cn } from "@/lib/utils"

export const FundedStockLogo = React.forwardRef<
    SVGSVGElement,
    React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
    <svg
        ref={ref}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-6 w-6", className)}
        {...props}
    >
        <path
            fill="currentColor"
            d="M8.5,0A8.5,8.5,0,0,0,0,8.5V91.5A8.5,8.5,0,0,0,8.5,100H50L91.5,58.5V8.5A8.5,8.5,0,0,0,83,0Z"
        />
        <path
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M25,65 L40,50 L60,70 L75,55"
            fill="none"
        />
    </svg>
));
FundedStockLogo.displayName = "FundedStockLogo";
