import json
from pathlib import Path
from app.models.state import State
from app.models.time import Time
from app.repositories.config_repo import load_config, find_active_interval
from datetime import time

STATE_FILE = Path("storage/state.json")


def load_state() -> State:
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)

    return State(
        selected_config=state["selected_configuration"],
        active_interval=state["active_interval"],
        boiler_state=state["boiler_state"],
        current_temp=state["current_temp"],
        current_timestamp=parse_time(state["current_timestamp"]),
        prev_temp=state["prev_temp"],
        prev_timestamp=parse_time(state["prev_timestamp"])
    )


def save_state(state: State):
    with open(STATE_FILE, 'w') as f:
        json.dump({
            "selected_configuration": state.selected_config,
            "active_interval": state.active_interval,
            "boiler_state": state.boiler_state,
            "current_temp": state.current_temp,
            "current_timestamp": state.current_timestamp.isoformat(),
            "prev_temp": state.prev_temp,
            "prev_timestamp": state.prev_timestamp.isoformat()
        }, f, indent=4)



def change_selected_configuration(name: str, current_time: Time):
    new_config = load_config(name)
    new_active_interval =  find_active_interval(new_config, current_time)

    state = load_state()
    state.selected_config = new_config.name
    state.active_interval = new_active_interval
    save_state(state)


def parse_time(t: str) -> time:
    return time.fromisoformat(t)


def print_state(state: State):
    print("State:")
    print(f"  Selected configuration: {state.selected_config}")
    print(f"  Active interval:        {state.active_interval}")
    print(f"  Boiler state:           {state.boiler_state}")
    print(f"  Current temp:           {state.current_temp}°C at {state.current_timestamp}")
    print(f"  Previous temp:          {state.prev_temp}°C at {state.prev_timestamp}")
