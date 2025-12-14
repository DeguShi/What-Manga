'use client';

import { useState } from 'react';
import { X, Plus, Minus, Save, BookOpen, Scroll } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { Work } from '@prisma/client';

interface WorkDetailDrawerProps {
    work: Work;
    open: boolean;
    onClose: () => void;
    onUpdate: (work: Work) => void;
}

const STATUS_OPTIONS = [
    { value: 'IN_PROGRESS', label: 'In Progress', symbol: '~' },
    { value: 'COMPLETED', label: 'Completed', symbol: '*' },
    { value: 'INCOMPLETE', label: 'Incomplete', symbol: '∆' },
    { value: 'UNCERTAIN', label: 'Uncertain', symbol: '?' },
    { value: 'DROPPED_HIATUS', label: 'Dropped/Hiatus', symbol: 'r.π' },
];

export function WorkDetailDrawer({
    work,
    open,
    onClose,
    onUpdate,
}: WorkDetailDrawerProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: work.status,
        mangaProgressCurrent: work.mangaProgressCurrent ?? 0,
        novelProgressCurrent: work.novelProgressCurrent ?? 0,
        score: work.score ?? 0,
        reviewNote: work.reviewNote ?? '',
    });
    const [showRaw, setShowRaw] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/works/${work.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: formData.status,
                    mangaProgressCurrent: formData.mangaProgressCurrent || null,
                    novelProgressCurrent: formData.novelProgressCurrent || null,
                    score: formData.score || null,
                    reviewNote: formData.reviewNote || null,
                }),
            });

            if (!response.ok) throw new Error('Failed to update');

            const updatedWork = await response.json();
            onUpdate(updatedWork);
            toast({
                title: 'Saved',
                description: 'Changes saved successfully.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save changes.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const incrementProgress = (field: 'manga' | 'novel', delta: number) => {
        if (field === 'manga') {
            setFormData((prev) => ({
                ...prev,
                mangaProgressCurrent: Math.max(0, prev.mangaProgressCurrent + delta),
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                novelProgressCurrent: Math.max(0, prev.novelProgressCurrent + delta),
            }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{work.userIndex}</span>
                        <span>{work.title}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status */}
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, status: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <span className="mr-2 text-muted-foreground">
                                            {option.symbol}
                                        </span>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Manga Progress */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Manga Progress
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => incrementProgress('manga', -1)}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={formData.mangaProgressCurrent}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        mangaProgressCurrent: parseFloat(e.target.value) || 0,
                                    }))
                                }
                                className="text-center"
                                step="0.1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => incrementProgress('manga', 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {work.mangaProgressRaw && (
                            <p className="text-xs text-muted-foreground">
                                Original: {work.mangaProgressRaw}
                            </p>
                        )}
                    </div>

                    {/* Novel Progress (if exists) */}
                    {(work.novelProgressRaw || formData.novelProgressCurrent > 0) && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Scroll className="h-4 w-4" />
                                Novel Progress
                            </Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => incrementProgress('novel', -1)}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.novelProgressCurrent}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            novelProgressCurrent: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                    className="text-center"
                                    step="0.1"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => incrementProgress('novel', 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {work.novelProgressRaw && (
                                <p className="text-xs text-muted-foreground">
                                    Original: {work.novelProgressRaw}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Score */}
                    <div className="space-y-2">
                        <Label>Score (0-10)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                value={formData.score}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        score: Math.max(0, Math.min(10, parseFloat(e.target.value) || 0)),
                                    }))
                                }
                                className="w-24"
                                min="0"
                                max="10"
                                step="0.1"
                            />
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={formData.score}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            score: parseFloat(e.target.value),
                                        }))
                                    }
                                    className="w-full accent-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Review Note */}
                    <div className="space-y-2">
                        <Label>Review Note (private)</Label>
                        <Textarea
                            value={formData.reviewNote}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, reviewNote: e.target.value }))
                            }
                            placeholder="Add your private notes here..."
                            rows={3}
                        />
                    </div>

                    {/* Raw Import Text */}
                    {work.rawImportedText && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowRaw(!showRaw)}
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                {showRaw ? 'Hide' : 'Show'} raw imported text
                            </button>
                            {showRaw && (
                                <pre className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs">
                                    {work.rawImportedText}
                                </pre>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
