import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5175'
const MEDIA = '/cursor/stores/self/media/arcade-attic'

async function main() {
  await mkdir(MEDIA, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByText('Arcade Attic').first().waitFor()

  // Demo 1: welcome hero
  await page.screenshot({ path: path.join(MEDIA, 'v2-demo-1.png'), fullPage: false })
  console.log('saved v2-demo-1.png')

  // Create attic
  await page.getByLabel('Attic name').fill('Glow Loft')
  await page.getByRole('button', { name: 'Build attic' }).click()
  await page.getByRole('heading', { name: 'Glow Loft' }).waitFor()

  // Place décor on an empty tile
  const cells = page.locator('.cell')
  await cells.nth(3).click()

  // Switch floor vibe
  await page.getByRole('button', { name: 'Arcade check' }).click()

  // Play starter machine briefly
  await page.locator('.cell.has-machine').first().click()
  await page.getByText('Orb Catch').first().waitFor()
  const canvas = page.locator('canvas.game-canvas')
  await canvas.waitFor()
  const box = await canvas.boundingBox()
  if (box) {
    for (let i = 0; i < 10; i++) {
      await page.mouse.click(box.x + box.width * (0.2 + i * 0.07), box.y + 36 + i * 10)
      await page.waitForTimeout(100)
    }
  }
  await page.getByRole('button', { name: 'Close' }).click()

  // Author Lane Dash via stepped workshop
  await page.getByRole('button', { name: '+ New machine' }).click()
  await page.getByRole('button', { name: /Lane Dash/ }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: /Sunset|Chrome|Moss|Candy/ }).first().click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: /Chill|Classic|Spicy/ }).nth(1).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByLabel('Machine name').fill('Dash Shack')
  await page.getByRole('button', { name: 'Place in attic' }).click()
  await page.locator('.cell.place-target').nth(2).click()
  await page.getByText(/Dash Shack placed/).waitFor({ timeout: 3000 }).catch(() => {})

  // Author Wall Zap quickly
  await page.getByRole('button', { name: '+ New machine' }).click()
  await page.getByRole('button', { name: /Wall Zap/ }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByLabel('Machine name').fill('Zap Shack')
  await page.getByRole('button', { name: 'Place in attic' }).click()
  await page.locator('.cell.place-target').first().click()

  // Party: open + simulate friend + cheer
  await page.getByRole('button', { name: 'Party' }).click()
  await page.getByRole('button', { name: /Open party/ }).click()
  await page.getByRole('button', { name: 'Copy code' }).click()
  await page.getByRole('button', { name: '+ Rio' }).click()
  await page.getByText(/Rio hopped/).waitFor({ timeout: 3000 }).catch(() => {})
  await page.getByRole('button', { name: 'Let play' }).first().click()
  await page.getByRole('button', { name: 'Back to attic' }).click()

  // Demo 2: attic with machines + visitor
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(MEDIA, 'v2-demo-2.png'), fullPage: false })
  console.log('saved v2-demo-2.png')

  // Remix gallery
  await page.getByRole('button', { name: 'Remix gallery' }).click()
  await page.locator('.chip', { hasText: 'Lane Dash' }).click()
  await page.getByRole('button', { name: 'Remix into my attic' }).first().click()
  // remix workshop starts at feel step
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Place remix' }).click()
  await page.locator('.cell.place-target').first().click()

  // Mobile viewport smoke
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(300)
  await page.getByRole('heading', { name: 'Glow Loft' }).waitFor()

  console.log('playtest OK')
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
