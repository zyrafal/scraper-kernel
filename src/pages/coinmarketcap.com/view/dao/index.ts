import puppeteer, { ElementHandle } from "puppeteer";
import PageProps from "../../../../@types/page-props";
import ScrapedProject from "../../../../@types/scraped-project";
import { extractURLs, getMarketCap, getProperty, scrollToBottom } from "../../../../common";

export default async (browser: puppeteer.Browser) => {
  const activeTarget = browser.targets()[browser.targets().length - 1];
  const page = await activeTarget.page();
  if (!page) {
    throw new Error("No page found");
  }
  await page.bringToFront();
  await scrollToBottom(page);

  const urls = await getCmcPageURLs(page);
  const tokens = [] as ScrapedProject[];

  for (const url of urls) {
    try {
      await scrapeProject(browser, url, tokens);
    } catch (e) {
      console.error(e);
      console.warn(`Caught error scraping "${url}"`);
    }
  }
  return tokens;
};

async function scrapeProject(browser: puppeteer.Browser, url: string, tokens: ScrapedProject[]) {
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  const propsHandler = (await page.$(`script#__NEXT_DATA__[type="application/json"]`)) as ElementHandle<Element>;
  const propsRawString = await getProperty(propsHandler, "textContent");
  const { props } = JSON.parse(propsRawString) as PageProps;
  const token = props.initialProps.pageProps.info;
  delete token.platforms;
  delete token.relatedCoins;
  delete token.relatedExchanges;
  delete token.wallets;
  delete token.holders;
  tokens.push(token); //  as ScrapedProject
  console.log(`got ${token.name}`);
}

async function getCmcPageURLs(page: puppeteer.Page) {
  const currencies = await page.$$(`td:nth-child(3) a[href^="/currencies/"]`);
  if (!currencies) {
    throw new Error(`No currencies found`);
  } else {
    const urls = await extractURLs(currencies);
    return urls;
  }
}

async function getMarketCaps(page: puppeteer.Page) {
  const marketCaps = await page.$$(`td:nth-child(7) span:last-child`);
  if (!marketCaps) {
    throw new Error(`No market caps found`);
  } else {
    const mcaps = await getMarketCap(marketCaps);
    return mcaps;
  }
}
