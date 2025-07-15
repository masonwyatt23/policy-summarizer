// Deployment-specific configuration for handling timeouts and processing

export const getDeploymentConfig = () => {
  const isDeployed = !!process.env.REPL_ID;
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDeployed,
    isProduction,
    environment: isDeployed ? 'DEPLOYED' : 'PREVIEW',
    
    // Aggressive timeout configurations for deployment (in milliseconds)
    timeouts: {
      xaiRequest: isDeployed ? 90000 : 60000, // 1.5 minutes for deployment, 1 minute for preview
      pdfExtraction: isDeployed ? 20000 : 15000, // 20s for deployment, 15s for preview
      totalProcessing: isDeployed ? 150000 : 90000, // 2.5 minutes for deployment, 1.5 minutes for preview
    },
    
    // Very aggressive text processing limits for deployment
    textLimits: {
      maxCharacters: isDeployed ? 25000 : 100000, // Very small limit for deployment
      truncateWarning: isDeployed ? 20000 : 80000, // Warning threshold
      chunkSize: isDeployed ? 8000 : 15000, // Process in smaller chunks for deployment
    },
    
    // Aggressive retry configurations
    retries: {
      maxAttempts: isDeployed ? 3 : 2, // More retries for deployment
      delayMs: isDeployed ? 1000 : 1000, // Shorter delay for faster retries
      exponentialBackoff: isDeployed, // Use exponential backoff only in deployment
    },
    
    // Deployment-specific processing options
    processing: {
      useChunking: isDeployed, // Break large documents into chunks
      aggressiveTimeout: isDeployed, // Use shorter individual timeouts
      simplifiedPrompts: isDeployed, // Use shorter, simpler prompts
    },
    
    // Logging configurations
    logging: {
      verbose: true, // Always verbose for debugging deployment issues
      includeTimings: true,
      includeMemory: isDeployed,
    }
  };
};

export type DeploymentConfig = ReturnType<typeof getDeploymentConfig>;