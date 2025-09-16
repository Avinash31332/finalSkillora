import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { fetchMyResume, Resume } from "@/lib/resume.service";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, GraduationCap, Cpu, Trophy, Award, FolderGit2, Mail, Phone, MapPin, Link2 } from "lucide-react";

export default function ResumePage() {
  const { isAuthenticated } = useAuth();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isAuthenticated) return;
      const data = await fetchMyResume();
      if (mounted) {
        setResume(data);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-10">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4">Please sign in to create and view your resume.</p>
              <Button onClick={() => navigate("/signin")}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-10">Loading...</div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-10">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-2">No resume yet</h2>
              <p className="mb-4">Create your professional resume using our template.</p>
              <Button onClick={() => navigate("/resume/edit")}>Create Resume</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const parts = (resume.full_name || "").trim().split(/\s+/);
  const initials = parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join("") || "U";

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-end gap-2 mb-6 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>Download / Print</Button>
          <Button onClick={() => navigate("/resume/edit")}>Edit</Button>
        </div>

        {/* Resume Canvas */}
        <div className="relative bg-white shadow-sm ring-1 ring-gray-200 max-w-5xl mx-auto print:shadow-none print:ring-0">
          {/* Subtle background pattern (screen only) */}
          <div className="absolute inset-0 pointer-events-none hidden print:hidden sm:block" aria-hidden>
            <div className="h-full w-full opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,#000_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>
          {/* Accent Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 print:hidden" />
          {/* Header */}
          <div className="relative px-10 pt-8 pb-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-semibold shadow-sm">
                  {initials}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{resume.full_name}</h1>
                  {resume.headline && (
                    <p className="text-slate-700 mt-1">{resume.headline}</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <div className="flex flex-col gap-1 lg:items-end">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700">
                    {resume.location && <span className="inline-flex items-center gap-1"><MapPin size={14} className="text-indigo-600" />{resume.location}</span>}
                    {resume.phone && <span className="inline-flex items-center gap-1"><Phone size={14} className="text-indigo-600" />{resume.phone}</span>}
                    {resume.email && <span className="inline-flex items-center gap-1"><Mail size={14} className="text-indigo-600" />{resume.email}</span>}
                  </div>
                  {resume.links?.length ? (
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 lg:justify-end">
                      {resume.links.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-600">
                          <Link2 size={14} />
                          <span className="underline decoration-indigo-300 decoration-2 underline-offset-4">{l.label}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-10 py-8 grid lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              {resume.summary && (
                <section>
                  <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Professional Summary</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-900 whitespace-pre-line">
                    {resume.summary}
                  </p>
                </section>
              )}

              {resume.experience?.length ? (
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-indigo-700" />
                      <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Experience</h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                  </div>
                  <div className="mt-3 space-y-6">
                    {resume.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-indigo-200 pl-4">
                        <div className="text-sm font-medium text-gray-900">
                          {exp.role ? `${exp.role} · ` : ""}{exp.company}
                          {exp.duration ? <span className="text-gray-600 font-normal"> — {exp.duration}</span> : null}
                        </div>
                        {exp.bullets?.length ? (
                          <ul className="mt-2 list-disc ml-5 text-sm leading-6 text-gray-800 space-y-1">
                            {exp.bullets.map((b, bi) => (
                              <li key={bi}>{b}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {resume.projects?.length ? (
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FolderGit2 size={14} className="text-indigo-700" />
                      <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Projects</h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                  </div>
                  <div className="mt-3 space-y-6">
                    {resume.projects.map((p, i) => (
                      <div key={i}>
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        {p.description ? (
                          <div className="text-sm text-gray-800 mt-1">{p.description}</div>
                        ) : null}
                        {p.bullets?.length ? (
                          <ul className="mt-2 list-disc ml-5 text-sm leading-6 text-gray-800 space-y-1">
                            {p.bullets.map((b, bi) => (
                              <li key={bi}>{b}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {resume.education?.length ? (
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={14} className="text-indigo-700" />
                      <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Education</h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                  </div>
                  <ul className="mt-3 text-sm text-gray-900 space-y-2">
                    {resume.education.map((e, i) => (
                      <li key={i}>
                        <span className="font-medium">{e.school}</span>
                        {e.degree ? `, ${e.degree}` : ""}
                        {e.duration ? ` — ${e.duration}` : ""}
                        {e.details ? <div className="text-gray-700">{e.details}</div> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {resume.achievements?.length ? (
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-indigo-700" />
                      <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Achievements & Hackathons</h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                  </div>
                  <ul className="mt-3 list-disc ml-5 text-sm leading-6 text-gray-800 space-y-1">
                    {resume.achievements.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {resume.certifications?.length ? (
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-indigo-700" />
                      <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Certifications</h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                  </div>
                  <ul className="mt-3 list-disc ml-5 text-sm leading-6 text-gray-800 space-y-1">
                    {resume.certifications.map((c, i) => (
                      <li key={i}>{[c.name, c.issuer, c.year].filter(Boolean).join(" – ")}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {resume.technical_skills?.length ? (
                <section>
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-indigo-700" />
                    <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Core Competencies</h2>
                  </div>
                  <div className="mt-3 space-y-3">
                    {resume.technical_skills.map((s, i) => (
                      <div key={i}>
                        <div className="text-xs font-medium text-gray-900 mb-1">{s.section}</div>
                        <div className="flex flex-wrap gap-1">
                          {s.items.map((item, ii) => (
                            <span key={ii} className="px-2 py-0.5 text-[11px] rounded-md bg-gradient-to-br from-indigo-50 to-white text-indigo-900 border border-indigo-100 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {/* Contact quick glance for print readability */}
              <section>
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-indigo-700" />
                  <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Contact</h2>
                </div>
                <div className="mt-3 text-sm text-gray-900 space-y-1">
                  {resume.location ? <div>{resume.location}</div> : null}
                  {resume.phone ? <div>{resume.phone}</div> : null}
                  {resume.email ? <div>{resume.email}</div> : null}
                  {resume.links?.length ? (
                    <div className="pt-1 flex flex-col gap-1">
                      {resume.links.map((l, i) => (
                        <div key={i} className="text-indigo-700">{l.label}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}


