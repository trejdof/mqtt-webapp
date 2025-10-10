from fastapi import APIRouter, HTTPException
from app.repositories import config_repo, state_repo

router = APIRouter()

@router.get("/configs")
def get_all_configs():
    return config_repo.load_all_configs()


@router.get("/configs/{name}")
def get_config(name: str):
    try:
        return config_repo.load_config(name)
    except KeyError:
        raise HTTPException(status_code=404, detail = f"Configuration '{name}' not found")


@router.post("/configs/{name}")
def create_config(name: str):
    try:
        config_repo.create_config(name)
        return {"status": "created", "name": name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/configs/{name}")
def delete_config(name: str):
    try:
        # Get current state to check if config is active
        state = state_repo.load_state_threadsafe()
        config_repo.delete_config(name, current_selected_config=state.selected_config)
        return {"status": "deleted", "name": name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/configs/{name}")
def update_config(name: str, config_data: dict):
    try:
        all_configs = config_repo.load_all_configs()
        
        # Check if config exists
        if name not in all_configs:
            raise HTTPException(status_code=404, detail=f"Configuration '{name}' not found")
        
        # Validate each day's intervals
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            if day in config_data and config_data[day]:  # Only validate if day has intervals
                intervals = config_repo.parse_intervals(config_data[day])
                config_repo.check_interval_list(intervals)
        
        # Update and save if validation passes
        all_configs[name] = config_data
        config_repo.save_all_configs(all_configs)
        
        return {"status": "updated", "name": name}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=f"Configuration '{name}' not found")