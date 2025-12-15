'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { ParsedEntry } from '@/lib/parser';

type ImportMode = 'add' | 'update' | 'replace';

const STATUS_LABELS: Record<string, string> = {
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    INCOMPLETE: 'Incomplete',
    UNCERTAIN: 'Uncertain',
    DROPPED_HIATUS: 'Dropped',
};

export default function ImportPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [parsedData, setParsedData] = useState<{
        entries: ParsedEntry[];
        stats: {
            totalLines: number;
            successCount: number;
            warningCount: number;
            errorCount: number;
        };
        parseErrors: Array<{ line: number; message: string }>;
    } | null>(null);
    const [importMode, setImportMode] = useState<ImportMode>('add');

    const handleFile = useCallback(async (file: File) => {
        if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
            toast({
                title: 'Invalid file type',
                description: 'Please upload a .txt or .csv file',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        setParsedData(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/import', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to parse file');
            }

            const data = await response.json();
            setParsedData(data.result);
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to parse the file',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    }, [toast]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile]
    );

    const handleCommit = async () => {
        if (!parsedData) return;

        setIsCommitting(true);
        try {
            const response = await fetch('/api/import/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entries: parsedData.entries,
                    mode: importMode,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to commit import');
            }

            const result = await response.json();
            toast({
                title: 'Import successful',
                description: `Created: ${result.stats.created}, Updated: ${result.stats.updated}`,
                variant: 'success',
            });

            router.push('/');
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to import entries',
                variant: 'destructive',
            });
        } finally {
            setIsCommitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
                <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold">Import Manga List</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-4xl space-y-8">
                    {/* Upload Zone */}
                    {!parsedData && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 transition-colors ${isDragging
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-primary/50'
                                }`}
                        >
                            {isUploading ? (
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            ) : (
                                <>
                                    <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="mb-2 text-lg font-medium">
                                        Drop your manga list here
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Supports .txt and .csv files
                                    </p>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".txt,.csv"
                                onChange={handleFileInput}
                                className="absolute inset-0 cursor-pointer opacity-0"
                                disabled={isUploading}
                            />
                        </div>
                    )}

                    {/* Parse Results */}
                    {parsedData && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Total Entries
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{parsedData.stats.successCount}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Lines Parsed
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{parsedData.stats.totalLines}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-600">
                                            <AlertCircle className="h-4 w-4" />
                                            Warnings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{parsedData.stats.warningCount}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Success Rate
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">
                                            {parsedData.stats.successCount > 0
                                                ? Math.round(
                                                    ((parsedData.stats.successCount - parsedData.stats.warningCount) /
                                                        parsedData.stats.successCount) *
                                                    100
                                                )
                                                : 0}
                                            %
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Import Mode */}
                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium">Import Mode:</label>
                                <Select
                                    value={importMode}
                                    onValueChange={(v) => setImportMode(v as ImportMode)}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="add">Add New Only</SelectItem>
                                        <SelectItem value="update">Update Existing</SelectItem>
                                        <SelectItem value="replace">Replace All</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Preview Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preview</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[400px] overflow-auto">
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-card">
                                                <tr className="border-b">
                                                    <th className="p-3 text-left text-sm font-medium">#</th>
                                                    <th className="p-3 text-left text-sm font-medium">
                                                        Title
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-medium">
                                                        Status
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-medium">
                                                        Progress
                                                    </th>
                                                    <th className="p-3 text-left text-sm font-medium">
                                                        Score
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.entries.slice(0, 100).map((entry, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className={`border-b last:border-0 ${entry.parseWarnings.length > 0 ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                                                            }`}
                                                    >
                                                        <td className="p-3 text-sm text-muted-foreground">
                                                            {entry.userIndex}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="font-medium">{entry.title}</span>
                                                            {entry.parseWarnings.length > 0 && (
                                                                <span className="ml-2 text-xs text-amber-600">
                                                                    ⚠ {entry.parseWarnings[0]}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            <Badge variant="outline">
                                                                {STATUS_LABELS[entry.status]}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-3 text-sm">
                                                            {entry.mangaProgress?.current
                                                                ? `Ch. ${entry.mangaProgress.current}`
                                                                : '-'}
                                                        </td>
                                                        <td className="p-3 text-sm font-medium">
                                                            {entry.score?.toFixed(1) ?? '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {parsedData.entries.length > 100 && (
                                            <p className="p-4 text-center text-sm text-muted-foreground">
                                                Showing first 100 of {parsedData.entries.length} entries
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex justify-end gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setParsedData(null)}
                                    disabled={isCommitting}
                                >
                                    Upload Different File
                                </Button>
                                <Button onClick={handleCommit} disabled={isCommitting}>
                                    {isCommitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Import {parsedData.entries.length} Entries
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
