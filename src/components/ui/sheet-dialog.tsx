"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo, type Variants } from "framer-motion";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { createContext, useContext, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/design-system/components/ui/button";
import { fade, pop, reduced, transition } from "@/design-system/motion";
import { cn } from "@/lib/utils";

/**
 * CZ dialog with iOS behaviour: a centred glass panel that pops in on larger
 * screens, and a bottom sheet on phones that springs up and can be dragged down
 * to dismiss. Same API as the design-system Dialog.
 */
type Ctx = { open: boolean; setOpen: (open: boolean) => void };
const DialogContext = createContext<Ctx>({ open: false, setOpen: () => {} });

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(max-width: 639px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
function useIsPhone() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}

export function Dialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [inner, setInner] = useState(defaultOpen ?? false);
  const open = openProp ?? inner;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInner(next);
    onOpenChange?.(next);
  };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
    </DialogPrimitive.Root>
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const sheet: Variants = {
  hidden: { y: "100%", transition: transition.exit },
  visible: { y: 0, transition: transition.smooth },
};

export function DialogContent({
  className,
  children,
  hideClose,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  const { open, setOpen } = useContext(DialogContext);
  const reduce = useReducedMotion();
  const phone = useIsPhone();
  const drag = useDragControls();

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 110 || info.velocity.y > 600) setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-50 bg-overlay backdrop-blur-xs"
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
            />
          </DialogPrimitive.Overlay>
          {phone ? (
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end">
              <DialogPrimitive.Content asChild forceMount {...props}>
                <motion.div
                  className={cn(
                    "glass glass-strong glass-float pointer-events-auto relative flex max-h-[92dvh] w-full flex-col gap-4 overflow-y-auto",
                    "rounded-t-2xl px-5 pb-safe pt-2 text-fg outline-none",
                    className,
                    "max-w-none rounded-b-none",
                  )}
                  variants={reduce ? reduced(fade) : sheet}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  drag={reduce ? false : "y"}
                  dragListener={false}
                  dragControls={drag}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0.04, bottom: 0.7 }}
                  onDragEnd={onDragEnd}
                >
                  {/* Grabber: drag it down to dismiss, like an iOS sheet */}
                  <div
                    className="-mx-5 flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-1 active:cursor-grabbing"
                    onPointerDown={(e) => drag.start(e)}
                    aria-hidden
                  >
                    <span className="h-1.5 w-10 rounded-full bg-line-strong" />
                  </div>
                  {children}
                  <div className="h-4 shrink-0" />
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          ) : (
            <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
              <DialogPrimitive.Content asChild forceMount {...props}>
                <motion.div
                  className={cn(
                    "glass glass-strong glass-float pointer-events-auto relative flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto",
                    "rounded-dialog p-6 text-fg outline-none",
                    className,
                  )}
                  variants={reduce ? reduced(pop) : pop}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {children}
                  {!hideClose && (
                    <DialogPrimitive.Close asChild>
                      <Button variant="ghost" size="icon-sm" className="absolute right-3 top-3 rounded-full" aria-label="关闭">
                        <X />
                      </Button>
                    </DialogPrimitive.Close>
                  )}
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          )}
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 sm:pr-6", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-title text-fg max-sm:text-center max-sm:text-title-sm", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-body text-fg-muted", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
