"""
export_obsidian.py
------------------
Export Open Sangam data as an Obsidian vault.

The vault is a linked Markdown "second brain":
  - Maps (MOCs) for Home, Tiṇai, Works, Poets, Artifacts, Entities, Stories, Research
  - one note per work, tiṇai, poet, artifact, entity, curated story, brief and article
  - one verse index per work (atomic verse notes are optional)

Usage:
    cd backend/python
    python -m knowledge.export_obsidian
    python -m knowledge.export_obsidian --out ../../obsidian-vault --verses index
    python -m knowledge.export_obsidian --verses all --clean
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).parents[3]
TEXTS = REPO / "data" / "texts"
GRAPH_PATH = REPO / "data" / "knowledge" / "graph.json"
TINAI_CONTEXT_PATH = REPO / "data" / "knowledge" / "tinai_context.json"
ARTIFACTS_PATH = REPO / "data" / "library" / "artifacts.json"
CORPUS_ARTIFACTS_PATH = REPO / "data" / "library" / "corpus-artifacts.json"
ENTITIES_PATH = REPO / "data" / "library" / "corpus-entities.json"
STORY_ANTHOLOGY_PATH = REPO / "data" / "library" / "story-anthology.json"
BRIEFS_PATH = REPO / "data" / "library" / "avai-research" / "index.json"
ARTICLES_DIR = REPO / "content" / "articles"
DEFAULT_OUT = REPO / "obsidian-vault"

TINAI = {
    "kurinji": ("குறிஞ்சி", "Kurinji", "Mountains"),
    "mullai": ("முல்லை", "Mullai", "Forest"),
    "marutam": ("மருதம்", "Marutam", "Cropland"),
    "neytal": ("நெய்தல்", "Neytal", "Seashore"),
    "palai": ("பாலை", "Palai", "Wasteland"),
    "unknown": ("வகைப்படுத்தாத", "Unclassified", "Mixed / puṟam"),
}
POEM_TITLES = {
    "natrinai": ("நற்றிணை", "Natrinai"),
    "kurunthokai": ("குறுந்தொகை", "Kurunthokai"),
    "ainkurunooru": ("ஐங்குறுநூறு", "Ainkurunooru"),
    "kalithokai": ("கலித்தொகை", "Kalithokai"),
    "akananooru": ("அகநானூறு", "Akananooru"),
    "pathitrupathu": ("பதிற்றுப்பத்து", "Pathitrupathu"),
    "purananooru": ("புறநானூறு", "Purananooru"),
    "paripadal": ("பரிபாடல்", "Paripadal"),
    "thirumurugatrupadai": ("திருமுருகாற்றுப்படை", "Tirumurugaatrupadai"),
    "porunaratrupadai": ("பொருநராற்றுப்படை", "Porunaratrupadai"),
    "sirupanatrupadai": ("சிறுபாணாற்றுப்படை", "Sirupanatrupadai"),
    "perumpanatrupadai": ("பெரும்பாணாற்றுப்படை", "Perumpanatrupadai"),
    "malaipadukadam": ("மலைபடுகடாம்", "Malaipadukadam"),
    "maduraikanchi": ("மதுரைக்காஞ்சி", "Maduraikanchi"),
    "kurinjipattu": ("குறிஞ்சிப்பாட்டு", "Kurinjipattu"),
    "pattinappalai": ("பட்டினப்பாலை", "Pattinappalai"),
    "mullaippattu": ("முல்லைப்பாட்டு", "Mullaippattu"),
    "nedunalvadai": ("நெடுநல்வாடை", "Nedunalvadai"),
    "thirukkural": ("திருக்குறள்", "Tirukkural"),
    "naladiyar": ("நாலடியார்", "Naladiyar"),
}


def clean_poet(name: str | None) -> str:
    name = (name or '').strip().rstrip('.。 ').strip()
    if any(marker in name for marker in ('அறியப்படவில்லை', 'பெயர்', 'unknown')):
        return ''
    return name


def safe(text: str) -> str:
    text = re.sub(r'[\\/:*?"<>|#^\[\]]+', " ", text or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:120] or "Untitled"


def link(name: str, label: str | None = None) -> str:
    if label and label != name:
        return f"[[{name}|{label}]]"
    return f"[[{name}]]"


def note_link(prefix: str, ident: str, label: str | None = None) -> str:
    return link(f"{prefix} - {ident}", label)


def work_link(poem: str) -> str:
    ta, en = POEM_TITLES.get(poem, (poem, poem))
    return note_link("Work", poem, ta)


def tinai_link(tid: str) -> str:
    ta, en, _landscape = TINAI.get(tid, (tid, tid, ""))
    return note_link("Tiṇai", en, ta)


def frontmatter(meta: dict) -> str:
    lines = ["---"]
    for key, value in meta.items():
        if value is None or value == "":
            continue
        if isinstance(value, list):
            lines.append(f"{key}:")
            for item in value:
                lines.append(f"  - {item}")
        else:
            lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines)


def write_note(path: Path, meta: dict, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(frontmatter(meta) + "\n\n" + body.strip() + "\n", encoding="utf-8")


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def load_corpus() -> dict[str, list[dict]]:
    works: dict[str, list[dict]] = {}
    for path in sorted(TEXTS.glob("*/*.json")):
        if "normalized" in path.parts:
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(data, list) and data:
            poem = data[0].get("poem") or path.parent.name
            works[poem] = data
    return works


def graph_maps(graph: dict):
    node_by_id = {n["id"]: n for n in graph.get("nodes", [])}
    adj = defaultdict(list)
    for edge in graph.get("edges", []):
        adj[edge["source"]].append(edge)
        adj[edge["target"]].append({**edge, "source": edge["target"], "target": edge["source"]})
    return node_by_id, adj


def artifact_links(artifacts: list[dict], poem: str, limit: int = 12) -> list[str]:
    out = []
    for artifact in artifacts:
        if any(row["poem"] == poem for row in artifact.get("poems", [])):
            out.append(link(f"Artifact - {artifact['id']}", artifact["ta"]))
    return out[:limit]


def entity_links(entities: list[dict], poem: str, limit: int = 12) -> list[str]:
    out = []
    for entity in entities:
        if any(row["poem"] == poem for row in entity.get("poems", [])):
            out.append(link(f"Entity - {entity['id']}", entity["ta"]))
    return out[:limit]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Export Open Sangam as an Obsidian vault")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--verses", choices=["none", "index", "all"], default="index")
    parser.add_argument("--clean", action="store_true")
    args = parser.parse_args(argv)

    out = args.out.resolve()
    if args.clean and out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)

    graph = load_json(GRAPH_PATH, {"nodes": [], "edges": [], "meta": {}})
    tinai_context = load_json(TINAI_CONTEXT_PATH, {})
    artifacts_data = load_json(ARTIFACTS_PATH, {"artifacts": []})
    corpus_artifacts = load_json(CORPUS_ARTIFACTS_PATH, {"artifacts": []})["artifacts"]
    entities = load_json(ENTITIES_PATH, {"entities": []})["entities"]
    anthology = load_json(STORY_ANTHOLOGY_PATH, {"stories": []})["stories"]
    briefs = load_json(BRIEFS_PATH, {"briefs": []})["briefs"]
    works = load_corpus()
    node_by_id, adj = graph_maps(graph)

    # Maps
    maps_dir = out / "01 Maps"
    maps_dir.mkdir(parents=True, exist_ok=True)

    # Tinai notes
    tinai_dir = out / "02 Tiṇai"
    for tid, (ta, en, landscape) in TINAI.items():
        ctx = tinai_context.get(tid, {})
        if tid == "unknown" and not ctx:
            continue
        name = f"Tiṇai - {en}"
        body = [
            f"# {ta} · {en}",
            "",
            f"**Landscape:** {landscape}",
            "",
            f"- Verses: **{ctx.get('verseCount', 0)}**",
            f"- Top poets: " + ", ".join(link(f"Poet - {p['poet']}", p["poet"]) for p in ctx.get("topPoets", [])[:8]),
            "",
            "## Works",
            "",
            *[f"- {work_link(row['poem'])} — {row['count']} verses" for row in ctx.get("poemBreakdown", [])],
            "",
            "## Attested karu-poruḷ",
            "",
        ]
        for cat, rows in (ctx.get("attested") or {}).items():
            body.append(f"### {cat.title()}")
            body.append("")
            body.extend(f"- {row['ta']} — {row['count']} attestations" for row in rows[:12])
            body.append("")
        write_note(tinai_dir / f"{safe(name)}.md", {
            "title": f"{ta} · {en}",
            "type": "tinai",
            "tags": ["sangam", "tinai", tid],
            "aliases": [ta, en, f"{en} tiṇai"],
        }, "\n".join(body))

    # Work + verse index notes
    works_dir = out / "03 Works"
    verses_dir = out / "03 Works" / "Verse Index"
    all_poets = Counter()
    for poem, records in sorted(works.items()):
        ta, en = POEM_TITLES.get(poem, (poem, poem))
        name = f"Work - {poem}"
        tinai_counts = Counter(r.get("tinai") or "unknown" for r in records)
        poet_counts = Counter(clean_poet(r.get("poet")) for r in records if clean_poet(r.get("poet")))
        all_poets.update(poet_counts)
        body = [
            f"# {ta} · {en}",
            "",
            f"- Records: **{len(records)}**",
            f"- Tiṇai: " + ", ".join(f"{tinai_link(t)} ({c})" for t, c in tinai_counts.most_common()),
            f"- Poets: " + ", ".join(link(f"Poet - {p}", p) for p, _ in poet_counts.most_common(12)),
            "",
            "## Graph connections",
            "",
        ]
        for edge in (adj.get(f"poem:{poem}") or [])[:20]:
            target = edge["target"].replace("tinai:", "")
            if edge["target"].startswith("tinai:"):
                body.append(f"- Tiṇai → {tinai_link(target)} ({edge['weight']})")
            elif edge["target"].startswith("artifact:"):
                body.append(f"- Artifact → {note_link('Artifact', edge['target'].replace('artifact:', ''))} ({edge['weight']} mentions)")
            elif edge["target"].startswith("entity:"):
                body.append(f"- Entity → {note_link('Entity', edge['target'].replace('entity:', ''))} ({edge['weight']} mentions)")
        body.append("")
        body.append("## Artifact terms in this work")
        body.append("")
        body.extend(f"- {x}" for x in artifact_links(corpus_artifacts, poem))
        body.append("")
        body.append("## Entity terms in this work")
        body.append("")
        body.extend(f"- {x}" for x in entity_links(entities, poem))
        body.append("")
        if args.verses in ("index", "all"):
            body.append(f"## Verse index")
            body.append("")
            body.append(f"See {link(f'Verse Index - {poem}', f'{en} verse index')}.")
            if args.verses == "all":
                body.append("")
                body.append("Atomic verse notes are in `03 Works/Verses/`.")
        write_note(works_dir / f"{safe(name)}.md", {
            "title": f"{ta} · {en}",
            "type": "work",
            "tags": ["sangam", "work", poem],
            "aliases": [ta, en],
            "records": len(records),
        }, "\n".join(body))

        if args.verses in ("index", "all"):
            rows = ["# Verse index — " + ta, "", "| # | Title / opening | Tiṇai | Poet |", "|---|---|---|---|"]
            for record in records:
                number = record.get("number") or record.get("sectionNumber") or ""
                title = (record.get("title") or record.get("sangamTamil") or "").split("\n")[0][:60]
                poet = clean_poet(record.get("poet"))
                tinai = record.get("tinai") or ""
                if args.verses == "all":
                    note = f"Verse - {record['id']}"
                    rows.append(f"| {number} | {link(note, title)} | {tinai} | {poet} |")
                else:
                    rows.append(f"| {number} | {title} | {tinai} | {poet} |")
            write_note(verses_dir / f"{safe('Verse Index - ' + poem)}.md", {
                "title": f"{en} — verse index",
                "type": "verse-index",
                "tags": ["sangam", "index", poem],
            }, "\n".join(rows))

        if args.verses == "all":
            for record in records:
                tinai = record.get("tinai") or "unknown"
                poet = clean_poet(record.get("poet"))
                body = [
                    f"# {record.get('title') or record['id']}",
                    "",
                    f"- Work: {link(name, ta)}",
                    f"- Tiṇai: {tinai_link(tinai)}",
                    f"- Poet: {link(f'Poet - {poet}', poet) if poet else '—'}",
                    f"- Source: {record.get('source', '')}",
                    "",
                    "## Tamil",
                    "```",
                    record.get("sangamTamil", ""),
                    "```",
                ]
                if record.get("urai"):
                    body += ["", "## Urai", record["urai"]]
                if record.get("english"):
                    body += ["", "## English", record["english"]]
                write_note(out / "03 Works" / "Verses" / poem / f"{safe(record['id'])}.md", {
                    "title": record.get("title") or record["id"],
                    "type": "verse",
                    "tags": ["sangam", "verse", poem, tinai],
                    "poem": poem,
                    "ordinal": record.get("number") or record.get("sectionNumber"),
                    "tinai": tinai,
                    "poet": poet,
                }, "\n".join(body))

    # Poet notes
    poets_dir = out / "04 Poets"
    for poet, count in all_poets.most_common(80):
        name = f"Poet - {poet}"
        works_for = [p for p, records in works.items() if any(clean_poet(r.get("poet")) == poet for r in records)]
        tinai = Counter(r.get("tinai") or "unknown" for records in works.values() for r in records if clean_poet(r.get("poet")) == poet)
        body = [
            f"# {poet}",
            "",
            f"- Verses: **{count}**",
            f"- Works: " + ", ".join(work_link(p) for p in works_for),
            f"- Tiṇai: " + ", ".join(tinai_link(t) for t, _ in tinai.most_common()),
            "",
            "## Verse index",
            "",
        ]
        for poem in works_for[:12]:
            body.append(f"- {note_link('Verse Index', poem, POEM_TITLES.get(poem, (poem, poem))[0])}")
        write_note(poets_dir / f"{safe(name)}.md", {
            "title": poet,
            "type": "poet",
            "tags": ["sangam", "poet"],
            "verse_count": count,
        }, "\n".join(body))

    # Artifact notes
    artifacts_dir = out / "05 Artifacts"
    for artifact in artifacts_data.get("artifacts", []):
        name = f"Artifact - {artifact['id']}"
        body = [
            f"# {artifact['ta']} · {artifact['en']}",
            "",
            f"- Class: **{artifact.get('class', '')} / {artifact.get('subclass', '')}**",
            f"- Period: {artifact.get('period', '')}",
            f"- Place: {artifact.get('place', '')}",
            f"- Script: {artifact.get('script') or '—'}",
            f"- Rights: {artifact.get('rights', '')}",
            "",
            artifact.get("summary", ""),
            "",
            "## Scholar reader layers",
            "",
        ]
        for layer, data in (artifact.get("layers") or {}).items():
            body.append(f"- **{layer}** — {data.get('status', 'pending')}")
        body += ["", "## Related", "", f"- {link('Map - Artifacts', 'Artifacts map')}"]
        write_note(artifacts_dir / f"{safe(name)}.md", {
            "title": artifact["ta"],
            "type": "artifact",
            "tags": ["sangam", "artifact", artifact.get("class", "")],
            "aliases": [artifact["en"]],
            "rights": artifact.get("rights"),
        }, "\n".join(body))

    # Entity notes
    entities_dir = out / "06 Entities"
    for entity in entities:
        name = f"Entity - {entity['id']}"
        body = [
            f"# {entity['ta']} · {entity['en']}",
            "",
            f"- Category: **{entity['category']}**",
            f"- Attestations: **{entity['count']}**",
            f"- Roman: {entity.get('roman', '')}",
            "",
            "## Poem distribution",
            "",
            *[f"- {work_link(row['poem'])} — {row['count']}" for row in entity.get("poems", [])[:12]],
            "",
            "## Sample lines",
            "",
        ]
        for sample in entity.get("samples", [])[:6]:
            body += [f"> {sample.get('text', '')}", f"> — {sample.get('recordId')} · line {sample.get('lineNumber')}", ""]
        write_note(entities_dir / f"{safe(name)}.md", {
            "title": entity["ta"],
            "type": "entity",
            "tags": ["sangam", "entity", entity["category"]],
            "aliases": [entity["en"]],
            "count": entity["count"],
        }, "\n".join(body))

    # Story notes
    stories_dir = out / "07 Stories"
    for story in anthology:
        name = f"Story - {story['id']}"
        body = [
            f"# {story['titleTa']} · {story['titleEn']}",
            "",
            story.get("narrativeTa", ""),
            "",
            "## English",
            "",
            story.get("narrativeEn", ""),
            "",
            "## Evidence",
            "",
            f"- Source: {story.get('recordId')} · {story.get('poem')} {story.get('ordinal') or ''}",
            f"- Characters: {', '.join(story.get('characters', []))}",
            f"- Setting: {story.get('setting', '')}",
            f"- Conflict: {story.get('conflict', '')}",
            f"- Turn: {story.get('turn', '')}",
            f"- Resolution: {story.get('resolution', '')}",
            "",
            "## Source verse",
            "",
            "> " + (story.get("sourceText") or "").replace("\n", "\n> "),
            "",
            f"Read online: {story.get('sourceUrl', '')}",
        ]
        write_note(stories_dir / f"{safe(name)}.md", {
            "title": story["titleTa"],
            "type": "story",
            "tags": ["sangam", "story", story.get("kind", "")],
            "aliases": [story["titleEn"]],
            "record_id": story.get("recordId"),
        }, "\n".join(body))

    # Research briefs
    briefs_dir = out / "08 Research" / "Briefs"
    for brief in briefs:
        name = f"Brief - {brief['id']}"
        body = [
            f"# {brief['titleTa']} · {brief['titleEn']}",
            "",
            f"- Agent: **{brief.get('agent')}**",
            f"- Workflow: {brief.get('workflow')}",
            f"- Evidence: {brief.get('evidenceStatus')}",
            f"- Citations: {brief.get('citationCount', 0)}",
            "",
            brief.get("responseText", ""),
        ]
        write_note(briefs_dir / f"{safe(name)}.md", {
            "title": brief["titleTa"],
            "type": "research-brief",
            "tags": ["sangam", "avai", "research", brief.get("agent", "")],
            "aliases": [brief["titleEn"]],
        }, "\n".join(body))

    # Articles
    articles_dir = out / "08 Research" / "Articles"
    for path in sorted(ARTICLES_DIR.glob("*.md")) if ARTICLES_DIR.exists() else []:
        text = path.read_text(encoding="utf-8")
        match = re.search(r"^---\n(.*?)\n---\n", text, re.S)
        slug = re.search(r"^slug:\s*(.+)$", text, re.M)
        title = re.search(r"^title:\s*(.+)$", text, re.M)
        slug = slug.group(1).strip().strip('"') if slug else path.stem
        title = title.group(1).strip().strip('"') if title else path.stem
        body = text[match.end():] if match else text
        write_note(articles_dir / f"{safe('Article - ' + slug)}.md", {
            "title": title,
            "type": "article",
            "tags": ["sangam", "article", "research"],
            "source": f"content/articles/{path.name}",
        }, body)

    # MOCs
    write_note(maps_dir / "Map - Tiṇai.md", {
        "title": "Tiṇai map",
        "type": "moc",
        "tags": ["sangam", "moc", "tinai"],
    }, "\n".join([
        "# Tiṇai map",
        "",
        *[f"- {tinai_link(tid)} — {landscape}" for tid, (ta, en, landscape) in TINAI.items() if tid != "unknown"],
        "",
        f"See also {link('Map - Works', 'Works')} · {link('Map - Artifacts', 'Artifacts')} · {link('Map - Entities', 'Entities')}",
    ]))

    write_note(maps_dir / "Map - Works.md", {
        "title": "Works map",
        "type": "moc",
        "tags": ["sangam", "moc", "works"],
    }, "\n".join([
        "# Works map",
        "",
        *[f"- {work_link(poem)} — {len(records)} records" for poem, records in sorted(works.items())],
    ]))

    write_note(maps_dir / "Map - Poets.md", {
        "title": "Poets map",
        "type": "moc",
        "tags": ["sangam", "moc", "poets"],
    }, "\n".join([
        "# Poets map",
        "",
        *[f"- {link(f'Poet - {poet}', poet)} — {count} verses" for poet, count in all_poets.most_common(80)],
    ]))

    write_note(maps_dir / "Map - Artifacts.md", {
        "title": "Artifacts map",
        "type": "moc",
        "tags": ["sangam", "moc", "artifacts"],
    }, "\n".join([
        "# Artifacts map",
        "",
        "## Physical artifacts",
        *[f"- {note_link('Artifact', a['id'], a['ta'])} — {a.get('class', '')}" for a in artifacts_data.get("artifacts", [])],
        "",
        "## Corpus artifact terms",
        *[f"- {note_link('Artifact', a['id'], a['ta'])} — {a['count']} attestations" for a in corpus_artifacts[:40]],
    ]))

    write_note(maps_dir / "Map - Entities.md", {
        "title": "Entities map",
        "type": "moc",
        "tags": ["sangam", "moc", "entities"],
    }, "\n".join([
        "# Entities map",
        "",
        *[f"- {note_link('Entity', e['id'], e['ta'])} — {e['count']} ({e['category']})" for e in sorted(entities, key=lambda x: -x["count"])[:80]],
    ]))

    write_note(maps_dir / "Map - Stories.md", {
        "title": "Stories map",
        "type": "moc",
        "tags": ["sangam", "moc", "stories"],
    }, "\n".join([
        "# Stories map",
        "",
        *[f"- {note_link('Story', s['id'], s['titleTa'])} — {s.get('kind')}" for s in anthology],
    ]))

    write_note(maps_dir / "Map - Research.md", {
        "title": "Research map",
        "type": "moc",
        "tags": ["sangam", "moc", "research"],
    }, "\n".join([
        "# Research map",
        "",
        "## Avai briefs",
        *[f"- {note_link('Brief', b['id'], b['titleTa'])} — {b.get('agent')}" for b in briefs],
        "",
        f"See also {link('Map - Artifacts', 'Artifacts')} · {link('Map - Entities', 'Entities')} · {link('Map - Works', 'Works')}",
    ]))

    # Home
    write_note(out / "00 Home.md", {
        "title": "Open Sangam — second brain",
        "type": "home",
        "tags": ["sangam", "moc", "home"],
    }, "\n".join([
        "# Open Sangam — second brain",
        "",
        "A linked Obsidian vault generated from the Open Sangam corpus, artifact register, entity index, stories and Avai research.",
        "",
        "## Launch points",
        "",
        f"- {link('Map - Tiṇai', 'Tiṇai landscapes')}",
        f"- {link('Map - Works', 'Works')}",
        f"- {link('Map - Poets', 'Poets')}",
        f"- {link('Map - Artifacts', 'Artifacts')}",
        f"- {link('Map - Entities', 'Entities')}",
        f"- {link('Map - Stories', 'Stories')}",
        f"- {link('Map - Research', 'Research')}",
        "",
        "## Corpus",
        "",
        f"- Works: **{len(works)}**",
        f"- Records: **{sum(len(v) for v in works.values()):,}**",
        f"- Tiṇai notes: **{len([t for t in TINAI if t != 'unknown'])}**",
        f"- Poets: **{len(all_poets)}**",
        f"- Artifact records: **{len(artifacts_data.get('artifacts', []))}**",
        f"- Corpus artifact terms: **{len(corpus_artifacts)}**",
        f"- Entity terms: **{len(entities)}**",
        f"- Curated stories: **{len(anthology)}**",
        f"- Research briefs: **{len(briefs)}**",
        "",
        "## Graph",
        "",
        f"This vault is Obsidian graph-ready. Use Graph View, then filter by tags such as `#tinai`, `#work`, `#poet`, `#artifact`, `#entity`, `#story`, `#research-brief`.",
        "",
        f"Live web graph: {link('Map - Tiṇai', 'Tiṇai map')} · `data/knowledge/graph.json`",
    ]))

    # Obsidian graph colours
    obsidian = out / ".obsidian"
    obsidian.mkdir(exist_ok=True)
    (obsidian / "graph.json").write_text(json.dumps({
        "collapse-filter": False,
        "search": "",
        "showTags": True,
        "showAttachments": False,
        "hideUnresolved": False,
        "showOrphans": True,
        "colorGroups": [
            {"query": "tag:#tinai", "color": {"a": 1, "rgb": 11899648}},
            {"query": "tag:#work", "color": {"a": 1, "rgb": 5187839}},
            {"query": "tag:#poet", "color": {"a": 1, "rgb": 371380}},
            {"query": "tag:#artifact", "color": {"a": 1, "rgb": 895497}},
            {"query": "tag:#entity", "color": {"a": 1, "rgb": 8132855}},
            {"query": "tag:#story", "color": {"a": 1, "rgb": 14655368}},
            {"query": "tag:#research", "color": {"a": 1, "rgb": 3447003}},
        ],
    }, indent=2), encoding="utf-8")

    print(f"Obsidian vault exported → {out}")
    print(f"  works: {len(works)} · poets: {len(all_poets)} · artifacts: {len(artifacts_data.get('artifacts', []))}")
    print(f"  entities: {len(entities)} · stories: {len(anthology)} · briefs: {len(briefs)}")
    print(f"  verse mode: {args.verses}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
