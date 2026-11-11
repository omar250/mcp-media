export interface ModelConfig {
  id: string;
  type: "image" | "video";
  provider: "kie" | "comet";
  upstreamModel: string;
}

export const MODELS: Record<string, ModelConfig> = {
  "flux-pro": { id: "flux-pro", type: "image", provider: "kie", upstreamModel: "flux-pro" },
  "kling-video": { id: "kling-video", type: "video", provider: "kie", upstreamModel: "kling-v1" },
  "luma-dream": { id: "luma-dream", type: "video", provider: "comet", upstreamModel: "luma-ray" },
};

export function resolveModel(name: string): ModelConfig {
  return MODELS[name.toLowerCase()] || MODELS["flux-pro"];
}
