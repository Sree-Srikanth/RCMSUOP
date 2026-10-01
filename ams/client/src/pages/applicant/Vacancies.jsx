import { useState } from 'react';
import { get } from '../../lib/api';
import { Button, Card, Modal, PageHeader } from '../../components/ui';
import { VacancyBrowser } from '../public/PublicHome';
import { VacancyInfo, useApply } from '../public/VacancyDetail';

export default function ApplicantVacancies() {
  const [selected, setSelected] = useState(null);
  const { apply, busy } = useApply();

  const open = async (v) => {
    const r = await get(`/vacancies/${v.id}`);
    setSelected(r.vacancy);
  };

  return (
    <>
      <PageHeader title="Open Vacancies" subtitle="Select a vacancy to view its details and start an application." />
      <Card>
        <VacancyBrowser onSelect={open} />
      </Card>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected ? `${selected.position_title} – ${selected.department_name}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected?.is_open && (
              <Button onClick={() => apply(selected.id)} loading={busy}>
                Start application
              </Button>
            )}
          </>
        }
      >
        {selected && <VacancyInfo v={selected} />}
      </Modal>
    </>
  );
}
