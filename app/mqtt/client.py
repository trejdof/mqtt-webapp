import paho.mqtt.client as mqtt
from app.mqtt import topics, handlers
from datetime import datetime, timedelta
from threading import Thread, Event
import time

client = mqtt.Client()
last_temp_time = datetime.now()
watchdog_stop_event = Event()

def start_mqtt():
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect("localhost", 1883, 60)
    client.loop_start()

def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] Connected with result code {rc}")
    client.subscribe(topics.SENSOR_TOPIC)
    client.subscribe(topics.ACK_TOPIC)
    client.subscribe(topics.DEVICE_STATUS_TOPIC_PATTERN)
    print(f"[MQTT] Subscribed to device status topic: {topics.DEVICE_STATUS_TOPIC_PATTERN}")

def on_message(client, userdata, msg):
    global last_temp_time
    topic = msg.topic
    payload = msg.payload.decode().strip()

    if topic == topics.SENSOR_TOPIC:
        last_temp_time = datetime.now()
        temp = float(payload)
        handlers.handle_temperature_ping(temp)
    elif topic == topics.ACK_TOPIC:
        handlers.handle_boiler_ack(payload)
    elif topic.startswith("branko/devices/") and topic.endswith("/status"):
        handlers.handle_device_status(topic, payload)

def start_temperature_watchdog():
    print("[WATCHDOG] Starting temperature watchdog...")
    def watchdog():
        while not watchdog_stop_event.is_set():
            if datetime.now() - last_temp_time > timedelta(minutes=1):
                print("[WATCHDOG] No temperature received in the last minute!")
            watchdog_stop_event.wait(30)
    Thread(target=watchdog, daemon=True).start()
