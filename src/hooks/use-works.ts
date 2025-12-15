'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Work } from '@prisma/client';

// Query keys
export const workKeys = {
    all: ['works'] as const,
    list: (filters?: { status?: string; search?: string }) => [...workKeys.all, 'list', filters] as const,
    detail: (id: string) => [...workKeys.all, 'detail', id] as const,
};

// Fetch all works
async function fetchWorks(): Promise<Work[]> {
    const response = await fetch('/api/works?limit=10000');
    if (!response.ok) throw new Error('Failed to fetch works');
    const data = await response.json();
    return data.data || [];
}

// Create a work
async function createWork(data: Partial<Work>): Promise<Work> {
    const response = await fetch('/api/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create work');
    }
    return response.json();
}

// Update a work
async function updateWork({ id, ...data }: Partial<Work> & { id: string }): Promise<Work> {
    const response = await fetch(`/api/works/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update work');
    return response.json();
}

// Delete all works
async function deleteAllWorks(): Promise<void> {
    const response = await fetch('/api/works/all', { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete works');
}

/**
 * Hook to fetch all works
 */
export function useWorks() {
    return useQuery({
        queryKey: workKeys.all,
        queryFn: fetchWorks,
    });
}

/**
 * Hook to create a new work
 */
export function useCreateWork() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createWork,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: workKeys.all });
        },
    });
}

/**
 * Hook to update a work
 */
export function useUpdateWork() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateWork,
        onSuccess: (updatedWork) => {
            // Update the work in the cache
            queryClient.setQueryData<Work[]>(workKeys.all, (old) =>
                old?.map((w) => (w.id === updatedWork.id ? updatedWork : w))
            );
        },
    });
}

/**
 * Hook to delete all works
 */
export function useDeleteAllWorks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAllWorks,
        onSuccess: () => {
            queryClient.setQueryData(workKeys.all, []);
        },
    });
}
