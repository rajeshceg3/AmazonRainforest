from playwright.sync_api import sync_playwright
import time
import os
import json

def verify_drag():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 800, "height": 600})

        # page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        print("Navigating to app...")
        try:
            page.goto("http://localhost:5173", wait_until="domcontentloaded")
        except Exception as e:
            print(f"Navigation warning: {e}")

        # Wait for button
        try:
            print("Waiting for enter button...")
            button = page.wait_for_selector("text=ENTER EXPERIENCE", timeout=30000)
            if button:
                button.click()
                print("Clicked enter button")
        except Exception as e:
            print(f"Could not find start button: {e}")
            browser.close()
            return

        print("Waiting for scene to be ready (checking _debug_camera_euler)...")

        # Wait until window._debug_camera_euler is defined
        try:
            page.wait_for_function("() => typeof window._debug_camera_euler !== 'undefined'", timeout=60000)
            print("Scene appears ready.")
        except Exception as e:
            print(f"Timeout waiting for scene: {e}")
            browser.close()
            return

        time.sleep(2) # Extra settle time

        # Get initial camera Euler
        initial_euler = page.evaluate("() => window._debug_camera_euler")
        print(f"Initial Euler: {initial_euler}")

        print("Performing drag (simulating look)...")
        # Start at center
        cx, cy = 400, 300
        page.mouse.move(cx, cy)
        page.mouse.down()
        # Drag DOWN by 100 pixels
        page.mouse.move(cx, cy + 100, steps=10)
        page.mouse.up()

        time.sleep(1)

        # Get final camera Euler
        final_euler = page.evaluate("() => window._debug_camera_euler")
        print(f"Final Euler: {final_euler}")

        if initial_euler and final_euler:
             dx = final_euler['x'] - initial_euler['x']
             dy = final_euler['y'] - initial_euler['y']
             print(f"Change: dX={dx}, dY={dy}")

             if abs(dx) > 0.01 or abs(dy) > 0.01:
                  print("SUCCESS: Camera rotated significantly.")
             else:
                  print("FAILURE: Camera did not rotate significantly.")
        else:
             print("FAILURE: Could not retrieve camera state.")

        browser.close()

if __name__ == "__main__":
    verify_drag()
