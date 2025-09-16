import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { fetchMyResume, upsertMyResume, Resume } from "@/lib/resume.service";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

type FormState = {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: string; // one per line: label|url
  summary: string;
  education: string; // one entry per line: School | Degree | Duration
  skills: string; // sections lines: Section: item1, item2, item3
  experience: string; // blocks separated by blank line. First line: Role | Company | Duration; bullets lines start with -
  projects: string; // blocks separated by blank line. First line: Name; bullets lines start with -
  achievements: string; // one per line
  certifications: string; // one per line: Name | Issuer | Year
};

export default function EditResumePage() {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    links: "",
    summary: "",
    education: "",
    skills: "",
    experience: "",
    projects: "",
    achievements: "",
    certifications: "",
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const existing = await fetchMyResume();
      if (existing && mounted) {
        setForm({
          full_name: existing.full_name || "",
          headline: existing.headline || "",
          email: existing.email || "",
          phone: existing.phone || "",
          location: existing.location || "",
          links: (existing.links || []).map(l => `${l.label}|${l.url}`).join("\n"),
          summary: existing.summary || "",
          education: (existing.education || []).map(e => [e.school, e.degree, e.duration].filter(Boolean).join(" | ")).join("\n"),
          skills: (existing.technical_skills || []).map(s => `${s.section}: ${s.items.join(", ")}`).join("\n"),
          experience: (existing.experience || []).map(exp => [`${exp.role || ""} | ${exp.company} | ${exp.duration || ""}`, ...exp.bullets.map(b => `- ${b}`)].join("\n")).join("\n\n"),
          projects: (existing.projects || []).map(p => [p.name, ...(p.bullets || []).map(b => `- ${b}`)].join("\n")).join("\n\n"),
          achievements: (existing.achievements || []).join("\n"),
          certifications: (existing.certifications || []).map(c => [c.name, c.issuer, c.year].filter(Boolean).join(" | ")).join("\n"),
        });
      }
    })();
    return () => { mounted = false };
  }, []);

  const update = (key: keyof FormState, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const resume: Omit<Resume, "user_id"> = {
        full_name: form.full_name.trim(),
        headline: form.headline.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        location: form.location.trim() || undefined,
        links: form.links.split(/\n+/).filter(Boolean).map(line => {
          const [label, url] = line.split("|").map(s => s.trim());
          return { label, url };
        }),
        summary: form.summary.trim() || undefined,
        education: form.education.split(/\n+/).filter(Boolean).map(line => {
          const [school, degree, duration] = line.split("|").map(s => s.trim());
          return { school, degree, duration };
        }),
        technical_skills: form.skills.split(/\n+/).filter(Boolean).map(line => {
          const [section, items] = line.split(":");
          const list = (items || "").split(",").map(s => s.trim()).filter(Boolean);
          return { section: (section || "").trim(), items: list };
        }),
        experience: form.experience.split(/\n\n+/).filter(Boolean).map(block => {
          const lines = block.split(/\n+/).filter(Boolean);
          const [header, ...rest] = lines;
          const [role, company, duration] = (header || "").split("|").map(s => s.trim());
          const bullets = rest.map(l => l.replace(/^\-\s*/, "").trim()).filter(Boolean);
          return { company: company || "", role, duration, bullets };
        }),
        projects: form.projects.split(/\n\n+/).filter(Boolean).map(block => {
          const lines = block.split(/\n+/).filter(Boolean);
          const [name, ...rest] = lines;
          const bullets = rest.map(l => l.replace(/^\-\s*/, "").trim()).filter(Boolean);
          return { name: name || "", bullets };
        }),
        achievements: form.achievements.split(/\n+/).map(s => s.trim()).filter(Boolean),
        certifications: form.certifications.split(/\n+/).filter(Boolean).map(line => {
          const [name, issuer, year] = line.split("|").map(s => s.trim());
          return { name, issuer, year };
        }),
      };
      await upsertMyResume(resume);
      // Simulate AI crafting time for a more professional experience
      await new Promise((r) => setTimeout(r, 1400));
      navigate("/resume");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {saving && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 text-white flex items-center justify-center mb-4">
                <Loader2 className="animate-spin" size={20} />
              </div>
              <h3 className="text-lg font-semibold">Crafting your resume</h3>
              <p className="text-sm text-slate-600 mt-1">Applying layout, typography and sections…</p>
              <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-1/3 animate-[loading_1.4s_ease-in-out_infinite] bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-400" />
              </div>
            </div>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Build Your Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" value={form.full_name} onChange={e => update("full_name", e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input id="headline" value={form.headline} onChange={e => update("headline", e.target.value)} placeholder="Full Stack Developer" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={e => update("phone", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={e => update("location", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Links (one per line: Label|https://url)</Label>
                <Textarea value={form.links} onChange={e => update("links", e.target.value)} rows={3} />
              </div>

              <div>
                <Label>Professional Summary</Label>
                <Textarea value={form.summary} onChange={e => update("summary", e.target.value)} rows={5} />
              </div>

              <div>
                <Label>Education (one per line: School | Degree | Duration)</Label>
                <Textarea value={form.education} onChange={e => update("education", e.target.value)} rows={3} />
              </div>

              <div>
                <Label>Technical Skills (one per line: Section: item1, item2, item3)</Label>
                <Textarea value={form.skills} onChange={e => update("skills", e.target.value)} rows={4} />
              </div>

              <div>
                <Label>Experience (blocks: first line Role | Company | Duration, bullets start with -)</Label>
                <Textarea value={form.experience} onChange={e => update("experience", e.target.value)} rows={8} />
              </div>

              <div>
                <Label>Projects (blocks: first line Name, bullets start with -)</Label>
                <Textarea value={form.projects} onChange={e => update("projects", e.target.value)} rows={8} />
              </div>

              <div>
                <Label>Achievements (one per line)</Label>
                <Textarea value={form.achievements} onChange={e => update("achievements", e.target.value)} rows={4} />
              </div>

              <div>
                <Label>Certifications (one per line: Name | Issuer | Year)</Label>
                <Textarea value={form.certifications} onChange={e => update("certifications", e.target.value)} rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/resume")}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Resume"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


