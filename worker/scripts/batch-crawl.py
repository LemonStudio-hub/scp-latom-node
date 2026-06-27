#!/usr/bin/env python3
"""
Batch crawl script for SCP Wiki index initialization.
Uses curl to avoid Cloudflare WAF blocking.
"""

import json
import subprocess
import time

API_BASE = "https://api.scp.lat/api/crawler"
LIMIT = 30
BATCH_DELAY = 30  # seconds between batches
STATUS_DELAY = 10  # seconds between status checks

def curl_get(path):
    """GET request via curl."""
    result = subprocess.run(
        ["curl", "-s", f"{API_BASE}{path}"],
        capture_output=True, text=True, timeout=20
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None

def curl_post(path):
    """POST request via curl."""
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{API_BASE}{path}"],
        capture_output=True, text=True, timeout=20
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None

def get_status(lang):
    return curl_get(f"/{lang}/status")

def trigger_crawl(lang, limit):
    return curl_post(f"/{lang}/crawl?limit={limit}")

def wait_for_idle(lang, max_wait=120):
    waited = 0
    while waited < max_wait:
        status = get_status(lang)
        if status and status.get("state", {}).get("status") != "crawling":
            return status
        time.sleep(STATUS_DELAY)
        waited += STATUS_DELAY
    return get_status(lang)

def full_crawl(lang):
    print(f"\n{'='*50}")
    print(f"Starting full crawl for {lang.upper()}")
    print(f"{'='*50}")

    batch = 1
    prev_total = 0

    while batch <= 500:
        status = get_status(lang)
        if not status:
            print("  API error, stopping.")
            break

        current_total = status.get("state", {}).get("totalEntries", 0)
        print(f"  Batch {batch}: Current total = {current_total}")

        result = trigger_crawl(lang, LIMIT)
        if not result:
            print("  Trigger failed, stopping.")
            break

        time.sleep(BATCH_DELAY)

        final = wait_for_idle(lang)
        if not final:
            print("  Status check failed.")
            break

        new_total = final.get("state", {}).get("totalEntries", 0)

        if new_total == prev_total:
            print(f"\n  Crawl complete! Total entries: {new_total}")
            return new_total

        print(f"  Progress: {prev_total} -> {new_total} entries")
        prev_total = new_total
        batch += 1

        time.sleep(5)

    return prev_total

def main():
    print("SCP Wiki Full Batched Crawl")
    print("===========================")

    results = {}
    for lang in ["en", "cn"]:
        total = full_crawl(lang)
        results[lang] = total
        print(f"\n{lang.upper()} final count: {total} entries")

    print("\n\nFinal verification:")
    for lang in ["en", "cn"]:
        status = get_status(lang)
        if status:
            state = status.get("state", {})
            print(f"  {lang.upper()}: {state.get('totalEntries', 0)} entries, status: {state.get('status')}")

if __name__ == "__main__":
    main()
