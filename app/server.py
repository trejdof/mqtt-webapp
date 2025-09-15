from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api import config_routes, state_routes

app = FastAPI()
app.include_router(config_routes.router)
app.include_router(state_routes.router)

app.mount("/", StaticFiles(directory="static", html=True), name="static")