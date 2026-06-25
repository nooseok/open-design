import type {
  FinalizeAnthropicRequest,
  FinalizeDaemonRequest,
  FinalizeProviderProtocol,
} from '@open-design/contracts';

import { effectiveMaxTokens } from '../state/maxTokens';
import type { ApiProtocol, AppConfig } from '../types';

const FINALIZE_PROTOCOLS = new Set<FinalizeProviderProtocol>([
  'anthropic',
  'openai',
  'azure',
  'google',
  'ollama',
]);

export interface FinalizeCredentialsMissingToast {
  message: string;
  details: string | null;
}

function resolveFinalizeProtocol(config: AppConfig): FinalizeProviderProtocol {
  const protocol = config.apiProtocol ?? 'anthropic';
  return FINALIZE_PROTOCOLS.has(protocol as FinalizeProviderProtocol)
    ? (protocol as FinalizeProviderProtocol)
    : 'anthropic';
}

function resolveByokFields(config: AppConfig, protocol: ApiProtocol) {
  const saved = config.apiProtocolConfigs?.[protocol];
  return {
    apiKey: (saved?.apiKey ?? config.apiKey ?? '').trim(),
    baseUrl: (saved?.baseUrl ?? config.baseUrl ?? '').trim(),
    model: (saved?.model ?? config.model ?? '').trim(),
    apiVersion: (saved?.apiVersion ?? config.apiVersion ?? '').trim(),
  };
}

export function isFinalizeByokConfigured(config: AppConfig): boolean {
  const protocol = resolveFinalizeProtocol(config);
  const { apiKey, model } = resolveByokFields(config, protocol);
  return Boolean(apiKey && model);
}

export function buildFinalizeRequest(
  config: AppConfig,
): FinalizeAnthropicRequest | (FinalizeDaemonRequest & { mode: 'daemon' }) | null {
  if (config.mode === 'daemon') {
    if (!config.agentId) return null;
    const choice = config.agentModels?.[config.agentId];
    return {
      mode: 'daemon',
      agentId: config.agentId,
      model: choice?.model ?? null,
      reasoning: choice?.reasoning ?? null,
    };
  }

  const protocol = resolveFinalizeProtocol(config);
  const { apiKey, baseUrl, model, apiVersion } = resolveByokFields(
    config,
    protocol,
  );
  if (!apiKey || !model) return null;

  return {
    protocol,
    apiKey,
    ...(baseUrl ? { baseUrl } : {}),
    model,
    maxTokens: effectiveMaxTokens(config),
    ...(protocol === 'azure' && apiVersion ? { apiVersion } : {}),
  };
}

export function buildFinalizeCredentialsMissingToast(
  config: AppConfig,
): FinalizeCredentialsMissingToast {
  if (config.mode === 'daemon') {
    return {
      message: 'Pick a local agent first.',
      details: 'Open the agent/model selector and choose an available local CLI agent.',
    };
  }

  return {
    message: 'Bad request — check the API key and model.',
    details: 'Open Settings → BYOK and verify your API key, base URL, and model.',
  };
}
