import time
from threading import Event
import app.repositories.state_repo as sr
from app.mqtt import mqtt_service
import threading
import json

ACK_TIMEOUT = 5
ack_event = Event()

# Track connected devices
connected_devices = {
    "relay": {"status": "offline", "ip_address": None},
    "sensor": {"status": "offline", "ip_address": None}
}

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

        # Extract device_id from topic (branko/devices/relay_1/status -> relay_1)
        device_id = topic.split("/")[2]

        if status == "online":
            print(f"[DEVICE STATUS] {device_id} ({device_type}) connected from {ip_address}")
            if device_type in connected_devices:
                connected_devices[device_type]["status"] = "online"
                connected_devices[device_type]["ip_address"] = ip_address
                connected_devices[device_type]["device_id"] = device_id
        elif status == "offline":
            print(f"[DEVICE STATUS] {device_id} disconnected")
            if device_type:
                connected_devices[device_type]["status"] = "offline"
            else:
                # If device_type not in offline message, try to find by device_id
                for dev_type, dev_info in connected_devices.items():
                    if dev_info.get("device_id") == device_id:
                        connected_devices[dev_type]["status"] = "offline"
                        break

        print(f"[DEVICE STATUS] Current devices: {connected_devices}")

    except json.JSONDecodeError:
        print(f"[DEVICE STATUS] Invalid JSON payload: {payload}")
    except Exception as e:
        print(f"[DEVICE STATUS] Error handling device status: {e}")

def get_connected_devices():
    """Return the current status of connected devices"""
    return connected_devices