"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "./utils";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      // No default border-b: callers provide their own border via className.
      className={cn(className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          // Minimal base: flex row, vertically centred, no underline, no extra
          // rounding (the card AccordionItem owns border-radius + overflow-hidden).
          // Padding is intentionally omitted — callers set px/py via className.
          "flex flex-1 items-center justify-between gap-2",
          "text-left text-sm font-medium transition-all outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-[rgba(17,16,20,0.56)] pointer-events-none size-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      // rounded-b-[11px] + overflow-hidden: clips the content's bg to the
      // bottom rounded corners (1 px inside the item border-radius of 12px).
      // This lets us skip overflow-hidden on the AccordionItem itself, which
      // was causing the bottom border to be clipped during Radix animation.
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden rounded-b-[11px] text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
