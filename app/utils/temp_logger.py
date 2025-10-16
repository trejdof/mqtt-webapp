from pathlib import Path
from datetime import datetime
import threading

_log_lock = threading.Lock()

TEMP_READINGS_DIR = Path("temp_readings")


def log_temperature_change(temp: float, timestamp: datetime):

    TEMP_READINGS_DIR.mkdir(exist_ok=True)

    date_str = timestamp.strftime("%Y_%m_%d")
    log_file = TEMP_READINGS_DIR / f"{date_str}.txt"

    time_str = timestamp.strftime("%H:%M:%S")

    with _log_lock:
        with open(log_file, 'a') as f:
            f.write(f"{time_str},{temp:.1f}\n")