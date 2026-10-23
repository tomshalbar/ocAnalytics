"""Read-only smoke check: python scripts/check_deployment.py https://your-api.onrender.com"""
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


def check(base_url):
    for path in ("/", "/openapi.json", "/locations/latest"):
        try:
            with urlopen(base_url.rstrip("/") + path, timeout=120) as response:
                payload = json.load(response)
                if path == "/locations/latest":
                    if not isinstance(payload, list):
                        raise ValueError("Expected a list of location readings")
                    for row in payload:
                        if not isinstance(row, dict) or not {
                            "LocationId", "runDatetime", "is_stale", "collection_is_stale"
                        }.issubset(row):
                            raise ValueError("Missing expected occupancy fields")
                    print(f"PASS {path}: {len(payload)} location(s)")
                    if not payload:
                        print("NOTE: query succeeded but no locations were returned")
                else:
                    if not isinstance(payload, dict):
                        raise ValueError("Expected a JSON object")
                    print(f"PASS {path}")
        except HTTPError as error:
            raise RuntimeError(f"FAIL {path}: HTTP {error.code}") from None
        except (URLError, ValueError, TimeoutError):
            raise RuntimeError(f"FAIL {path}: network timeout or invalid response") from None


if __name__ == "__main__":
    if len(sys.argv) != 2 or not sys.argv[1].startswith(("https://", "http://")):
        sys.exit("Usage: python scripts/check_deployment.py https://your-api.onrender.com")
    try:
        check(sys.argv[1])
    except RuntimeError as error:
        sys.exit(str(error))
