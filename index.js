const debug = require("debug")("pol-ma-blitzer");
const graph = require("fbgraph");
const express = require("express");
const app = express();
const config = require("./config.json");
let latestPost = {};

if (!config || !config.fbAccessToken) {
	console.log("Config or facebook access token missing!");
	process.exit(1);
}

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
			let today = new Date().getTime();

			for (let i = 0; i < posts.length; i++) {
				let post = posts[i];
				if (post.message.match(/#Geschwindigkeitskontrollen/i)) {
					post._ageInDays = (today - new Date(post.created_time).getTime()) / 1000 / 60 / 60 / 24;
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

function findLatestPost(posts) {
	debug("Searching for latest post about speed camera locations...");
	return Promise.all(posts.map(function(post) {
		return findLocations(post).then((locations) => {
			return { locations, post }; 
		});
	})).then(function(findings) {
		findings = findings.filter(function(finding) {
			return finding.locations.length > 0;
		})

		findings.sort(function(a, b) {
			return a.post._ageInDays - b.post._ageInDays;
		});

		const post = findings[0];
		debug("Found post from %d days ago containing %d locations", Math.floor(post.post._ageInDays), post.locations.length);
		return post;
	});
}

app.use("/", express.static('public'))
app.get("/api/latestPost", function(req, res){
	res.json(latestPost);
});

const httpServer = app.listen(config.httpPort, function() {
	console.log(`Server listening on port ${config.httpPort}...`);
});

retrievePosts().then(findLatestPost).then(function(post) {
	latestPost = post;
}).catch(function(err) {
	console.log(err);
	process.exit(1);
});
