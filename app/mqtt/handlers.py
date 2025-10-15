import time
from threading import Event
import app.repositories.state_repo as sr
import app.repositories.device_status_repo as device_repo
from app.mqtt import mqtt_service, topics
import threading
import json

ACK_TIMEOUT = 5
ack_event = Event()

# Relay sync state
relay_synced = False

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
    global relay_synced

    # Block if relay is not synced yet
    if not relay_synced:
        print("[HANDLER] Blocked: Relay not synced yet, skipping command")
        return

    # Determine target state (toggle current state)
    current_state = sr.load_state_threadsafe()
    target_state = "OFF" if current_state.boiler_state else "ON"

    # Publish ON or OFF command
    mqtt_service.publish_boiler_command(target_state)
    wait_for_ack_and_toggle()

def handle_device_status(topic: str, payload: str):
    """
    Handle device connection status messages
    Topic format: branko/devices/{device_id}/status
    Payload format: {"status": "online"/"offline", "device_type": "relay"/"sensor", "ip_address": "192.168.1.x"}
    """
    global relay_synced

    try:
        data = json.loads(payload)
        status = data.get("status")
        device_type = data.get("device_type")
        ip_address = data.get("ip_address")

        device_id = topic.split("/")[2]

        if status == "online":
            print(f"[DEVICE STATUS] {device_id} ({device_type}) connected from {ip_address}")
            device_repo.update_device_status(device_type, "online", ip_address, device_id)
        elif status == "offline":
            print(f"[DEVICE STATUS] {device_id} disconnected")

            # If relay goes offline, block commands until it re-syncs
            if device_type == "relay" or device_id == "relay":
                relay_synced = False
                print("[STATE SYNC] Relay disconnected - Relay commands BLOCKED until re-sync")

            if device_type:
                device_repo.update_device_status(device_type, "offline")
            else:
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

def handle_state_sync_request(client):
    """
    Handle state sync request from ESP32 on boot.
    Sends current boiler state to ESP32.
    """
    print("[STATE SYNC] Received state sync request from ESP32")

    current_state = sr.load_state_threadsafe()
    state_str = "ON" if current_state.boiler_state else "OFF"

    # Publish current state to ESP32
    client.publish(topics.STATE_RESPONSE_TOPIC, state_str, qos=1)
    print(f"[STATE SYNC] Sent current state to ESP32: {state_str}")

def handle_state_sync_ack(payload):
    """
    Handle ACK from ESP32 after state sync is complete.
    """
    global relay_synced

    if payload.strip() == "ACK":
        relay_synced = True
        print("[STATE SYNC] ESP32 confirmed state sync successful - Relay commands UNBLOCKED")
    else:
        print(f"[STATE SYNC] Unexpected ACK payload: {payload}")