from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting Playwright...")
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(args=["--no-sandbox", "--disable-setuid-sandbox"])
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:5173...")
            page.goto("http://localhost:5173", timeout=60000)
            print("Page loaded.")

            # Click Enter Experience
            print("Waiting for ENTER EXPERIENCE button...")
            try:
                page.get_by_text("ENTER EXPERIENCE").click(timeout=5000)
                print("Clicked Enter.")
            except:
                print("ENTER EXPERIENCE button not found or click failed. Maybe already entered?")
                # Continue anyway, check canvas

            # Wait for canvas
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=60000)
            print("Canvas found.")

            # Wait for shaders
            print("Waiting for shaders (10s)...")
            time.sleep(10)

            # Screenshot 1: Default View
            print("Taking screenshot 1...")
            page.screenshot(path="verification_view1.png", timeout=120000)

            # Scroll to move camera
            print("Scrolling...")
            page.mouse.wheel(0, 1000)
            time.sleep(2)
            print("Taking screenshot 2...")
            page.screenshot(path="verification_view2.png", timeout=120000)

            # Drag to move
            print("Dragging...")
            page.mouse.move(400, 300)
            page.mouse.down()
            page.mouse.move(200, 300, steps=20)
            page.mouse.up()
            time.sleep(2)
            print("Taking screenshot 3...")
            page.screenshot(path="verification_view3.png", timeout=120000)

            print("Verification complete.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
