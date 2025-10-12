import json
from pathlib import Path
from app.models.device_status import DeviceStatus, DeviceInfo
import threading

_device_status_lock = threading.Lock()

DEVICE_STATUS_FILE = Path("storage/device_status.json")


def load_device_status_threadsafe() -> DeviceStatus:
    """Load device status from JSON file"""
    with _device_status_lock:
        # Create file with defaults if it doesn't exist
        if not DEVICE_STATUS_FILE.exists():
            default_status = DeviceStatus(
                relay=DeviceInfo(status="offline", ip_address=None, device_id=None),
                sensor=DeviceInfo(status="offline", ip_address=None, device_id=None)
            )
            # Save directly without acquiring lock again (we already have it)
            DEVICE_STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(DEVICE_STATUS_FILE, 'w') as f:
                json.dump({
                    "relay": {
                        "status": default_status.relay.status,
                        "ip_address": default_status.relay.ip_address,
                        "device_id": default_status.relay.device_id
                    },
                    "sensor": {
                        "status": default_status.sensor.status,
                        "ip_address": default_status.sensor.ip_address,
                        "device_id": default_status.sensor.device_id
                    }
                }, f, indent=4)
            return default_status

        with open(DEVICE_STATUS_FILE, 'r') as f:
            data = json.load(f)

        return DeviceStatus(
            relay=DeviceInfo(
                status=data["relay"]["status"],
                ip_address=data["relay"].get("ip_address"),
                device_id=data["relay"].get("device_id")
            ),
            sensor=DeviceInfo(
                status=data["sensor"]["status"],
                ip_address=data["sensor"].get("ip_address"),
                device_id=data["sensor"].get("device_id")
            )
        )


def save_device_status_threadsafe(device_status: DeviceStatus):
    """Save device status to JSON file"""
    with _device_status_lock:
        DEVICE_STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(DEVICE_STATUS_FILE, 'w') as f:
            json.dump({
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
            }, f, indent=4)


def update_device_status(device_type: str, status: str, ip_address: str = None, device_id: str = None):
    """Update status for a specific device (relay or sensor)"""
    device_status = load_device_status_threadsafe()

    if device_type == "relay":
        device_status.relay = DeviceInfo(
            status=status,
            ip_address=ip_address if status == "online" else device_status.relay.ip_address,
            device_id=device_id if status == "online" else device_status.relay.device_id
        )
    elif device_type == "sensor":
        device_status.sensor = DeviceInfo(
            status=status,
            ip_address=ip_address if status == "online" else device_status.sensor.ip_address,
            device_id=device_id if status == "online" else device_status.sensor.device_id
        )

    save_device_status_threadsafe(device_status)
