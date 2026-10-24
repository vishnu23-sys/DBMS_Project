/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  // native / heavy server-only packages are loaded from node_modules at runtime
  serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node', 'sharp'],
};

export default nextConfig;
