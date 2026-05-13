// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistantMessage } from '../../src/components/AssistantMessage';
import type { AgentEvent, ChatMessage } from '../../src/types';

function messageWithText(text: string): ChatMessage {
  const events: AgentEvent[] = [{ kind: 'text', text }];
  return {
    id: 'assistant-1',
    role: 'assistant',
    content: '',
    events,
    startedAt: 1_000,
    endedAt: 3_000,
  };
}

describe('AssistantMessage project file links', () => {
  afterEach(() => cleanup());

  it('opens absolute .od project file URLs as workspace preview tabs', () => {
    const onOpenFile = vi.fn();
    const url =
      'http://13.209.4.19:3000/workspace/works-oss/open-design/.od/projects/project-1/pptx/source-slide-01-1.png';

    render(
      <AssistantMessage
        message={messageWithText(`Preview: ${url}`)}
        streaming={false}
        projectId="project-1"
        projectFileNames={new Set(['pptx/source-slide-01-1.png'])}
        onRequestOpenFile={onOpenFile}
        isLast
      />,
    );

    const link = screen.getByText(url).closest('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/projects/project-1/files/pptx/source-slide-01-1.png');

    fireEvent.click(link as HTMLAnchorElement);

    expect(onOpenFile).toHaveBeenCalledWith('pptx/source-slide-01-1.png');
  });
});
