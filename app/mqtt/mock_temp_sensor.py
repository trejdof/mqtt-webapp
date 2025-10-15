"""
Mock Temperature Sensor
Simulates an ESP32 temperature sensor publishing to MQTT.
"""
import time
import random
from threading import Thread, Event
from datetime import datetime

MOCK_SENSOR_TOPIC = "branko/sensor/temperature"
PUBLISH_INTERVAL = 5  # seconds
TEMP_MIN = 20.0
TEMP_MAX = 22.0

class MockTemperatureSensor:
    """
    Mock temperature sensor that publishes readings every 15 seconds.

    Important: Temperature changes only after 3 consecutive identical readings.
    This simulates the real sensor behavior where 3 same readings = confirmed temperature.
    """

    def __init__(self, mqtt_client):
        self.mqtt_client = mqtt_client
        self.stop_event = Event()
        self.thread = None
        self.current_temp = 20.0
        self.target_temp = 20.0
        self.consecutive_count = 0
        self.is_running = False

    def start(self):
        if self.is_running:
            print("[MOCK SENSOR] Already running")
            return

        self.is_running = True
        self.stop_event.clear()
        self.thread = Thread(target=self._publishing_loop, daemon=True)
        self.thread.start()
        print(f"[MOCK SENSOR] Started - Publishing to {MOCK_SENSOR_TOPIC} every {PUBLISH_INTERVAL}s")
        print(f"[MOCK SENSOR] Temperature range: {TEMP_MIN}-{TEMP_MAX}°C")
        print("[MOCK SENSOR] Note: 3 consecutive same readings = temperature actually changed")

    def stop(self):
        if not self.is_running:
            return

        print("[MOCK SENSOR] Stopping...")
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=2)
        self.is_running = False
        print("[MOCK SENSOR] Stopped")

    def _get_next_temperature(self):
        """
        Temperature only changes after 3 consecutive same readings.
        This mimics the real sensor behavior.
        """
        self.consecutive_count += 1

        if self.consecutive_count >= 3:
            self.current_temp = self.target_temp
            self.target_temp = round(random.uniform(TEMP_MIN, TEMP_MAX), 1)
            self.consecutive_count = 0
            print(f"[MOCK SENSOR] Temperature confirmed at {self.current_temp}°C, new target: {self.target_temp}°C")

        return self.target_temp

    def _publish_temperature(self, temp):
        try:
            payload = f"{temp:.1f}"
            result = self.mqtt_client.publish(MOCK_SENSOR_TOPIC, payload, qos=0, retain=False)

            if result.rc == 0:
                timestamp = datetime.now().strftime("%H:%M:%S")
                print(f"[MOCK SENSOR] [{timestamp}] Published: {payload}°C (count: {self.consecutive_count}/3)")
            else:
                print(f"[MOCK SENSOR] Failed to publish temperature, rc={result.rc}")
        except Exception as e:
            print(f"[MOCK SENSOR] Error publishing temperature: {e}")

    def _publishing_loop(self):
        time.sleep(2)

        while not self.stop_event.is_set():
            temp = self._get_next_temperature()
            self._publish_temperature(temp)

            self.stop_event.wait(PUBLISH_INTERVAL)

    def get_status(self):
        return {
            "running": self.is_running,
            "current_temp": self.current_temp,
            "target_temp": self.target_temp,
            "consecutive_count": self.consecutive_count,
            "publish_interval": PUBLISH_INTERVAL
        }


_mock_sensor_instance = None

def init_mock_sensor(mqtt_client):
    global _mock_sensor_instance
    if _mock_sensor_instance is None:
        _mock_sensor_instance = MockTemperatureSensor(mqtt_client)
    return _mock_sensor_instance

def start_mock_sensor():
    if _mock_sensor_instance:
        _mock_sensor_instance.start()
    else:
        print("[MOCK SENSOR] Error: Not initialized. Call init_mock_sensor() first.")

def stop_mock_sensor():
    if _mock_sensor_instance:
        _mock_sensor_instance.stop()

def get_mock_sensor_status():
    if _mock_sensor_instance:
        return _mock_sensor_instance.get_status()
    return {"running": False}
