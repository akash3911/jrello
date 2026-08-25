#!/bin/bash
sleep 3
echo "== JRELLO FINAL VERIFICATION =="
for u in / \
  /demo-eng/projects/core-platform \
  /demo-eng/projects/core-platform/issues \
  /demo-eng/projects/core-platform/sprints \
  /demo-eng/projects/core-platform/sprints/reports \
  /demo-eng/projects/core-platform/settings \
  /demo-eng/issue/CORE-101 \
  /onboarding; do
  printf '%-55s' "$u"
  curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$u"
done
echo -n "health: "
curl -s http://localhost:3000/api/health | grep -o '"status":"[a-z]*"' | head -1
echo "-- server log tail --"
tail -2 /tmp/jrello.log
