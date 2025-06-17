import time
from threading import Event
import app.repositories.state_repo as sr
from app.mqtt import mqtt_service
import threading

ACK_TIMEOUT = 5
ack_event = Event()

def handle_temperature_ping(temp: float):
    print(f"[MQTT] Temperature ping: {temp}")
    should_toggle = sr.temp_heartbeat(temp)
    if should_toggle:
        threading.Thread(target=toggle_with_ack, daemon=True).start()
    print("__________________________________________________________________________")

def handle_boiler_ack(payload: str):
    if payload.strip() == "ACK":
        print(f"[HANDLER] Received ACK")
        ack_event.set()


def wait_for_ack_and_toggle():
    ack_event.clear()
    start = time.time()
    print(f"[HANDLER] Waiting for ACK")

    if ack_event.wait(timeout=5):
        print(f"[HANDLER] ACK received")
        sr.toggle_boiler()
    else:
        print(f"[HANDLER] No ACK received")

def toggle_with_ack():
    mqtt_service.publish_toggle_command()
    wait_for_ack_and_toggle()