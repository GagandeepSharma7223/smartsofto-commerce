import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Empty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex min-h-52 flex-col items-center justify-center gap-5 rounded-[var(--radius-lg)] border border-dashed border-border bg-card/70 p-8 text-center", className)} {...props} />
))
Empty.displayName = "Empty"

const EmptyHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("flex max-w-md flex-col items-center gap-2", className)} {...props} />)
const emptyMediaVariants = cva("flex items-center justify-center", { variants: { variant: { default: "", icon: "h-12 w-12 rounded-full bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5" } }, defaultVariants: { variant: "default" } })
const EmptyMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof emptyMediaVariants>>(({ className, variant, ...props }, ref) => <div ref={ref} className={cn(emptyMediaVariants({ variant }), className)} {...props} />)
const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-xl font-semibold", className)} {...props} />)
const EmptyDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />)
const EmptyContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-wrap items-center justify-center gap-3", className)} {...props} />)

EmptyHeader.displayName = "EmptyHeader"
EmptyMedia.displayName = "EmptyMedia"
EmptyTitle.displayName = "EmptyTitle"
EmptyDescription.displayName = "EmptyDescription"
EmptyContent.displayName = "EmptyContent"

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent }
