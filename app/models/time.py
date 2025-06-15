from dataclasses import dataclass, field

@dataclass

class Time:
    hours: int
    minutes: int
    timestamp: int = field(init = False)

    def __init__(self, hours, minutes):
        if not (0 <= hours < 24) or not (0 <= minutes < 60):
            raise ValueError("Invalid time")
        self.hours = hours
        self.minutes = minutes
        self.timestamp = hours * 60 + minutes


    def __repr__(self):
        return f"Time({self.hours:02d}:{self.minutes:02d}, timestamp:{self.timestamp})"


    def __str__(self):
        return f"{self.hours:02d}:{self.minutes:02d}"