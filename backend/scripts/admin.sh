#!/usr/bin/env bash
# scripts/admin.sh — Pull-Sync batch admin operations
# Usage: ./scripts/admin.sh <command> [options]
#
# Commands:
#   close-stale [days]                Close PRs not updated in N days (default 30)
#   assign <prId> <userId,userId,...> Assign reviewers to a PR
#   report                            Print summary report
#   set-role <userId> <role>          Change a user's role (owner/reviewer/viewer)
#
# Prerequisites:
#   export PULLSYNC_TOKEN=token_alex   # owner token required
#   export PULLSYNC_API=http://localhost:4000

API="${PULLSYNC_API:-http://localhost:4000}"
TOKEN="${PULLSYNC_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌  Set PULLSYNC_TOKEN env variable first."
  echo "    export PULLSYNC_TOKEN=token_alex"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"
CT_HEADER="Content-Type: application/json"

cmd="$1"

case "$cmd" in
  close-stale)
    DAYS="${2:-30}"
    echo "🕐  Closing PRs not updated in $DAYS days..."
    curl -s -X POST "$API/api/admin/close-stale" \
      -H "$AUTH_HEADER" -H "$CT_HEADER" \
      -d "{\"days\": $DAYS}" | python3 -m json.tool
    ;;

  assign)
    PR_ID="$2"
    REVIEWERS="$3"   # comma-separated: u2,u3
    if [ -z "$PR_ID" ] || [ -z "$REVIEWERS" ]; then
      echo "Usage: $0 assign <prId> <userId1,userId2,...>"
      exit 1
    fi
    # Convert "u2,u3" → ["u2","u3"]
    JSON_ARRAY=$(echo "$REVIEWERS" | python3 -c "import sys,json; ids=sys.stdin.read().strip().split(','); print(json.dumps(ids))")
    echo "👥  Assigning reviewers $REVIEWERS to PR $PR_ID..."
    curl -s -X POST "$API/api/admin/assign-reviewers" \
      -H "$AUTH_HEADER" -H "$CT_HEADER" \
      -d "{\"prId\": \"$PR_ID\", \"reviewerIds\": $JSON_ARRAY}" | python3 -m json.tool
    ;;

  report)
    echo "📊  Fetching report..."
    curl -s "$API/api/admin/report" \
      -H "$AUTH_HEADER" | python3 -m json.tool
    ;;

  set-role)
    USER_ID="$2"
    ROLE="$3"
    if [ -z "$USER_ID" ] || [ -z "$ROLE" ]; then
      echo "Usage: $0 set-role <userId> <owner|reviewer|viewer>"
      exit 1
    fi
    echo "🔑  Setting $USER_ID role to $ROLE..."
    curl -s -X POST "$API/api/admin/bulk-update-permissions" \
      -H "$AUTH_HEADER" -H "$CT_HEADER" \
      -d "{\"userId\": \"$USER_ID\", \"role\": \"$ROLE\"}" | python3 -m json.tool
    ;;

  *)
    echo "Pull-Sync Admin Script"
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  close-stale [days]                 Close PRs stale for N days (default 30)"
    echo "  assign <prId> <u1,u2>              Assign reviewers to a PR"
    echo "  report                             View summary statistics"
    echo "  set-role <userId> <role>           Update user permission role"
    echo ""
    echo "Environment:"
    echo "  PULLSYNC_TOKEN   Bearer token (required, must be owner)"
    echo "  PULLSYNC_API     API base URL (default: http://localhost:4000)"
    ;;
esac
