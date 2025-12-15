'use client';

import { signIn } from 'next-auth/react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Floating orb component
function FloatingOrb({
    className,
    delay = 0,
    duration = 20
}: {
    className: string;
    delay?: number;
    duration?: number;
}) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return <div className={className} />;
    }

    return (
        <motion.div
            className={className}
            animate={{
                y: [0, -30, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
}

export default function SignInPage() {
    const shouldReduceMotion = useReducedMotion();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                damping: 25,
                stiffness: 300,
            },
        },
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated gradient mesh background */}
            <div className="absolute inset-0 mesh-gradient" />

            {/* Floating orbs - only show if reduced motion is not preferred */}
            {!shouldReduceMotion && (
                <>
                    <FloatingOrb
                        className="absolute top-[10%] left-[15%] w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/10 blur-3xl"
                        delay={0}
                        duration={25}
                    />
                    <FloatingOrb
                        className="absolute top-[60%] right-[10%] w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/15 to-cyan-500/10 blur-3xl"
                        delay={5}
                        duration={30}
                    />
                    <FloatingOrb
                        className="absolute bottom-[10%] left-[20%] w-72 h-72 rounded-full bg-gradient-to-br from-pink-500/15 to-rose-500/10 blur-3xl"
                        delay={2}
                        duration={22}
                    />
                    <FloatingOrb
                        className="absolute top-[30%] right-[25%] w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/5 blur-3xl"
                        delay={8}
                        duration={28}
                    />
                </>
            )}

            {/* Login card */}
            <motion.div
                className="w-full max-w-sm mx-4 relative z-10"
                variants={shouldReduceMotion ? {} : containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="glass-card rounded-2xl p-8 text-center space-y-6 shadow-2xl"
                    variants={shouldReduceMotion ? {} : itemVariants}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.01, transition: { duration: 0.2 } }}
                >
                    {/* Logo */}
                    <motion.div
                        className="flex justify-center"
                        variants={shouldReduceMotion ? {} : itemVariants}
                    >
                        <motion.div
                            className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg"
                            whileHover={shouldReduceMotion ? {} : {
                                scale: 1.1,
                                rotate: 5,
                                transition: { type: 'spring', stiffness: 400, damping: 10 }
                            }}
                            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                        >
                            <BookOpen className="h-8 w-8 text-white" />
                        </motion.div>
                    </motion.div>

                    <motion.div variants={shouldReduceMotion ? {} : itemVariants}>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            What-Manga
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Track your reading journey
                        </p>
                    </motion.div>

                    <motion.div variants={shouldReduceMotion ? {} : itemVariants}>
                        <Button
                            onClick={() => signIn('google', { callbackUrl: '/' })}
                            className="w-full h-12 text-base glass-button hover:glow-sm transition-all duration-300"
                            variant="outline"
                        >
                            <motion.span
                                className="flex items-center justify-center w-full"
                                whileHover={shouldReduceMotion ? {} : { x: 2 }}
                                whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                            >
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </motion.span>
                        </Button>
                    </motion.div>

                    <motion.p
                        className="text-xs text-muted-foreground/60"
                        variants={shouldReduceMotion ? {} : itemVariants}
                    >
                        Your manga tracking journey starts here
                    </motion.p>
                </motion.div>
            </motion.div>
        </div>
    );
}
