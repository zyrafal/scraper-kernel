import dotenv from "dotenv";
import { EventEmitter } from "events";
import { Browser } from "puppeteer";
import "source-map-support/register";
import { eventHandlers } from "./boot/event-handlers";
import newTabToURL from "./boot/new-tab-to-url";
dotenv.config();

export const events = new EventEmitter();

export default function scrape(browser: Browser, url: string): Promise<string> {
  return new Promise((resolve) => {
    events.on("scrapecomplete", eventHandlers.scrapeComplete(resolve));
    // events.on("logicfailed", eventHandlers.logicFailed(browser));
    newTabToURL(browser, url); // Open new tab and load page
  });
}
