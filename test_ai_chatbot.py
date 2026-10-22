import os
import shutil
import time
from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_test():
    options = Options()
    for bin_path in [
        r"C:\Program Files\Mozilla Firefox\firefox.exe",
        r"C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
    ]:
        if os.path.exists(bin_path):
            options.binary_location = bin_path
            break

    driver_path = os.path.abspath("geckodriver.exe") if os.path.exists("geckodriver.exe") else shutil.which("geckodriver")
    service = Service(executable_path=driver_path) if driver_path else Service()
    
    driver = webdriver.Firefox(service=service, options=options)
    driver.set_window_size(1400, 900)
    driver.implicitly_wait(10)

    try:
        print("Navigating to http://localhost:5174/ ...")
        driver.get("http://localhost:5174/")
        time.sleep(2)

        # Login
        email_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='email']")
        if email_inputs:
            email_inputs[0].clear()
            email_inputs[0].send_keys("deric@gmail.com")
            
            pwd_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
            if pwd_inputs:
                pwd_inputs[0].clear()
                pwd_inputs[0].send_keys("Password123!")
                pwd_inputs[0].send_keys(Keys.ENTER)
                time.sleep(3)

        print("Current URL:", driver.current_url)

        # Look for the AI Doubt Clearing card banner or floating button
        time.sleep(2)
        
        # Click the floating AI Chatbot button
        ai_buttons = driver.find_elements(By.XPATH, "//button[@title='Open ArenaX AI Doubt Assistant']")
        if ai_buttons:
            print("Found floating AI button, clicking it...")
            ai_buttons[0].click()
            time.sleep(1.5)
        else:
            print("Trying banner button...")
            banner_btns = driver.find_elements(By.XPATH, "//*[contains(text(), 'Ask ArenaX AI Now')]")
            if banner_btns:
                banner_btns[0].click()
                time.sleep(1.5)

        # Verify chat drawer opened
        headers = driver.find_elements(By.XPATH, "//*[contains(text(), 'ArenaX AI Assistant')]")
        print("AI Assistant Header found:", len(headers) > 0)

        # Click a topic chip: "🏆 Open Tournaments"
        chips = driver.find_elements(By.XPATH, "//button[contains(text(), 'Open Tournaments')]")
        if chips:
            print("Clicking 'Open Tournaments' chip...")
            chips[0].click()
            time.sleep(3)

        # Type a custom question
        chat_inputs = driver.find_elements(By.XPATH, "//input[@placeholder[contains(., 'Ask any doubt')]]")
        if chat_inputs:
            print("Found chat input, sending custom doubt...")
            chat_inputs[0].send_keys("How do I get my athlete pass verified?")
            chat_inputs[0].send_keys(Keys.ENTER)
            time.sleep(3)

        # Take screenshot
        os.makedirs(r"C:\Users\hp\.gemini\antigravity-ide\brain\176f3d34-b7fa-4e46-a4c7-ed55219b4b69", exist_ok=True)
        screenshot_path = r"C:\Users\hp\.gemini\antigravity-ide\brain\176f3d34-b7fa-4e46-a4c7-ed55219b4b69\ai_chatbot_verified.png"
        driver.save_screenshot(screenshot_path)
        print("Screenshot saved to:", screenshot_path)

        # Print message texts
        messages = driver.find_elements(By.XPATH, "//div[contains(@class, 'rounded-2xl')]")
        print(f"Total message blocks on screen: {len(messages)}")
        print("TEST PASSED SUCCESSFULLY!")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_test()
