/**
 * Keyboard shortcuts for Wall Designer
 */

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
}

export class KeyboardShortcutManager {
    private shortcuts: Map<string, KeyboardShortcut> = new Map();
    private enabled = true;

    constructor() {
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Register a keyboard shortcut
     */
    register(shortcut: KeyboardShortcut) {
        const key = this.getShortcutKey(shortcut);
        this.shortcuts.set(key, shortcut);
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregister(key: string, ctrl = false, shift = false, alt = false) {
        const shortcutKey = this.getShortcutKey({ key, ctrl, shift, alt } as KeyboardShortcut);
        this.shortcuts.delete(shortcutKey);
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.enabled = true;
        window.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.enabled = false;
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Get all registered shortcuts
     */
    getAll(): KeyboardShortcut[] {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Handle keydown event
     */
    private handleKeyDown(e: KeyboardEvent) {
        if (!this.enabled) return;

        // Don't trigger shortcuts when typing in inputs
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        const key = this.getShortcutKey({
            key: e.key.toLowerCase(),
            ctrl: e.ctrlKey || e.metaKey,
            shift: e.shiftKey,
            alt: e.altKey,
        } as KeyboardShortcut);

        const shortcut = this.shortcuts.get(key);
        if (shortcut) {
            e.preventDefault();
            shortcut.action();
        }
    }

    /**
     * Generate unique key for shortcut
     */
    private getShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
        const parts: string[] = [];
        if (shortcut.ctrl) parts.push('ctrl');
        if (shortcut.shift) parts.push('shift');
        if (shortcut.alt) parts.push('alt');
        parts.push(shortcut.key || '');
        return parts.join('+');
    }

    /**
     * Format shortcut for display
     */
    static formatShortcut(shortcut: KeyboardShortcut): string {
        const parts: string[] = [];
        if (shortcut.ctrl) parts.push('Ctrl');
        if (shortcut.shift) parts.push('Shift');
        if (shortcut.alt) parts.push('Alt');
        parts.push(shortcut.key.toUpperCase());
        return parts.join(' + ');
    }
}

/**
 * Default shortcuts for Wall Designer
 */
export const DEFAULT_SHORTCUTS = {
    // Mode switching
    DRAW_MODE: { key: 'd', description: 'Switch to Draw mode' },
    EDIT_MODE: { key: 'e', description: 'Switch to Edit mode' },
    PAN_MODE: { key: 'p', description: 'Switch to Pan mode' },

    // Actions
    UNDO: { key: 'z', ctrl: true, description: 'Undo last action' },
    REDO: { key: 'y', ctrl: true, description: 'Redo last action' },
    DELETE: { key: 'delete', description: 'Delete selected item' },
    CLEAR: { key: 'delete', ctrl: true, shift: true, description: 'Clear all' },

    // Tools
    QUICK_RECTANGLE: { key: 'r', description: 'Open Quick Rectangle' },
    CLOSE_LOOP: { key: 'l', description: 'Close loop' },
    SET_SCALE: { key: 's', ctrl: true, description: 'Set scale' },

    // View
    ZOOM_IN: { key: '=', ctrl: true, description: 'Zoom in' },
    ZOOM_OUT: { key: '-', ctrl: true, description: 'Zoom out' },
    FIT_TO_SCREEN: { key: '0', ctrl: true, description: 'Fit to screen' },
    TOGGLE_GRID: { key: 'g', description: 'Toggle grid' },
    TOGGLE_SNAP: { key: 'shift', description: 'Toggle snap (hold)' },

    // File
    SAVE: { key: 's', ctrl: true, shift: true, description: 'Save floor plan' },
    EXPORT: { key: 'e', ctrl: true, description: 'Export menu' },
    TUTORIAL: { key: 'h', description: 'Show tutorial' },
};
