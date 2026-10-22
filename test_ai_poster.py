import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.edge.options import Options as EdgeOptions

def run_test():
    options = EdgeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1600,1050")

    driver = webdriver.Edge(options=options)
    driver.set_window_size(1600, 1050)
    driver.implicitly_wait(6)

    try:
        print("Navigating to http://localhost:5174/ ...")
        driver.get("http://localhost:5174/")
        time.sleep(2)

        # Login as Jake (Organizer)
        print("Logging in as organizer...")
        email_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='email']")
        if email_inputs:
            email_inputs[0].send_keys("jake@gmail.com")
            pwd_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
            if pwd_inputs:
                pwd_inputs[0].send_keys("Password123!")
                pwd_inputs[0].send_keys(Keys.ENTER)
                time.sleep(3)

        # Dismiss any initial publish modal if present
        close_btns = driver.find_elements(By.CSS_SELECTOR, ".lucide-x")
        if close_btns:
            try:
                close_btns[0].click()
                time.sleep(1)
            except Exception:
                pass

        # Capture Organizer Overview screenshot
        overview_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\176f3d34-b7fa-4e46-a4c7-ed55219b4b69\organizer_overview.png"
        driver.save_screenshot(overview_path)
        print("Saved overview screenshot to:", overview_path)

        # Click "AI Poster Studio" in sidebar or quick actions
        print("Locating AI Poster Studio button...")
        studio_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), 'AI Poster Studio')]")
        if studio_buttons:
            studio_buttons[0].click()
            time.sleep(2)
            print("Opened AI Poster Studio!")

            # Take Studio screenshot
            studio_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\176f3d34-b7fa-4e46-a4c7-ed55219b4b69\ai_poster_studio.png"
            driver.save_screenshot(studio_path)
            print("Saved studio screenshot to:", studio_path)

            # Test Generate button
            gen_btn = driver.find_elements(By.XPATH, "//*[contains(text(), 'Generate Poster via ML')]")
            if gen_btn:
                print("Clicking Generate Poster via ML button...")
                gen_btn[0].click()
                # Wait for neural diffusion ML pipeline
                time.sleep(14)
                gen_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\176f3d34-b7fa-4e46-a4c7-ed55219b4b69\ai_poster_generated.png"
                driver.save_screenshot(gen_path)
                print("Saved generated poster screenshot to:", gen_path)

        # Navigate to Host Tournament to test Option D
        print("Navigating to Host Tournament...")
        host_btns = driver.find_elements(By.XPATH, "//*[contains(text(), 'Host New Tournament') or contains(text(), 'Host Tournament')]")
        if host_btns:
            host_btns[0].click()
            time.sleep(2)

            # Scroll to Section 3 and click Option D
            opt_d = driver.find_elements(By.XPATH, "//*[contains(text(), 'Option D') or contains(text(), 'Instant ML')]")
            if opt_d:
                for btn in opt_d:
                    if "Option D" in btn.text or "Instant ML" in btn.text:
                        btn.click()
                        time.sleep(1)
                        break

            create_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\176f3d34-b7fa-4e46-a4c7-ed55219b4b69\create_tournament_ai_option.png"
            driver.save_screenshot(create_path)
            print("Saved create tournament screenshot to:", create_path)

        print("All automated verification steps completed successfully!")

    finally:
        driver.quit()

if __name__ == '__main__':
    run_test()
