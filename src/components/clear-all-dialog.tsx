'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    AnimatedDialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface ClearAllDialogProps {
    open: boolean;
    onClose: () => void;
    onCleared: () => void;
    totalCount: number;
}

export function ClearAllDialog({ open, onClose, onCleared, totalCount }: ClearAllDialogProps) {
    const { toast } = useToast();
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isConfirmed = confirmText === 'DELETE';

    const handleClear = async () => {
        if (!isConfirmed) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/works/all', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmToken: 'DELETE_ALL_WORKS' }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            const result = await response.json();

            toast({
                title: 'All entries cleared',
                description: `Deleted ${result.deleted} entries.`,
            });

            setConfirmText('');
            onCleared();
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to clear entries',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { setConfirmText(''); onClose(); }}>
            <AnimatedDialogContent
                open={open}
                mobileSheet
                className="w-[calc(100vw-2rem)] sm:max-w-md glass-card border-destructive/30"
            >
                <DialogHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg text-destructive">
                                Clear All Entries
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                This action cannot be undone
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-sm">
                            You are about to permanently delete <strong>{totalCount}</strong> entries from your library.
                            This action cannot be reversed.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</span> to confirm
                        </Label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            placeholder="Type DELETE..."
                            className={`font-mono ${isConfirmed ? 'border-destructive' : ''}`}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                    <Button variant="ghost" onClick={() => { setConfirmText(''); onClose(); }}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleClear}
                        disabled={!isConfirmed || isLoading}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isLoading ? 'Deleting...' : 'Delete All'}
                    </Button>
                </div>
            </AnimatedDialogContent>
        </Dialog>
    );
}
