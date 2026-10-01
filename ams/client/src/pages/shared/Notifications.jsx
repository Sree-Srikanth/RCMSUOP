import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { get, post } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader, Spinner, useLoad } from '../../components/ui';

export default function Notifications() {
  const { data, loading, error, reload } = useLoad(() => get('/me/notifications'), []);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (data?.unread) {
      const t = setTimeout(() => post('/me/notifications/read').catch(() => {}), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [data]);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Emails and system messages sent to you."
        actions={
          data?.unread > 0 && (
            <Button variant="secondary" icon={CheckCheck} onClick={() => post('/me/notifications/read').then(reload)}>
              Mark all as read
            </Button>
          )
        }
      />
      <ErrorBox error={error} />
      {loading ? (
        <Spinner />
      ) : !data?.notifications.length ? (
        <Card>
          <EmptyState icon={Bell} title="No notifications" />
        </Card>
      ) : (
        <Card bodyClass="p-0">
          <ul className="divide-y divide-slate-200">
            {data.notifications.map((n) => (
              <li key={n.id}>
                <button type="button" className="w-full px-5 py-3 text-left hover:bg-slate-50" onClick={() => setOpen(open === n.id ? null : n.id)} aria-expanded={open === n.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={n.is_read ? 'text-slate-700' : 'font-semibold text-slate-900'}>
                      {!n.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-uop-600" aria-label="Unread" />}
                      {n.subject}
                    </p>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      {n.reference_no && <Badge tone="maroon">{n.reference_no}</Badge>}
                      {fmtDateTime(n.created_at)}
                    </span>
                  </div>
                  {open === n.id && <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-700">{n.body}</pre>}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
