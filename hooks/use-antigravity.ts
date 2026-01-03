'use client'

import { useOptimistic, useTransition } from "react";
import toast from "react-hot-toast";

type ServerAction<T, R> = (data: T) => Promise<{ success: boolean; error?: string; data?: R }>;

/**
 * Antigravity Hook - Makes heavy engineering operations feel weightless
 * 
 * This hook provides optimistic UI updates while server-side validation
 * and calculations happen asynchronously in the background.
 * 
 * @param initialData - Initial data array
 * @param syncAction - Server action to sync changes
 * @param keyProp - Unique identifier property (e.g., 'id')
 * @returns Object with optimistic data, pending state, and update function
 */
export function useAntigravity<TData extends Record<string, any>, TResult>(
    initialData: TData[],
    syncAction: ServerAction<TData, TResult>,
    keyProp: keyof TData
) {
    const [isPending, startTransition] = useTransition();

    // 1. Optimistic State (The "Weightless" UI)
    // This state updates IMMEDIATELY, before the server even hears about it.
    const [optimisticData, setOptimisticData] = useOptimistic(
        initialData,
        (state, newItem: TData) => {
            // Upsert logic: Update if exists, Add if new
            const index = state.findIndex((item) => item[keyProp] === newItem[keyProp]);
            if (index === -1) return [...state, newItem];
            const newState = [...state];
            newState[index] = newItem;
            return newState;
        }
    );

    // 2. The Mutator (The Trigger)
    const applyUpdate = (newItem: TData) => {
        // A. Apply Gravity-Defying Update (Instant)
        startTransition(async () => {
            setOptimisticData(newItem);

            // B. The Heavy Lift (Async Server Action)
            const result = await syncAction(newItem);

            // C. Reality Check (Calibration)
            if (!result.success) {
                toast.error(result.error || "Physics Violation");
                // The optimistic state will automatically rollback on next render
                // because the server revalidation didn't happen / failed.
            } else {
                toast.success("Structure Stabilized");
            }
        });
    };

    // 3. Delete operation (for removing items)
    const applyDelete = (itemKey: TData[keyof TData]) => {
        startTransition(async () => {
            // Optimistically remove from UI
            const filtered = optimisticData.filter(item => item[keyProp] !== itemKey);
            if (filtered.length > 0) {
                setOptimisticData(filtered[0]); // Trigger optimistic update
            }

            // Sync with server - create a partial object with just the key
            const deletePayload = { [keyProp]: itemKey } as Partial<TData> & { _deleted?: boolean };
            deletePayload._deleted = true;

            const result = await syncAction(deletePayload as TData);

            if (!result.success) {
                toast.error(result.error || "Delete failed");
            }
        });
    };

    return {
        data: optimisticData,
        isCalibrating: isPending, // Hook this to your "Spinner" or "Pending" UI
        update: applyUpdate,
        remove: applyDelete,
    };
}

/**
 * Simplified version for single-item optimistic updates
 */
export function useAntigravitySingle<TData, TResult>(
    initialData: TData,
    syncAction: ServerAction<TData, TResult>
) {
    const [isPending, startTransition] = useTransition();

    const [optimisticData, setOptimisticData] = useOptimistic(
        initialData,
        (_state, newData: TData) => newData
    );

    const applyUpdate = (newData: TData) => {
        startTransition(async () => {
            setOptimisticData(newData);

            const result = await syncAction(newData);

            if (!result.success) {
                toast.error(result.error || "Update failed");
            }
        });
    };

    return {
        data: optimisticData,
        isCalibrating: isPending,
        update: applyUpdate,
    };
}
