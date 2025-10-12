from dataclasses import dataclass
from typing import Optional

@dataclass
class DeviceInfo:
    status: str  # "online" or "offline"
    ip_address: Optional[str]
    device_id: Optional[str]

@dataclass
class DeviceStatus:
    relay: DeviceInfo
    sensor: DeviceInfo
