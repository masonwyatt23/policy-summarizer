// Deployment-specific configuration for handling timeouts and processing

export const getDeploymentConfig = () => {
  const isDeployed = !!process.env.REPL_ID;
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDeployed,
    isProduction,
    environment: isDeployed ? 'DEPLOYED' : 'PREVIEW',
    
    // Timeout configurations (in milliseconds)
    timeouts: {
      xaiRequest: isDeployed ? 120000 : 60000, // 2 minutes for deployment, 1 minute for preview
      pdfExtraction: isDeployed ? 30000 : 15000, // 30s for deployment, 15s for preview
      totalProcessing: isDeployed ? 180000 : 90000, // 3 minutes for deployment, 1.5 minutes for preview
    },
    
    // Text processing limits
    textLimits: {
      maxCharacters: isDeployed ? 40000 : 100000, // Smaller limit for deployment
      truncateWarning: isDeployed ? 30000 : 80000, // Warning threshold
    },
    
    // Retry configurations
    retries: {
      maxAttempts: isDeployed ? 2 : 3,
      delayMs: isDeployed ? 2000 : 1000,
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