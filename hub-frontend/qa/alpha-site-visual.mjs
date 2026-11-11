import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const widths = [320, 375, 390, 768, 1024, 1440];
const routes = ["/", "/apps", "/apps/software", "/pricing", "/support", "/safety", "/login", "/dashboard"];
const screenRoutes = new Set(["/", "/apps/software", "/pricing", "/dashboard"]);
const screenshotWidths = new Set([390, 768, 1440]);
const dir = path.join(process.cwd(), "qa-screenshots");
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const warnings = [];
const rows = [];

for (const width of widths) {
  for (const route of routes) {
    const page = await browser.newPage({
      viewport: { width, height: width < 500 ? 844 : width < 1000 ? 1024 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    const errors = [];
    page.on("pageerror", e => errors.push(String(e.message).slice(0, 180)));
    let status = 0;
    try {
      const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 40000 });
      status = response?.status() || 0;
      await page.waitForTimeout(route === "/" ? 1600 : 750);
      const result = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const visible = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > .05 && r.width > 1 && r.height > 1;
        };
        const out = [];
        const inScrollableCarousel = (node) => {
          for (let p = node.parentElement; p && p !== document.body; p = p.parentElement) {
            const style = getComputedStyle(p);
            if (/(auto|scroll)/.test(style.overflowX) && p.scrollWidth > p.clientWidth + 5) return true;
          }
          return false;
        };
        for (const el of document.querySelectorAll("header a,header button,main a,main button,main input,main select,main textarea,main h1,main h2,main h3")) {
          if (!visible(el) || inScrollableCarousel(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.left < -8 || r.right > width + 8) {
            out.push({ tag: el.tagName, text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40), left: Math.round(r.left), right: Math.round(r.right) });
          }
        }
        const overflowSources = [...document.querySelectorAll("main *")]
          .filter(el => visible(el) && !inScrollableCarousel(el) && el.getBoundingClientRect().right > width + 12)
          .map(el => ({tag:el.tagName,cls:typeof el.className === "string" ? el.className.slice(0,90) : "",right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left)}))
          .sort((a,b) => b.right-a.right).slice(0,14);
        const fixed = document.querySelector("div.fixed.bottom-0.left-0.right-0.z-50");
        const socials = fixed ? [...fixed.querySelectorAll('a[aria-label="Telegram"],a[aria-label="X"]')].filter(visible).length : 0;
        const bodyFont = getComputedStyle(document.body).fontFamily;
        const styles = getComputedStyle(document.documentElement);
        return {
          documentWidth: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
          viewportWidth: width,
          overflowControls: out.slice(0, 12),
          overflowSources,
          socialsInMobileTicker: socials,
          bodyFont,
          gold: styles.getPropertyValue("--gold").trim(),
          bg: styles.getPropertyValue("--bg").trim(),
          menuVisible: [...document.querySelectorAll('header button[aria-label*="navigation menu"]')].some(visible),
          upcoming: !!document.querySelector("#upcoming"),
          headingCount: document.querySelectorAll("h1").length
        };
      });
      const issues = [];
      if (status !== 200) issues.push("HTTP " + status);
      if (result.documentWidth > width + 4) issues.push("document horizontal overflow " + result.documentWidth + ", sources=" + JSON.stringify(result.overflowSources.slice(0, 8)));
      if (result.overflowControls.length) issues.push("controls outside viewport: " + JSON.stringify(result.overflowControls));
      if (width < 640 && result.socialsInMobileTicker > 0) issues.push("mobile ticker social overlay");
      if (result.gold !== "231 188 103" || result.bg !== "9 9 11") issues.push("brand tokens inconsistent");
      if (!/manrope/i.test(result.bodyFont)) issues.push("unexpected body font " + result.bodyFont);
      if (route === "/apps/software" && !result.upcoming) issues.push("roadmap missing");
      const standalone = route.startsWith("/apps") || route === "/support";
      if (width < 1024 && !standalone && !result.menuVisible) issues.push("mobile navigation toggle missing");
      if (width < 1024) {
        const menu = page.getByRole("button", { name: "Open navigation menu" });
        if (!standalone && await menu.isVisible()) {
          await menu.click();
          const close = page.getByRole("button", { name: "Close navigation menu" });
          await page.waitForTimeout(250);
          if (!(await close.isVisible())) issues.push("mobile navigation did not open on click");
          else {
            const mobileNav = page.locator("#alpha-mobile-nav");
            if (!(await mobileNav.getByRole("link", { name: "Telegram" }).isVisible())) issues.push("Telegram missing from mobile menu");
            if (!(await mobileNav.getByRole("link", { name: "X / Twitter" }).isVisible())) issues.push("X missing from mobile menu");
            await close.click();
          }
        }
      }
      if (errors.length) warnings.push({ route, width, pageerrors: errors.slice(0, 3) });
      if (screenRoutes.has(route) && screenshotWidths.has(width)) {
        const filename = (route === "/" ? "home" : route.slice(1).replaceAll("/", "-")) + "-" + width + ".png";
        await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
        await page.screenshot({ path: path.join(dir, filename), fullPage: false, animations: "disabled" });
        if (route === "/apps/software") {
          await page.locator("#upcoming").scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          await page.screenshot({ path: path.join(dir, "upcoming-" + width + ".png"), fullPage: false, animations: "disabled" });
        }
      }
      rows.push({ route, width, status, ...result, issues });
      for (const issue of issues) failures.push({ route, width, issue });
    } catch (error) {
      failures.push({ route, width, issue: String(error).slice(0, 350) });
      rows.push({ route, width, status, error: String(error).slice(0, 350) });
    } finally {
      await page.close();
    }
  }
}
await browser.close();
await writeFile(path.join(dir, "results.json"), JSON.stringify({ base, rows, failures, warnings }, null, 2));
console.log(JSON.stringify({ base, tests: rows.length, failures: failures.length, warnings: warnings.length, sampleFailures: failures.slice(0, 20) }, null, 2));
assert.equal(failures.length, 0, "Responsive layout checks failed; see qa-screenshots/results.json");
