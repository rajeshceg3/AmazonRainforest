from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        print("Browser launched")
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        try:
            print("Navigating...")
            page.goto("http://localhost:5173", timeout=60000)
            print("Loaded")

            # Click Enter Experience
            try:
                page.get_by_text("ENTER EXPERIENCE").click(timeout=10000)
                print("Clicked ENTER EXPERIENCE")
            except:
                print("Could not find ENTER EXPERIENCE, maybe auto-started or stuck")

            # Wait for canvas
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=60000)
            print("Canvas found")

            # Wait for shaders to compile and render
            time.sleep(15)

            # Screenshot 1: Default View
            print("Taking screenshot 1")
            page.screenshot(path="verification_view1.png", timeout=120000)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
