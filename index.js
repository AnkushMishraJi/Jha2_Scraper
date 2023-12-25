import { launch } from 'puppeteer';
import { loginDetails, XPaths } from './const.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { pageUrl, loginEmail, loginPassword } = loginDetails;
const { downloadCSVDropdown, mustFix, fixArray, downloadItems } = XPaths;

// driver function for setting up browser and executing all steps.
const startBrowser = async () => {
    // launch a browser with given configurations
    const browser = await launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.goto(pageUrl);
    await readAnswers(page);
    // await login(page);
    // await downloadCSV(page);
    // await requestReview(page);
    // browser.close();
}

// function to read answers from quora
const readAnswers = async (page) => {
    const elHandleArray = await page.$$('.puppeteer_test_answer_content');
    for (const element of elHandleArray) {
        const value = await element.evaluate(el => el.textContent); // grab the textContent from the element, by evaluating this function in the browser context
        console.log('Answer - ',value);
    }
}

// login to admanager with given credentials
const login = async (page) => {
    //to make sure that page is loaded and there is no process going on before accessing dom elements
    const navigationPromise = page.waitForNavigation({ waitUntil: ["domcontentloaded", "networkidle0"] });
    await page.type("#identifierId", loginEmail);
    await page.click("#identifierNext");
    await navigationPromise;
    await page
        .waitForSelector('#password', { visible: true })
        .then(async () => await page.screenshot({ path: './screenshots/password.png' }));
    await page.type("#password", loginPassword);
    await navigationPromise;
    await page
        .waitForSelector('#passwordNext', { visible: true })
        .then(async () => await page.screenshot({ path: './screenshots/passwordNexrtBtn.png' }));
    await page.click("#passwordNext");
}

// download policy violation csv from GAM
const downloadCSV = async (page) => {
    //to make sure that page is loaded and there is no process going on before accessing dom elements
    const navigationPromise = page.waitForNavigation({ waitUntil: ["domcontentloaded", "networkidle0"] });
    await navigationPromise;
    await page
        .waitForXPath(downloadCSVDropdown, { visible: true })
        .then(async () => await page.screenshot({ path: './screenshots/dropdown.png' }));
    const downloadCSVElement = await page.$x(downloadCSVDropdown);
    await downloadCSVElement[0].click();
    await navigationPromise;
    await page
        .waitForXPath(downloadItems, { visible: true })
        .then(async () => await page.screenshot({ path: './screenshots/dropdownDown.png' }));
    const downloadAllItems = await page.$x(downloadItems);
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(__dirname, './Downloads'),
    });
    await downloadAllItems[0].click();
    await page.screenshot({ path: './screenshots/downloadingCSV.png' })
    await navigationPromise;
}

// check apps with PV - must fix
const requestReview = async (page) => {
    //to make sure that page is loaded and there is no process going on before accessing dom elements
    const navigationPromise = page.waitForNavigation({ waitUntil: ["domcontentloaded", "networkidle0"] });
    await navigationPromise;
    await page
        .waitForXPath(mustFix, { visible: true })
        .then(async () => await page.screenshot({ path: './screenshots/MustFixVisible.png' }));
    const mustFixButton = await page.$x(mustFix)
    console.log(mustFixButton);
    await mustFixButton[0].click();
    await navigationPromise;
    await page
        .waitForXPath(fixArray, { visible: true })
        .then(async () => await page.screenshot({ path: './screenshots/MustFixClicked.png' }));
    const mustFixActionElementArray = await page.$x(fixArray);
    console.log('mustfixArray', mustFixActionElementArray);
    mustFixActionElementArray.forEach((element) => {
        console.log('element', element);
    })
}

startBrowser();