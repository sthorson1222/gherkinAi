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
      content: 'Feature: User Login\n  Scenario: Valid Login Flow\n    Given I verify the browser is open and loaded\n    When I perform the secure login sequence with "admin@house.gov" and "securePass123"\n    Then I should be fully authenticated and on the dashboard',
      stepsCode: `import { Given, When, Then } from "@cucumber/cucumber";
import { expect, Page, Locator } from "@playwright/test";
import * as fs from 'fs';

// ============================================================
// 📁 tests/pages/LoginPage.ts
// ============================================================

export class LoginPage {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string) {
    console.log(\`🚀 Launching browser and navigating to: \${url}\`);
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    
    // CAPTURE EVIDENCE 1: Landing Page
    await this.page.screenshot({ path: '1-landing-page.png' });
    console.log("📸 Screenshot saved: 1-landing-page.png");
  }

  async validateBrowserState() {
    // VALIDATION: Check if browser is actually open on the right page
    const currentUrl = this.page.url();
    const pageTitle = await this.page.title();
    
    console.log(\`✅ Browser Validated | URL: \${currentUrl}\`);
    console.log(\`📑 Page Title: \${pageTitle}\`);

    if (currentUrl === 'about:blank') {
        throw new Error("❌ Browser failed to navigate! URL is still about:blank");
    }
  }

  async performLogin(email: string, pass: string) {
    console.log("⌨️ Filling credentials...");
    
    // Using robust Playwright locators
    const emailInput = this.page.getByPlaceholder('Email, phone, or Skype');
    await emailInput.fill(email);
    
    await this.page.getByRole('button', { name: 'Next' }).click();
    
    const passwordInput = this.page.getByPlaceholder('Password');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(pass);
    
    await this.page.getByRole('button', { name: 'Sign in' }).click();
    
    // Handle "Stay signed in?" prompt
    const staySignedIn = this.page.getByText('Stay signed in?');
    if (await staySignedIn.isVisible()) {
        await this.page.getByRole('button', { name: 'Yes' }).click();
    }
  }

  async captureEvidence() {
    // CAPTURE EVIDENCE 2: Post-Login Dashboard
    await this.page.screenshot({ path: '2-dashboard-signed-in.png' });
    console.log("📸 Screenshot saved: 2-dashboard-signed-in.png");
  }
}

// ============================================================
// 📁 tests/pages/DashboardPage.ts
// ============================================================

export class DashboardPage {
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

// ============================================================
// 📁 tests/step-definitions/loginSteps.ts
// ============================================================

Given('I verify the browser is open and loaded', async function () {
  this.loginPage = new LoginPage(this.page);
  const baseUrl = process.env.BASE_URL || 'https://lims2qa.house.gov';
  
  await this.loginPage.navigate(baseUrl);
  await this.loginPage.validateBrowserState();
});

When('I perform the secure login sequence with {string} and {string}', async function (user, pass) {
  const finalUser = process.env.TEST_USER || user;
  const finalPass = process.env.TEST_PASSWORD || pass;
  
  await this.loginPage.performLogin(finalUser, finalPass);
  await this.loginPage.captureEvidence();
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