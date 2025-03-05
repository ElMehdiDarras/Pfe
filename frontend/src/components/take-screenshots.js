// take-screenshots.js
const { firefox } = require('playwright');

async function captureScreenshots() {
  console.log('Starting screenshot capture...');
  
  // Launch a browser
  const browser = await firefox.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // List of routes to capture
  const routes = [
    { path: '/', name: 'dashboard' },
    { path: '/monitoring', name: 'monitoring' },
    { path: '/configuration', name: 'configuration' },
    { path: '/statistique', name: 'statistics' },
    { path: '/cartes', name: 'maps' },
    { path: '/historique', name: 'history' },
    { path: '/sites/rabat-hay-nahda', name: 'site-nahda' },
    { path: '/sites/rabat-soekarno', name: 'site-soekarno' },
    { path: '/sites/casa-nations-unies', name: 'site-casa' },
  ];

  // Make sure your React app is running at this URL
  const baseUrl = 'http://localhost:3000';

  // Take screenshots for each route
  for (const route of routes) {
    console.log(`Capturing ${route.name}...`);
    
    try {
      // Navigate to the page
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
      
      // Wait a moment for any animations or data loading
      await page.waitForTimeout(1000);
      
      // Take screenshot of the full page
      await page.screenshot({ 
        path: `screenshots/${route.name}-full.png`,
        fullPage: true 
      });
      
      console.log(`✓ Captured ${route.name} full page`);
      
      // Capture specific sections
      // 1. App bar / Navigation
      try {
        const appBar = await page.$('.MuiAppBar-root');
        if (appBar) {
          await appBar.screenshot({ path: `screenshots/${route.name}-appbar.png` });
          console.log(`✓ Captured ${route.name} app bar`);
        }
      } catch (e) {
        console.log(`Could not capture app bar for ${route.name}`, e);
      }
      
      // 2. Main content area
      try {
        const mainContent = await page.$('.MuiContainer-root');
        if (mainContent) {
          await mainContent.screenshot({ path: `screenshots/${route.name}-content.png` });
          console.log(`✓ Captured ${route.name} main content`);
        }
      } catch (e) {
        console.log(`Could not capture main content for ${route.name}`, e);
      }
      
      // 3. Cards (if present)
      try {
        const cards = await page.$$('.MuiCard-root');
        for (let i = 0; i < cards.length && i < 3; i++) {  // Limit to first 3 cards to avoid too many screenshots
          await cards[i].screenshot({ path: `screenshots/${route.name}-card-${i+1}.png` });
          console.log(`✓ Captured ${route.name} card ${i+1}`);
        }
      } catch (e) {
        console.log(`Could not capture cards for ${route.name}`, e);
      }
      
    } catch (error) {
      console.error(`Error capturing ${route.name}:`, error);
    }
  }

  // Close the browser
  await browser.close();
  console.log('Screenshot capture complete! Check the screenshots folder.');
}

// Run the function
captureScreenshots().catch(console.error);