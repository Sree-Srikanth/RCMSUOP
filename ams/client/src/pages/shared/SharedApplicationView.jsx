import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { get, download } from '../../lib/api';
import ApplicationView from '../../components/ApplicationView';
import { Badge, Button, DecisionBadge, ErrorBox, PageHeader, Spinner, useLoad, useToast } from '../../components/ui';

export default function SharedApplicationView() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error } = useLoad(() => get(`/applications/${id}`), [id]);
  const a = data?.application;
  return (
    <>
      <PageHeader
        back={
          <Link to="/shared" className="mb-2 inline-flex items-center gap-1 text-sm text-uop-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Shared applications
          </Link>
        }
        title={a ? `${a.title ? a.title + '. ' : ''}${a.name_in_full}` : 'Application'}
        subtitle={a ? `${a.reference_no} · ${a.position_title} · ${a.department_name}` : ''}
        actions={
          a && (
            <Button variant="secondary" icon={Download} onClick={() => download(`/applications/${id}/pdf`).catch((e) => toast(e.message, 'error'))}>
              Download application PDF
            </Button>
          )
        }
      />
      <ErrorBox error={error} />
      {loading && <Spinner />}
      {a && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <DecisionBadge decision={a.decision_code} category={a.category_code} />
            <Badge>Referee reports received: {a.rr_received}/2</Badge>
          </div>
          <ApplicationView app={a} />
        </>
      )}
    </>
  );
}
