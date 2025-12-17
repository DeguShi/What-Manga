'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Plus,
    Minus,
    Save,
    BookOpen,
    Scroll,
    Edit3,
    Eye,
    Clock,
    Star,
    FileText,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { STATUS_OPTIONS, STATUS_BADGE_VARIANT, STATUS_LABELS, getScoreColor, type Status } from '@/lib/constants';
import type { Work } from '@prisma/client';

interface WorkDetailPanelProps {
    work: Work;
    open: boolean;
    onClose: () => void;
    onUpdate: (work: Work) => void;
    onDelete?: (workId: string) => void;
}

export function WorkDetailPanel({
    work,
    open,
    onClose,
    onUpdate,
    onDelete,
}: WorkDetailPanelProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showRaw, setShowRaw] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        status: work.status,
        mangaProgressCurrent: work.mangaProgressCurrent ?? 0,
        novelProgressCurrent: work.novelProgressCurrent ?? 0,
        score: work.score ?? 0,
        reviewNote: work.reviewNote ?? '',
    });

    // Sync form data when work prop changes (fixes stale data issue)
    useEffect(() => {
        setFormData({
            status: work.status,
            mangaProgressCurrent: work.mangaProgressCurrent ?? 0,
            novelProgressCurrent: work.novelProgressCurrent ?? 0,
            score: work.score ?? 0,
            reviewNote: work.reviewNote ?? '',
        });
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setDeleteConfirmText('');
    }, [work]);

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
            setIsEditing(false);
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

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-emerald-500';
        if (score >= 6) return 'text-amber-500';
        if (score > 0) return 'text-rose-500';
        return 'text-muted-foreground';
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/works/${work.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete');

            toast({
                title: 'Deleted',
                description: `"${work.title}" has been removed.`,
            });

            onDelete?.(work.id);
            onClose();
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to delete entry.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
        }
    };

    const statusOption = STATUS_OPTIONS.find((o) => o.value === work.status);

    return (
        <Dialog open={open} onOpenChange={() => onClose()}>
            <AnimatedDialogContent
                open={open}
                mobileSheet
                className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto glass-card border-white/20 dark:border-white/10"
            >
                <DialogHeader className="pb-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                                #{work.userIndex}
                            </span>
                            <span className="truncate max-w-[300px]">{work.title}</span>
                        </DialogTitle>
                        {!isEditing && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="glass-button"
                            >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Read-Only View */}
                    {!isEditing && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Status & Score Row */}
                            <div className="flex items-center justify-between">
                                <Badge variant={STATUS_BADGE_VARIANT[work.status as Status]} className="text-sm px-3 py-1">
                                    <span className="mr-1.5">{statusOption?.symbol}</span>
                                    {STATUS_LABELS[work.status as Status]}
                                </Badge>
                                {work.score && (
                                    <div className="flex items-center gap-1.5">
                                        <Star className={`h-5 w-5 ${getScoreColor(work.score)} fill-current`} />
                                        <span className={`text-xl font-bold ${getScoreColor(work.score)}`}>
                                            {work.score.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Progress Cards */}
                            <div className="grid gap-3">
                                {work.mangaProgressRaw && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                        <BookOpen className="h-5 w-5 text-amber-600" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Manga Progress</p>
                                            <p className="text-xs text-muted-foreground">{work.mangaProgressRaw}</p>
                                        </div>
                                        {work.mangaProgressCurrent && (
                                            <span className="text-lg font-bold text-amber-600">
                                                Ch. {work.mangaProgressCurrent}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {work.novelProgressRaw && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                        <Scroll className="h-5 w-5 text-rose-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Novel Progress</p>
                                            <p className="text-xs text-muted-foreground">{work.novelProgressRaw}</p>
                                        </div>
                                        {work.novelProgressCurrent && (
                                            <span className="text-lg font-bold text-rose-500">
                                                Ch. {work.novelProgressCurrent}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Review Note */}
                            {work.reviewNote && (
                                <div className="p-4 rounded-xl bg-muted/50 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Notes</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {work.reviewNote}
                                    </p>
                                </div>
                            )}

                            {/* Raw Import Toggle */}
                            {work.rawImportedText && (
                                <div className="pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => setShowRaw(!showRaw)}
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                        {showRaw ? 'Hide' : 'Show'} raw imported text
                                    </button>
                                    {showRaw && (
                                        <pre className="mt-3 p-3 rounded-lg bg-muted text-xs overflow-auto max-h-32 scrollbar-thin">
                                            {work.rawImportedText}
                                        </pre>
                                    )}
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-4 pt-2 border-t border-white/10 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Updated: {new Date(work.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Mode */}
                    {isEditing && (
                        <div className="space-y-5 animate-fade-in">
                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, status: value }))
                                    }
                                >
                                    <SelectTrigger className="glass-button">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <span className={`mr-2 ${option.color}`}>{option.symbol}</span>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Manga Progress */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                    <BookOpen className="h-4 w-4 text-amber-600" />
                                    Manga Progress
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10"
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
                                        className="text-center text-lg font-medium"
                                        step="0.1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10"
                                        onClick={() => incrementProgress('manga', 1)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Novel Progress (if exists) */}
                            {(work.novelProgressRaw || formData.novelProgressCurrent > 0) && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                        <Scroll className="h-4 w-4 text-rose-500" />
                                        Novel Progress
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10"
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
                                            className="text-center text-lg font-medium"
                                            step="0.1"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10"
                                            onClick={() => incrementProgress('novel', 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

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
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                score: Math.max(0, Math.min(10, parseFloat(e.target.value) || 0)),
                                            }))
                                        }
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
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    score: parseFloat(e.target.value),
                                                }))
                                            }
                                            className="w-full accent-primary h-2 rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-sm font-medium">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Private Notes
                                </Label>
                                <Textarea
                                    value={formData.reviewNote}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, reviewNote: e.target.value }))
                                    }
                                    placeholder="Add your private notes here..."
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between gap-2 pt-4 border-t border-white/10">
                    {/* Delete button (left side, edit mode only) */}
                    <div>
                        {isEditing && onDelete && !showDeleteConfirm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        )}
                        {showDeleteConfirm && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                    placeholder="Type DELETE"
                                    className="w-24 px-2 py-1 text-xs font-mono border border-destructive/50 rounded bg-destructive/5 focus:outline-none focus:ring-1 focus:ring-destructive"
                                    autoFocus
                                />
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                                >
                                    {isDeleting ? '...' : 'Confirm'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Action buttons (right side) */}
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="gradient-primary text-white"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </AnimatedDialogContent>
        </Dialog>
    );
}
