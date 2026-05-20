from fastapi import APIRouter
from pathlib import Path
import json

router = APIRouter()

_DATA_PATH = Path(__file__).parent.parent / "data" / "activities.json"


def _load() -> list[dict]:
    with open(_DATA_PATH, encoding="utf-8") as f:
        return json.load(f)["activities"]


@router.get("/activities")
def get_activities(grade: str | None = None, region: str | None = None, season: str | None = None):
    items = _load()

    if grade:
        items = [a for a in items if grade in a["grade"]]
    if region:
        items = [a for a in items if a["region"] == region]
    if season:
        items = [a for a in items if season in a["season"]]

    return {"activities": items, "total": len(items)}
