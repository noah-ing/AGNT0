import type { ToolDefinition, ExecutionContext } from '../../runtime/types';
import puppeteer, { Browser, Page } from 'puppeteer';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export const BrowserTool: ToolDefinition = {
  id: 'browser',
  name: 'Browser',
  description: 'Automate browser interactions - navigate, click, type, screenshot, extract content',
  category: 'Web',
  icon: 'Globe',
  schema: {
    input: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['navigate', 'click', 'type', 'screenshot', 'content', 'evaluate', 'waitFor'],
          description: 'Browser action to perform',
        },
        url: { type: 'string', description: 'URL to navigate to' },
        selector: { type: 'string', description: 'CSS selector for element' },
        text: { type: 'string', description: 'Text to type' },
        script: { type: 'string', description: 'JavaScript to evaluate' },
        timeout: { type: 'number', description: 'Timeout in milliseconds', default: 30000 },
      },
      required: ['action'],
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        result: { type: 'any' },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const { action, url, selector, text, script, timeout = 30000 } = input as {
      action: string;
      url?: string;
      selector?: string;
      text?: string;
      script?: string;
      timeout?: number;
    };

    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      page.setDefaultTimeout(timeout);

      let result: unknown;

      switch (action) {
        case 'navigate':
          if (!url) throw new Error('URL required for navigate action');
          await page.goto(url, { waitUntil: 'networkidle2' });
          result = { url: page.url(), title: await page.title() };
          break;

        case 'click':
          if (!selector) throw new Error('Selector required for click action');
          if (url) await page.goto(url, { waitUntil: 'networkidle2' });
          await page.click(selector);
          result = { clicked: selector };
          break;

        case 'type':
          if (!selector || !text) throw new Error('Selector and text required for type action');
          if (url) await page.goto(url, { waitUntil: 'networkidle2' });
          await page.type(selector, text);
          result = { typed: text, into: selector };
          break;

        case 'screenshot':
          if (url) await page.goto(url, { waitUntil: 'networkidle2' });
          const screenshot = await page.screenshot({ encoding: 'base64' });
          result = { screenshot: `data:image/png;base64,${screenshot}` };
          break;

        case 'content':
          if (url) await page.goto(url, { waitUntil: 'networkidle2' });
          if (selector) {
            const element = await page.$(selector);
            result = element ? await element.evaluate((el) => el.textContent) : null;
          } else {
            result = await page.content();
          }
          break;

        case 'evaluate':
          if (!script) throw new Error('Script required for evaluate action');
          if (url) await page.goto(url, { waitUntil: 'networkidle2' });
          result = await page.evaluate(script);
          break;

        case 'waitFor':
          if (!selector) throw new Error('Selector required for waitFor action');
          if (url) await page.goto(url, { waitUntil: 'networkidle2' });
          await page.waitForSelector(selector, { timeout });
          result = { found: selector };
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      await page.close();
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
