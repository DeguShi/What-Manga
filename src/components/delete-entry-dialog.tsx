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

interface DeleteEntryDialogProps {
    open: boolean;
    onClose: () => void;
    onDeleted: () => void;
    workId: string;
    workTitle: string;
}

export function DeleteEntryDialog({
    open,
    onClose,
    onDeleted,
    workId,
    workTitle,
}: DeleteEntryDialogProps) {
    const { toast } = useToast();
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isConfirmed = confirmText === 'DELETE';

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    const handleDelete = async () => {
        if (!isConfirmed) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/works/${workId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            toast({
                title: 'Entry deleted',
                description: `"${workTitle}" has been removed from your library.`,
            });

            setConfirmText('');
            onDeleted();
            onClose();
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to delete entry',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <AnimatedDialogContent
                open={open}
                mobileSheet
                className="w-[calc(100vw-2rem)] sm:max-w-sm glass-card border-destructive/30"
            >
                <DialogHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <DialogTitle className="text-base text-destructive">
                                Delete Entry
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                This action cannot be undone
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-3">
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-sm">
                            You are about to permanently delete{' '}
                            <strong className="break-words">&quot;{workTitle}&quot;</strong> from your library.
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
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                    <Button variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmed || isLoading}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </AnimatedDialogContent>
        </Dialog>
    );
}
