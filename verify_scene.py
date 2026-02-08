from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

        page.goto("http://localhost:5173")

        # Wait for button to be present and click it
        try:
            page.wait_for_selector("button", timeout=5000)
            page.click("button")
            print("Start button clicked")
        except:
            print("Start button not found or timed out")

        # Wait for canvas to be present
        page.wait_for_selector("canvas", timeout=10000)

        # Wait a bit for Three.js to render
        time.sleep(5)

        # Initial view (Forest Floor / Mid)
        page.screenshot(path="verification_initial.png")
        print("Initial screenshot taken")

        # Scroll UP (negative deltaY) to go DOWN to River
        # Simulate wheel event
        # Playwright mouse.wheel(delta_x, delta_y)
        # We want negative delta_y.
        page.mouse.wheel(0, -2000)
        time.sleep(3) # Wait for interpolation
        page.screenshot(path="verification_river.png")
        print("River screenshot taken")

        # Scroll DOWN (positive deltaY) to go UP to Canopy
        # We are at Y=1. We want Y=25. Delta needed: +24.
        # Factor is 0.01. So we need 2400 deltaY.
        page.mouse.wheel(0, 4000)
        time.sleep(3)
        page.screenshot(path="verification_canopy.png")
        print("Canopy screenshot taken")

        browser.close()

if __name__ == "__main__":
    run()
