import json
from pathlib import Path
from app.models.configuration import Configuration
from app.models.interval import Interval
from typing import List, Dict
from app.constants import DAYS_OF_WEEK

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
    return [Interval(**item) for item in raw_list]

def create_config(name: str):
    with open(CONFIG_FILE, 'r') as f:
        all_configs = json.load(f)

    if name in all_configs:
        raise ValueError(f"Configuration '{name}' already exists.")

    empty_schedule = {day: [] for day in DAYS_OF_WEEK}

    all_configs[name] = empty_schedule

    with open(CONFIG_FILE, 'w') as f:
        json.dump(all_configs, f, indent=4)

    print(f"Configuration '{name}' created with empty schedule")