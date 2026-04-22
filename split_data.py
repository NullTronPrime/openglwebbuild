"""
split_data.py
Splits a large Unity .data file into chunks for GitHub Releases hosting.

Usage:
    python split_data.py "Build/all stars webgl port.data"

Output:
    chunks/data.part000, data.part001, ...
    Prints the GitHub Release upload commands and chunk URLs to paste into index.html
"""

import os
import sys
import math

CHUNK_SIZE = 90 * 1024 * 1024  # 90 MB — safe for GitHub Releases, easy to upload

def split(input_path):
    if not os.path.exists(input_path):
        print(f"ERROR: File not found: {input_path}")
        sys.exit(1)

    os.makedirs("chunks", exist_ok=True)

    with open(input_path, "rb") as f:
        data = f.read()

    total_size = len(data)
    num_chunks = math.ceil(total_size / CHUNK_SIZE)

    print(f"Input:       {input_path}")
    print(f"Total size:  {total_size / 1024 / 1024:.1f} MB")
    print(f"Chunk size:  {CHUNK_SIZE / 1024 / 1024:.0f} MB")
    print(f"Num chunks:  {num_chunks}")
    print()

    chunk_names = []
    for i in range(num_chunks):
        chunk_data = data[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        name = f"data.part{i:03d}"
        path = os.path.join("chunks", name)
        with open(path, "wb") as f:
            f.write(chunk_data)
        chunk_names.append(name)
        print(f"  Written: {path}  ({len(chunk_data) / 1024 / 1024:.1f} MB)")

    print()
    print("=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print()
    print("1. Create a GitHub Release (e.g. tag: 'gamedata-v1')")
    print("   and upload ALL files from the 'chunks/' folder.")
    print()
    print("2. Paste this array into index.html (replace USERNAME/REPO/TAG):")
    print()
    print("const CHUNK_URLS = [")
    for name in chunk_names:
        print(f'  "https://github.com/USERNAME/REPO/releases/download/TAG/{name}",')
    print("];")
    print()

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "Build/all stars webgl port.data"
    split(path)
