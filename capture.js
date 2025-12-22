
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/309af935-2eb6-45d9-a382-8cf43c1053c3';
const BASE_URL = 'http://localhost:5173';
const VIEWPORT = { width: 1280, height: 720 };

console.log('Starting capture script...');
(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        console.log('Browser launched.');
        const page = await browser.newPage();
        await page.setViewport(VIEWPORT);

        // 1. Dashboard (Requires Login)
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        console.log('Page loaded. Checking for login form...');

        // Login
        try {
            await page.waitForSelector('#email-address', { timeout: 5000 });
            console.log('Login form found. Typing credentials...');
            await page.type('#email-address', 'talinecarvalho19@gmail.com');
            await page.type('#password', 'oimanolo');
            await page.click('button[type="submit"]');
            console.log('Submitted login. Waiting for dashboard...');

            await page.waitForSelector('h1', { timeout: 15000, visible: true });
            console.log('Dashboard loaded.');
        } catch (e) {
            console.log('Maybe already logged in or error finding login:', e.message);
        }

        await new Promise(r => setTimeout(r, 4000)); // Wait for charts
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'dashboard_print.png') });
        console.log('Saved dashboard_print.png');

        // 2. Demands
        console.log('Navigating to Demandas...');
        // XPath to find sidebar item by text. Assuming it is a span or div
        const demandsLinks = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('nav div, nav a'));
            const found = elements.find(el => el.textContent.includes('Demandas'));
            if (found) {
                found.click();
                return true;
            }
            return false;
        });

        if (demandsLinks) {
            console.log('Clicked Demandas.');
            await new Promise(r => setTimeout(r, 3000)); // Wait for load
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'demandas_print.png') });
            console.log('Saved demandas_print.png');
        } else {
            console.log('Could not find Demandas link in sidebar.');
        }

        // 3. Suppliers
        console.log('Navigating to Fornecedores...');
        const suppliersLinks = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('nav div, nav a'));
            const found = elements.find(el => el.textContent.includes('Fornecedores'));
            if (found) {
                found.click();
                return true;
            }
            return false;
        });

        if (suppliersLinks) {
            console.log('Clicked Fornecedores.');
            await new Promise(r => setTimeout(r, 3000));
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'fornecedores_print.png') });
            console.log('Saved fornecedores_print.png');
        }

        // 4. Transparency (Public)
        console.log('Navigating to Transparency...');
        await page.goto(`${BASE_URL}/transparencia`, { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'transparencia_print.png') });
        console.log('Saved transparencia_print.png');

        await browser.close();
    } catch (error) {
        console.error('Error in capture script:', error);
        process.exit(1);
    }
})();
