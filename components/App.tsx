import React, { useState, Component, ErrorInfo } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { Dashboard } from './Dashboard.tsx';
import { TestGenerator } from './TestGenerator.tsx';
import { TestRunner } from './TestRunner.tsx';
import { Settings } from './Settings.tsx';
import { AppView, GeneratedFeature, TestEnvironment, ExecutionConfig } from '../types.ts';

// Simple Error Boundary to catch render errors
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("UI Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-white bg-red-900/20 m-4 rounded-lg border border-red-500/50">
          <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
          <p className="font-mono text-sm bg-black/30 p-4 rounded">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>({
    mode: 'simulated',
    executionMethod: 'host',
    backendUrl: 'http://localhost:3001',
    containerName: 'playwright-runner'
  });

  const [features, setFeatures] = useState<GeneratedFeature[]>([
    { 
      id: 'default-1', 
      title: 'User Login', 
      content: 'Feature: User Login\n  Scenario: Valid Login Flow\n    Given I navigate to the portal\n    When I perform the secure login sequence with "admin@house.gov" and "securePass123"\n    Then I should be fully authenticated and on the dashboard',
      stepsCode: `import { Given, When, Then } from "@cucumber/cucumber";
import { expect, Page, Locator } from "@playwright/test";

// --- Page Object Models ---

class LoginPage {
  private page: Page;
  private loginBtnSelector = "//button[@data-testid='loginBtn']";
  private emailInputSelector = "input[name='loginfmt']";

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string) {
    console.log(\`🌐 Navigating to \${url}\`);
    await this.page.goto(url);
  }

  async performLogin(email: string, pass: string) {
    const loginBtn = this.page.locator(this.loginBtnSelector);
    if (await loginBtn.isVisible()) {
        await loginBtn.click();
    }
    const emailInput = this.page.locator(this.emailInputSelector);
    await emailInput.fill(email);
    console.log("📧 Email entered.");
  }
}

Given('I navigate to the portal', async function () {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate('https://lims2qa.house.gov');
});

When('I perform the secure login sequence with {string} and {string}', async function (user, pass) {
  await this.loginPage.performLogin(user, pass);
});

Then('I should be fully authenticated and on the dashboard', async function () {
  // Assertion logic
});`,
      createdAt: new Date().toISOString()
    }
  ]);
  
  const [environments, setEnvironments] = useState<TestEnvironment[]>([
    { 
      id: 'env-1', 
      name: 'Local Dev', 
      url: 'http://localhost:3000', 
      active: false,
      variables: []
    },
    { 
      id: 'env-2', 
      name: 'House QA Portal', 
      url: 'https://lims2qa.house.gov', 
      active: true,
      variables: []
    }
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
        return (
          <TestRunner 
            features={features} 
            activeEnvironment={activeEnvironment} 
            executionConfig={executionConfig}
            onUpdateExecutionConfig={setExecutionConfig}
          />
        );
      case AppView.SETTINGS:
        return (
          <Settings 
            environments={environments} 
            onUpdateEnvironments={setEnvironments} 
            executionConfig={executionConfig}
            onUpdateExecutionConfig={setExecutionConfig}
          />
        );
      default:
        return <Dashboard features={features} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        backendUrl={executionConfig.backendUrl}
      />
      
      <main className="flex-1 flex flex-col h-full min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg font-medium text-white">
            {currentView === AppView.DASHBOARD && 'System Overview'}
            {currentView === AppView.GENERATOR && 'Gherkin AI Generator'}
            {currentView === AppView.RUNNER && 'Playwright Execution'}
            {currentView === AppView.SETTINGS && 'System Settings'}
          </h2>
          <div className="ml-auto flex items-center gap-4">
             {executionConfig.mode === 'real' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-red-400 font-semibold">
                      LIVE: {executionConfig.executionMethod === 'docker' ? 'CONTAINER' : 'HOST'}
                    </span>
                </div>
             )}
             <div className="text-xs text-slate-500 font-mono">v1.3.0</div>
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
               QA
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}