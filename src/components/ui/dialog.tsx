'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// Spring animation presets
const springConfig = {
    type: 'spring' as const,
    damping: 30,
    stiffness: 400,
};

// Overlay component - now serves as flex container for centering
const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { isMobileSheet?: boolean }
>(({ className, isMobileSheet = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <DialogPrimitive.Overlay ref={ref} asChild forceMount {...props}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                className={cn(
                    'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
                    // Flexbox centering for desktop dialogs (not mobile sheets)
                    !isMobileSheet && 'flex items-center justify-center',
                    // Mobile sheet needs different alignment
                    isMobileSheet && 'sm:flex sm:items-center sm:justify-center',
                    className
                )}
            />
        </DialogPrimitive.Overlay>
    );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;


interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
    /**
     * Whether to show the dialog as a bottom sheet on mobile
     * @default false
     */
    mobileSheet?: boolean;
}

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    DialogContentProps
>(({ className, children, mobileSheet = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    // Animation variants for dialog
    const dialogVariants = {
        hidden: {
            opacity: 0,
            scale: 0.96,
            y: 8,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
        },
        exit: {
            opacity: 0,
            scale: 0.96,
            y: 8,
        },
    };

    // Animation variants for mobile bottom sheet
    const sheetVariants = {
        hidden: {
            opacity: 0,
            y: '100%',
        },
        visible: {
            opacity: 1,
            y: 0,
        },
        exit: {
            opacity: 0,
            y: '100%',
        },
    };

    // Choose variants based on mobile sheet mode
    const variants = mobileSheet ? sheetVariants : dialogVariants;

    // Reduced motion fallback
    const reducedMotionTransition = { duration: 0 };
    const normalTransition = mobileSheet
        ? { ...springConfig, damping: 35 }
        : springConfig;

    return (
        <DialogPrimitive.Content ref={ref} asChild forceMount {...props}>
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={variants}
                transition={shouldReduceMotion ? reducedMotionTransition : normalTransition}
                style={{ transformOrigin: 'center center' }}
                className={cn(
                    // Base styles - now relative positioned as flex child
                    'relative z-50 grid gap-4 border bg-background p-6 shadow-xl',
                    // Default dialog styling (flexbox handles centering)
                    !mobileSheet && 'w-full max-w-lg rounded-xl mx-4 sm:mx-0',
                    // Mobile sheet: bottom sheet on mobile, centered dialog on desktop
                    mobileSheet && 'w-[calc(100%-2rem)] max-w-lg rounded-xl mx-4 sm:mx-0',
                    mobileSheet && 'max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:mx-0 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[85vh] max-sm:overflow-y-auto',
                    className
                )}
            >
                {children}
                <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </motion.div>
        </DialogPrimitive.Content>
    );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

// Wrapper component that handles AnimatePresence
interface AnimatedDialogContentProps extends DialogContentProps {
    open: boolean;
}

const AnimatedDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    AnimatedDialogContentProps
>(({ open, children, mobileSheet = false, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <DialogPortal forceMount>
            <AnimatePresence mode="wait">
                {open && (
                    <DialogPrimitive.Overlay asChild forceMount>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                            className={cn(
                                'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
                                // Flexbox centering - content is a child now
                                'flex items-center justify-center',
                                // Mobile sheet alignment
                                mobileSheet && 'max-sm:items-end'
                            )}
                        >
                            <DialogContent ref={ref} mobileSheet={mobileSheet} {...props}>
                                {children}
                            </DialogContent>
                        </motion.div>
                    </DialogPrimitive.Overlay>
                )}
            </AnimatePresence>
        </DialogPortal>
    );
});
AnimatedDialogContent.displayName = 'AnimatedDialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    AnimatedDialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
