// src/app/(other)/apply/steps/Step5Research.tsx
import React, { useState } from "react";
import { BookOpen, Book, Newspaper, Mic } from "lucide-react";
import { newId } from "../normalize";
import type { ResearchBook, ResearchConference, ResearchJournal, ResearchPublications } from "../types";
import { AddButton, EmptyState, Field, Grid, Notice, RepeatCard, StepHeader, Tabs, TextInput, listOps } from "../ui";
import type { StepProps } from "./stepProps";

const Step5Research: React.FC<StepProps> = ({ data, update }) => {
  const [tab, setTab] = useState("journals");
  const rp = data.researchPublications;
  const setPart = <K extends keyof ResearchPublications>(k: K, v: ResearchPublications[K]) =>
    update("researchPublications", { ...rp, [k]: v });

  const books = listOps(rp.books, (l) => setPart("books", l));
  const journals = listOps(rp.journals, (l) => setPart("journals", l));
  const confs = listOps(rp.conferences, (l) => setPart("conferences", l));

  return (
    <div>
      <StepHeader
        step="research"
        optional
        icon={<BookOpen size={22} />}
        subtitle="First-degree dissertations and postgraduate theses are not considered publications."
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "journals", label: "Journal Articles", count: rp.journals.length, icon: <Newspaper size={16} /> },
          { id: "conferences", label: "Conference Abstracts", count: rp.conferences.length, icon: <Mic size={16} /> },
          { id: "books", label: "Books / Chapters", count: rp.books.length, icon: <Book size={16} /> },
        ]}
      />

      {tab === "journals" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <AddButton
              onClick={() =>
                journals.add({ id: newId(), articleTitle: "", authors: "", journalName: "", year: "", volume: "", issue: "", pages: "", doi: "" } as ResearchJournal)
              }
            >
              Add Journal Article
            </AddButton>
          </div>
          {rp.journals.length === 0 && <EmptyState icon={<Newspaper size={36} />} text="No journal articles added." />}
          {rp.journals.map((j, i) => (
            <RepeatCard key={j.id} index={i} label="Journal Article" onRemove={() => journals.remove(j.id)}>
              <Grid>
                <Field label="Article Title" required full>
                  <TextInput value={j.articleTitle} onValue={(v) => journals.update(j.id, "articleTitle", v)} />
                </Field>
                <Field label="Author(s)" full hint="List all authors in order.">
                  <TextInput value={j.authors} onValue={(v) => journals.update(j.id, "authors", v)} />
                </Field>
                <Field label="Journal" full>
                  <TextInput value={j.journalName} onValue={(v) => journals.update(j.id, "journalName", v)} />
                </Field>
                <Field label="Year">
                  <TextInput inputMode="numeric" maxLength={4} value={j.year} onValue={(v) => journals.update(j.id, "year", v.replace(/\D/g, ""))} placeholder="YYYY" />
                </Field>
                <Field label="Volume">
                  <TextInput value={j.volume} onValue={(v) => journals.update(j.id, "volume", v)} />
                </Field>
                <Field label="Issue">
                  <TextInput value={j.issue} onValue={(v) => journals.update(j.id, "issue", v)} />
                </Field>
                <Field label="Pages">
                  <TextInput value={j.pages} onValue={(v) => journals.update(j.id, "pages", v)} placeholder="e.g. 1–15" />
                </Field>
                <Field label="DOI" full>
                  <TextInput value={j.doi} onValue={(v) => journals.update(j.id, "doi", v)} placeholder="10.xxxx/xxxxx" />
                </Field>
              </Grid>
            </RepeatCard>
          ))}
        </section>
      )}

      {tab === "conferences" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <AddButton
              onClick={() =>
                confs.add({ id: newId(), abstractTitle: "", authors: "", conferenceName: "", conferenceDate: "", location: "" } as ResearchConference)
              }
            >
              Add Conference Abstract
            </AddButton>
          </div>
          {rp.conferences.length === 0 && <EmptyState icon={<Mic size={36} />} text="No conference abstracts added." />}
          {rp.conferences.map((c, i) => (
            <RepeatCard key={c.id} index={i} label="Conference Abstract" onRemove={() => confs.remove(c.id)}>
              <Grid>
                <Field label="Abstract Title" required full>
                  <TextInput value={c.abstractTitle} onValue={(v) => confs.update(c.id, "abstractTitle", v)} />
                </Field>
                <Field label="Author(s)" full>
                  <TextInput value={c.authors} onValue={(v) => confs.update(c.id, "authors", v)} />
                </Field>
                <Field label="Conference" full>
                  <TextInput value={c.conferenceName} onValue={(v) => confs.update(c.id, "conferenceName", v)} />
                </Field>
                <Field label="Date">
                  <TextInput type="date" value={c.conferenceDate} onValue={(v) => confs.update(c.id, "conferenceDate", v)} />
                </Field>
                <Field label="Location">
                  <TextInput value={c.location} onValue={(v) => confs.update(c.id, "location", v)} placeholder="City, Country" />
                </Field>
              </Grid>
            </RepeatCard>
          ))}
        </section>
      )}

      {tab === "books" && (
        <section className="space-y-4">
          <div className="flex justify-end">
            <AddButton onClick={() => books.add({ id: newId(), bookName: "", publicationDate: "", authors: "", isbn: "" } as ResearchBook)}>
              Add Book
            </AddButton>
          </div>
          {rp.books.length === 0 && <EmptyState icon={<Book size={36} />} text="No books added." />}
          {rp.books.map((b, i) => (
            <RepeatCard key={b.id} index={i} label="Book" onRemove={() => books.remove(b.id)}>
              <Grid>
                <Field label="Title" required full>
                  <TextInput value={b.bookName} onValue={(v) => books.update(b.id, "bookName", v)} />
                </Field>
                <Field label="Author(s)" full>
                  <TextInput value={b.authors} onValue={(v) => books.update(b.id, "authors", v)} />
                </Field>
                <Field label="Publication Date">
                  <TextInput type="date" value={b.publicationDate} onValue={(v) => books.update(b.id, "publicationDate", v)} />
                </Field>
                <Field label="ISBN">
                  <TextInput value={b.isbn} onValue={(v) => books.update(b.id, "isbn", v)} />
                </Field>
              </Grid>
            </RepeatCard>
          ))}
        </section>
      )}

      <div className="mt-6">
        <Notice>PDF copies of publications can be attached in the Supporting Documents step.</Notice>
      </div>
    </div>
  );
};

export default Step5Research;
