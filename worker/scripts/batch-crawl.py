#!/usr/bin/env python3
"""
Batch crawl script for SCP Wiki index initialization.
Uses curl to avoid Cloudflare WAF blocking.
"""

import json
import argparse
import os
import subprocess
import time

DEFAULT_API_BASE = "https://api.scp.lat/api/crawler"
DEFAULT_LIMIT = 30
DEFAULT_BATCH_DELAY = 30  # seconds between batches
DEFAULT_STATUS_DELAY = 10  # seconds between status checks


def normalize_api_base(value):
    """Accept either a Worker/API base URL or the crawler endpoint URL."""
    base = value.rstrip("/")
    if base.endswith("/api/crawler"):
        return base
    if base.endswith("/api"):
        return f"{base}/crawler"
    return f"{base}/api/crawler"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Batch crawl SCP Wiki indexes into a deployed SCP Latom Node API."
    )
    parser.add_argument(
        "--api-base",
        default=os.environ.get("SCP_CRAWLER_API_BASE", DEFAULT_API_BASE),
        help=(
            "API base URL. Accepts the Worker origin, /api, or /api/crawler. "
            "Can also be set with SCP_CRAWLER_API_BASE."
        ),
    )
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="Entries per crawl batch.")
    parser.add_argument(
        "--langs",
        default="en,cn",
        help="Comma-separated languages to crawl: en, cn, or en,cn.",
    )
    parser.add_argument(
        "--batch-delay",
        type=int,
        default=DEFAULT_BATCH_DELAY,
        help="Seconds to wait after triggering each batch.",
    )
    parser.add_argument(
        "--status-delay",
        type=int,
        default=DEFAULT_STATUS_DELAY,
        help="Seconds between crawl status checks.",
    )
    parser.add_argument(
        "--max-batches",
        type=int,
        default=500,
        help="Safety cap for batches per language.",
    )
    args = parser.parse_args()

    langs = [lang.strip() for lang in args.langs.split(",") if lang.strip()]
    invalid = [lang for lang in langs if lang not in {"en", "cn"}]
    if invalid:
        parser.error(f"invalid language(s): {', '.join(invalid)}. Use en, cn, or en,cn.")
    if not langs:
        parser.error("--langs must include at least one language.")
    if args.limit < 0:
        parser.error("--limit must be 0 or greater.")

    args.api_base = normalize_api_base(args.api_base)
    args.langs = langs
    return args


def curl_get(api_base, path):
    """GET request via curl."""
    result = subprocess.run(
        ["curl", "-s", f"{api_base}{path}"],
        capture_output=True, text=True, timeout=20
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None

def curl_post(api_base, path):
    """POST request via curl."""
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{api_base}{path}"],
        capture_output=True, text=True, timeout=20
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None

def get_status(api_base, lang):
    return curl_get(api_base, f"/{lang}/status")

def trigger_crawl(api_base, lang, limit):
    return curl_post(api_base, f"/{lang}/crawl?limit={limit}")

def wait_for_idle(api_base, lang, status_delay, max_wait=120):
    waited = 0
    while waited < max_wait:
        status = get_status(api_base, lang)
        if status and status.get("state", {}).get("status") != "crawling":
            return status
        time.sleep(status_delay)
        waited += status_delay
    return get_status(api_base, lang)

def full_crawl(api_base, lang, limit, batch_delay, status_delay, max_batches):
    print(f"\n{'='*50}")
    print(f"Starting full crawl for {lang.upper()}")
    print(f"{'='*50}")

    batch = 1
    prev_total = 0

    while batch <= max_batches:
        status = get_status(api_base, lang)
        if not status:
            print("  API error, stopping.")
            break

        current_total = status.get("state", {}).get("totalEntries", 0)
        print(f"  Batch {batch}: Current total = {current_total}")

        result = trigger_crawl(api_base, lang, limit)
        if not result:
            print("  Trigger failed, stopping.")
            break

        time.sleep(batch_delay)

        final = wait_for_idle(api_base, lang, status_delay)
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
    args = parse_args()

    print("SCP Wiki Full Batched Crawl")
    print("===========================")
    print(f"API base: {args.api_base}")
    print(f"Languages: {', '.join(args.langs)}")
    print(f"Batch limit: {args.limit}")

    results = {}
    for lang in args.langs:
        total = full_crawl(
            args.api_base,
            lang,
            args.limit,
            args.batch_delay,
            args.status_delay,
            args.max_batches,
        )
        results[lang] = total
        print(f"\n{lang.upper()} final count: {total} entries")

    print("\n\nFinal verification:")
    for lang in args.langs:
        status = get_status(args.api_base, lang)
        if status:
            state = status.get("state", {})
            print(f"  {lang.upper()}: {state.get('totalEntries', 0)} entries, status: {state.get('status')}")

if __name__ == "__main__":
    main()
