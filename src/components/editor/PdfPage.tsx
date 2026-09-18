import { cn } from "@/lib/utils";
import type { PDFPage } from "@/types/pdf";
import { PdfCanvasPage } from "./PdfCanvasPage";
import { usePdfDoc } from "./usePdfDocument";
import type { EditorState } from "./useEditorState";

interface Props {
  page: PDFPage;
  active: boolean;
  onActivate: () => void;
  editor: EditorState;
  children?: React.ReactNode;
}

export function PdfPage({ page, active, onActivate, editor, children }: Props) {
  const template = page.template;
  const pdfDoc = usePdfDoc();
  return (
    <div
      id={`pdf-page-${page.index + 1}`}
      onMouseDown={onActivate}
      className={cn(
        "relative shrink-0 bg-page text-page-foreground shadow-page ring-1 ring-black/5 transition-shadow",
        active && "ring-2 ring-brand/30",
      )}
      style={{
        width: page.width,
        aspectRatio: `${page.width} / ${page.height}`,
        transform: page.rotation ? `rotate(${page.rotation}deg)` : undefined,
      }}
    >
      {pdfDoc ? (
        <PdfCanvasPage page={page} editor={editor} />
      ) : (
        <div className="h-full overflow-hidden px-[76px] py-[72px] font-serif text-[13.5px] leading-[1.75]">
          {template === 0 && <PageOne />}
          {template === 1 && <PageTwo />}
          {template === 2 && <PageThree />}
          {template === 3 && <PageFour />}
        </div>
      )}
      {children}
      <span className="absolute -bottom-6 left-0 text-[11px] font-sans tabular-nums text-muted-foreground">
        Page {page.index + 1}
      </span>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-6 mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-page-foreground">
      {children}
    </h2>
  );
}

function PageOne() {
  return (
    <>
      <div className="flex items-start justify-between border-b border-black/10 pb-4">
        <div>
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            Northbridge Analytics Pvt. Ltd.
          </p>
          <p className="mt-1 text-[11.5px] text-black/55">
            14 Harbour Row, Bandra Kurla Complex, Mumbai 400051
          </p>
        </div>
        <p className="font-sans text-[10px] uppercase tracking-wider text-black/45">
          Confidential · HR-0142
        </p>
      </div>

      <h1 className="mt-9 text-center text-[23px] font-semibold uppercase tracking-[0.06em]">
        Employee Service Agreement
      </h1>
      <p className="mt-2 text-center text-[11.5px] italic text-black/55">
        Executed on the 14th day of September, 2026
      </p>

      <p className="mt-8">
        This Employee Service Agreement (the “Agreement”) is entered into between{" "}
        <strong>Northbridge Analytics Private Limited</strong>, a company incorporated under the
        Companies Act, 2013 (the “Company”), and the individual identified below (the “Employee”),
        and sets out the terms governing the Employee’s engagement with the Company.
      </p>

      <Heading>Employee Information</Heading>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px]">
        <Field label="Full name">Aarav Sharma</Field>
        <Field label="Employee ID">NB-20416</Field>
        <Field label="Designation">Senior Data Engineer</Field>
        <Field label="Department">Platform Engineering</Field>
        <Field label="Reporting to">R. Mehta, VP Engineering</Field>
        <Field label="Start date">01 October 2026</Field>
      </dl>

      <Heading>1. Position and Duties</Heading>
      <p>
        The Employee shall serve in the designation stated above and shall perform such duties as are
        customarily associated with that role, together with any additional responsibilities
        reasonably assigned by the Company from time to time. The Employee agrees to devote their
        full professional time and attention to the business of the Company during the term of this
        Agreement.
      </p>
      <p className="mt-3">
        The initial term of engagement shall be for a period of twelve (12) months from the start
        date, renewable by mutual written consent. The first ninety (90) days shall constitute a
        probationary period during which either party may terminate on seven (7) days’ notice.
      </p>

      <div className="mt-8 flex items-end justify-between border-t border-black/10 pt-3 font-sans text-[10px] text-black/45">
        <span>Northbridge Analytics · Employee Service Agreement</span>
        <span>Page 1 of 4</span>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-dotted border-black/15 pb-1">
      <dt className="font-sans text-[9.5px] uppercase tracking-[0.12em] text-black/45">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function PageTwo() {
  return (
    <>
      <Heading>2. Compensation</Heading>
      <p>
        In consideration of the services rendered, the Company shall pay the Employee the annual
        fixed compensation set out in the schedule below, payable in twelve equal monthly
        instalments, subject to statutory deductions including income tax, provident fund and
        professional tax as applicable.
      </p>

      <table className="mt-5 w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-black/[0.04]">
            <th className="border border-black/10 px-3 py-1.5 text-left font-sans text-[10px] uppercase tracking-wider">
              Component
            </th>
            <th className="border border-black/10 px-3 py-1.5 text-left font-sans text-[10px] uppercase tracking-wider">
              Basis
            </th>
            <th className="border border-black/10 px-3 py-1.5 text-right font-sans text-[10px] uppercase tracking-wider">
              Annual (INR)
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Basic salary", "Fixed", "12,60,000"],
            ["House rent allowance", "40% of basic", "5,04,000"],
            ["Special allowance", "Fixed", "3,36,000"],
            ["Provident fund (employer)", "12% of basic", "1,51,200"],
            ["Performance bonus", "Up to 15%, at discretion", "2,25,000"],
          ].map(([a, b, c]) => (
            <tr key={a}>
              <td className="border border-black/10 px-3 py-1.5">{a}</td>
              <td className="border border-black/10 px-3 py-1.5 text-black/60">{b}</td>
              <td className="border border-black/10 px-3 py-1.5 text-right tabular-nums">{c}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="border border-black/10 px-3 py-1.5" colSpan={2}>
              Total cost to company
            </td>
            <td className="border border-black/10 px-3 py-1.5 text-right tabular-nums">
              24,76,200
            </td>
          </tr>
        </tbody>
      </table>

      <Heading>3. Benefits Schedule</Heading>
      <p>
        The Employee shall be entitled to participate in the Company’s benefit programmes, as amended
        from time to time, including the following:
      </p>
      <ol className="mt-3 space-y-1.5 pl-5 [counter-reset:item] list-decimal">
        <li>Group medical insurance covering the Employee, spouse and up to two dependent children.</li>
        <li>Twenty-four (24) days of paid annual leave, accruing monthly and carried forward up to ten days.</li>
        <li>Twelve (12) days of paid sick leave per calendar year, supported by medical certification beyond three consecutive days.</li>
        <li>An annual professional development allowance of INR 60,000 towards approved training and certification.</li>
        <li>Hybrid working arrangement of three days on-site per week, subject to team requirements.</li>
      </ol>

      <p className="mt-5">
        Any revision of compensation shall be communicated in writing and shall form part of this
        Agreement by reference. The Company reserves the right to modify benefit programmes provided
        that overall benefit value is not materially reduced.
      </p>

      <div className="mt-8 flex items-end justify-between border-t border-black/10 pt-3 font-sans text-[10px] text-black/45">
        <span>Northbridge Analytics · Employee Service Agreement</span>
        <span>Page 2 of 4</span>
      </div>
    </>
  );
}

function PageThree() {
  return (
    <>
      <Heading>4. Confidentiality and Intellectual Property</Heading>
      <p>
        The Employee acknowledges that during the course of engagement they will have access to
        confidential information, including client data, source code, product roadmaps, commercial
        terms and business strategy. The Employee agrees to hold such information in strict
        confidence and not to disclose it to any third party during or after the term of this
        Agreement, except as required by law.
      </p>
      <p className="mt-3">
        4.2 &nbsp;All work product, inventions, designs and documentation created by the Employee in
        the course of engagement shall vest exclusively in the Company. The Employee agrees to
        execute such further documents as may reasonably be required to perfect the Company’s title
        to such work product.
      </p>
      <p className="mt-3">
        4.3 &nbsp;Upon cessation of engagement, the Employee shall return all Company property,
        including devices, access credentials, records and documents, whether physical or electronic,
        and shall permanently delete any Company data held on personal systems.
      </p>

      <Heading>5. Termination</Heading>
      <p>
        Either party may terminate this Agreement by providing sixty (60) days’ written notice.
        The Company may, at its discretion, pay salary in lieu of notice. The Company may terminate
        without notice in cases of gross misconduct, wilful breach of policy, or conduct materially
        prejudicial to the interests of the Company.
      </p>

      <table className="mt-5 w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-black/[0.04]">
            <th className="border border-black/10 px-3 py-1.5 text-left font-sans text-[10px] uppercase tracking-wider">
              Clause
            </th>
            <th className="border border-black/10 px-3 py-1.5 text-left font-sans text-[10px] uppercase tracking-wider">
              Notice period
            </th>
            <th className="border border-black/10 px-3 py-1.5 text-left font-sans text-[10px] uppercase tracking-wider">
              Survives term
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Resignation by Employee", "60 days", "Clauses 4, 6"],
            ["Termination by Company", "60 days or salary in lieu", "Clauses 4, 6"],
            ["Termination for cause", "Immediate", "Clauses 4, 6, 7"],
            ["Expiry of term", "Not applicable", "Clause 4"],
          ].map(([a, b, c]) => (
            <tr key={a}>
              <td className="border border-black/10 px-3 py-1.5">{a}</td>
              <td className="border border-black/10 px-3 py-1.5 text-black/60">{b}</td>
              <td className="border border-black/10 px-3 py-1.5 text-black/60">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Heading>6. Non-solicitation</Heading>
      <p>
        For a period of twelve (12) months following cessation of engagement, the Employee shall not
        directly solicit any employee, contractor or client of the Company with whom the Employee had
        material dealings during the final twelve months of engagement.
      </p>

      <div className="mt-8 flex items-end justify-between border-t border-black/10 pt-3 font-sans text-[10px] text-black/45">
        <span>Northbridge Analytics · Employee Service Agreement</span>
        <span>Page 3 of 4</span>
      </div>
    </>
  );
}

function PageFour() {
  return (
    <>
      <Heading>7. Governing Law and Dispute Resolution</Heading>
      <p>
        This Agreement shall be governed by and construed in accordance with the laws of India. Any
        dispute arising out of or in connection with this Agreement shall be referred to arbitration
        under the Arbitration and Conciliation Act, 1996, seated in Mumbai, before a sole arbitrator
        appointed by mutual consent.
      </p>

      <Heading>8. Entire Agreement</Heading>
      <p>
        This Agreement, together with its schedules, constitutes the entire understanding between the
        parties and supersedes all prior discussions, offers and correspondence relating to the
        Employee’s engagement.
      </p>

      <p className="mt-8 text-[12.5px]">
        <strong>In witness whereof</strong>, the parties have executed this Agreement on the date
        first written above.
      </p>

      <div className="mt-14 grid grid-cols-2 gap-12">
        {[
          { role: "For the Company", name: "Ritu Mehta", title: "VP Engineering" },
          { role: "Employee", name: "Aarav Sharma", title: "Senior Data Engineer" },
        ].map((s) => (
          <div key={s.role}>
            <p className="font-sans text-[9.5px] uppercase tracking-[0.14em] text-black/45">
              {s.role}
            </p>
            <div className="mt-12 border-b border-black/40" />
            <p className="mt-1.5 text-[12.5px] font-semibold">{s.name}</p>
            <p className="text-[11.5px] text-black/55">{s.title}</p>
            <div className="mt-5 border-b border-dotted border-black/30" />
            <p className="mt-1 font-sans text-[9.5px] uppercase tracking-[0.14em] text-black/45">
              Date
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-sm border border-black/10 bg-black/[0.02] p-4 text-[11.5px] text-black/60">
        <p className="font-sans text-[9.5px] font-bold uppercase tracking-[0.14em] text-black/45">
          Witnessed by
        </p>
        <div className="mt-2 grid grid-cols-2 gap-8">
          <p>1. &nbsp;S. Iyer — Head of People Operations</p>
          <p>2. &nbsp;K. Rao — Legal Counsel</p>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between border-t border-black/10 pt-3 font-sans text-[10px] text-black/45">
        <span>Northbridge Analytics · Employee Service Agreement</span>
        <span>Page 4 of 4</span>
      </div>
    </>
  );
}
