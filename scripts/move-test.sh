#!/bin/bash
source /root/.nvm/nvm.sh >/dev/null 2>&1
B=http://localhost:3000
J='Content-Type: application/json'
WS=/api/v1/workspaces/demo-eng/projects/core-platform

NUM=$1
SID=$(curl -s "$B$WS" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const p=JSON.parse(d).project;console.log(p.statuses.find(s=>s.kind==="IN_PROGRESS").id)});')
echo "target status id: $SID"

echo "== move CORE-$NUM (with sort orders) =="
curl -s -X POST "$B$WS/issues/$NUM/move" -H "$J" \
  -d "{\"targetStatusId\":\"$SID\",\"previousIssueSortOrder\":1000,\"nextIssueSortOrder\":2000}" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const i=JSON.parse(d).issue;console.log("moved:",i.number,"->",i.status.kind,"| sortOrder:",i.sortOrder)});'

echo "== patch priority + description =="
curl -s -X PATCH "$B$WS/issues/$NUM" -H "$J" \
  -d '{"priority":"URGENT","description":"Updated via smoke test"}' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const i=JSON.parse(d).issue;console.log("patched:",i.priority,"|",i.description)});'

echo "== soft delete =="
curl -s -X DELETE "$B$WS/issues/$NUM"
echo

echo "== verify count back to 9 =="
curl -s "$B$WS/issues" | grep -o '"number":' | wc -l
