/**
 * Application Constants
 * Centralized location for magic numbers, default values, and feature flags
 */

// =============================================================================
// WALL DESIGNER CONSTANTS
// =============================================================================

export const WALL_DESIGNER = {
    GRID_SIZE: 20,           // pixels
    SNAP_DISTANCE: 15,       // pixels
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5,
    DEFAULT_WALL_THICKNESS: 0.5,  // feet
    DEFAULT_SCALE: 10,       // pixels per foot
} as const;

// =============================================================================
// CANVAS CONSTANTS
// =============================================================================

export const CANVAS = {
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
    BACKGROUND_COLOR: '#1e293b',  // slate-800
    GRID_COLOR: '#334155',        // slate-700
    SELECTION_COLOR: '#3b82f6',   // blue-500
} as const;

// =============================================================================
// SYSTEM CALCULATIONS
// =============================================================================

export const ELECTRICAL = {
    MAX_VOLTAGE_DROP_PERCENT: 3,
    DERATING_FACTOR: 0.8,
    MOTOR_BREAKER_MULTIPLIER: 2.5,
    GENERAL_BREAKER_MULTIPLIER: 1.25,
} as const;

export const DUCTING = {
    MIN_VELOCITY_FPM: 3500,
    MAX_VELOCITY_FPM: 4500,
    WASTE_FACTOR: 1.15,
} as const;

export const COMPRESSED_AIR = {
    DEFAULT_PRESSURE_PSI: 90,
    MIN_PIPE_DIAMETER_IN: 0.5,
    MAX_PRESSURE_DROP_PERCENT: 5,
} as const;

// =============================================================================
// API LIMITS
// =============================================================================

export const API_LIMITS = {
    RATE_LIMIT_REQUESTS: 20,
    RATE_LIMIT_WINDOW_MS: 60000,  // 1 minute
    MAX_UPLOAD_SIZE_MB: 30,
    MAX_CHAT_MESSAGES: 50,
    MAX_MESSAGE_LENGTH: 10000,
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
    ENABLE_3D_VIEW: true,
    ENABLE_AI_CHAT: true,
    ENABLE_PDF_ANALYSIS: true,
    ENABLE_COLLISION_DETECTION: true,
    ENABLE_BOM_GENERATION: true,
    ENABLE_SYSTEM_ROUTING: true,
} as const;

// =============================================================================
// UI DEFAULTS
// =============================================================================

export const UI = {
    TOAST_DURATION_MS: 3000,
    DEBOUNCE_MS: 300,
    ANIMATION_DURATION_MS: 200,
    MOBILE_BREAKPOINT: 768,
} as const;

// =============================================================================
// FILE TYPES
// =============================================================================

export const ALLOWED_FILE_TYPES = {
    IMAGES: ['image/png', 'image/jpeg', 'image/webp'],
    PDFS: ['application/pdf'],
    MODELS: ['model/gltf-binary', 'model/gltf+json'],
    EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.glb', '.gltf'],
} as const;
