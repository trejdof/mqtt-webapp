from dataclasses import dataclass
from app.models.configuration import Configuration
from app.models.interval import Interval
from datetime import datetime

@dataclass
class State:
    selected_config: str
    active_interval: str
    boiler_state: bool
    current_temp: float
    current_timestamp: datetime
    prev_temp: float
    prev_timestamp: datetime
    temp_measure_period: int
    consecutive_measures: int
