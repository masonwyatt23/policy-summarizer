// Deployment readiness check for production environments
import { pool } from './db';

export async function checkDeploymentReadiness(): Promise<{
  isReady: boolean;
  issues: string[];
  warnings: string[];
}> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'XAI_API_KEY',
    'SESSION_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    issues.push(`Database connection failed: ${error.message}`);
  }

  // Check if session secret is secure for production
  if (process.env.NODE_ENV === 'production') {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 32) {
      issues.push('SESSION_SECRET should be at least 32 characters long in production');
    }
    if (sessionSecret === 'development-secret-key') {
      issues.push('SESSION_SECRET should not use development default in production');
    }
  }

  // Check XAI API key format
  if (process.env.XAI_API_KEY && !process.env.XAI_API_KEY.startsWith('xai-')) {
    warnings.push('XAI_API_KEY format may be incorrect (should start with "xai-")');
  }

  // Log session store configuration
  console.log('✅ Session store: Memory store (simplified for deployment stability)');

  return {
    isReady: issues.length === 0,
    issues,
    warnings
  };
}

// Run deployment check on startup
if (process.env.NODE_ENV === 'production') {
  checkDeploymentReadiness().then(result => {
    if (!result.isReady) {
      console.error('❌ Deployment issues found:');
      result.issues.forEach(issue => console.error(`  - ${issue}`));
      process.exit(1);
    }
    if (result.warnings.length > 0) {
      console.warn('⚠️  Deployment warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    console.log('✅ Deployment readiness check passed');
  });
}