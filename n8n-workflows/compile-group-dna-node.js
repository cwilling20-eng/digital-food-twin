// --- Input: user_ids from the parent workflow ---
// Defensive: handle missing input (e.g. a manual editor execute-test with no
// pinned trigger data) and user_ids arriving as a JSON string or CSV string.
const triggerJson = $('When Executed by Another Workflow').first().json || {};
let userIds = triggerJson.user_ids;

if (typeof userIds === 'string') {
  try { userIds = JSON.parse(userIds); }
  catch (e) { userIds = userIds.split(',').map(s => s.trim()).filter(Boolean); }
}
if (!Array.isArray(userIds)) userIds = [];

if (userIds.length === 0) {
  return [{ json: {
    error: 'No user_ids received. Pass user_ids as an array of profile UUIDs. If testing manually in the editor, pin test data on the trigger node first, e.g. {"user_ids": ["<uuid1>", "<uuid2>"]}.',
    group_size: 0,
    members: []
  }}];
}

// Each Supabase node outputs one item per row; alwaysOutputData can emit a
// single empty item when a query returns no rows, so filter those out.
const rows = (nodeName) => $(nodeName).all()
  .map(i => i.json)
  .filter(j => j && Object.keys(j).length > 0);

const profiles = rows('Get Profiles');
const publicProfiles = rows('Get Public Profiles');
const constraints = rows('Get Dietary Constraints');
const cuisinePrefs = rows('Get Cuisine Preferences');
const flavorProfiles = rows('Get Flavor Profiles');

// Build a profile for each user
const groupMembers = userIds.map(userId => {
  const profile = profiles.find(p => p.user_id === userId) || {};
  const publicProfile = publicProfiles.find(p => p.id === userId) || {};
  const userConstraints = constraints.find(c => c.user_id === userId) || {};
  const userCuisines = cuisinePrefs.filter(c => c.user_id === userId) || [];
  const userFlavor = flavorProfiles.find(f => f.user_id === userId) || {};
  
  return {
    user_id: userId,
    name: publicProfile.display_name || publicProfile.username || 'Friend',
    
    // Dietary constraints (HARD requirements)
    allergies: userConstraints.allergies || [],
    restrictions: userConstraints.restrictions || [],
    never_eat: userConstraints.never_eat || [],
    
    // Preferences (SOFT - try to match)
    favorite_foods: profile.favorite_foods || [],
    dislikes: profile.dislikes || [],
    
    // Cuisine preferences
    favorite_cuisines: userCuisines.map(c => c.cuisine_type),
    cuisine_details: userCuisines.map(c => ({
      cuisine: c.cuisine_type,
      favorite_dishes: c.favorite_dishes || [],
      spice_level: c.spice_level || 5
    })),
    
    // Taste profile (user_flavor_profile.spicy_preference, 1-10 slider -
    // NOT user_profiles.spicy_preference, which is a 0-100 swipe-derived score)
    spicy_tolerance: userFlavor.spicy_preference || 5
  };
});

// Compile group constraints
const allAllergies = [...new Set(groupMembers.flatMap(m => m.allergies))];
const allRestrictions = [...new Set(groupMembers.flatMap(m => m.restrictions))];
const allNeverEat = [...new Set(groupMembers.flatMap(m => m.never_eat))];
const allDislikes = [...new Set(groupMembers.flatMap(m => m.dislikes))];

// Find cuisines EVERY member lists (strict - not majority)
const cuisineCounts = {};
groupMembers.forEach(m => {
  m.favorite_cuisines.forEach(c => {
    cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
  });
});

const sharedCuisines = Object.entries(cuisineCounts)
  .filter(([cuisine, count]) => count === groupMembers.length)
  .map(([cuisine]) => cuisine)
  .sort((a, b) => cuisineCounts[b] - cuisineCounts[a]);

// Find lowest spice tolerance in group
const lowestSpiceTolerance = Math.min(...groupMembers.map(m => m.spicy_tolerance));

return [{
  json: {
    group_size: groupMembers.length,
    members: groupMembers,
    
    // HARD constraints - must respect these
    hard_constraints: {
      all_allergies: allAllergies,
      all_restrictions: allRestrictions,
      all_never_eat: allNeverEat,
      description: (allAllergies.length > 0 || allRestrictions.length > 0 || allNeverEat.length > 0)
        ? `Must avoid: ${[...allAllergies, ...allRestrictions, ...allNeverEat].join(', ')}`
        : 'No hard dietary restrictions'
    },
    
    // SOFT preferences - try to accommodate
    soft_preferences: {
      shared_favorite_cuisines: sharedCuisines,
      combined_dislikes: allDislikes,
      max_spice_level: lowestSpiceTolerance
    },
    
    // Recommendation summary
    recommendation_notes: generateRecommendationNotes(groupMembers, sharedCuisines, allAllergies, allNeverEat)
  }
}];

function generateRecommendationNotes(members, sharedCuisines, allergies, neverEat) {
  const notes = [];
  
  if (allergies.length > 0) {
    notes.push(`⚠️ Allergy alert: ${allergies.join(', ')} - must avoid these`);
  }
  
  if (neverEat.length > 0) {
    notes.push(`🚫 Never serve: ${neverEat.join(', ')} - hard constraints, treat like allergies`);
  }
  
  if (sharedCuisines.length > 0) {
    notes.push(`✅ Cuisines every single member enjoys: ${sharedCuisines.slice(0, 3).join(', ')}`);
  } else {
    notes.push(`ℹ️ No cuisine that every member lists - look for versatile restaurants`);
  }
  
  const spiceLevels = members.map(m => m.spicy_tolerance);
  if (Math.max(...spiceLevels) - Math.min(...spiceLevels) > 4) {
    notes.push(`🌶️ Mixed spice preferences - choose a place with mild and spicy options`);
  }
  
  return notes;
}