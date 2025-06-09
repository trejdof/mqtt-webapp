from fastapi import APIRouter, HTTPException
from app.repositories import config_repo

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
        config_repo.delete_config(name)
        return {"status": "deleted", "name": name}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))