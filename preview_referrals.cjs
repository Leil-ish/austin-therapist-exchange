const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Auth via token_hash callback
  const authUrl = 'http://localhost:3000/auth/callback?token_hash=6a9829fbdbacddcf9f28709df39ffcb00ba1dbac348ca99b9a3b4e23&type=magiclink&next=/member/referrals';
  await page.goto(authUrl, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('After auth, URL:', page.url());

  // Ensure profile is active via debug endpoint
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'networkidle', timeout: 15000 });
  const debugText = await page.textContent('body');
  console.log('Debug auth:', debugText?.slice(0, 200));

  // Go to referrals
  await page.goto('http://localhost:3000/member/referrals', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Referrals URL:', page.url());
  await page.screenshot({ path: '/tmp/referrals_blank.png', fullPage: false });

  // Fill in the minimum required fields to trigger results
  // Level of care
  await page.click('button:has-text("Weekly Therapy")').catch(async () => {
    // Try select
    const levelBtn = await page.$('[role="combobox"]');
    if (levelBtn) await levelBtn.click();
    await page.click('text=Weekly Therapy').catch(() => {});
  });

  await page.screenshot({ path: '/tmp/referrals_step1.png', fullPage: false });

  // Wait a moment for form to update
  await page.waitForTimeout(1000);
  
  // Try to find and fill form fields by looking at what's visible
  const bodyText = await page.textContent('body');
  console.log('Body snippet:', bodyText?.slice(0, 500));

  await page.screenshot({ path: '/tmp/referrals_form.png', fullPage: true });
  await browser.close();
  console.log('Done. Screenshots saved to /tmp/referrals_*.png');
})();
