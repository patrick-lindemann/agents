from __future__ import annotations

import json
import sys
from pathlib import Path

if __name__ == "__main__":
    print(json.dumps({"binary": sys.argv[0], "cwd": str(Path.cwd()), "args": sys.argv[1:]}))
    raise SystemExit(1)
