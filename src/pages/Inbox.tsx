import { Typography } from '@/components/ui/design-system';

const Inbox = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="max-w-4xl mx-auto">
      <Typography.H2 className="mb-6">Messages</Typography.H2>
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <Typography.Body className="text-muted-foreground">Messaging feature coming soon.</Typography.Body>
      </div>
    </div>
  </div>
);

export default Inbox;
