// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectLocationsSection } from '../../src/components/ProjectLocationsSection';
import {
  fetchProjectLocations,
  openProjectLocationFolderDialog,
  scanProjectLocations,
  updateProjectLocations,
} from '../../src/state/project-locations';
import type { AppConfig } from '../../src/types';

vi.mock('../../src/state/project-locations', () => ({
  fetchProjectLocations: vi.fn(),
  openProjectLocationFolderDialog: vi.fn(),
  scanProjectLocations: vi.fn(),
  updateProjectLocations: vi.fn(),
}));

const mockedFetchProjectLocations = vi.mocked(fetchProjectLocations);
const mockedOpenProjectLocationFolderDialog = vi.mocked(openProjectLocationFolderDialog);
const mockedScanProjectLocations = vi.mocked(scanProjectLocations);
const mockedUpdateProjectLocations = vi.mocked(updateProjectLocations);

const baseConfig: AppConfig = {
  mode: 'daemon',
  apiKey: '',
  apiProtocol: 'anthropic',
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-sonnet-4-5',
  apiProviderBaseUrl: 'https://api.anthropic.com',
  agentId: null,
  skillId: null,
  designSystemId: null,
  projectLocations: [],
  defaultProjectLocationId: 'default',
};

describe('ProjectLocationsSection', () => {
  beforeEach(() => {
    mockedFetchProjectLocations.mockResolvedValue([
      {
        id: 'default',
        name: 'Open Design projects',
        path: '/runtime/projects',
        builtIn: true,
      },
    ]);
    mockedUpdateProjectLocations.mockResolvedValue([
      {
        id: 'default',
        name: 'Open Design projects',
        path: '/runtime/projects',
        builtIn: true,
      },
      {
        id: 'server-work',
        name: 'Server work',
        path: '/srv/open-design/work',
      },
    ]);
    mockedScanProjectLocations.mockResolvedValue({
      scanned: 0,
      imported: [],
      existing: [],
      skipped: [],
    });
    mockedOpenProjectLocationFolderDialog.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('adds a server project location from a typed path without opening the native picker', async () => {
    const setCfg = vi.fn();

    render(
      <ProjectLocationsSection
        cfg={baseConfig}
        setCfg={setCfg}
        onProjectsRefresh={vi.fn()}
      />,
    );

    fireEvent.change(await screen.findByLabelText('Project path'), {
      target: { value: '/srv/open-design/work' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add folder…' }));

    await waitFor(() => {
      expect(mockedUpdateProjectLocations).toHaveBeenCalledWith([
        { path: '/srv/open-design/work' },
      ]);
    });
    expect(mockedOpenProjectLocationFolderDialog).not.toHaveBeenCalled();
  });
});
