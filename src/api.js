export async function fetchForgeData() {
  const res = await fetch("/api/forge-data");
  return res.json();
}

export async function saveYamlEntry(id, yamlContent) {
  const res = await fetch("/api/save-entry", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({id, content: yamlContent}),
  });
  return res.json();
}
