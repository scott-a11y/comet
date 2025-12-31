
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Create a spy we can control
const mockCreate = vi.fn();

// 2. Mock dependencies
vi.mock('../lib/pdf', () => {
    return {
        parsePdfText: vi.fn().mockResolvedValue({
            text: "Mocked PDF content with specs: Width: 10 in. Weight: 50 lb.",
            pages: 1
        })
    };
});

// 3. Mock OpenAI using the spy
vi.mock('openai', () => {
    return {
        default: class MockOpenAI {
            chat = {
                completions: {
                    create: mockCreate
                }
            }
        }
    }
});

vi.mock('@/lib/env', () => ({
    env: {
        OPENAI_API_KEY: 'mock-key'
    }
}));

import { extractMachinerySpecs } from '../actions/extract-specs';

describe('extractMachinerySpecs', () => {
    beforeEach(() => {
        mockCreate.mockReset();
    });

    it('should successfully extract specs from valid input', async () => {
        // Setup happy path
        mockCreate.mockResolvedValue({
            choices: [{
                message: {
                    content: JSON.stringify({
                        manufacturer: "Test Corp",
                        model: "X-100",
                        dimensions: { width: 10, unit: "in" },
                        weight: { value: 50, unit: "lb" }
                    })
                }
            }]
        });

        const mockBase64 = "bG9yZW0gaXBzdW0=";

        const [result, err] = await extractMachinerySpecs({ fileBase64: mockBase64 });

        expect(err).toBeNull();
        expect(result).toBeDefined();
        if (result) {
            expect(result.success).toBe(true);
            expect(result.data?.manufacturer).toBe("Test Corp");
        }
    });

    it('should handle validation errors', async () => {
        // Setup failure path
        mockCreate.mockResolvedValue({
            choices: [{
                message: {
                    content: JSON.stringify({
                        manufacturer: "Bad Data",
                        dimensions: { width: "STRING INSTEAD OF NUMBER" }
                    })
                }
            }]
        });

        const [result, err] = await extractMachinerySpecs({ fileBase64: "dGVzdA==" });

        expect(err).toBeNull();
        expect(result?.success).toBe(false);
        // Error details should identify validaton failure
        expect(result?.error).toBe("Failed to validate extracted data");
    });
});
