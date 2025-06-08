from app.models.interval import Interval
from app.models.configuration import Configuration
from app.models.time import Time
from app.repositories.config_repo import *
from app.constants import DAYS_OF_WEEK

def main():

    delete_config("test1")
    delete_config("test2")
    delete_config("test4")
    print(json.dumps(load_all_configs(), indent=4))



if __name__ == "__main__":
    main()