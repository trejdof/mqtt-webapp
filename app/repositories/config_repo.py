import json
from pathlib import Path
from app.models.configuration import Configuration
from app.models.interval import Interval
from typing import List, Dict

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