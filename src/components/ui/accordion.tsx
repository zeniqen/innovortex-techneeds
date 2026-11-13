"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { IconChevronDown } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

type HeadingLevel = "h2" | "h3" | "h4";

/**
 * The heading level each question is rendered at. Radix renders an h3,
 * which is right under a section's h2, but skips a level on a page whose
 * own title is the h1 sitting directly above the questions. Such a page
 * wraps its content in <AccordionHeadingLevel level="h2">.
 */
const HeadingLevelContext = React.createContext<HeadingLevel>("h3");

function AccordionHeadingLevel({
  level,
  children,
}: {
  level: HeadingLevel;
  children: React.ReactNode;
}) {
  return (
    <HeadingLevelContext.Provider value={level}>
      {children}
    </HeadingLevelContext.Provider>
  );
}

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const level = React.useContext(HeadingLevelContext);
  // The heading element is chosen by tag name; createElement keeps that
  // plain (it is a string, not a component made during render).
  return (
    <AccordionPrimitive.Header asChild>
      {React.createElement(
        level,
        { className: "flex" },
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex flex-1 items-center justify-between gap-4 py-4 text-left font-medium transition-colors hover:text-[var(--color-iron-fixture)] [&[data-state=open]>svg]:rotate-180",
            className,
          )}
          {...props}
        >
          {children}
          <IconChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>,
      )}
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export {
  Accordion,
  AccordionHeadingLevel,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
