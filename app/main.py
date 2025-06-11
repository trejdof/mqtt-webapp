from app.models.interval import Interval
from app.models.configuration import Configuration
from app.models.time import Time
from app.repositories.config_repo import *
from app.repositories.state_repo import *
from app.constants import DAYS_OF_WEEK

def main():

    state = load_state()
    print_state(state)

    print("##########################")
    current_time = Time(19, 31)
    change_selected_configuration('first',current_time)
    state = load_state()
    print_state(state)


if __name__ == "__main__":
    main()