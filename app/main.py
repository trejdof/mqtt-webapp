from app.models.interval import Interval
from app.models.configuration import Configuration
from app.models.time import Time
from app.repositories.config_repo import *
from app.repositories.state_repo import *
from app.constants import DAYS_OF_WEEK

def main():

    state = load_state_threadsafe()
    print_state(state)

    temp_heartbeat(26.5)

    state = load_state_threadsafe()
    print_state(state)

if __name__ == "__main__":
    main()