#!/usr/bin/env node

/**
 * Force redeploy to Vercel with clean cache
 * Usage: node scripts/force-deploy.js
 */

const { execSync } = require('child_process');

console.log('🚀 Starting force deployment to Vercel...\n');

try {
  // Check if vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Vercel CLI not installed.');
    console.log('\nInstall it with: npm i -g vercel');
    console.log('Then run: vercel login');
    process.exit(1);
  }

  console.log('✅ Vercel CLI detected\n');
  console.log('📦 Deploying to production with clean cache...\n');

  // Force production deployment
  execSync('vercel --prod --force', { stdio: 'inherit' });

  console.log('\n✨ Deployment complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Wait for deployment to finish (~5-10 minutes)');
  console.log('2. Run: npm run db:migrate:deploy');
  console.log('3. Test your endpoints');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\n💡 Manual alternative:');
  console.log('1. Go to Vercel dashboard → Deployments');
  console.log('2. Click ⋯ menu → Redeploy');
  console.log('3. Uncheck "Use existing Build Cache"');
  console.log('4. Click Redeploy');
  process.exit(1);
}
