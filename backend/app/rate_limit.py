import time
from collections import defaultdict
from fastapi import HTTPException



_request_log: dict[str, list[float]] = defaultdict(list)


def rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    """
    Raise HTTP 429 if `key` (e.g. f"chat:{user_id}") has made more than
    `max_requests` calls in the last `window_seconds`. Call this at the
    top of any route you want to protect.
    """
    now = time.time()
    window_start = now - window_seconds

    timestamps = _request_log[key]
    
    while timestamps and timestamps[0] < window_start:
        timestamps.pop(0)

    if len(timestamps) >= max_requests:
        retry_after = int(window_seconds - (now - timestamps[0]))
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Please wait a moment and try again.",
            headers={"Retry-After": str(max(retry_after, 1))}
        )

    timestamps.append(now)