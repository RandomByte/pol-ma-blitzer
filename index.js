const debug = require("debug")("pol-ma-blitzer");
const graph = require("fbgraph");
const config = require("./config.json");

graph.setAccessToken(config.fbAccessToken);

function retrievePosts() {
	return new Promise(function(resolve, reject) {
		graph.get("PolizeiMannheim/posts", function(err, res) {
			if (err) {
				reject(err);
				return;
			}
			let posts = res.data;
			let matches = [];

			for (let i = 0; i < posts.length; i++) {
				let post = posts[i];
				if (post.message.match(/#Geschwindigkeitskontrollen/i)) {
					matches.push(post);
				}
			}
			resolve(matches);
		});
	});
}

function findLocations(post) {
	return new Promise(function(resolve, reject) {
		const regionRegex =
			/(Mannheim|Heidelberg|Rhein-Neckar-Kreis|RheinNeckarKreis|Rhein Neckar Kreis)[^a-zA-Z]*\n+((?:#.*\n?)+)/ig;
		const locationRegex = /#(.*)/igm;

		let foundLocations = [];
		let regionMatch;
		while ((regionMatch = regionRegex.exec(post.message)) !== null) {
			let region = regionMatch[1];
			let locations = regionMatch[2];
			debug("Matches for region %s:", region);

			let locationMatch;
			while ((locationMatch = locationRegex.exec(locations)) !== null) {
				let location = locationMatch[1];
				debug("=> %s", location);
				foundLocations.push({
					region,
					location
				});
			}
		}
		resolve(foundLocations);
	});
}

retrievePosts().then(function(posts) {
	return Promise.all(posts.map(function(post) {
		return findLocations(post);
	})).then(function(findings) {
		let count = 0;
		for (var i = findings.length - 1; i >= 0; i--) {
			count += findings[i].length;
		}
		debug("Found %d locations in %d posts", count, findings.length);
	});
});
