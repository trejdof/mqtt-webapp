import json
from pathlib import Path
from app.models.state import State
from app.models.time import Time
from app.models.configuration import Configuration
import app.repositories.config_repo as cfg
from datetime import time, datetime
import threading
import math

_state_lock = threading.Lock()

STATE_FILE = Path("storage/state.json")


def load_state_threadsafe() -> State:
    with _state_lock:
        with open(STATE_FILE, 'r') as f:
            state = json.load(f)

        return State(
            selected_config=state["selected_configuration"],
            active_interval=state["active_interval"],
            boiler_state=state["boiler_state"],
            current_temp=state["current_temp"],
            current_timestamp=parse_time(state["current_timestamp"]),
            prev_temp=state["prev_temp"],
            prev_timestamp=parse_time(state["prev_timestamp"]),
            temp_measure_period=state["temp_measure_period"],
            consecutive_measures=state["consecutive_measures"],
            hysteresis=state.get("hysteresis", 0.5)
        )


def save_state_threadsafe(state: State):
    with _state_lock:
        with open(STATE_FILE, 'w') as f:
            json.dump({
                "selected_configuration": state.selected_config,
                "active_interval": state.active_interval,
                "boiler_state": state.boiler_state,
                "current_temp": state.current_temp,
                "current_timestamp": state.current_timestamp.replace(microsecond=0).isoformat(),
                "prev_temp": state.prev_temp,
                "prev_timestamp": state.prev_timestamp.replace(microsecond=0).isoformat(),
                "temp_measure_period": state.temp_measure_period,
                "consecutive_measures": state.consecutive_measures,
                "hysteresis": state.hysteresis
            }, f, indent=4)


def change_selected_configuration(name: str, current_time: Time):
    new_config = cfg.load_config(name)
    new_active_interval =  cfg.find_active_interval(new_config, current_time)

    state = load_state_threadsafe()
    state.selected_config = new_config.name
    state.active_interval = new_active_interval
    save_state_threadsafe(state)


def temp_heartbeat(temp: float) -> bool:
    now = datetime.now()
    time_obj = Time(now.hour, now.minute)

    rounded_temp = round_temperature(temp)
    record_temperature_reading(rounded_temp, now)

    state = load_state_threadsafe()
    config = cfg.load_config(state.selected_config)


    active_interval = cfg.find_active_interval(config, time_obj)

    if active_interval != state.active_interval:
        update_active_interval(active_interval)

    boiler_toggle = should_toggle_boiler(rounded_temp, state.boiler_state, active_interval, config)

    return boiler_toggle


def should_toggle_boiler(temp: float, boiler_state: bool, active_interval: str, config: Configuration) -> bool:

    active_interval_obj = cfg.get_interval_obj(config, active_interval)

    print(f"[TOGGLE CHECK] Current: {temp}°C, Boiler: {boiler_state_str(boiler_state)}, "
          f"ON_temp: {active_interval_obj.ON_temperature}°C, OFF_temp: {active_interval_obj.OFF_temperature}°C")

    if boiler_state:
        if temp >= active_interval_obj.OFF_temperature:
            print(f"[TOGGLE CHECK] Boiler ON and temp ({temp}°C) >= OFF threshold ({active_interval_obj.OFF_temperature}°C) - Turn OFF")
            return True
        else:
            print(f"[TOGGLE CHECK] Boiler ON but temp ({temp}°C) < OFF threshold ({active_interval_obj.OFF_temperature}°C) - Stay ON")
    else:
        if temp <= active_interval_obj.ON_temperature:
            print(f"[TOGGLE CHECK] Boiler OFF and temp ({temp}°C) <= ON threshold ({active_interval_obj.ON_temperature}°C) - Turn ON")
            return True
        else:
            print(f"[TOGGLE CHECK] Boiler OFF but temp ({temp}°C) > ON threshold ({active_interval_obj.ON_temperature}°C) - Stay OFF")

    return False


def toggle_boiler():
    state = load_state_threadsafe()

    old_boiler_state = state.boiler_state
    state.boiler_state = not state.boiler_state

    save_state_threadsafe(state)

    print(f"[NOTIFY] Boiler state changed from {boiler_state_str(old_boiler_state)} to {boiler_state_str(state.boiler_state)}")


def update_active_interval(interval: str):
    state = load_state_threadsafe()
    config = cfg.load_config(state.selected_config)

    old_interval_string = state.active_interval
    old_interval_obj = cfg.get_interval_obj(config, old_interval_string)
    new_interval_obj = cfg.get_interval_obj(config, interval)

    state.active_interval = interval
    save_state_threadsafe(state)

    print(f"[NOTIFY] Interval changed: {old_interval_obj} => {new_interval_obj}")


def round_temperature(temp: float) -> float:
    """
    Round temperature down to 1 decimal place for conservative/stable readings.

    Examples:
        21.22 -> 21.2
        21.26 -> 21.2
        21.30 -> 21.3

    Args:
        temp: Raw temperature reading

    Returns:
        Temperature rounded down to 1 decimal place
    """
    return math.floor(temp * 10) / 10


def record_temperature_reading(temp: float, timestamp: time):
    state = load_state_threadsafe()

    state.prev_temp = state.current_temp
    state.prev_timestamp = state.current_timestamp

    state.current_temp = temp
    state.current_timestamp = timestamp

    save_state_threadsafe(state)
    if state.prev_temp != state.current_temp:
        print(f"[STATE] Temperature changed from {state.prev_temp} to {state.current_temp}")


def parse_time(t: str) -> datetime:
    return datetime.fromisoformat(t)


def print_state(state: State):
    print("===================================================================================")
    print(f"  Selected configuration:               {state.selected_config}")
    print(f"  Active interval:                      {state.active_interval}")
    print(f"  Boiler state:                         {state.boiler_state}")
    print(f"  Current temp:                         {state.current_temp}°C at {state.current_timestamp}")
    print(f"  Previous temp:                        {state.prev_temp}°C at {state.prev_timestamp}")
    print(f"  Temperature measure period:           {state.temp_measure_period}")
    print(f"  Consecutive temperature measures:     {state.consecutive_measures}")
    print("===================================================================================")


def boiler_state_str(state: bool) -> str:
    return "ON" if state else "OFF"


def update_hysteresis(value: float):
    state = load_state_threadsafe()
    state.hysteresis = value
    save_state_threadsafe(state)