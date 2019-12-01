let express = require('express');
let axios = require('axios');
let cheerio = require('cheerio');
let app = express();

app.use(express.json())
app.options('/scrape', function(req, res) {
    res.type('text/plain')
    .set('Access-Control-Allow-Origin', '*')
    .set('Access-Control-Allow-Methods', 'POST')
    .set('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token')
});

app.post('/scrape', async function (req, res) {

    const body = req.body;
    if (!(body.urls && body.urls.length)) {
        res.status(400).send('Bad request');
        return;
    }

    const urls = req.body.urls;
    let allMetas = {};


    for (let url of urls) {
        let metasForUrl = {};
        try {
            const response = await axios.get(url);
            const data = response.data;
            const metas = getOgMeta(data);
            metasForUrl[url] = metas;

        } catch (error) {
            console.log(error)
            res.status(500).send('Oops something went wrong')
        }

        allMetas = { ...allMetas, ...metasForUrl };
    }

    res.type('application/json')
        .status('200')
        .set('Access-Control-Allow-Origin', '*')
        .set('Access-Control-Allow-Methods', 'POST')
        .set('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token')
        .send(JSON.stringify({ foundMetas: allMetas }))
})

function getOgMeta(html) {
    const $ = cheerio.load(html);
    const head = $('html head');
    const ogMeta = head.children('meta[property^="og:"]');

    let foundMetas = [];
    let name, property, content;

    ogMeta.each(function () {
        name = $(this).attr('name');
        name = name ? name : '';
        property = $(this).attr('property');
        content = $(this).attr('content');

        foundMetas.push({ name, property, content });
    })

    return foundMetas
}

app.listen('8081')
console.log('Server started!')
exports = module.exports = app;