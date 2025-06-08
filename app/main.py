from app.models.interval import Interval
from app.models.configuration import Configuration
from app.models.time import Time
from app.repositories.config_repo import *
from app.constants import DAYS_OF_WEEK

def main():
    # config = load_config("default_schedule")

    # print(f"Loaded config: {config.name}")

    # for day_name in DAYS_OF_WEEK:
    #     intervals = getattr(config, day_name)
    #     print(f"{day_name.capitalize()}:")
    #     for interval in intervals:
    #         print(f"  ON: {interval.ON_temperature}, OFF: {interval.OFF_temperature}")
    # create_config("new_schedule")

    t = Time(8, 30)
    print(repr(t))

    t1 = Time(25, 61)


if __name__ == "__main__":
    main()