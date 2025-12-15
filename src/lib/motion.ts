/**
 * Centralized motion configuration
 * Provides consistent animation behavior across the app
 */

// Spring configurations
export const springs = {
    /** Fast, snappy interactions (buttons, toggles) */
    snappy: { type: 'spring' as const, damping: 25, stiffness: 400 },
    /** Smooth transitions (dialogs, sheets) */
    smooth: { type: 'spring' as const, damping: 30, stiffness: 300 },
    /** Gentle, flowing motion (lists, cascades) */
    gentle: { type: 'spring' as const, damping: 35, stiffness: 200 },
    /** Bouncy emphasis (celebrations) */
    bouncy: { type: 'spring' as const, damping: 15, stiffness: 400 },
};

// Stagger configuration for list animations
export const stagger = {
    /** Fast stagger for short lists */
    fast: 0.03,
    /** Default stagger timing */
    default: 0.05,
    /** Slow stagger for emphasis */
    slow: 0.08,
};

// Fade animation variants
export const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

// Slide up animation variants
export const slideUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
};

// Scale animation variants (subtle)
export const scaleVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
};

// Card hover animation
export const cardHover = {
    rest: { y: 0, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    hover: { y: -2, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
};

// List item animation variants for stagger
export const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
};

// Container with stagger children
export const staggerContainer = (staggerChildren = stagger.default) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren,
            delayChildren: 0.1,
        },
    },
});
