/**
 * Konva Event Types
 * Provides proper typing for Konva event handlers to replace `any` usage
 */

import Konva from 'konva';

// Re-export Konva event types for convenience
export type KonvaMouseEvent = Konva.KonvaEventObject<MouseEvent>;
export type KonvaWheelEvent = Konva.KonvaEventObject<WheelEvent>;
export type KonvaTouchEvent = Konva.KonvaEventObject<TouchEvent>;
export type KonvaDragEvent = Konva.KonvaEventObject<DragEvent>;
export type KonvaPointerEvent = Konva.KonvaEventObject<PointerEvent>;

// Generic event type for handlers that accept multiple event types
export type KonvaEventHandler<T = MouseEvent> = (e: Konva.KonvaEventObject<T>) => void;

// Common handler signatures used in wall editor
export type WallClickHandler = (e: KonvaMouseEvent) => void;
export type WallDragHandler = (e: KonvaMouseEvent) => void;
export type WheelZoomHandler = (e: KonvaWheelEvent) => void;

// Stage reference type
export type StageRef = Konva.Stage | null;

// Point type for positions
export interface Point2D {
    x: number;
    y: number;
}

// Transform event for resize/rotate operations
export interface TransformEvent {
    target: Konva.Node;
    currentTarget: Konva.Node;
    evt: MouseEvent;
}

// Selection box bounds
export interface SelectionBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
