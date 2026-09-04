import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { chromium, devices } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const defaults = {
  route: '/about',
  name: 'capture',
  selector: '',
  outDir: 'src/assets/captures',
  desktopWidth: 1440,
  desktopHeight: 1100,
  mobileDevice: 'iPhone 15 Pro',
  format: 'png',
  fullPage: false,
  waitMs: 1200,
  skipDesktop: false,
  skipMobile: false,
};

function parseArgs(argv) {
  const options = { ...defaults };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    if (arg === '--full-page') {
      options.fullPage = true;
      continue;
    }

    if (arg === '--skip-desktop') {
      options.skipDesktop = true;
      continue;
    }

    if (arg === '--skip-mobile') {
      options.skipMobile = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }

    switch (arg) {
      case '--url':
        options.url = nextValue;
        break;
      case '--desktop-url':
        options.desktopUrl = nextValue;
        break;
      case '--mobile-url':
        options.mobileUrl = nextValue;
        break;
      case '--route':
        options.route = nextValue;
        break;
      case '--desktop-route':
        options.desktopRoute = nextValue;
        break;
      case '--mobile-route':
        options.mobileRoute = nextValue;
        break;
      case '--name':
        options.name = nextValue;
        break;
      case '--selector':
        options.selector = nextValue;
        break;
      case '--desktop-selector':
        options.desktopSelector = nextValue;
        break;
      case '--mobile-selector':
        options.mobileSelector = nextValue;
        break;
      case '--out-dir':
        options.outDir = nextValue;
        break;
      case '--desktop-out':
        options.desktopOut = nextValue;
        break;
      case '--mobile-out':
        options.mobileOut = nextValue;
        break;
      case '--desktop-width':
        options.desktopWidth = Number(nextValue);
        break;
      case '--desktop-height':
        options.desktopHeight = Number(nextValue);
        break;
      case '--mobile-device':
        options.mobileDevice = nextValue;
        break;
      case '--mobile-width':
        options.mobileWidth = Number(nextValue);
        break;
      case '--mobile-height':
        options.mobileHeight = Number(nextValue);
        break;
      case '--format':
        options.format = nextValue;
        break;
      case '--wait-ms':
        options.waitMs = Number(nextValue);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }

    index += 1;
  }

  if (!['png', 'jpeg'].includes(options.format)) {
    throw new Error(`Unsupported format "${options.format}". Use png or jpeg.`);
  }

  if (options.skipDesktop && options.skipMobile) {
    throw new Error('You cannot skip both desktop and mobile captures.');
  }

  if (!Number.isFinite(options.desktopWidth) || !Number.isFinite(options.desktopHeight)) {
    throw new Error('Desktop dimensions must be valid numbers.');
  }

  if ((options.mobileWidth !== undefined && !Number.isFinite(options.mobileWidth)) || (options.mobileHeight !== undefined && !Number.isFinite(options.mobileHeight))) {
    throw new Error('Mobile dimensions must be valid numbers.');
  }

  if ((options.mobileWidth !== undefined) !== (options.mobileHeight !== undefined)) {
    throw new Error('Set both mobile-width and mobile-height together.');
  }

  if (!Number.isFinite(options.waitMs)) {
    throw new Error('wait-ms must be a valid number.');
  }

  return options;
}

async function wait(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to determine an open port.')));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });

    server.once('error', reject);
  });
}

async function startViteServer() {
  const port = await findOpenPort();
  const baseUrl = `http://127.0.0.1:${port}`;

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
      {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let resolved = false;

    const handleOutput = (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);

      if (!resolved && text.includes(`${baseUrl}/`)) {
        resolved = true;
        resolve({
          child,
          baseUrl,
        });
      }
    };

    child.stdout.on('data', handleOutput);
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk.toString());
    });

    child.once('error', (error) => {
      if (!resolved) {
        reject(error);
      }
    });

    child.once('exit', (code) => {
      if (!resolved) {
        reject(new Error(`Vite dev server exited early with code ${code ?? 'unknown'}.`));
      }
    });
  });
}

function toAbsolutePath(filePath) {
  if (!filePath) {
    return filePath;
  }

  return path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
}

async function ensureDirectoryFor(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function capturePage(page, options, outputPath) {
  if (options.selector) {
    const target = page.locator(options.selector).first();
    await target.waitFor({ state: 'visible' });
    await target.screenshot({ path: outputPath, type: options.format });
    return;
  }

  await page.screenshot({
    path: outputPath,
    type: options.format,
    fullPage: options.fullPage,
  });
}

function buildTargetUrl({ baseUrl, url, route }) {
  if (url) {
    return url;
  }

  return `${baseUrl}${route}`;
}

function buildOutputPaths(options) {
  const outDir = toAbsolutePath(options.outDir);

  return {
    desktop: options.desktopOut
      ? toAbsolutePath(options.desktopOut)
      : path.join(outDir, `${options.name}-desktop.${options.format}`),
    mobile: options.mobileOut
      ? toAbsolutePath(options.mobileOut)
      : path.join(outDir, `${options.name}-mobile.${options.format}`),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outputs = buildOutputPaths(options);
  let server;
  let browser;

  if (!options.skipDesktop) {
    await ensureDirectoryFor(outputs.desktop);
  }

  if (!options.skipMobile) {
    await ensureDirectoryFor(outputs.mobile);
  }

  try {
    server = options.url ? null : await startViteServer();
    const baseUrl = server?.baseUrl ?? '';
    browser = await chromium.launch();

    if (!options.skipDesktop) {
      const desktopContext = await browser.newContext({
        viewport: {
          width: options.desktopWidth,
          height: options.desktopHeight,
        },
        deviceScaleFactor: 2,
      });
      const desktopPage = await desktopContext.newPage();
      const desktopTargetUrl = buildTargetUrl({
        baseUrl,
        url: options.desktopUrl ?? options.url,
        route: options.desktopRoute ?? options.route,
      });

      await desktopPage.goto(desktopTargetUrl, { waitUntil: 'networkidle' });
      await wait(options.waitMs);
      await capturePage(
        desktopPage,
        {
          ...options,
          selector: options.desktopSelector ?? options.selector,
        },
        outputs.desktop,
      );
      await desktopContext.close();
    }

    if (!options.skipMobile) {
      const mobilePreset = devices[options.mobileDevice];
      if (!mobilePreset) {
        throw new Error(`Unknown Playwright device: ${options.mobileDevice}`);
      }

      const mobileContext = await browser.newContext({
        ...mobilePreset,
        ...(options.mobileWidth ? {
          viewport: {
            width: options.mobileWidth,
            height: options.mobileHeight,
          },
        } : {}),
      });
      const mobilePage = await mobileContext.newPage();
      const mobileTargetUrl = buildTargetUrl({
        baseUrl,
        url: options.mobileUrl ?? options.url,
        route: options.mobileRoute ?? options.route,
      });

      await mobilePage.goto(mobileTargetUrl, { waitUntil: 'networkidle' });
      await wait(options.waitMs);
      await capturePage(
        mobilePage,
        {
          ...options,
          selector: options.mobileSelector ?? options.selector,
        },
        outputs.mobile,
      );
      await mobileContext.close();
    }
  } finally {
    if (browser) {
      await browser.close();
    }

    if (server?.child && !server.child.killed) {
      server.child.kill('SIGTERM');
    }
  }

  if (!options.skipDesktop) {
    console.log(`Saved desktop screenshot to ${path.relative(repoRoot, outputs.desktop)}`);
  }

  if (!options.skipMobile) {
    console.log(`Saved mobile screenshot to ${path.relative(repoRoot, outputs.mobile)}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
