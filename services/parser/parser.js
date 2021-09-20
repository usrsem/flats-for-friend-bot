const settings = require("../../config/settings.json");

const puppeteer = require('puppeteer');

const NodeCache = require("node-cache");
const cache = new NodeCache( { stdTTL: 60 * 60 * 24 } );

const { getPostsMap, getPostInfo } = require("../scraper/index");

const sendMessages = require("../tg-bot/index");

module.exports = parse


async function parse() {

    const browser = await puppeteer.launch( { slowMo: 100, headless: false } );
    await browser.createIncognitoBrowserContext();
    const logginedPage = await loginToFacebook(browser);
    await logginedPage.goto(settings.requestOptions.uri, { waitUntil: "networkidle2" });
    console.log("Group page loaded");

    while(true) {
        try {
            const map = await getPostsMap(logginedPage);
            // TODO: create promise for reloading
            logginedPage.reload( { waitUntil: "networkidle2" } );

            if (map == undefined) { return parse(); }

            console.log("Starting new iteration...");
//            map.forEach(async (link, id) => {
//                if (cache.get(id) === undefined) {
//                    getPostInfo(browser, link)
//                        .then((post) => {
//                            if (post !== undefined) {
//                                console.log(post);
//                                sendMessages(post);
//                                cache.set(id, post);
//                            }
//                        })
//                        .catch((error) => {
//                            console.error(error);
//                        })
//                }
//            });
            for ([id, link] of map) {
                if (cache.get(id) === undefined) {
                    const post = await getPostInfo(browser, link);
                    if (post != undefined) {
                        sendMessages(post);
                        cache.set(id, post);
                    }
                }
            }

            await sleep(settings.parserSpeed * 60 * 1000);
        } catch (error) {
            console.error("Error while parsing: " + error);
        }
    }
}



async function loginToFacebook(browser) {
    const page = await browser.newPage();
    console.log("Browser started");

    await page.goto(settings.facebookAuth.link, { waitUntil: "networkidle2" });
    await page.waitForSelector('#m_login_email');
    console.log("Login page loaded");

    await page.type('#m_login_email', settings.facebookAuth.username);
    console.log("Login typed");
    await page.type('#m_login_password', settings.facebookAuth.password);
    console.log("Password typed");

    await page.click('button[name=login]');
    await page.waitForNavigation();
    console.log("Login button clicked");

    return page;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
