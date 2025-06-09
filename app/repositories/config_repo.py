import json
from pathlib import Path
from app.models.configuration import Configuration
from app.models.interval import Interval
from app.models.time import Time
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
    return [
        Interval(
            ON_temperature=item["ON_temperature"],
            OFF_temperature=item["OFF_temperature"],
            # Time class's constructor computes timestamp here
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