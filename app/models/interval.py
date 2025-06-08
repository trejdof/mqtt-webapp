from dataclasses import dataclass
from app.models.time import Time

@dataclass
class Interval:
    ON_temperature: float
    OFF_temperature: float
    start_time: Time
    end_time: Time