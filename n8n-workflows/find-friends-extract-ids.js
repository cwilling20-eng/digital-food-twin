const currentUserId = $('When Executed by Another Workflow').first().json.user_id;

// Supabase node outputs one item per row; alwaysOutputData can emit a single
// empty item when there are no rows, so filter those out.
const relationships = $input.all()
  .map(i => i.json)
  .filter(j => j && Object.keys(j).length > 0);

const friendIds = relationships.map(rel =>
  rel.user_id === currentUserId ? rel.friend_id : rel.user_id
).filter(Boolean);

return [{
  json: {
    friend_ids: friendIds,
    // Zero-UUID sentinel keeps id=in.(...) valid when there are no friends
    friend_ids_string: friendIds.length ? friendIds.join(',') : '00000000-0000-0000-0000-000000000000'
  }
}];