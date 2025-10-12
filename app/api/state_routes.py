from fastapi import APIRouter, HTTPException
from app.repositories import state_repo, config_repo
from app.models.time import Time
from app.mqtt import handlers
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/state")
def get_state():
    """Get current system state"""
    try:
        state = state_repo.load_state_threadsafe()
        # Get server's current date and time
        server_time = datetime.now()

        # Check if temperature reading is stale (older than 1 minute)
        time_since_last_temp = server_time - state.current_timestamp
        is_temp_stale = time_since_last_temp > timedelta(minutes=1)

        return {
            "selected_config": state.selected_config,
            "active_interval": state.active_interval,
            "boiler_state": state.boiler_state,
            "current_temp": state.current_temp,
            "current_timestamp": state.current_timestamp.isoformat(),
            "prev_temp": state.prev_temp,
            "prev_timestamp": state.prev_timestamp.isoformat(),
            "temp_measure_period": state.temp_measure_period,
            "consecutive_measures": state.consecutive_measures,
            "server_time": server_time.isoformat(),
            "is_temp_stale": is_temp_stale
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading state: {str(e)}")


@router.post("/state/select-config")
def select_config(config_data: dict):
    """Change the selected configuration"""
    try:
        config_name = config_data.get("config_name")
        if not config_name:
            raise HTTPException(status_code=400, detail="config_name is required")
        
        # Check if config exists
        config_repo.load_config(config_name)
        
        # Get current time for finding active interval
        now = datetime.now()
        current_time = Time(now.hour, now.minute)
        
        # Change the selected configuration
        state_repo.change_selected_configuration(config_name, current_time)
        
        return {"status": "success", "selected_config": config_name}
        
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Configuration '{config_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing configuration: {str(e)}")


@router.get("/state/active-interval-details")
def get_active_interval_details():
    """Get detailed information about the currently active interval"""
    try:
        state = state_repo.load_state_threadsafe()
        config = config_repo.load_config(state.selected_config)

        if state.active_interval:
            interval_obj = config_repo.get_interval_obj(config, state.active_interval)
            return {
                "active_interval": state.active_interval,
                "start_time": str(interval_obj.start_time),
                "end_time": str(interval_obj.end_time),
                "ON_temperature": interval_obj.ON_temperature,
                "OFF_temperature": interval_obj.OFF_temperature
            }
        else:
            return {"active_interval": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting interval details: {str(e)}")


@router.get("/state/active-config")
def get_active_config():
    """Get the complete active configuration"""
    try:
        state = state_repo.load_state_threadsafe()

        if not state.selected_config:
            return {"config_name": None, "config": None}

        # Get the raw config data (dictionary format)
        all_configs = config_repo.load_all_configs()
        config_data = all_configs.get(state.selected_config)

        if config_data:
            return {
                "config_name": state.selected_config,
                "config": config_data
            }
        else:
            return {"config_name": state.selected_config, "config": None}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting active config: {str(e)}")


@router.get("/devices/status")
def get_devices_status():
    """Get status of connected devices (relay and sensor)"""
    try:
        devices = handlers.get_connected_devices()
        return {
            "relay": devices.get("relay", {"status": "offline", "ip_address": None, "device_id": None}),
            "sensor": devices.get("sensor", {"status": "offline", "ip_address": None, "device_id": None})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting device status: {str(e)}")