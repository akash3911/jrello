#!/bin/bash
B=http://localhost:3000
J='Content-Type: application/json'

echo "== 1. workspaces =="
curl -s $B/api/v1/workspaces | head -c 200; echo; echo

echo "== 2. list issues (count) =="
curl -s "$B/api/v1/workspaces/demo-eng/projects/core-platform/issues" | grep -o '"number":' | wc -l

echo "== 3. create issue =="
CREATED=$(curl -s -X POST "$B/api/v1/workspaces/demo-eng/projects/core-platform/issues" \
  -H "$J" \
  -d '{"title":"WSL smoke test issue","priority":"HIGH","statusKind":"TODO","estimate":2}')
echo "$CREATED" | head -c 260; echo
NUM=$(echo "$CREATED" | grep -o '"number":[0-9]*' | head -1 | cut -d: -f2)
echo "created issue number: $NUM"; echo

echo "== 4. move it to IN_PROGRESS column =="
STATUS_ID=$(curl -s "$B/api/v1/workspaces/demo-eng/projects/core-platform" | node -e "
let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
  const p=JSON.parse(d).project;
  console.log(p.statuses.find(s=>s.kind==='IN_PROGRESS').id);
});")
curl -s -X POST "$B/api/v1/workspaces/demo-eng/projects/core-platform/issues/$NUM/move" \
  -H "$J" \
  -d "{\"targetStatusId\":\"$STATUS_ID\"}" | grep -o '"statusId":"[^"]*"' | head -1
echo

echo "== 5. comment on it =="
curl -s -X POST "$B/api/v1/workspaces/demo-eng/projects/core-platform/issues/$NUM/comments" \
  -H "$J" \
  -d '{"body":"Comment posted during WSL smoke test."}' | head -c 200; echo; echo

echo "== 6. notifications =="
curl -s $B/api/v1/workspaces/demo-eng/notifications | head -c 120; echo; echo

echo "== 7. sprint lifecycle =="
SPRINT=$(curl -s -X POST "$B/api/v1/workspaces/demo-eng/projects/core-platform/sprints" \
  -H "$J" \
  -d '{"name":"Sprint A","startDate":"2026-08-25T00:00:00.000Z","endDate":"2026-09-08T00:00:00.000Z"}')
SID=$(echo "$SPRINT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "sprint id: $SID"
curl -s -X POST "$B/api/v1/workspaces/demo-eng/projects/core-platform/sprints/$SID/start" -o /dev/null -w 'start: %{http_code}\n'
curl -s -X POST "$B/api/v1/workspaces/demo-eng/projects/core-platform/sprints/$SID/complete" \
  -H "$J" -d '{}' -o /dev/null -w 'complete: %{http_code}\n'

echo "== 8. velocity report =="
curl -s "$B/api/v1/workspaces/demo-eng/projects/core-platform/sprints/reports" >/dev/null 2>&1
curl -s -o /dev/null -w 'board page: %{http_code}\n' http://localhost:3000/demo-eng/projects/core-platform
curl -s -o /dev/null -w 'issues page: %{http_code}\n' http://localhost:3000/demo-eng/projects/core-platform/issues
curl -s -o /dev/null -w 'sprints page: %{http_code}\n' http://localhost:3000/demo-eng/projects/core-platform/sprints
curl -s -o /dev/null -w 'reports page: %{http_code}\n' http://localhost:3000/demo-eng/projects/core-platform/sprints/reports
curl -s -o /dev/null -w 'settings page: %{http_code}\n' http://localhost:3000/demo-eng/projects/core-platform/settings
curl -s -o /dev/null -w 'issue page CORE-101: %{http_code}\n' http://localhost:3000/demo-eng/issue/CORE-101
