var fs = require("fs");
var localCA_path = '/Users/allen/.localhost-ssl'
module.exports = {
	cert: fs.readFileSync(localCA_path + "/localhost.pem"),
	key: fs.readFileSync(localCA_path+ "/localhost-key.pem"),
	passphrase: "12345"
};
