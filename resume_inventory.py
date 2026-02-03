#!/usr/bin/env python3
"""
resume_inventory.py

Scans one or more codebases (repos/folders) and generates:
- inventory.json (machine readable)
- inventory.md (human readable)
- skills_suggestions.md (skills pulled from code signals)

Goal: make resume writing easy and accurate by extracting what you actually built.

Usage (Windows PowerShell examples):

python .\resume_inventory.py `
  --repo "C:\Projects\saas_hub\hub-frontend" `
  --repo "C:\Projects\ALPHA-EARLY" `
  --repo "C:\Projects\ALPHA-TREND" `
  --repo "C:\Projects\ALPHA-RUNNER"

Optional:
  --out "C:\Projects\resume_inventory_outputs"
  --max-files 6000
  --max-bytes 200000
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set


# ----------------------------
# Helpers
# ----------------------------

IGNORE_DIRS = {
    ".git", ".svn", ".hg",
    "node_modules", ".next", "dist", "build", "out",
    "__pycache__", ".pytest_cache", ".mypy_cache",
    ".venv", "venv", "env", ".env",
    ".idea", ".vscode",
    "Archive", "archive", "archives",
}

# We do NOT read huge binaries. We only read text-ish files up to max-bytes.
TEXT_FILE_EXTS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".md", ".txt", ".yml", ".yaml",
    ".toml", ".ini", ".cfg", ".env", ".sh", ".bat", ".ps1", ".html", ".css",
    ".sql", ".graphql", ".gql"
}

KEY_PATTERNS = {
    # Web / SaaS
    "Next.js": [r"\bnext\.config\.", r"\"next\"", r"from\s+\"next/", r"from\s+'next/"],
    "React": [r"\"react\"", r"from\s+\"react\"", r"from\s+'react'"],
    "TypeScript": [r"\"typescript\"", r"\.ts\b", r"\.tsx\b"],
    "Tailwind CSS": [r"tailwind\.config\.", r"\"tailwindcss\"", r"@tailwind\s+base", r"@tailwind\s+components", r"@tailwind\s+utilities"],
    "Framer Motion": [r"\"framer-motion\"", r"from\s+\"framer-motion\"", r"from\s+'framer-motion'"],
    "Vercel": [r"vercel\.json", r"\"vercel\"", r"VERCEL", r"vercel\.app"],
    "Supabase": [r"\"@supabase/", r"\bsupabase\.co\b", r"createClient\(", r"SUPABASE_"],
    "Clerk": [r"\"@clerk/", r"ClerkProvider", r"CLERK_"],

    # Bots / Automation
    "Python": [r"\.py\b", r"python3", r"#!/usr/bin/env python"],
    "Telegram API": [r"api\.telegram\.org", r"python-telegram-bot", r"telebot", r"sendMessage", r"sendPhoto", r"TELEGRAM_"],
    "WebSockets": [r"\bwebsocket\b", r"\bwebsockets\b", r"wss://", r"WebSocket"],
    "HTTP Requests": [r"\brequests\b", r"\bhttpx\b", r"\baiohttp\b", r"axios"],
    "CSV Logging": [r"\bcsv\b", r"\.csv\b", r"DictWriter", r"writerow\("],
    "Backtesting": [r"\bbacktest\b", r"\bbacktesting\b", r"\bsimulate\b", r"\boutcome\b"],
    "Async": [r"\basync\b", r"\bawait\b", r"asyncio"],
    "Threading/Parallel": [r"ThreadPoolExecutor", r"\bthreading\b", r"\bconcurrent\.futures\b"],
    "Environment Vars": [r"\.env\b", r"os\.environ", r"dotenv", r"load_dotenv", r"process\.env"],

    # Crypto / Trading signals (generic signals, not claiming results)
    "Technical Indicators": [r"\bRSI\b", r"\bMACD\b", r"\bEMA\b", r"\bVWAP\b", r"\bBollinger\b", r"\bATR\b", r"\bvolume spike\b"],
    "Bybit": [r"\bbybit\b", r"api\.bybit\.com", r"testnet\.bybit", r"pybit"],
    "RapidAPI": [r"rapidapi", r"X-RapidAPI-Key", r"X-RapidAPI-Host"],
    "Solana": [r"\bsolana\b", r"solscan", r"raydium", r"pump\.fun", r"jupiter", r"alchemy", r"helius", r"rugcheck", r"dexscreener"],
}

API_HINT_PATTERNS = [
    r"https?://[a-zA-Z0-9\.\-_/:%\?\=&]+",
    r"\bwss://[a-zA-Z0-9\.\-_/:%\?\=&]+",
]

SENSITIVE_PATTERNS = [
    r"api[_-]?key\s*=\s*['\"][^'\"]+['\"]",
    r"secret\s*=\s*['\"][^'\"]+['\"]",
    r"token\s*=\s*['\"][^'\"]+['\"]",
    r"PRIVATE[_-]?KEY",
]


def safe_read_text(path: Path, max_bytes: int) -> str:
    try:
        size = path.stat().st_size
        if size > max_bytes:
            # Read only the first chunk
            with path.open("rb") as f:
                chunk = f.read(max_bytes)
            return chunk.decode("utf-8", errors="ignore")
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def is_probably_text(path: Path) -> bool:
    # Simple filter by extension
    return path.suffix.lower() in TEXT_FILE_EXTS or path.name in {"Dockerfile", "Makefile"}


def run_git(repo: Path, args: List[str]) -> Tuple[int, str]:
    try:
        proc = subprocess.run(
            ["git"] + args,
            cwd=str(repo),
            capture_output=True,
            text=True,
            check=False,
        )
        out = (proc.stdout or "").strip()
        err = (proc.stderr or "").strip()
        combined = out if out else err
        return proc.returncode, combined
    except Exception as e:
        return 1, str(e)


def now_stamp() -> str:
    return dt.datetime.now().strftime("%Y%m%d_%H%M%S")


@dataclass
class RepoInventory:
    repo_path: str
    repo_name: str
    file_counts_by_ext: Dict[str, int]
    total_files_scanned: int
    key_signals_found: Dict[str, int]
    sample_evidence: Dict[str, List[str]]
    detected_dependencies: Dict[str, List[str]]
    detected_scripts: Dict[str, str]
    detected_workflows: List[str]
    detected_deploy_files: List[str]
    detected_env_files: List[str]
    detected_api_hints: List[str]
    git_summary: Dict[str, str]
    notes: List[str]


def scan_repo(repo: Path, max_files: int, max_bytes: int) -> RepoInventory:
    repo = repo.resolve()
    repo_name = repo.name

    file_counts: Dict[str, int] = {}
    total_scanned = 0

    key_hits: Dict[str, int] = {k: 0 for k in KEY_PATTERNS.keys()}
    evidence: Dict[str, List[str]] = {k: [] for k in KEY_PATTERNS.keys()}

    dependencies: Dict[str, List[str]] = {}
    scripts: Dict[str, str] = {}
    workflows: List[str] = []
    deploy_files: List[str] = []
    env_files: List[str] = []
    api_hints: Set[str] = set()
    notes: List[str] = []

    # Pre-check important config files
    important_paths = [
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "Pipfile",
        "poetry.lock",
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
        "vercel.json",
        "next.config.js",
        "next.config.mjs",
        "tailwind.config.js",
        "tailwind.config.ts",
        "tsconfig.json",
        ".github/workflows",
        "supabase",
    ]

    for rel in important_paths:
        p = repo / rel
        if p.exists():
            if p.is_dir():
                if rel == ".github/workflows":
                    for wf in p.glob("*.yml"):
                        workflows.append(str(wf.relative_to(repo)))
                    for wf in p.glob("*.yaml"):
                        workflows.append(str(wf.relative_to(repo)))
            else:
                name = p.name.lower()
                if name.startswith(".env") or name.endswith(".env"):
                    env_files.append(str(p.relative_to(repo)))
                if p.name in {"vercel.json", "Dockerfile", "docker-compose.yml", "docker-compose.yaml"}:
                    deploy_files.append(str(p.relative_to(repo)))

    # Walk files
    for root, dirs, files in os.walk(repo):
        # Modify dirs in place to skip ignore dirs
        dirs[:] = [
            d for d in dirs if d not in IGNORE_DIRS and not d.startswith(".git")]
        for fname in files:
            if total_scanned >= max_files:
                notes.append(
                    f"Hit max_files limit ({max_files}). Repo may be larger than scanned subset.")
                break

            fpath = Path(root) / fname
            relpath = fpath.relative_to(repo)

            # Track env files
            if fname.startswith(".env") or fname.endswith(".env"):
                env_files.append(str(relpath))

            # Skip non-text
            if not is_probably_text(fpath):
                continue

            total_scanned += 1
            ext = fpath.suffix.lower() if fpath.suffix else "(no_ext)"
            file_counts[ext] = file_counts.get(ext, 0) + 1

            text = safe_read_text(fpath, max_bytes=max_bytes)
            if not text:
                continue

            # Avoid capturing secrets
            for sp in SENSITIVE_PATTERNS:
                if re.search(sp, text, flags=re.IGNORECASE):
                    notes.append(
                        f"Possible secret-like pattern detected in {relpath}. Review and ensure secrets are in env vars, not committed.")
                    break

            # Key signals
            for key, pats in KEY_PATTERNS.items():
                for pat in pats:
                    if re.search(pat, text, flags=re.IGNORECASE):
                        key_hits[key] += 1
                        if len(evidence[key]) < 8:
                            evidence[key].append(str(relpath))
                        break

            # API hints
            for pat in API_HINT_PATTERNS:
                for m in re.findall(pat, text):
                    # Keep hints short and unique, and skip obvious local file refs
                    if m.startswith("http") or m.startswith("wss://"):
                        if len(m) <= 140:
                            api_hints.add(m)

    # Parse package.json (if exists)
    pkg = repo / "package.json"
    if pkg.exists():
        try:
            data = json.loads(pkg.read_text(encoding="utf-8", errors="ignore"))
            deps = data.get("dependencies", {}) or {}
            dev = data.get("devDependencies", {}) or {}
            dependencies["npm_dependencies"] = sorted(list(deps.keys()))
            dependencies["npm_devDependencies"] = sorted(list(dev.keys()))
            scripts_obj = data.get("scripts", {}) or {}
            scripts = {k: str(v) for k, v in scripts_obj.items()}
        except Exception as e:
            notes.append(f"Could not parse package.json: {e}")

    # Parse requirements.txt
    req = repo / "requirements.txt"
    if req.exists():
        lines = req.read_text(encoding="utf-8", errors="ignore").splitlines()
        pkgs = []
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Strip version pins for readability
            line = re.split(r"[<=>]", line)[0].strip()
            if line:
                pkgs.append(line)
        dependencies["pip_requirements"] = sorted(list(set(pkgs)))

    # Parse pyproject.toml for poetry/pep621 (best-effort text parse)
    pyproj = repo / "pyproject.toml"
    if pyproj.exists():
        txt = pyproj.read_text(encoding="utf-8", errors="ignore")
        # Simple regex extracts like: name = "requests"
        pkgs = set()
        for m in re.findall(r'^\s*([a-zA-Z0-9_\-]+)\s*=\s*["\']', txt, flags=re.MULTILINE):
            # This over-captures sometimes, so we filter obvious non-packages
            if m.lower() not in {"python", "name", "version", "description"}:
                pkgs.add(m)
        if pkgs:
            dependencies["pyproject_signals"] = sorted(pkgs)

    # Git summary (if git exists)
    git_summary: Dict[str, str] = {}
    if (repo / ".git").exists():
        code, branch = run_git(repo, ["rev-parse", "--abbrev-ref", "HEAD"])
        if code == 0:
            git_summary["branch"] = branch

        code, last_commit = run_git(
            repo, ["log", "-1", "--pretty=%h %ad %s", "--date=short"])
        if code == 0:
            git_summary["last_commit"] = last_commit

        code, first_commit = run_git(
            repo, ["log", "--reverse", "-1", "--pretty=%h %ad %s", "--date=short"])
        if code == 0:
            git_summary["first_commit"] = first_commit

        code, top_files = run_git(repo, ["ls-files"])
        if code == 0 and top_files:
            git_summary["tracked_files_count"] = str(
                len(top_files.splitlines()))

    # Clean up evidence lists (remove empties)
    evidence = {k: v for k, v in evidence.items() if v}

    inv = RepoInventory(
        repo_path=str(repo),
        repo_name=repo_name,
        file_counts_by_ext=dict(
            sorted(file_counts.items(), key=lambda x: (-x[1], x[0]))),
        total_files_scanned=total_scanned,
        key_signals_found={k: v for k, v in key_hits.items() if v > 0},
        sample_evidence=evidence,
        detected_dependencies=dependencies,
        detected_scripts=scripts,
        detected_workflows=sorted(list(set(workflows))),
        detected_deploy_files=sorted(list(set(deploy_files))),
        detected_env_files=sorted(list(set(env_files))),
        detected_api_hints=sorted(list(api_hints))[:60],
        git_summary=git_summary,
        notes=notes[:30],
    )
    return inv


def build_skills(inv_list: List[RepoInventory]) -> Dict[str, List[str]]:
    # Convert signals + dependencies into a skills bucket list.
    skills: Dict[str, Set[str]] = {
        "Languages": set(),
        "Frontend": set(),
        "Backend": set(),
        "DevOps/Cloud": set(),
        "Data/Observability": set(),
        "APIs/Integrations": set(),
        "Crypto/Trading Domain": set(),
        "Practices": set(),
    }

    # Helper: add if present
    def add(bucket: str, item: str):
        if item:
            skills[bucket].add(item)

    # From key signals
    for inv in inv_list:
        s = inv.key_signals_found

        if "Python" in s:
            add("Languages", "Python")
        if "TypeScript" in s:
            add("Languages", "TypeScript")
        if "React" in s:
            add("Frontend", "React")
        if "Next.js" in s:
            add("Frontend", "Next.js")
        if "Tailwind CSS" in s:
            add("Frontend", "Tailwind CSS")
        if "Framer Motion" in s:
            add("Frontend", "Framer Motion")

        if "HTTP Requests" in s:
            add("APIs/Integrations", "REST APIs")
        if "WebSockets" in s:
            add("APIs/Integrations", "WebSockets")

        if "Supabase" in s:
            add("Backend", "Supabase (Postgres)")
            add("APIs/Integrations", "Supabase Auth")
        if "Clerk" in s:
            add("Backend", "Clerk Auth")

        if "Telegram API" in s:
            add("APIs/Integrations", "Telegram Bot API")

        if "Vercel" in s:
            add("DevOps/Cloud", "Vercel Deployments")
        if inv.detected_workflows:
            add("DevOps/Cloud", "GitHub Actions (CI/CD)")

        if "CSV Logging" in s:
            add("Data/Observability", "CSV logging")
        if "Backtesting" in s:
            add("Data/Observability", "Backtesting pipelines")
        if "Environment Vars" in s:
            add("Practices", "Environment-based config (.env)")

        if "Async" in s:
            add("Practices", "Async programming (asyncio)")
        if "Threading/Parallel" in s:
            add("Practices", "Parallel scanning (ThreadPoolExecutor)")

        if "Technical Indicators" in s:
            add("Crypto/Trading Domain", "Signal logic (RSI, MACD, EMA, VWAP, ATR)")
        if "Bybit" in s:
            add("APIs/Integrations", "Bybit API (testnet/live)")
        if "RapidAPI" in s:
            add("APIs/Integrations", "RapidAPI integrations")
        if "Solana" in s:
            add("Crypto/Trading Domain",
                "Solana ecosystem (DEX, explorers, aggregators)")

    # From dependencies
    all_deps = set()
    for inv in inv_list:
        for k, dep_list in inv.detected_dependencies.items():
            for d in dep_list:
                all_deps.add(d.lower())

    # Common libs
    if "requests" in all_deps or "httpx" in all_deps or "aiohttp" in all_deps:
        add("Backend", "HTTP clients (requests/httpx/aiohttp)")
    if "pandas" in all_deps:
        add("Data/Observability", "Pandas")
    if "numpy" in all_deps:
        add("Data/Observability", "NumPy")

    # Convert sets to sorted lists
    return {k: sorted(list(v)) for k, v in skills.items() if v}


def write_outputs(out_dir: Path, inv_list: List[RepoInventory]) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = now_stamp()
    run_dir = out_dir / f"resume_inventory_{stamp}"
    run_dir.mkdir(parents=True, exist_ok=True)

    # JSON
    json_path = run_dir / "inventory.json"
    json_path.write_text(
        json.dumps([asdict(x) for x in inv_list], indent=2),
        encoding="utf-8",
    )

    # Skills
    skills = build_skills(inv_list)
    skills_md = run_dir / "skills_suggestions.md"
    skills_md.write_text(render_skills_md(skills), encoding="utf-8")

    # Markdown inventory
    md_path = run_dir / "inventory.md"
    md_path.write_text(render_inventory_md(inv_list, skills), encoding="utf-8")

    return run_dir


def render_skills_md(skills: Dict[str, List[str]]) -> str:
    lines = []
    lines.append("# Skills Suggestions (pulled from code signals)\n")
    lines.append(
        "These are skills your code appears to use. We will clean this list later.\n")
    for bucket, items in skills.items():
        lines.append(f"## {bucket}")
        for it in items:
            lines.append(f"- {it}")
        lines.append("")
    return "\n".join(lines).strip() + "\n"


def render_inventory_md(inv_list: List[RepoInventory], skills: Dict[str, List[str]]) -> str:
    lines = []
    lines.append("# Resume Inventory (auto-generated)\n")
    lines.append(
        "This report is meant to help you write a resume by listing what your codebase shows.\n")
    lines.append(
        "Tip: send this file to ChatGPT and ask it to turn it into resume bullets.\n")

    lines.append("## Skills (quick view)\n")
    for bucket, items in skills.items():
        lines.append(f"**{bucket}:** " + ", ".join(items)
                     if items else f"**{bucket}:** (none)")
    lines.append("")

    for inv in inv_list:
        lines.append(f"---\n\n## {inv.repo_name}\n")
        lines.append(f"**Path:** `{inv.repo_path}`\n")

        if inv.git_summary:
            lines.append("**Git:**")
            for k, v in inv.git_summary.items():
                lines.append(f"- {k}: {v}")
            lines.append("")

        lines.append(f"**Files scanned:** {inv.total_files_scanned}")
        if inv.file_counts_by_ext:
            top = list(inv.file_counts_by_ext.items())[:12]
            lines.append("**Top file types:** " +
                         ", ".join([f"{ext}={cnt}" for ext, cnt in top]))
        lines.append("")

        if inv.detected_deploy_files or inv.detected_workflows:
            lines.append("**Deploy / CI signals:**")
            for df in inv.detected_deploy_files:
                lines.append(f"- deploy file: `{df}`")
            for wf in inv.detected_workflows:
                lines.append(f"- workflow: `{wf}`")
            lines.append("")

        if inv.detected_env_files:
            lines.append("**Env/config files found (review for safety):**")
            for ef in sorted(set(inv.detected_env_files))[:20]:
                lines.append(f"- `{ef}`")
            if len(inv.detected_env_files) > 20:
                lines.append(
                    f"- (and {len(inv.detected_env_files) - 20} more)")
            lines.append("")

        if inv.detected_dependencies:
            lines.append("**Dependencies (signals):**")
            for k, v in inv.detected_dependencies.items():
                if not v:
                    continue
                lines.append(
                    f"- {k}: {', '.join(v[:30])}" + (f" (and {len(v)-30} more)" if len(v) > 30 else ""))
            lines.append("")

        if inv.detected_scripts:
            lines.append("**Scripts (from package.json):**")
            for k, v in inv.detected_scripts.items():
                lines.append(f"- {k}: `{v}`")
            lines.append("")

        if inv.key_signals_found:
            lines.append(
                "**Key signals found (count = number of files that matched):**")
            for k, v in sorted(inv.key_signals_found.items(), key=lambda x: (-x[1], x[0])):
                lines.append(f"- {k}: {v}")
            lines.append("")

        if inv.sample_evidence:
            lines.append(
                "**Evidence samples (example files that triggered signals):**")
            for k, files in inv.sample_evidence.items():
                lines.append(
                    f"- {k}: " + ", ".join([f"`{x}`" for x in files[:8]]))
            lines.append("")

        if inv.detected_api_hints:
            lines.append("**API / endpoint hints (from code text):**")
            for h in inv.detected_api_hints[:25]:
                lines.append(f"- {h}")
            if len(inv.detected_api_hints) > 25:
                lines.append(
                    f"- (and {len(inv.detected_api_hints) - 25} more)")
            lines.append("")

        if inv.notes:
            lines.append("**Notes / warnings:**")
            for n in inv.notes:
                lines.append(f"- {n}")
            lines.append("")

    lines.append("\n---\n")
    lines.append("## Next step\n")
    lines.append(
        "Send `inventory.md` back into ChatGPT and we will convert it into:\n")
    lines.append(
        "- a clean project list\n- strong resume bullets\n- a targeted resume for your job title\n")

    return "\n".join(lines).strip() + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", action="append", required=True,
                    help="Path to a repo/project folder. Use multiple --repo args.")
    ap.add_argument("--out", default=str(Path.cwd() /
                    "resume_inventory_outputs"), help="Output folder.")
    ap.add_argument("--max-files", type=int, default=6000,
                    help="Max text files to scan per repo.")
    ap.add_argument("--max-bytes", type=int, default=200_000,
                    help="Max bytes to read per file.")
    args = ap.parse_args()

    out_dir = Path(args.out).resolve()

    inv_list: List[RepoInventory] = []
    for r in args.repo:
        repo_path = Path(r).expanduser()
        if not repo_path.exists():
            print(f"[WARN] Repo path not found: {repo_path}")
            continue
        inv = scan_repo(repo_path, max_files=args.max_files,
                        max_bytes=args.max_bytes)
        inv_list.append(inv)

    if not inv_list:
        raise SystemExit(
            "No valid repos were scanned. Check your --repo paths.")

    run_dir = write_outputs(out_dir, inv_list)
    print(f"\nDone. Outputs written to:\n  {run_dir}\n")
    print("Key files:")
    print(f"  - {run_dir / 'inventory.md'}")
    print(f"  - {run_dir / 'inventory.json'}")
    print(f"  - {run_dir / 'skills_suggestions.md'}\n")


if __name__ == "__main__":
    main()
