'use client';

import { useState } from 'react';
import { Plus, Minus, BookOpen, Scroll, Star, Hash, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    AnimatedDialogContent,
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

interface CreateEntryModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    nextIndex: number;
}

const STATUS_OPTIONS = [
    { value: 'IN_PROGRESS', label: 'In Progress', symbol: '~' },
    { value: 'COMPLETED', label: 'Completed', symbol: '*' },
    { value: 'INCOMPLETE', label: 'Incomplete', symbol: '∆' },
    { value: 'UNCERTAIN', label: 'Uncertain', symbol: '?' },
    { value: 'DROPPED_HIATUS', label: 'Dropped/Hiatus', symbol: 'r.π' },
];

export function CreateEntryModal({ open, onClose, onCreated, nextIndex }: CreateEntryModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showNovel, setShowNovel] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        userIndex: nextIndex,
        status: 'IN_PROGRESS',
        mangaProgress: 0,
        novelProgress: 0,
        score: 0,
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (formData.userIndex < 0) {
            newErrors.userIndex = 'Index must be positive';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/works', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    userIndex: formData.userIndex,
                    status: formData.status,
                    mangaProgressCurrent: formData.mangaProgress || null,
                    mangaProgressRaw: formData.mangaProgress ? `${formData.mangaProgress}` : null,
                    novelProgressCurrent: showNovel && formData.novelProgress ? formData.novelProgress : null,
                    novelProgressRaw: showNovel && formData.novelProgress ? `${formData.novelProgress}` : null,
                    score: formData.score || null,
                    reviewNote: formData.notes || null,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create');
            }

            toast({
                title: 'Created!',
                description: `"${formData.title}" added to your list.`,
            });

            // Reset form
            setFormData({
                title: '',
                userIndex: nextIndex + 1,
                status: 'IN_PROGRESS',
                mangaProgress: 0,
                novelProgress: 0,
                score: 0,
                notes: '',
            });
            setShowNovel(false);

            onCreated();
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create entry',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const incrementProgress = (field: 'manga' | 'novel', delta: number) => {
        if (field === 'manga') {
            setFormData(prev => ({
                ...prev,
                mangaProgress: Math.max(0, prev.mangaProgress + delta),
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                novelProgress: Math.max(0, prev.novelProgress + delta),
            }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => onClose()}>
            <AnimatedDialogContent
                open={open}
                mobileSheet
                className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto glass-card border-white/20 dark:border-white/10"
            >
                <DialogHeader className="pb-4 border-b border-white/10">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        Add New Work
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Index */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            Index Number
                        </Label>
                        <Input
                            type="number"
                            value={formData.userIndex}
                            onChange={(e) => setFormData(prev => ({ ...prev, userIndex: parseInt(e.target.value) || 0 }))}
                            className="w-24"
                            min="0"
                        />
                        {errors.userIndex && <p className="text-xs text-destructive">{errors.userIndex}</p>}
                        <p className="text-xs text-muted-foreground">Default: next in sequence. Change for custom ordering.</p>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter manga or novel title..."
                            className={errors.title ? 'border-destructive' : ''}
                        />
                        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        >
                            <SelectTrigger className="glass-button">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <span className="text-primary mr-2">{option.symbol}</span>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Manga Progress */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            Manga Progress (Chapter)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => incrementProgress('manga', -1)}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={formData.mangaProgress}
                                onChange={(e) => setFormData(prev => ({ ...prev, mangaProgress: parseFloat(e.target.value) || 0 }))}
                                className="w-24 text-center font-medium"
                                step="0.1"
                                min="0"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => incrementProgress('manga', 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Novel Toggle */}
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setShowNovel(!showNovel)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${showNovel ? 'bg-purple-500 border-purple-500' : 'border-muted-foreground'}`}>
                                {showNovel && <span className="text-white text-xs">✓</span>}
                            </div>
                            <Scroll className="h-4 w-4 text-purple-500" />
                            Include Novel Progress
                        </button>

                        {showNovel && (
                            <div className="flex items-center gap-2 pl-6 animate-fade-in">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => incrementProgress('novel', -1)}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={formData.novelProgress}
                                    onChange={(e) => setFormData(prev => ({ ...prev, novelProgress: parseFloat(e.target.value) || 0 }))}
                                    className="w-24 text-center font-medium"
                                    step="0.1"
                                    min="0"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => incrementProgress('novel', 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Score */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                            <Star className="h-4 w-4 text-amber-500" />
                            Score (0-10)
                        </Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                value={formData.score}
                                onChange={(e) => setFormData(prev => ({ ...prev, score: Math.max(0, Math.min(10, parseFloat(e.target.value) || 0)) }))}
                                className="w-20 text-center font-medium"
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
                                    onChange={(e) => setFormData(prev => ({ ...prev, score: parseFloat(e.target.value) }))}
                                    className="w-full accent-primary h-2 rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Notes (optional)</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any personal notes..."
                            rows={2}
                            className="resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="gradient-primary text-white"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isLoading ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </AnimatedDialogContent>
        </Dialog>
    );
}
