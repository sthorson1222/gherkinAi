
export interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'restarting';
  uptime: string;
  cpu: number;
  memory: number;
}

export interface TestRun {
  id: string;
  feature: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration: string;
  timestamp: string;
}

export interface GeneratedFeature {
  id: string;
  title: string;
  content: string;
  stepsCode?: string;
  createdAt: string;
}

export interface EnvVariable {
  key: string;
  value: string;
}

export interface TestEnvironment {
  id: string;
  name: string;
  url: string;
  active: boolean;
  variables: EnvVariable[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  GENERATOR = 'GENERATOR',
  RUNNER = 'RUNNER',
  SETTINGS = 'SETTINGS',
}