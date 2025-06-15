import paho.mqtt.client as mqtt
from app.mqtt import topics, handlers
from datetime import datetime, timedelta
from time import sleep
from threading import Thread, Event


MQTT_BROKER = "localhost"
MQTT_PORT = 1883
KEEPALIVE = 60

client = mqtt.Client()
last_temp_time = datetime.now()
watchdog_stop_event = Event()

def start_mqtt():
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(MQTT_BROKER, MQTT_PORT, KEEPALIVE)
    client.loop_start()


def on_connect(client, userdata, flags, rc):
    print("[MQTT] Connected with result code", rc)
    client.subscribe(topics.SENSOR_TOPIC)
    client.subscribe(topics.BOILER_TOPIC)


def on_message(client, userdata, msg):
    global last_temp_time
    topic = msg.topic
    payload = msg.payload

    if topic == topics.SENSOR_TOPIC:
        handlers.handle_temperature_ping(payload.decode())
        last_temp_time = datetime.now()
    elif topic == topics.BOILER_TOPIC:
        handlers.handle_boiler_ack(payload)
    else:
        print(f"[MQTT] Unhandled topic: {topic}")


def start_temperature_watchdog():
    print("[TEMPERATURE] Watchdog started")
    def watchdog():
        while not watchdog_stop_event.is_set():
            now = datetime.now()
            if now - last_temp_time > timedelta(minutes = 1):
                print("[WARNING] No temperature received in the last minute!")
            watchdog_stop_event.wait(30)  # 30s
    t = Thread(target=watchdog, daemon=True)
    t.start()