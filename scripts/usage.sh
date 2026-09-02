#!/bin/zsh

set -euo pipefail

fenetre="${1:-7d}"

claude_skill_dir="$HOME/.claude/plugins/marketplaces/claude-plugins-official/plugins/session-report/skills/session-report"
claude_analyzer="$claude_skill_dir/analyze-sessions.mjs"
claude_history="$HOME/.claude/history.jsonl"
codex_logs="$HOME/.codex/logs_2.sqlite"

if ! command -v node >/dev/null 2>&1; then
  echo "Erreur: node est introuvable."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Erreur: jq est introuvable."
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "Erreur: sqlite3 est introuvable."
  exit 1
fi

echo "== Claude =="

if [ -f "$claude_analyzer" ]; then
  if [ "$fenetre" = "all" ]; then
    claude_json="$(node "$claude_analyzer" --json)"
  else
    claude_json="$(node "$claude_analyzer" --json --since "$fenetre")"
  fi

  echo "$claude_json" | jq '{
    periode: (if "'"$fenetre"'" == "all" then "all" else "'"$fenetre"'" end),
    input_uncached: .overall.input_tokens.uncached,
    input_cache_create: .overall.input_tokens.cache_creation,
    input_cache_read: .overall.input_tokens.cache_read,
    input_total: .overall.input_tokens.total,
    output_total: .overall.output_tokens,
    total_tokens: (.overall.input_tokens.total + .overall.output_tokens),
    pct_cached: .overall.input_tokens.pct_cached,
    sessions: .overall.sessions,
    subagent_calls: .overall.subagent.calls
  }'

  echo
  echo "-- Top projets Claude --"
  echo "$claude_json" | jq -r '
    .by_project
    | to_entries
    | map({
        project: .key,
        total_tokens: (.value.input_tokens.total + .value.output_tokens),
        input_total: .value.input_tokens.total,
        output_total: .value.output_tokens
      })
    | sort_by(-.total_tokens)
    | .[:5]
    | .[]
    | "\(.project) | total=\(.total_tokens) | input=\(.input_total) | output=\(.output_total)"
  '
else
  echo "Analyseur Claude introuvable: $claude_analyzer"
  if [ -f "$claude_history" ]; then
    echo "Historique Claude présent: $claude_history"
  fi
fi

echo
echo "== Codex =="

if [ -f "$codex_logs" ]; then
  echo "-- Derniers événements tokenUsage --"
  sqlite3 "$codex_logs" "
    select datetime(ts,'unixepoch','localtime') || ' | ' || substr(feedback_log_body,1,180)
    from logs
    where feedback_log_body like 'app-server event: thread/tokenUsage/updated%'
    order by ts desc
    limit 10;
  "

  echo
  echo "-- Derniers messages de quota/usage limit --"
  sqlite3 "$codex_logs" "
    select datetime(ts,'unixepoch','localtime') || ' | ' || substr(feedback_log_body,1,220)
    from logs
    where target = 'codex_core::session_startup_prewarm'
      and (
        feedback_log_body like '%usage limit%'
        or feedback_log_body like '%purchase more credits%'
        or feedback_log_body like '%Upgrade to Pro%'
        or feedback_log_body like '%try again at%'
      )
    order by ts desc
    limit 10;
  "
else
  echo "Base de logs Codex introuvable: $codex_logs"
fi
