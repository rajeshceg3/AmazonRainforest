from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        try:
            page.goto("http://localhost:5173", timeout=60000)

            # Click Enter Experience
            print("Looking for Enter Experience button...")
            page.get_by_role("button", name="Enter Experience").click()
            print("Clicked button.")

            # Wait for canvas
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", timeout=60000)

            # Wait for shaders
            time.sleep(10)

            # Screenshot 1: Default View
            page.screenshot(path="verification_view1.png", timeout=120000)

            # Scroll to move camera
            page.mouse.wheel(0, 1000)
            time.sleep(2)
            page.screenshot(path="verification_view2.png", timeout=120000)

            # Drag to move
            page.mouse.move(400, 300)
            page.mouse.down()
            page.mouse.move(200, 300, steps=20)
            page.mouse.up()
            time.sleep(2)
            page.screenshot(path="verification_view3.png", timeout=120000)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
