from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import date
from backend.supabase_client import supabase
from backend.auth import get_current_user

router = APIRouter()


class ConfirmedCreate(BaseModel):
    user_id: str = "default-user"
    date: date
    activity: str
    grade: str


@router.post("/confirmed", status_code=200)
def create_confirmed(body: ConfirmedCreate, user: str = Depends(get_current_user)):
    uid = user or body.user_id
    res = supabase.table("confirmed").insert({
        "user_id": uid,
        "date": str(body.date),
        "activity": body.activity,
        "grade": body.grade,
    }).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save confirmed activity")
    return res.data[0]


@router.get("/confirmed")
def get_confirmed(month: str, userId: str = None, user: str = Depends(get_current_user)):
    """month: YYYY-MM"""
    import calendar
    start = f"{month}-01"
    year, mon = map(int, month.split("-"))
    last_day = calendar.monthrange(year, mon)[1]
    end = f"{month}-{last_day:02d}"

    uid = user or userId
    q = (
        supabase.table("confirmed")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date")
    )
    if uid:
        q = q.eq("user_id", uid)
    return q.execute().data
