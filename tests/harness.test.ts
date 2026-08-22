import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import type { UIMessage } from 'ai';

import {
  resolveOpenCodeSettings,
  getSandboxHandle,
  CODING_AGENT_MODELS,
} from '@/lib/ai/harness/models';
import { extractLatestUserPrompt } from '@/lib/ai/chat-transport';

describe('OpenCode Harness & Coding Agent Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('resolveOpenCodeSettings', () => {
    it('resolves OpenCode Zen models and sets OPENAI_API_KEY / OPENAI_BASE_URL', () => {
      process.env.OPENCODE_ZEN_API_KEY = 'zen_test_key_123';
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = resolveOpenCodeSettings('opencode/big-pickle');

      expect(result.model).toBe('opencode/big-pickle');
      expect(result.auth).toBe('openai');
      expect(process.env.OPENAI_API_KEY).toBe('zen_test_key_123');
      expect(process.env.OPENAI_BASE_URL).toBe('https://opencode.ai/zen/v1');
    });

    it('defaults to opencode/deepseek-v4-flash-free when OPENCODE_ZEN_API_KEY is available', () => {
      process.env.OPENCODE_ZEN_API_KEY = 'zen_test_key_123';
      delete process.env.OPENROUTER_API_KEY;

      const result = resolveOpenCodeSettings();

      expect(result.model).toBe('opencode/deepseek-v4-flash-free');
      expect(result.auth).toBe('openai');
      expect(process.env.OPENAI_API_KEY).toBe('zen_test_key_123');
      expect(process.env.OPENAI_BASE_URL).toBe('https://opencode.ai/zen/v1');
    });

    it('resolves OpenRouter free models to openai auth with OpenRouter base URL', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-key';
      delete process.env.OPENCODE_ZEN_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.AI_GATEWAY_API_KEY;

      const result = resolveOpenCodeSettings('nvidia/nemotron-3-ultra-550b-a55b:free');

      expect(result.model).toBe('nvidia/nemotron-3-ultra-550b-a55b:free');
      expect(result.auth).toBe('openai');
      expect(process.env.OPENAI_API_KEY).toBe('sk-or-v1-test-key');
      expect(process.env.OPENAI_BASE_URL).toBe('https://openrouter.ai/api/v1');
    });

    it('resolves Anthropic models when ANTHROPIC_API_KEY is present', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OPENCODE_ZEN_API_KEY;

      const result = resolveOpenCodeSettings('anthropic/claude-sonnet-4-6');

      expect(result.model).toBe('anthropic/claude-sonnet-4-6');
      expect(result.auth).toBe('anthropic');
    });

    it('resolves OpenAI models when OPENAI_API_KEY is present', () => {
      process.env.OPENAI_API_KEY = 'sk-openai-test-key';
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OPENCODE_ZEN_API_KEY;

      const result = resolveOpenCodeSettings('openai/gpt-4o');

      expect(result.model).toBe('openai/gpt-4o');
      expect(result.auth).toBe('openai');
    });

    it('resolves AI Gateway when AI_GATEWAY_API_KEY is present', () => {
      process.env.AI_GATEWAY_API_KEY = 'gw_test_key';
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENCODE_ZEN_API_KEY;

      const result = resolveOpenCodeSettings('anthropic/claude-sonnet-4-6');

      expect(result.auth).toBe('ai-gateway');
    });

    it('falls back to OpenRouter when only OPENROUTER_API_KEY is available', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-test-fallback';
      delete process.env.OPENCODE_ZEN_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.AI_GATEWAY_API_KEY;

      const result = resolveOpenCodeSettings();

      expect(result.model).toBe('openrouter/free');
      expect(result.auth).toBe('openai');
      expect(process.env.OPENAI_API_KEY).toBe('sk-or-test-fallback');
      expect(process.env.OPENAI_BASE_URL).toBe('https://openrouter.ai/api/v1');
    });
  });

  describe('extractLatestUserPrompt', () => {
    it('extracts text from single-part user message', () => {
      const messages: UIMessage[] = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Build a canvas game' }] },
      ];

      expect(extractLatestUserPrompt(messages)).toBe('Build a canvas game');
    });

    it('extracts and trims text from multi-turn chat, picking the latest user message', () => {
      const messages: UIMessage[] = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'How can I help?' }] },
        { id: '3', role: 'user', parts: [{ type: 'text', text: '   Add a restart button   ' }] },
        { id: '4', role: 'assistant', parts: [{ type: 'text', text: 'Done!' }] },
      ];

      expect(extractLatestUserPrompt(messages)).toBe('Add a restart button');
    });

    it('concatenates multiple text parts in the same user message', () => {
      const messages: UIMessage[] = [
        {
          id: '1',
          role: 'user',
          parts: [
            { type: 'text', text: 'Part 1: Create index.html' },
            { type: 'text', text: 'Part 2: Create game.js' },
          ],
        },
      ];

      expect(extractLatestUserPrompt(messages)).toBe(
        'Part 1: Create index.html\nPart 2: Create game.js'
      );
    });

    it('returns empty string when there are no user messages', () => {
      const messages: UIMessage[] = [
        { id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Welcome!' }] },
      ];

      expect(extractLatestUserPrompt(messages)).toBe('');
      expect(extractLatestUserPrompt([])).toBe('');
    });
  });

  describe('getSandboxHandle', () => {
    it('unwraps getSandboxSession() if present on session', () => {
      const mockInnerSandbox = { run: () => ({ exitCode: 0 }) };
      const mockHarnessSession = {
        sessionId: 'test_session',
        getSandboxSession: () => mockInnerSandbox,
      };

      const handle = getSandboxHandle(mockHarnessSession);
      expect(handle).toBe(mockInnerSandbox);
    });

    it('returns session directly if getSandboxSession is not a method', () => {
      const mockDirectSandbox = { run: () => ({ exitCode: 0 }) };
      const handle = getSandboxHandle(mockDirectSandbox);
      expect(handle).toBe(mockDirectSandbox);
    });

    it('handles null/undefined gracefully', () => {
      expect(getSandboxHandle(null)).toBeNull();
      expect(getSandboxHandle(undefined)).toBeUndefined();
    });
  });

  describe('CODING_AGENT_MODELS contract', () => {
    it('defines valid models with id, name, and provider', () => {
      expect(CODING_AGENT_MODELS.length).toBeGreaterThan(0);

      for (const m of CODING_AGENT_MODELS) {
        expect(m.id).toBeTruthy();
        expect(m.name).toBeTruthy();
        expect(m.provider).toBeTruthy();
      }
    });

    it('includes OpenCode Zen models and free OpenRouter models', () => {
      const zenModels = CODING_AGENT_MODELS.filter((m) => m.provider === 'OpenCode Zen');
      expect(zenModels.length).toBeGreaterThan(0);
      expect(zenModels.some((m) => m.id === 'opencode/big-pickle')).toBe(true);

      const freeModels = CODING_AGENT_MODELS.filter((m) => m.free);
      expect(freeModels.length).toBeGreaterThan(0);
      expect(freeModels.some((m) => m.id.includes('nemotron'))).toBe(true);
      expect(freeModels.some((m) => m.id === 'openrouter/free')).toBe(true);
    });
  });
});
