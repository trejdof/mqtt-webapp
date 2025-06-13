from app.models.interval import Interval
from app.models.configuration import Configuration
from app.models.time import Time
from app.repositories.config_repo import *
from app.repositories.state_repo import *
from app.constants import DAYS_OF_WEEK
from app.mqtt.client import start_mqtt
from time import sleep


def main():
    start_mqtt()

    state = load_state_threadsafe()
    print_state(state)

    try:
        while True:
            sleep(10)
    except KeyboardInterrupt:
        print("Shutting down...")

if __name__ == "__main__":
    main()