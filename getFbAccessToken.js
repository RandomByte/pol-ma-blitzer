const https = require("https");
const parseArgs = require("minimist");

const argv = parseArgs(process.argv.slice(2), {
  string: ["appId", "appSecret"]
});

if (!argv.appId || !argv.appSecret) {
  console.log("appId and/or appSecret parameters missing");
  process.exit(1);
}

https.get(`https://graph.facebook.com/oauth/access_token?client_id=${argv.appId}&client_secret=${argv.appSecret}&grant_type=client_credentials`,
    function(res) {
        const { statusCode } = res;

        if (statusCode !== 200) {
            console.error("Request Failed.\n" + `Status Code: ${statusCode}`);
            // consume response data to free up memory
            res.resume();
            return;
        }

        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => { rawData += chunk; });
        res.on("end", () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log(parsedData);
        } catch (e) {
            console.error(e.message);
        }
        });
    }).on("error", (e) => {
        console.error(`Got error: ${e.message}`);
    });