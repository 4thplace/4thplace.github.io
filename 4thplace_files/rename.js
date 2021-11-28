var fs = require('fs')
var path = require('path')
const files = fs.readdirSync('.')
for( const file of files) {
	if(path.extname(file) == '.다운로드') {
		fs.renameSync(file, path.parse(file).name);
	}
}

