from app.models.interval import Interval
from app.repositories.config_repo import *
from app.constants import DAYS_OF_WEEK

def main():
    config = load_config("default_schedule")

    print(f"Loaded config: {config.name}")

    for day_name in DAYS_OF_WEEK:
        intervals = getattr(config, day_name)
        print(f"{day_name.capitalize()}:")
        for interval in intervals:
            print(f"  ON: {interval.ON_temperature}, OFF: {interval.OFF_temperature}")

if __name__ == "__main__":
    main()