const path = require('path');
const glob = require("glob")

const entry = glob
.sync("src/*.js", { ignore: "src/_*.js" })
.reduce((prev, curr) => {
    const name = path.basename(curr, ".js");
    prev[name] = "./" + curr;
    return prev;
}, {})

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public/scripts'),
        clean: true,
    },
};