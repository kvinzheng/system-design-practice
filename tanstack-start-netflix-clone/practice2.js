function bfs(node, target) {
	const queue = [node];
	while (queue.length) {
		const current = queue.shift();
		if (current.val === target) return true;
		for (const child of current.children) {
			queue.push(child);
		}
	}
	return false;
}

// Example usage:
const tree = {
	val: 1,
	children: [
		{ val: 2, children: [{ val: 4, children: [] }] },
		{ val: 3, children: [] },
	],
};
console.log("BFS search for 4:", bfs(tree, 4)); // true
