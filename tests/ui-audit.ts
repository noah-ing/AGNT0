import { chromium } from 'playwright';

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  suggestion: string;
}

const issues: Issue[] = [];

function logIssue(issue: Issue) {
  issues.push(issue);
  console.log(`[${issue.severity.toUpperCase()}] ${issue.component}: ${issue.description}`);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function auditUI() {
  console.log('Starting AGNT0 UI Audit...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to app
    console.log('1. Loading application...');
    await page.goto('http://localhost:3333', { waitUntil: 'domcontentloaded' });
    await delay(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/01-initial-load.png', fullPage: true });
    console.log('   Screenshot: 01-initial-load.png');

    // Check if page loaded properly
    const root = await page.$('#root');
    if (!root) {
      logIssue({
        severity: 'critical',
        component: 'App',
        description: 'Root element not found - app may not be rendering',
        suggestion: 'Check React mounting and console errors'
      });
    }

    // 2. Test Layout Structure
    console.log('\n2. Testing layout structure...');

    const toolbar = await page.$('.h-14'); // Toolbar
    const sidebar = await page.$('.w-64'); // Sidebar
    const editor = await page.$('.react-flow'); // Editor

    if (!toolbar) {
      logIssue({
        severity: 'high',
        component: 'Toolbar',
        description: 'Toolbar not found in DOM',
        suggestion: 'Check Toolbar component rendering'
      });
    }

    if (!sidebar) {
      logIssue({
        severity: 'high',
        component: 'Sidebar',
        description: 'Sidebar not found in DOM',
        suggestion: 'Check Sidebar component rendering'
      });
    }

    if (!editor) {
      logIssue({
        severity: 'critical',
        component: 'Editor',
        description: 'ReactFlow editor not found in DOM',
        suggestion: 'Check ReactFlow component initialization'
      });
    }

    // 3. Test Sidebar - Node Library
    console.log('\n3. Testing sidebar node library...');

    // Check for node categories
    const categories = await page.$$('text=/Flow|AI|Tools|Sensors/');
    console.log(`   Found ${categories.length} category headers`);

    // Check for draggable nodes
    const draggableNodes = await page.$$('[draggable="true"]');
    console.log(`   Found ${draggableNodes.length} draggable nodes`);

    if (draggableNodes.length === 0) {
      logIssue({
        severity: 'high',
        component: 'Sidebar',
        description: 'No draggable nodes found in sidebar',
        suggestion: 'Check node rendering in Sidebar component'
      });
    }

    // 4. Test Search functionality
    console.log('\n4. Testing search functionality...');
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('agent');
      await delay(500);
      await page.screenshot({ path: 'tests/screenshots/02-search-test.png', fullPage: true });

      const visibleNodes = await page.$$('[draggable="true"]:visible');
      console.log(`   After search: ${visibleNodes.length} visible nodes`);

      // Clear search
      await searchInput.fill('');
      await delay(300);
    } else {
      logIssue({
        severity: 'medium',
        component: 'Sidebar',
        description: 'Search input not found',
        suggestion: 'Check search input rendering'
      });
    }

    // 5. Test Drag & Drop
    console.log('\n5. Testing drag and drop...');

    const agentNode = await page.$('text=AI Agent');
    const reactFlow = await page.$('.react-flow');

    if (agentNode && reactFlow) {
      const agentBox = await agentNode.boundingBox();
      const flowBox = await reactFlow.boundingBox();

      if (agentBox && flowBox) {
        await page.mouse.move(agentBox.x + agentBox.width / 2, agentBox.y + agentBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(flowBox.x + 400, flowBox.y + 300, { steps: 10 });
        await page.mouse.up();
        await delay(500);
        await page.screenshot({ path: 'tests/screenshots/03-after-drop.png', fullPage: true });

        // Check if node was added
        const droppedNodes = await page.$$('.react-flow__node');
        console.log(`   Nodes in editor after drop: ${droppedNodes.length}`);

        if (droppedNodes.length === 0) {
          logIssue({
            severity: 'critical',
            component: 'Editor',
            description: 'Drag and drop not working - no nodes created',
            suggestion: 'Check onDrop handler in Editor component'
          });
        }
      }
    }

    // 6. Test multiple node drops
    console.log('\n6. Adding more nodes...');

    const nodeTypes = ['Input', 'Output', 'Prompt', 'Code'];
    for (const nodeType of nodeTypes) {
      const node = await page.$(`text=${nodeType}`);
      const flow = await page.$('.react-flow');

      if (node && flow) {
        const nodeBox = await node.boundingBox();
        const flowBox = await flow.boundingBox();

        if (nodeBox && flowBox) {
          const offsetX = nodeTypes.indexOf(nodeType) * 150;
          await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(flowBox.x + 200 + offsetX, flowBox.y + 200, { steps: 5 });
          await page.mouse.up();
          await delay(300);
        }
      }
    }

    await delay(500);
    await page.screenshot({ path: 'tests/screenshots/04-multiple-nodes.png', fullPage: true });

    const allNodes = await page.$$('.react-flow__node');
    console.log(`   Total nodes in editor: ${allNodes.length}`);

    // 7. Test Node Selection
    console.log('\n7. Testing node selection...');

    if (allNodes.length > 0) {
      await allNodes[0].click();
      await delay(500);
      await page.screenshot({ path: 'tests/screenshots/05-node-selected.png', fullPage: true });

      // Check if properties panel shows
      const propertiesPanel = await page.$('text=Properties');
      if (!propertiesPanel) {
        console.log('   Properties panel might be hidden (logs panel visible)');
      }
    }

    // 8. Test Toolbar Buttons
    console.log('\n8. Testing toolbar buttons...');

    // Test zoom buttons
    const zoomIn = await page.$('[title="Zoom In"]');
    const zoomOut = await page.$('[title="Zoom Out"]');
    const fitView = await page.$('[title="Fit View"]');

    if (zoomIn) {
      await zoomIn.click();
      await delay(200);
      await zoomIn.click();
      await delay(200);
    }

    if (zoomOut) {
      await zoomOut.click();
      await delay(200);
    }

    if (fitView) {
      await fitView.click();
      await delay(300);
    }

    await page.screenshot({ path: 'tests/screenshots/06-after-zoom.png', fullPage: true });

    // 9. Test Settings Modal
    console.log('\n9. Testing settings modal...');

    const settingsBtn = await page.$('[title="Settings"]');
    if (settingsBtn) {
      await settingsBtn.click();
      await delay(500);
      await page.screenshot({ path: 'tests/screenshots/07-settings-modal.png', fullPage: true });

      // Check settings tabs
      const keysTab = await page.$('text=API Keys');
      const modelsTab = await page.$('text=Models');
      const appearanceTab = await page.$('text=Appearance');

      if (keysTab) await keysTab.click();
      await delay(200);

      if (modelsTab) await modelsTab.click();
      await delay(200);
      await page.screenshot({ path: 'tests/screenshots/08-settings-models.png', fullPage: true });

      if (appearanceTab) await appearanceTab.click();
      await delay(200);
      await page.screenshot({ path: 'tests/screenshots/09-settings-appearance.png', fullPage: true });

      // Close modal
      const closeBtn = await page.$('.fixed button:has(svg)');
      if (closeBtn) {
        await closeBtn.click();
        await delay(300);
      }
    } else {
      logIssue({
        severity: 'high',
        component: 'Toolbar',
        description: 'Settings button not found',
        suggestion: 'Check toolbar button rendering'
      });
    }

    // 10. Test Logs Panel Toggle
    console.log('\n10. Testing logs panel...');

    const logsBtn = await page.$('[title="Logs"]');
    if (logsBtn) {
      // Toggle logs off
      await logsBtn.click();
      await delay(300);
      await page.screenshot({ path: 'tests/screenshots/10-logs-off.png', fullPage: true });

      // Toggle logs on
      await logsBtn.click();
      await delay(300);
      await page.screenshot({ path: 'tests/screenshots/11-logs-on.png', fullPage: true });
    }

    // 11. Test PromptBar
    console.log('\n11. Testing prompt bar...');

    const promptBar = await page.$('textarea[placeholder*="Describe your workflow"]');
    if (promptBar) {
      await promptBar.fill('Build a simple web scraper workflow');
      await delay(500);
      await page.screenshot({ path: 'tests/screenshots/12-prompt-bar.png', fullPage: true });

      // Test example prompts
      const examplePrompt = await page.$('button:has-text("Build a web scraper")');
      if (examplePrompt) {
        await examplePrompt.click();
        await delay(300);
      }

      // Clear the prompt
      await promptBar.fill('');
    } else {
      logIssue({
        severity: 'high',
        component: 'PromptBar',
        description: 'Prompt input not found',
        suggestion: 'Check PromptBar component rendering'
      });
    }

    // 12. Test Node Connections
    console.log('\n12. Testing node connections...');

    const nodes = await page.$$('.react-flow__node');
    if (nodes.length >= 2) {
      // Try to connect two nodes
      const handles = await page.$$('.react-flow__handle');
      console.log(`   Found ${handles.length} connection handles`);

      if (handles.length >= 2) {
        const sourceHandle = await page.$('.react-flow__handle-right');
        const targetHandle = await page.$('.react-flow__handle-left');

        if (sourceHandle && targetHandle) {
          const sourceBox = await sourceHandle.boundingBox();
          const targetBox = await targetHandle.boundingBox();

          if (sourceBox && targetBox) {
            await page.mouse.move(sourceBox.x + 6, sourceBox.y + 6);
            await page.mouse.down();
            await page.mouse.move(targetBox.x + 6, targetBox.y + 6, { steps: 10 });
            await page.mouse.up();
            await delay(500);
            await page.screenshot({ path: 'tests/screenshots/13-connections.png', fullPage: true });
          }
        }
      }
    }

    // 13. Test Run Button
    console.log('\n13. Testing run button...');

    const runBtn = await page.$('button:has-text("Run")');
    if (runBtn) {
      const isDisabled = await runBtn.getAttribute('disabled');
      console.log(`   Run button disabled: ${isDisabled !== null}`);
      await page.screenshot({ path: 'tests/screenshots/14-run-button.png', fullPage: true });
    }

    // 14. Test New Workflow
    console.log('\n14. Testing new workflow button...');

    const newBtn = await page.$('[title="New"]');
    if (newBtn) {
      await newBtn.click();
      await delay(500);
      await page.screenshot({ path: 'tests/screenshots/15-new-workflow.png', fullPage: true });
    }

    // 15. Check for console errors
    console.log('\n15. Checking for JavaScript errors...');

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Refresh to catch errors
    await page.reload();
    await delay(2000);

    if (consoleErrors.length > 0) {
      logIssue({
        severity: 'high',
        component: 'Console',
        description: `Found ${consoleErrors.length} console errors`,
        suggestion: consoleErrors.slice(0, 3).join('; ')
      });
    }

    // 16. Test Category Collapse/Expand
    console.log('\n16. Testing category collapse/expand...');

    const categoryHeaders = await page.$$('button:has-text("Flow"), button:has-text("AI"), button:has-text("Tools")');
    for (const header of categoryHeaders) {
      await header.click();
      await delay(200);
    }
    await page.screenshot({ path: 'tests/screenshots/16-categories-collapsed.png', fullPage: true });

    // Expand again
    for (const header of categoryHeaders) {
      await header.click();
      await delay(200);
    }

    // 17. Visual Inspection Checks
    console.log('\n17. Checking visual elements...');

    // Check for gradient text
    const gradientText = await page.$('.gradient-text');
    if (!gradientText) {
      logIssue({
        severity: 'low',
        component: 'Styling',
        description: 'Gradient text elements not visible',
        suggestion: 'Check gradient-text CSS class'
      });
    }

    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/17-final-state.png', fullPage: true });

    // Print summary
    console.log('\n========================================');
    console.log('UI AUDIT SUMMARY');
    console.log('========================================\n');

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    console.log(`Critical Issues: ${criticalCount}`);
    console.log(`High Issues: ${highCount}`);
    console.log(`Medium Issues: ${mediumCount}`);
    console.log(`Low Issues: ${lowCount}`);
    console.log(`Total Issues: ${issues.length}\n`);

    if (issues.length > 0) {
      console.log('Issues Found:');
      console.log('--------------');
      for (const issue of issues) {
        console.log(`\n[${issue.severity.toUpperCase()}] ${issue.component}`);
        console.log(`  Problem: ${issue.description}`);
        console.log(`  Fix: ${issue.suggestion}`);
      }
    } else {
      console.log('No major issues detected!');
    }

    console.log('\nScreenshots saved to tests/screenshots/');

  } catch (error) {
    console.error('Audit failed:', error);
    await page.screenshot({ path: 'tests/screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

auditUI().catch(console.error);
