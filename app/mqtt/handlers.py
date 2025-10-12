import time
from threading import Event
import app.repositories.state_repo as sr
import app.repositories.device_status_repo as device_repo
from app.mqtt import mqtt_service
import threading
import json

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

def handle_device_status(topic: str, payload: str):
    """
    Handle device connection status messages
    Topic format: branko/devices/{device_id}/status
    Payload format: {"status": "online"/"offline", "device_type": "relay"/"sensor", "ip_address": "192.168.1.x"}
    """
    try:
        data = json.loads(payload)
        status = data.get("status")
        device_type = data.get("device_type")
        ip_address = data.get("ip_address")

        # Extract device_id from topic (branko/devices/relay/status -> relay)
        device_id = topic.split("/")[2]

        if status == "online":
            print(f"[DEVICE STATUS] {device_id} ({device_type}) connected from {ip_address}")
            device_repo.update_device_status(device_type, "online", ip_address, device_id)
        elif status == "offline":
            print(f"[DEVICE STATUS] {device_id} disconnected")
            # For offline, we need to figure out which device type it is
            # Try to get it from the payload first, otherwise check existing status
            if device_type:
                device_repo.update_device_status(device_type, "offline")
            else:
                # Check which device has this device_id and mark it offline
                current_status = device_repo.load_device_status_threadsafe()
                if current_status.relay.device_id == device_id:
                    device_repo.update_device_status("relay", "offline")
                elif current_status.sensor.device_id == device_id:
                    device_repo.update_device_status("sensor", "offline")

        # Print current status
        current_status = device_repo.load_device_status_threadsafe()
        print(f"[DEVICE STATUS] Current devices: relay={current_status.relay.status}, sensor={current_status.sensor.status}")

    except json.JSONDecodeError:
        print(f"[DEVICE STATUS] Invalid JSON payload: {payload}")
    except Exception as e:
        print(f"[DEVICE STATUS] Error handling device status: {e}")

def get_connected_devices():
    """Return the current status of connected devices"""
    device_status = device_repo.load_device_status_threadsafe()
    return {
        "relay": {
            "status": device_status.relay.status,
            "ip_address": device_status.relay.ip_address,
            "device_id": device_status.relay.device_id
        },
        "sensor": {
            "status": device_status.sensor.status,
            "ip_address": device_status.sensor.ip_address,
            "device_id": device_status.sensor.device_id
        }
    }