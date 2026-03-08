from playwright.sync_api import sync_playwright
import time

def verify_scene():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        page.goto("http://localhost:5175")

        try:
            button = page.get_by_text("ENTER EXPERIENCE")
            button.click()
            print("Clicked enter button")
        except:
            print("Could not find start button")

        print("Waiting for scene...")
        time.sleep(15)

        # Drag to look up
        print("Looking up...")
        page.mouse.move(640, 360)
        page.mouse.down()
        page.mouse.move(640, 100, steps=10) # Drag up
        page.mouse.up()

        time.sleep(2)

        page.screenshot(path="verification_look_up.png")

        browser.close()

if __name__ == "__main__":
    verify_scene()
