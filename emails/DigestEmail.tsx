import React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components';

export type DigestEmailEvent = {
  id: string;
  change_type: 'pricing' | 'feature' | 'hiring' | 'other';
  change_summary: string;
  why_it_matters: string;
};

export type DigestEmailCompetitorGroup = {
  name: string;
  events: DigestEmailEvent[];
};

export type DigestEmailProps = {
  weekLabel: string;
  competitorGroups: DigestEmailCompetitorGroup[];
  settingsUrl: string;
};

const CATEGORY_STYLES: Record<DigestEmailEvent['change_type'], { label: string; bg: string; fg: string }> = {
  pricing: { label: 'PRICING', bg: '#f7e9ec', fg: '#9e3346' },
  feature: { label: 'LAUNCH', bg: '#eaf0f8', fg: '#17427f' },
  hiring: { label: 'HIRING', bg: '#e6f2eb', fg: '#146b45' },
  other: { label: 'UPDATE', bg: '#eceded', fg: '#3a3f43' },
};

export function DigestEmail({ weekLabel, competitorGroups, settingsUrl }: DigestEmailProps) {
  const totalChanges = competitorGroups.reduce((sum, group) => sum + group.events.length, 0);

  return (
    <Html>
      <Head />
      <Preview>
        {`${totalChanges} change${totalChanges === 1 ? '' : 's'} across ${competitorGroups.length} competitor${
          competitorGroups.length === 1 ? '' : 's'
        } this week`}
      </Preview>
      <Body
        style={{
          backgroundColor: '#f4f4f2',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: '24px 0',
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: '0 auto',
            backgroundColor: '#ffffff',
            border: '1px solid #d9dad4',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Section style={{ backgroundColor: '#fafaf8', borderBottom: '1px solid #eceded', padding: '18px 24px' }}>
            <Text style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', color: '#16181a' }}>
              Here&rsquo;s how your competitors changed this week
            </Text>
            <Text style={{ margin: '4px 0 0', fontSize: 12, color: '#8b8f91' }}>
              {weekLabel} &middot; {competitorGroups.length} competitor{competitorGroups.length === 1 ? '' : 's'}{' '}
              &middot; {totalChanges} change{totalChanges === 1 ? '' : 's'}
            </Text>
          </Section>

          {competitorGroups.map((group) => (
            <Section key={group.name} style={{ borderBottom: '1px solid #eceded', padding: '18px 24px' }}>
              <Heading as="h2" style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#16181a' }}>
                {group.name}
              </Heading>

              {group.events.map((event, index) => {
                const category = CATEGORY_STYLES[event.change_type] ?? CATEGORY_STYLES.other;
                return (
                  <Section key={event.id} style={{ marginBottom: index === group.events.length - 1 ? 0 : 16 }}>
                    <Text
                      style={{
                        display: 'inline-block',
                        margin: '0 0 6px',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.4,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: category.bg,
                        color: category.fg,
                      }}
                    >
                      {category.label}
                    </Text>
                    <Text style={{ margin: '0 0 4px', fontSize: 14, lineHeight: '20px', color: '#16181a' }}>
                      {event.change_summary}
                    </Text>
                    <Text style={{ margin: 0, fontSize: 13, lineHeight: '19px', color: '#5f6467' }}>
                      {event.why_it_matters}
                    </Text>
                  </Section>
                );
              })}
            </Section>
          ))}

          <Section style={{ padding: '18px 24px' }}>
            <Text style={{ margin: 0, fontSize: 12, lineHeight: '18px', color: '#8b8f91' }}>
              You&rsquo;re receiving this because you&rsquo;re tracking competitors on Signal.{' '}
              <Link href={settingsUrl} style={{ color: '#17427f' }}>
                Manage email preferences
              </Link>
            </Text>
          </Section>
        </Container>

        <Hr style={{ borderColor: 'transparent', margin: '16px 0' }} />
        <Text style={{ textAlign: 'center', fontSize: 12, color: '#b6b8b9', margin: 0 }}>
          Signal &middot; Built for founders who&rsquo;d rather ship than snoop.
        </Text>
      </Body>
    </Html>
  );
}

export default DigestEmail;
