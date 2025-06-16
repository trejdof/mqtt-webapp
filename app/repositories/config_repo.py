import json
from pathlib import Path
from app.models.configuration import Configuration
from app.models.interval import Interval
from app.models.time import Time
from typing import List, Dict
from app.constants import DAYS_OF_WEEK
from datetime import datetime

CONFIG_FILE = Path("storage/configurations.json")


def load_config(name: str) -> Configuration:
    with open(CONFIG_FILE, 'r') as f:
        all_configs = json.load(f)

    config =  all_configs[name]

    return Configuration(
        name=name,
        monday=parse_intervals(config["monday"]),
        tuesday=parse_intervals(config["tuesday"]),
        wednesday=parse_intervals(config["wednesday"]),
        thursday=parse_intervals(config["thursday"]),
        friday=parse_intervals(config["friday"]),
        saturday=parse_intervals(config["saturday"]),
        sunday=parse_intervals(config["sunday"]),
    )

def parse_intervals(raw_list: List[Dict]) -> List[Interval]:
    return [
        Interval(
            ON_temperature=float(item["ON_temperature"]),
            OFF_temperature=float(item["OFF_temperature"]),
            # Time class constructor computes timestamp here
            # No need to parse it as well. 
            start_time=Time(item["start_time"]["hour"], item["start_time"]["minute"]),
            end_time=Time(item["end_time"]["hour"], item["end_time"]["minute"]),
        )
        for item in raw_list
    ]


def create_config(name: str):
    all_configs = load_all_configs()
    
    if name in all_configs:
        raise ValueError(f"Configuration '{name}' already exists.")

    new_config = {day: [] for day in DAYS_OF_WEEK}

    all_configs[name] = new_config

    save_all_configs(all_configs)

    print(f"Configuration '{name}' created with empty schedule")


def delete_config(name: str):
    all_configs = load_all_configs()

    if name not in all_configs:
        raise ValueError(f"Configuration '{name}' does not exist.")
    
    del all_configs[name]

    save_all_configs(all_configs)
    
    print(f"Configuration '{name}' has been deleted.")


def load_all_configs() -> Dict:
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)


def save_all_configs(configs: Dict):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(configs, f, indent=4)


def check_interval_list(intervals: List[Interval]) -> bool:
    if not intervals:
        raise ValueError("Interval list is empty")

    # Check 1st requirement: first start_time should be last end_time + 1
    first_start = intervals[0].start_time.timestamp
    last_end = intervals[-1].end_time.timestamp
    expected_first_start = (last_end + 1) % (24 * 60) # Edge case when 23:59 is last end

    if first_start != expected_first_start:
        raise ValueError(f"First and Last timestamp in whole list are not continuous")

    wrap_count = 0
    n = len(intervals)

    for i in range(n):
        current = intervals[i]
        start = current.start_time.timestamp
        end = current.end_time.timestamp

        if start > end: # means this Interval passes midnight
            wrap_count += 1
            if wrap_count > 1:
                raise ValueError("More than one midnight pass")

        if i > 0:
            prev_end = intervals[i - 1].end_time.timestamp
            expected_start = (prev_end + 1) % (24 * 60) # Has to do % in case 23:59 was prev_end
            if start != expected_start:
                raise ValueError(f"Intervals {i} and {i + 1} are not continuous: ")

    return True


def find_active_interval(config: Configuration, time: Time) -> str:
    day = datetime.today().strftime("%A").lower()
    intervals = getattr(config, day)

    for i, interval in enumerate(intervals):
        start = interval.start_time.timestamp
        end = interval.end_time.timestamp

        if start < end:
            if start <= time.timestamp <= end:
                return f"{day}:{i}"
        else: # interval wraps past midnight
            if time.timestamp >= start or time.timestamp <= end:
                return f"{day}:{i}"


def get_interval_obj(config: Configuration, target_interval: str) -> Interval:
    day, index_str = target_interval.split(":")
    index = int(index_str)

    # config.day[index]
    return getattr(config, day)[index]
