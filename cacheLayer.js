import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

function getCachedRoute(from, to, method) {
	return cache.get(`${from}-${to}-${method}`);
}

function setCachedRoute(from, to, method, data) {
	cache.set(`${from}-${to}-${method}`, data);
}

export { getCachedRoute, setCachedRoute };
