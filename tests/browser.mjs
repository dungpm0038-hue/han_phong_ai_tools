import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE_PATH ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const failures = [];
try {
  await mkdir("artifacts", { recursive: true });
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    page.on("pageerror", (error) => failures.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    assert.match(await page.title(), /Hàn Phong/);
    assert.ok(await page.getByRole("heading", { level: 1 }).isVisible());
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `no horizontal overflow at ${viewport.width}px`,
    );
    await page
      .getByText("Mình có cần trả phí để sử dụng không?", { exact: true })
      .click();
    assert.ok(
      await page.getByText(/Không. Gói Free có 15 yêu cầu/).isVisible(),
    );
    assert.ok(
      await page.getByRole("link", { name: /01 \/ AI Chat/ }).isVisible(),
      "tool cards are never hidden by animations",
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `artifacts/landing-${viewport.width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("link", { name: /Bắt đầu miễn phí/ })
      .first()
      .click();
    await page.waitForURL("**/register");
    assert.ok(
      await page.getByRole("textbox", { name: "Địa chỉ email" }).isVisible(),
    );
    // Test environment intentionally lacks credentials; submission must fail closed.
    assert.ok(
      await page.getByRole("button", { name: "Tạo tài khoản" }).isDisabled(),
    );
    await page.goto(`${base}/pricing`);
    assert.ok(
      await page
        .getByRole("heading", { name: "Không gian cho mọi khởi đầu." })
        .isVisible(),
    );
    await page.goto(`${base}/dashboard`);
    await page.waitForURL("**/login?setup=1");
    await page.goto(`${base}/tools/chat`);
    await page.waitForURL("**/login?setup=1");
    await page.goto(`${base}/not-a-real-page`);
    assert.ok(
      await page
        .getByRole("heading", { name: "Trang này chưa có ở đây." })
        .isVisible(),
    );
    await page.goto(base);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      "Chuyển đến nội dung",
    );
    await page.close();
  }
  const response = await fetch(`${base}/api/ai`, {
    method: "POST",
    headers: {
      origin: "https://untrusted.example",
      "content-type": "application/json",
    },
    body: "{}",
  });
  assert.equal(
    response.status,
    403,
    "foreign Origin rejected before provider calls",
  );
  const protectedResponse = await fetch(`${base}/api/conversations`);
  assert.equal(protectedResponse.status, 503, "unconfigured auth fails closed");
  assert.deepEqual(failures, [], "no browser runtime errors");
  console.log(
    "PASS: desktop/mobile landing, FAQ, auth setup guard, private redirects, 404, keyboard skip link, API origin guard.",
  );
} finally {
  await browser.close();
}
