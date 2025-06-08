from dataclasses import dataclass
from app.models.interval  import Interval
from typing import List

@dataclass
class Configuration:
    name: str

    monday: List[Interval]
    tuesday: List[Interval]
    wednesday: List[Interval]
    thursday: List[Interval]
    friday: List[Interval]
    saturday: List[Interval]
    sunday: List[Interval]