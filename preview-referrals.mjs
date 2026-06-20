import { chromium } from 'playwright';

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sd2Rudmp6ZG5ibW92ZXVjY3VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MDY1MywiZXhwIjoyMDg4OTE2NjUzfQ.B-jaiGxKpdMnjw_ncpduFxNPH9HmjUglC9U18BaD1Sc";
const SUPABASE_URL = "https://mlwdnvjzdnbmoveuccud.supabase.co";

async function getHashedToken() {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email: 'chasementalwellness@gmail.com' }),
  });
  const data = await resp.json();
  return data.hashed_token;
}

async function main() {
  const hashedToken = await getHashedToken();
  console.log('hashed_token obtained:', hashedToken?.substring(0, 20) + '...');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

  // Use the /auth/callback route to set SSR session cookies directly
  const callbackUrl = `http://localhost:3000/auth/callback?token_hash=${hashedToken}&type=magiclink&next=/member/referrals`;
  console.log('Navigating to auth callback...');
  await page.goto(callbackUrl, { waitUntil: 'networkidle', timeout: 60000 });
  
  const currentUrl = page.url();
  console.log('After callback, at:', currentUrl);
  
  if (currentUrl.includes('/login') || currentUrl.includes('error')) {
    // Fallback: check debug-auth
    const bodyText = await page.textContent('body').catch(() => '');
    console.log('Auth may have failed. Body:', bodyText.substring(0, 200));
  }

  // Ensure membership is active via debug-auth
  console.log('Activating membership...');
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const debugBody = await page.textContent('body').catch(() => '{}');
  console.log('debug-auth:', debugBody);
  
  // Navigate to referrals
  console.log('Navigating to /member/referrals...');
  await page.goto('http://localhost:3000/member/referrals', { waitUntil: 'networkidle', timeout: 60000 });
  
  const title = await page.title();
  console.log('Page title:', title);
  console.log('Final URL:', page.url());
  
  // Wait for content to render
  await page.waitForTimeout(3000);
  
  // Screenshot top of page
  await page.screenshot({ path: '/tmp/referrals-top.png', fullPage: false });
  console.log('Screenshot 1 saved: /tmp/referrals-top.png');
  
  // Scroll to results area
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/referrals-mid.png', fullPage: false });
  console.log('Screenshot 2 saved: /tmp/referrals-mid.png');

  // Scroll further to see divider
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/referrals-lower.png', fullPage: false });
  console.log('Screenshot 3 saved: /tmp/referrals-lower.png');

  await browser.close();
  
  if (consoleErrors.length > 0) {
    console.log('\nConsole errors:', consoleErrors.join('\n'));
  } else {
    console.log('\nNo console errors.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
