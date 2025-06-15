from app.models.interval import Interval
from app.models.configuration import Configuration
from app.models.time import Time
from app.repositories.config_repo import *
from app.repositories.state_repo import *
from app.constants import DAYS_OF_WEEK
from app.mqtt import client
from time import sleep


def main():
    client.start_mqtt()
    client.start_temperature_watchdog()

    state = load_state_threadsafe()
    print_state(state)

    try:
        while True:
            sleep(10)
    except KeyboardInterrupt:
        print("Shutting down...")
        client.watchdog_stop_event.set()

if __name__ == "__main__":
    main()