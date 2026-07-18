// friend_names arrives as a string (JSON array or CSV) from the $fromAI input
let requestedNames = $('When Executed by Another Workflow').first().json.friend_names;
if (typeof requestedNames === 'string') {
  try { requestedNames = JSON.parse(requestedNames); }
  catch (e) { requestedNames = requestedNames.split(',').map(s => s.trim()).filter(Boolean); }
}
if (!Array.isArray(requestedNames)) requestedNames = [];

const friendProfiles = $('Get Friend Profiles').all()
  .map(i => i.json)
  .filter(j => j && Object.keys(j).length > 0);

const matches = [];
const notFound = [];

for (const name of requestedNames) {
  const nameLower = String(name).toLowerCase();
  const match = friendProfiles.find(f =>
    (f.display_name && f.display_name.toLowerCase().includes(nameLower)) ||
    (f.username && f.username.toLowerCase().includes(nameLower))
  );
  if (match) {
    matches.push({ requested_name: name, user_id: match.id, display_name: match.display_name, username: match.username });
  } else {
    notFound.push(name);
  }
}

return [{ json: { matched_friends: matches, not_found: notFound, matched_user_ids: matches.map(m => m.user_id) } }];