import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

async function run() {
  const screenshotDir = path.join(process.cwd(), "screenshots");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log("Launching Microsoft Edge via Playwright...");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  // 1. Desktop Test: 1440x900
  console.log("Testing Desktop 1440x900...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await desktopPage.waitForTimeout(1500);

  // Capture desktop hero
  await desktopPage.screenshot({
    path: path.join(screenshotDir, "hero-1440px.png"),
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("Captured hero-1440px.png");

  // Scroll to footer and capture
  const footerElement = await desktopPage.$("footer");
  if (footerElement) {
    await footerElement.scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(800);
    await footerElement.screenshot({
      path: path.join(screenshotDir, "footer-1440px.png"),
    });
    console.log("Captured footer-1440px.png");
  }

  // Run Axe accessibility & contrast check on desktop
  console.log("Running Axe accessibility contrast check...");
  const axeResults = await new AxeBuilder({ page: desktopPage })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const colorViolations = axeResults.violations.filter(
    (v) => v.id === "color-contrast"
  );
  console.log(`Desktop Axe Contrast Violations: ${colorViolations.length}`);
  if (colorViolations.length > 0) {
    console.log(JSON.stringify(colorViolations, null, 2));
  } else {
    console.log("✅ Color contrast passed with 0 violations at 1440px!");
  }

  // 2. Mobile Test: 390x844 (iPhone 13 / Pixel 7)
  console.log("Testing Mobile 390x844...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1500);

  // Capture mobile hero
  await mobilePage.screenshot({
    path: path.join(screenshotDir, "hero-390px.png"),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  console.log("Captured hero-390px.png");

  // Test mobile menu hamburger click
  const hamburger = await mobilePage.$('button[aria-label="Open navigation menu"]');
  if (hamburger) {
    await hamburger.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({
      path: path.join(screenshotDir, "mobile-sheet-390px.png"),
    });
    console.log("Captured mobile-sheet-390px.png");

    // Close menu
    const closeBtn = await mobilePage.$('button[aria-label="Close menu"]');
    if (closeBtn) {
      await closeBtn.click();
      await mobilePage.waitForTimeout(500);
    }
  }

  // Scroll to footer and capture mobile footer
  const mobileFooter = await mobilePage.$("footer");
  if (mobileFooter) {
    await mobileFooter.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(800);
    await mobileFooter.screenshot({
      path: path.join(screenshotDir, "footer-390px.png"),
    });
    console.log("Captured footer-390px.png");
  }

  // Run Axe on mobile
  const mobileAxeResults = await new AxeBuilder({ page: mobilePage })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

  const mobileColorViolations = mobileAxeResults.violations.filter(
    (v) => v.id === "color-contrast"
  );
  console.log(`Mobile Axe Contrast Violations: ${mobileColorViolations.length}`);
  if (mobileColorViolations.length === 0) {
    console.log("✅ Color contrast passed with 0 violations at 390px!");
  }

  await browser.close();
  console.log("All automated visual QA checks completed successfully!");
}

run().catch((err) => {
  console.error("Visual QA error:", err);
  process.exit(1);
});
