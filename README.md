# Grigorii Veviurko — personal website

Static personal website for https://veviurko.github.io. Python generates the pages; no framework or database is required. The complete bibliography is on Home. Previous publication URLs redirect there.

## Edit and preview

Requires Python 3.10+:

```sh
python3 scripts/build.py
python3 scripts/check_site.py
python3 scripts/test_publications.py
python3 scripts/serve.py
```

Open http://127.0.0.1:8765. The local preview server disables caching. Rebuild after editing content or styles.

- `content/site.json`: biography, research, experience and education.
- `content/publications.json`: complete cached bibliography.
- `content/publication_overrides.json`: curated metadata and links, preserved during imports.
- `static/assets/`: styles, scripts, CV, portrait, institution marks and research illustrations.
- `scripts/build.py`: page templates; generated output goes to `dist/`.
- Generated pages and assets are also included at the repository root for compatibility with the existing branch-based Pages site. The deployment workflow publishes `dist/`.

## Publications and deployment

`.github/workflows/publish.yml` builds and deploys pushes to `main` or `master`. Every Monday at 06:17 UTC, and on manual runs, it attempts to refresh Google Scholar author `2jVnBAIAAAAJ` before deploying. Set GitHub **Settings → Pages → Source → GitHub Actions** for workflow deployments.

The updater normalizes titles, preserves curated links and existing entries, and keeps the last good bibliography on source errors. Scholar may block automated requests; a failed refresh produces a workflow warning and deploys cached data. Five offline tests cover merging and failure preservation.

For a manual local refresh:

```sh
python3 -m pip install scholarly==1.7.11
python3 scripts/update_publications.py
python3 scripts/build.py
```

## Visuals and provenance

Biographical details come from the owner's supplied 2026 CV and redesign brief. Research prose draws on the owner's application materials and Naver Labs candidate talk. Private application documents are not included.

The constrained-RL illustration replays approximate positions recovered from the original GIF, sampled every second frame. It is not a new simulation or an exact data export. Playback is opt-in with pause, restart and scrubbing. Geometry panels are unchanged figures from the talk. The max-reward result figure is also from the talk.

The Brackets monogram is used in the header and favicon. Institution marks belong to their respective organizations. Original profile assets and bibliography come from the previous version of this repository. The supplied CV is unchanged.
