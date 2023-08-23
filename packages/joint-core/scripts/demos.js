const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const exclude = ['node_modules', '.gitignore'];
const readDirAsync = promisify(fs.readdir);

async function readFolder(location) {

    return readDirAsync(location).then(async function(items) {
        let res = [];
        for (const item of items) {
            const file = path.parse(item);
            if (!file.ext && !exclude.includes(item)) {

                let items1 = await readFolder(path.join(location, item));
                res = res.concat(items1)
            }

            if (file.ext === '.html') {

                res.push(path.join(location, item))
            }
        }
        return res
    });
}

const generateDemoLinks = async function() {

    const htmlFiles = await readFolder('../demo');
    const urls = htmlFiles.map(item => {
        return path.resolve(item).replace(/\\/g, '/');
    });
    const links = urls.map(item => {
        return `<a href="${item}">${item}</a><br/>`;
    });
    console.log(links.join('\n'));
};

generateDemoLinks();
