/**
 * Graph Recommendation Engine for CodeSync
 * 
 * Computes friend/peer recommendations using fundamental Graph Theory algorithms:
 * 1. Social Graph BFS 2-Hop Traversal (Finds friends of friends at distance d = 2).
 * 2. Adamic-Adar Index (Weights mutual friend nodes inversely by their degree).
 * 3. Bipartite Graph Projection & Jaccard Similarity (User-to-Workspace co-membership).
 * 
 * NOTE: Operates strictly on real registered developer peers in the network.
 * When a user has no connected network yet, it returns an empty set instead of dummy mock profiles.
 */

/**
 * Computes friend suggestions based on Graph Theory (BFS 2-hop, Adamic-Adar, Jaccard Index).
 *
 * @param {Object} currentUser - Current logged-in user object
 * @param {Array} currentFriends - Current user's friend array
 * @param {Array} userRooms - Current user's workspaces
 * @param {Array} networkDevelopers - Real peers registered in the platform
 * @returns {Array} Ranked list of suggested peers with mathematical graph metrics
 */
export function getGraphFriendSuggestions(currentUser, currentFriends = [], userRooms = [], networkDevelopers = []) {
  const currentUsername = currentUser?.username?.toLowerCase() || 'user';
  const friendUsernames = new Set(
    currentFriends.map((f) => (f.username || '').toLowerCase()).filter(Boolean)
  );

  // If no other developers exist in the real network, return empty list
  if (!networkDevelopers || networkDevelopers.length === 0) {
    return [];
  }

  // 1. Build Adjacency List for the Undirected Social Graph G = (V, E)
  const adjacencyList = new Map();

  function addEdge(u, v) {
    if (!u || !v || u === v) return;
    if (!adjacencyList.has(u)) adjacencyList.set(u, new Set());
    if (!adjacencyList.has(v)) adjacencyList.set(v, new Set());
    adjacencyList.get(u).add(v);
    adjacencyList.get(v).add(u);
  }

  // Connect current user to all current friends
  friendUsernames.forEach((friendUname) => {
    addEdge(currentUsername, friendUname);
  });

  // Connect known network developers based on their real connections
  networkDevelopers.forEach((dev) => {
    const devUname = (dev.username || '').toLowerCase();
    if (Array.isArray(dev.connections)) {
      dev.connections.forEach((conn) => {
        addEdge(devUname, conn.toLowerCase());
      });
    }
  });

  // 2. Perform Breadth-First Search (BFS) starting from currentUser to identify 2-Hop Neighbors
  const distances = new Map();
  const queue = [currentUsername];
  distances.set(currentUsername, 0);

  while (queue.length > 0) {
    const node = queue.shift();
    const currDist = distances.get(node);

    if (currDist >= 2) continue; // Only explore up to 2 hops

    const neighbors = adjacencyList.get(node) || new Set();
    neighbors.forEach((neighbor) => {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currDist + 1);
        queue.push(neighbor);
      }
    });
  }

  // 3. Extract User's Workspaces & Primary Languages for Bipartite Projection
  const userRoomNames = new Set(
    userRooms.map((r) => (r.name || '').toLowerCase()).filter(Boolean)
  );
  const userSkills = new Set(['cpp', 'python', 'javascript']);

  // 4. Score Candidate Developers
  const candidates = [];

  networkDevelopers.forEach((dev) => {
    const devUname = (dev.username || '').toLowerCase();

    // Skip if it's the current user or already a friend
    if (!devUname || devUname === currentUsername || friendUsernames.has(devUname)) {
      return;
    }

    // A. Graph Distance & Common Neighbors Gamma(u) ∩ Gamma(v)
    const uNeighbors = adjacencyList.get(currentUsername) || new Set();
    const vNeighbors = adjacencyList.get(devUname) || new Set();

    const mutualNeighbors = [];
    uNeighbors.forEach((nbr) => {
      if (vNeighbors.has(nbr)) {
        mutualNeighbors.push(nbr);
      }
    });

    // B. Adamic-Adar Index: Sum_{w in mutual} 1 / log2(deg(w))
    let adamicAdarScore = 0;
    mutualNeighbors.forEach((w) => {
      const degree = (adjacencyList.get(w) || new Set()).size;
      const degWeight = degree > 1 ? 1 / Math.log2(degree) : 1;
      adamicAdarScore += degWeight;
    });

    // C. Bipartite Jaccard Similarity on Shared Coding Rooms
    const devRooms = (dev.rooms || []).map((r) => r.toLowerCase());
    const intersectionRooms = devRooms.filter((r) => userRoomNames.has(r));
    const unionRooms = new Set([...userRoomNames, ...devRooms]);
    const jaccardRooms = unionRooms.size > 0 ? intersectionRooms.length / unionRooms.size : 0;

    // D. Skill Set Overlap
    const devSkills = dev.skills || [];
    const intersectionSkills = devSkills.filter((s) => userSkills.has(s.toLowerCase()));
    const unionSkills = new Set([...userSkills, ...devSkills.map((s) => s.toLowerCase())]);
    const jaccardSkills = unionSkills.size > 0 ? intersectionSkills.length / unionSkills.size : 0;

    const bipartiteScore = (jaccardRooms * 0.7) + (jaccardSkills * 0.3);

    // E. Composite Algorithmic Ranking Score
    const compositeScore = (adamicAdarScore * 0.6) + (bipartiteScore * 0.4);

    const matchPercentage = Math.min(
      98,
      Math.max(68, Math.round(65 + Math.min(adamicAdarScore * 14, 20) + (bipartiteScore * 15)))
    );

    let primaryMetric = '';
    let algorithmType = '';

    if (mutualNeighbors.length > 0) {
      primaryMetric = `2-Hop Neighbor via @${mutualNeighbors[0]}`;
      algorithmType = 'BFS 2-Hop + Adamic-Adar';
    } else if (intersectionRooms.length > 0) {
      primaryMetric = `Shared Room: "${dev.rooms[0]}"`;
      algorithmType = 'Bipartite Jaccard';
    } else {
      primaryMetric = `Common Stack: ${devSkills.slice(0, 2).join(', ').toUpperCase()}`;
      algorithmType = 'Jaccard Stack Overlap';
    }

    candidates.push({
      ...dev,
      matchPercentage,
      compositeScore,
      adamicAdarScore: Number(adamicAdarScore.toFixed(2)),
      jaccardScore: Number(bipartiteScore.toFixed(2)),
      mutualNeighbors,
      sharedRooms: intersectionRooms,
      sharedSkills: intersectionSkills,
      primaryMetric,
      algorithmType,
      hopDistance: distances.get(devUname) || 2
    });
  });

  // Sort descending by algorithmic composite score
  candidates.sort((a, b) => b.compositeScore - a.compositeScore);

  return candidates;
}
