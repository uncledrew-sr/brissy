from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import events, confirmed, free_windows, activities

app = FastAPI(title="Monthly Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(confirmed.router)
app.include_router(free_windows.router)
app.include_router(activities.router)


@app.get("/health")
def health():
    return {"status": "ok"}
