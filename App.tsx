import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TestGenerator } from './components/TestGenerator';
import { TestRunner } from './components/TestRunner';
import { Settings } from './components/Settings';
import { AppView, GeneratedFeature, TestEnvironment } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [features, setFeatures] = useState<GeneratedFeature[]>([
    { 
      id: 'default-1', 
      title: 'User Login', 
      content: 'Feature: User Login\n  Scenario: Valid Login Flow\n    Given I navigate to the portal\n    When I perform the secure login sequence with "admin@house.gov" and "securePass123"\n    Then I should be fully authenticated and on the dashboard',
      stepsCode: `import { Given, When, Then } from "@cucumber/cucumber";
import { expect, Page, Locator } from "@playwright/test";
import * as fs from 'fs';

// --- Page Object Models ---

class LoginPage {
  private page: Page;
  
  // Selectors based on LoginManager.java
  private loginBtnSelector = "//button[@data-testid='loginBtn']";
  private emailInputSelector = "input[name='loginfmt']";
  private nextBtnSelector = "//input[@type='submit']";
  private adOptionSelector = ".largeTextNoWrap.indentNonCollapsible:has-text('Active Directory')";
  private passwordInputSelector = "#passwordInput";
  private submitBtnSelector = "#submitButton";
  private staySignedInBtnSelector = "input#idSIButton9[value='Yes']";

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string) {
    console.log(\`🌐 Navigating to \${url}\`);
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    // Let initial UI stabilize as per requirements
    await this.page.waitForTimeout(2000); 
  }

  async performLogin(email: string, pass: string) {
    // 1. Check if initial login button exists (Entry point)
    const loginBtn = this.page.locator(this.loginBtnSelector);
    if (await loginBtn.isVisible()) {
        await loginBtn.click();
    } else {
        console.log("ℹ️ Login button not visible, assuming direct form or already logged in.");
    }

    // 2. Email Entry
    const emailInput = this.page.locator(this.emailInputSelector);
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(email);
    console.log("📧 Email entered.");

    const nextBtn = this.page.locator(this.nextBtnSelector);
    await nextBtn.click();

    // 3. Handle optional 'Active Directory' selection
    const adOption = this.page.locator(this.adOptionSelector);
    try {
        // Short timeout because this step is conditional
        await adOption.waitFor({ state: 'visible', timeout: 3000 });
        await adOption.click();
        console.log("🛂 Active Directory option clicked.");
    } catch (e) {
        // It's okay if this doesn't appear, continue flow
        console.log("ℹ️ Active Directory option skipped.");
    }

    // 4. Password Entry
    const passwordInput = this.page.locator(this.passwordInputSelector);
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await passwordInput.fill(pass);
    console.log("🔑 Password entered.");

    const submitBtn = this.page.locator(this.submitBtnSelector);
    await submitBtn.click();

    // 5. 'Stay Signed In' Confirmation
    const yesBtn = this.page.locator(this.staySignedInBtnSelector);
    await expect(yesBtn).toBeVisible({ timeout: 5000 });
    await yesBtn.click();
    
    console.log("✅ Login sequence completed.");
    await this.saveSessionStorage();
  }

  async saveSessionStorage() {
    try {
        const sessionStorage = await this.page.evaluate(() => JSON.stringify(sessionStorage));
        // In a real Node environment, you would write this to a file:
        // fs.writeFileSync('sessionStorage.json', sessionStorage);
        console.log("📦 sessionStorage captured (simulated save).");
    } catch (error) {
        console.error("❌ Failed to save sessionStorage:", error);
    }
  }
}

class DashboardPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/.*dashboard|.*portal/);
    // Add assertion for a common dashboard element
    await expect(this.page.locator('body')).toBeVisible(); 
  }
}

// --- Step Definitions ---

Given('I navigate to the portal', async function () {
  this.loginPage = new LoginPage(this.page);
  // Using the base URL from the environment config
  const baseUrl = process.env.BASE_URL || 'https://lims2qa.house.gov';
  await this.loginPage.navigate(baseUrl);
});

When('I perform the secure login sequence with {string} and {string}', async function (user, pass) {
  // If defined in env vars (like secrets), prefer those
  const finalUser = process.env.TEST_USER || user;
  const finalPass = process.env.TEST_PASSWORD || pass;
  
  await this.loginPage.performLogin(finalUser, finalPass);
});

Then('I should be fully authenticated and on the dashboard', async function () {
  const dashboard = new DashboardPage(this.page);
  await dashboard.verifyLoaded();
});`,
      createdAt: new Date().toISOString()
    }
  ]);
  
  // Environment State
  const [environments, setEnvironments] = useState<TestEnvironment[]>([
    { 
      id: 'env-1', 
      name: 'Local Dev', 
      url: 'http://localhost:3000', 
      active: false,
      variables: [
        { key: 'NODE_ENV', value: 'development' },
        { key: 'DEBUG', value: 'true' }
      ]
    },
    { 
      id: 'env-2', 
      name: 'House QA Portal', 
      url: 'https://lims2qa.house.gov', 
      active: true,
      variables: [
        { key: 'TEST_USER', value: 'ehoptester1@devmail.house.gov' },
        { key: 'TEST_PASSWORD', value: 'HopTest1107' }
      ]
    },
    { 
      id: 'env-3', 
      name: 'Production', 
      url: 'https://app.example.com', 
      active: false,
      variables: [] 
    },
  ]);

  const activeEnvironment = environments.find(e => e.active);

  const handleSaveFeature = (feature: GeneratedFeature) => {
    setFeatures(prev => [feature, ...prev]);
    setCurrentView(AppView.RUNNER);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard features={features} />;
      case AppView.GENERATOR:
        return <TestGenerator onSaveFeature={handleSaveFeature} />;
      case AppView.RUNNER:
        return <TestRunner features={features} activeEnvironment={activeEnvironment} />;
      case AppView.SETTINGS:
        return (
          <Settings 
            environments={environments} 
            onUpdateEnvironments={setEnvironments} 
          />
        );
      default:
        return <Dashboard features={features} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg font-medium text-white">
            {currentView === AppView.DASHBOARD && 'System Overview'}
            {currentView === AppView.GENERATOR && 'Gherkin AI Generator'}
            {currentView === AppView.RUNNER && 'Playwright Execution'}
            {currentView === AppView.SETTINGS && 'System Settings'}
          </h2>
          <div className="ml-auto flex items-center gap-4">
             {activeEnvironment && (
               <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-xs text-slate-300">Target: {activeEnvironment.name}</span>
               </div>
             )}
             <div className="text-xs text-slate-500 font-mono">v1.2.0-beta</div>
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
               QA
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}