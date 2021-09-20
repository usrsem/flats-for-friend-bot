// const request = require('request-promise');
const puppeteer = require('puppeteer');

const settings = require('../../config/settings.json');

const jsdom = require('jsdom');

const { JSDOM } = jsdom;

const postLinkRegex = /https:\/\/m.facebook.com\/groups\/flats4friends\/permalink\/\d{15,}/;

const fs = require("fs");

module.exports = {
    getPostsMap,
    getPostInfo
};
async function getPostsMap(page) {
    const resultMap = new Map();

    const postsLinks = await page.evaluate(() => {
        return Array.from(
            document
            .querySelector("#m_group_stories_container")
            .querySelectorAll("a")
        ).map(a => { return a.href });
    });

    postsLinks
        .filter((link) => postLinkRegex.test(link))
        .forEach((confirmedLink) => {
            const shortLink = confirmedLink.match(/https.*\//)[0];
            const postId = shortLink.match(/\d{15,}/)[0];
            resultMap.set(postId, shortLink);
        });

    console.log(`Loaded ${resultMap.size} posts`);

    return resultMap;
}

async function getPostInfo(browser, link) {
    const page = await browser.newPage();
    await page.goto(link, { waitUntil: "networkidle2" });
    const post = await page.evaluate((link) => {
        const timeAndText = document
            .querySelector("#m_story_permalink_view")
            .textContent.match(/(?:friends)(?<time>[^\/].*?)\s·\sДополнительные настройки(?<text>.*?)(?:Нравится|\+\d*\sНравится)/);
            //.textContent.match(/\\n(?<time>.*?)\\n.*\\n(?<text>.*)/);
        if (timeAndText !== null) {
            return {
                postText: timeAndText.groups.text,
                postTime: timeAndText.groups.time,
                postLink: link
            }
        }
        }, link)
    page.close();
    return post;
}

async function convertHtmlToPostDto(body, link) {
    const postDto = {
        postText: "",
        postTime: "",
        postLink: link
    }

    const dom = new JSDOM(body); 

    const post = dom.window.document.querySelector("#m_story_permalink_view");

    const timeAndText = post.querySelector("div:first-child").textContent.match(/(?:friends)(?<time>[^\/].*?)\s·\s(?<text>.*?)Нравится/);

    console.log(timeAndText);

    postDto.postTime = timeAndText.groups.time;
    postDto.postText = timeAndText.groups.text;


    return postDto;
}
