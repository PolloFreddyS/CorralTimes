import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvidenceViewer, QuoteCard, StoryCard } from '@/components/editorial';
import type { EditorialStory, SubmissionSummary } from '@shared/domain/models';

const PAYLOAD = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>';

describe('renderizado seguro de contenido enviado por usuarios', () => {
  it('StoryCard muestra HTML malicioso como texto', () => {
    const story: EditorialStory = { id: '1', submissionId: null, headline: PAYLOAD, satiricalBody: PAYLOAD, section: 'PORTADA', priority: 1, verification: 'UNVERIFIED', approved: true, isRumor: false };
    const { container } = render(<StoryCard story={story} variant="lead" />);
    expect(container.querySelector('img, script')).toBeNull();
    expect(container.textContent).toContain('<script>');
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it('EvidenceViewer y QuoteCard escapan contenido', () => {
    const sub: SubmissionSummary = { id: '1', receipt: 'R', category: 'RUMOR', status: 'SUBMITTED', reporterAlias: PAYLOAD, headline: PAYLOAD, description: PAYLOAD, eventDate: '2026-11-10', exactQuote: PAYLOAD, hasAttachment: false, receivedAt: '2026-11-10T00:00:00Z' };
    const a = render(<EvidenceViewer submission={sub} />);
    const b = render(<QuoteCard quote={PAYLOAD} attribution={PAYLOAD} />);
    for (const { container } of [a, b]) expect(container.querySelector('img, script')).toBeNull();
  });
});
