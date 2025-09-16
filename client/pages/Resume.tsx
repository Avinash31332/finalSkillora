import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { fetchMyResume, Resume } from "@/lib/resume.service";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, GraduationCap, Cpu, Trophy, Award, FolderGit2, Mail, Phone, MapPin, Link2, Sparkles } from "lucide-react";
import { usePosts } from "@/contexts/PostsContext";

export default function ResumePage() {
  const { isAuthenticated } = useAuth();
  const { profile } = useProfile();
  const { posts, refreshPosts } = usePosts();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [smartResults, setSmartResults] = useState<{ id: string; score: number; matched: string[] }[]>([]);
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

  function tokenize(values: string[]): string[] {
    return Array.from(new Set(values
      .flatMap(v => v.split(/[\s,\/\-]+/))
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)));
  }

  function computeSmartTrades() {
    setSmartOpen(true);
    setSmartLoading(true);
    // Ensure we have latest posts
    refreshPosts();
    const skillSections = resume.technical_skills || [];
    const resumeSkills = skillSections.flatMap(s => s.items || []);
    const mySkills = Array.isArray(profile?.skills_i_have) ? (profile!.skills_i_have as string[]) : [];
    const allSkillTokens = tokenize([...resumeSkills, ...mySkills]);

    const results = posts.map(p => {
      const postSkills = [
        ...(p.skills_offered || []),
        ...(p.skills_needed || []),
        p.title || "",
        p.content || ""
      ];
      const postTokens = tokenize(postSkills);
      const matched = allSkillTokens.filter(t => postTokens.some(pt => pt.includes(t) || t.includes(pt)));
      const score = matched.length / Math.max(1, allSkillTokens.length);
      return { id: p.id, score, matched };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

    // small delay to feel deliberate
    setTimeout(() => {
      setSmartResults(results);
      setSmartLoading(false);
    }, 700);
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-end gap-2 mb-6 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>Download / Print</Button>
          <Button onClick={() => navigate("/resume/edit")}>Edit</Button>
          <Button onClick={computeSmartTrades} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
            <Sparkles size={16} />
            Smart Trades
          </Button>
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

              {/* My Skills from profile */}
              {Array.isArray(profile?.skills_i_have) && (profile!.skills_i_have as string[]).length > 0 ? (
                <section>
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-indigo-700" />
                    <h2 className="text-xs font-semibold tracking-wider uppercase text-indigo-700">My Skills</h2>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(profile!.skills_i_have as string[]).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 text-[11px] rounded-md bg-gradient-to-br from-indigo-50 to-white text-indigo-900 border border-indigo-100 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]">{s}</span>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      {/* Smart Trades Drawer */}
      {smartOpen && (
        <div className="fixed inset-0 z-50 print:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSmartOpen(false)} />
          <div className="absolute inset-0 bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                <Sparkles size={18} /> Smart Trades
              </div>
              <Button variant="ghost" onClick={() => setSmartOpen(false)}>Close</Button>
            </div>

            <div className="p-6 overflow-y-auto h-full">
              {smartLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-700">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 animate-pulse mb-3" />
                  <div className="h-2 w-40 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 animate-[loading_1.4s_ease-in-out_infinite] bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-400" />
                  </div>
                  <p className="mt-3 text-sm">Scanning posts and matching your skills…</p>
                </div>
              ) : smartResults.length === 0 ? (
                <div className="text-center text-sm text-slate-600">No close matches yet. Try adding more specific skills.</div>
              ) : (
                <div className="mx-auto w-full max-w-6xl space-y-4">
                  {smartResults.map((r) => {
                    const post = posts.find(p => p.id === r.id)!;
                    return (
                      <div key={r.id} className="border rounded-xl p-5 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <img
                                src={post.user?.profile_picture || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces"}
                                alt={post.user?.name || "User"}
                                className="h-9 w-9 rounded-full object-cover border"
                              />
                              <div className="truncate">
                                <div className="font-medium truncate text-base">{post.title}</div>
                                <div className="text-xs text-slate-500 truncate">by {post.user?.name || "Anonymous"}</div>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs px-2.5 py-1 shrink-0 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{Math.round(r.score * 100)}% match</span>
                        </div>
                        <p className="text-[15px] text-slate-700 mt-2">{post.content}</p>

                        {/* Media preview */}
                        {Array.isArray(post.media_urls) && post.media_urls.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            {post.media_urls.slice(0, 3).map((url, i) => (
                              <img key={i} src={url} alt="attachment" className="h-36 w-full object-cover rounded-lg border" />
                            ))}
                          </div>
                        )}

                        {r.matched.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {r.matched.slice(0, 10).map((m, i) => (
                              <span key={i} className="text-[12px] px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">{m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


