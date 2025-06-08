from fastapi import FastAPI
from app.api import config_routes

app = FastAPI()

#app.include_router(config_routes.router)