import type { ToolDefinition, ExecutionContext } from '../../runtime/types';
import * as cheerio from 'cheerio';

export const ScraperTool: ToolDefinition = {
  id: 'scraper',
  name: 'Web Scraper',
  description: 'Extract structured data from web pages using CSS selectors',
  category: 'Web',
  icon: 'FileSearch',
  schema: {
    input: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
        html: { type: 'string', description: 'HTML content to parse (alternative to URL)' },
        selectors: {
          type: 'object',
          description: 'Map of field names to CSS selectors',
          additionalProperties: {
            type: 'object',
            properties: {
              selector: { type: 'string' },
              attribute: { type: 'string', description: 'Attribute to extract (default: text)' },
              multiple: { type: 'boolean', description: 'Extract all matching elements' },
            },
          },
        },
        extractLinks: { type: 'boolean', description: 'Extract all links from page' },
        extractImages: { type: 'boolean', description: 'Extract all images from page' },
        extractText: { type: 'boolean', description: 'Extract full text content' },
      },
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        links: { type: 'array', items: { type: 'string' } },
        images: { type: 'array', items: { type: 'string' } },
        text: { type: 'string' },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const {
      url,
      html,
      selectors = {},
      extractLinks = false,
      extractImages = false,
      extractText = false,
    } = input as {
      url?: string;
      html?: string;
      selectors?: Record<string, { selector: string; attribute?: string; multiple?: boolean }>;
      extractLinks?: boolean;
      extractImages?: boolean;
      extractText?: boolean;
    };

    try {
      let content: string;

      if (html) {
        content = html;
      } else if (url) {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AGNT0/1.0)',
          },
        });
        content = await response.text();
      } else {
        throw new Error('Either url or html must be provided');
      }

      const $ = cheerio.load(content);
      const result: Record<string, unknown> = {};

      // Extract data using selectors
      for (const [fieldName, config] of Object.entries(selectors)) {
        const { selector, attribute = 'text', multiple = false } = config;

        if (multiple) {
          const values: string[] = [];
          $(selector).each((_, el) => {
            const value = attribute === 'text'
              ? $(el).text().trim()
              : $(el).attr(attribute) || '';
            if (value) values.push(value);
          });
          result[fieldName] = values;
        } else {
          const el = $(selector).first();
          result[fieldName] = attribute === 'text'
            ? el.text().trim()
            : el.attr(attribute) || '';
        }
      }

      // Extract links
      let links: string[] | undefined;
      if (extractLinks) {
        links = [];
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            // Resolve relative URLs if we have a base URL
            if (url && !href.startsWith('http')) {
              try {
                const resolved = new URL(href, url).href;
                links!.push(resolved);
              } catch {
                links!.push(href);
              }
            } else {
              links!.push(href);
            }
          }
        });
        links = [...new Set(links)]; // Deduplicate
      }

      // Extract images
      let images: string[] | undefined;
      if (extractImages) {
        images = [];
        $('img[src]').each((_, el) => {
          const src = $(el).attr('src');
          if (src) {
            if (url && !src.startsWith('http') && !src.startsWith('data:')) {
              try {
                const resolved = new URL(src, url).href;
                images!.push(resolved);
              } catch {
                images!.push(src);
              }
            } else {
              images!.push(src);
            }
          }
        });
        images = [...new Set(images)];
      }

      // Extract full text
      let text: string | undefined;
      if (extractText) {
        // Remove script and style elements
        $('script, style, noscript').remove();
        text = $('body').text().replace(/\s+/g, ' ').trim();
      }

      return {
        success: true,
        data: result,
        ...(links && { links }),
        ...(images && { images }),
        ...(text && { text }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
