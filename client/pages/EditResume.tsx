import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { fetchMyResume, upsertMyResume, Resume } from "@/lib/resume.service";
import { generateResumeWithAI, saveGeminiApiKey, getGeminiApiKey, AIResumeRequest } from "@/lib/ai-resume.service";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Settings } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";

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
  const { profile, updateProfile } = useProfile();
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
  const [mySkills, setMySkills] = useState<string>("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
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
      // Prefill skills from profile
      if (mounted && profile?.skills_i_have) {
        setMySkills((profile.skills_i_have as string[]).join(", "));
      }
      // Load existing API key
      if (mounted) {
        setApiKey(getGeminiApiKey() || "");
      }
    })();
    return () => { mounted = false };
  }, [profile]);

  const update = (key: keyof FormState, value: string) => {
    console.log(`Updating ${key} to:`, value);
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const saveResumeToDatabase = async (formData: FormState) => {
    try {
      const resume: Omit<Resume, "user_id"> = {
        full_name: formData.full_name.trim(),
        headline: formData.headline.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        location: formData.location.trim() || undefined,
        links: formData.links.split(/\n+/).filter(Boolean).map(line => {
          const [label, url] = line.split("|").map(s => s.trim());
          return { label, url };
        }),
        summary: formData.summary.trim() || undefined,
        education: formData.education.split(/\n+/).filter(Boolean).map(line => {
          const [school, degree, duration] = line.split("|").map(s => s.trim());
          return { school, degree, duration };
        }),
        technical_skills: formData.skills.split(/\n+/).filter(Boolean).map(line => {
          const [section, items] = line.split(":");
          const list = (items || "").split(",").map(s => s.trim()).filter(Boolean);
          return { section: (section || "").trim(), items: list };
        }),
        experience: formData.experience.split(/\n\n+/).filter(Boolean).map(block => {
          const lines = block.split(/\n+/).filter(Boolean);
          const [header, ...rest] = lines;
          const [role, company, duration] = (header || "").split("|").map(s => s.trim());
          const bullets = rest.map(l => l.replace(/^\-\s*/, "").trim()).filter(Boolean);
          return { company: company || "", role, duration, bullets };
        }),
        projects: formData.projects.split(/\n\n+/).filter(Boolean).map(block => {
          const lines = block.split(/\n+/).filter(Boolean);
          const [name, ...rest] = lines;
          const bullets = rest.map(l => l.replace(/^\-\s*/, "").trim()).filter(Boolean);
          return { name: name || "", bullets };
        }),
        achievements: formData.achievements.split(/\n+/).map(s => s.trim()).filter(Boolean),
        certifications: formData.certifications.split(/\n+/).filter(Boolean).map(line => {
          const [name, issuer, year] = line.split("|").map(s => s.trim());
          return { name, issuer, year };
        }),
      };
      
      await upsertMyResume(resume);
      
      // Update profile skills_i_have
      const parsedSkills = mySkills
        .split(/[,\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
      if (parsedSkills.length > 0) {
        await updateProfile({ skills_i_have: parsedSkills as any });
      }
      
      console.log("Resume saved to database successfully!");
    } catch (error) {
      console.error("Error saving resume to database:", error);
      throw error;
    }
  };

  const generateWithAI = async () => {
    if (!form.full_name.trim()) {
      alert("Please enter your full name first");
      return;
    }

    setAiGenerating(true);
    try {
      const aiRequest: AIResumeRequest = {
        full_name: form.full_name,
        headline: form.headline,
        email: form.email,
        phone: form.phone,
        location: form.location,
        summary: form.summary,
        education: form.education,
        skills: form.skills,
        experience: form.experience,
        projects: form.projects,
        achievements: form.achievements,
        certifications: form.certifications,
      };

      const aiResume = await generateResumeWithAI(aiRequest);
      console.log("AI Resume generated:", aiResume);
      console.log("AI Resume keys:", Object.keys(aiResume));
      console.log("AI Resume full_name:", aiResume.full_name);
      console.log("AI Resume summary:", aiResume.summary);
      console.log("AI Resume location:", aiResume.location);
      console.log("AI Resume technical_skills:", aiResume.technical_skills);
      
      // Update form with AI-generated content
      const newForm = {
        full_name: aiResume.full_name || form.full_name,
        headline: aiResume.headline || "",
        email: aiResume.email || "",
        phone: aiResume.phone || "",
        location: aiResume.location || "",
        links: "", // AI doesn't generate links
        summary: aiResume.summary || "",
        education: (aiResume.education || []).map(e => [e.school, e.degree, e.duration].filter(Boolean).join(" | ")).join("\n"),
        skills: (aiResume.technical_skills || []).map(s => `${s.section}: ${s.items.join(", ")}`).join("\n"),
        experience: (aiResume.experience || []).map(exp => [`${exp.role || ""} | ${exp.company} | ${exp.duration || ""}`, ...exp.bullets.map(b => `- ${b}`)].join("\n")).join("\n\n"),
        projects: (aiResume.projects || []).map(p => [p.name, ...(p.bullets || []).map(b => `- ${b}`)].join("\n")).join("\n\n"),
        achievements: (aiResume.achievements || []).join("\n"),
        certifications: (aiResume.certifications || []).map(c => [c.name, c.issuer, c.year].filter(Boolean).join(" | ")).join("\n"),
      };
      
      console.log("New form data:", newForm);
      console.log("New form full_name:", newForm.full_name);
      console.log("New form summary:", newForm.summary);
      
      // Update form state
      setForm(newForm);
      
      // Show saving message
      alert("Resume generated! Now saving to database...");
      
      // Automatically save to database
      await saveResumeToDatabase(newForm);
      
      // Show success message
      alert("Resume generated and saved successfully! You can now view it or make edits.");
      
      // Force re-render by updating a dummy state
      setTimeout(() => {
        setForm(prev => ({ ...prev }));
      }, 50);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(`Failed to generate resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      saveGeminiApiKey(apiKey.trim());
      setShowApiKeyDialog(false);
      alert("API key saved successfully!");
    }
  };

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
      // Update profile skills_i_have
      const parsedSkills = mySkills
        .split(/[,\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
      if (parsedSkills.length > 0) {
        await updateProfile({ skills_i_have: parsedSkills as any });
      }
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
            <div className="flex items-center justify-between">
              <CardTitle>Build Your Resume</CardTitle>
              <div className="flex items-center gap-2">
                <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gemini API Key</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="api-key">Enter your Gemini API Key</Label>
                        <Input
                          id="api-key"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="AIza..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Google AI Studio</a>
                        </p>
                      </div>
                      <Button onClick={saveApiKey} className="w-full">Save API Key</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={generateWithAI} 
                  disabled={aiGenerating || !form.full_name.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    console.log("Testing manual form update...");
                    const testData = {
                      full_name: "Tejas",
                      headline: "Full Stack Developer & Software Engineer",
                      email: "tejas.email@example.com",
                      phone: "123-456-7890",
                      location: "Hyderabad, India",
                      links: "LinkedIn|https://linkedin.com/in/tejas\nGitHub|https://github.com/tejas",
                      summary: "Experienced software engineer with 3+ years in full-stack development, specializing in Python, JavaScript, React. Proven ability to deliver scalable solutions and work effectively in team environments. Seeking opportunities to contribute technical expertise to innovative projects.",
                      education: "University of California, Berkeley | Bachelor of Science in Computer Science | 2018 - 2022",
                      skills: "Programming Languages: Python, JavaScript, Java, SQL\nFrameworks & Tools: React, Node.js, Express.js, Django, Git, Docker\nOther Skills: AWS, MongoDB, PostgreSQL, Problem Solving, Team Collaboration",
                      experience: "Software Engineer | TechCorp Solutions | 2021 - Present\n- Developed scalable web applications using React and Node.js\n- Implemented microservices architecture, improving system performance by 40%\n- Collaborated with cross-functional teams to deliver new features\n- Mentored junior developers and maintained code quality standards\n\nFull Stack Developer | StartupXYZ | 2020 - 2021\n- Built RESTful APIs using Node.js and Express\n- Developed responsive frontend components with React\n- Implemented automated testing with Jest\n- Deployed applications on AWS using Docker",
                      projects: "E-Commerce Platform\n- Developed using React, Node.js, and MongoDB\n- Implemented secure payment integration with Stripe\n- Built real-time inventory tracking system\n\nAnalytics Dashboard\n- Created using Python and React\n- Implemented data visualization components\n- Integrated with multiple data sources via REST APIs",
                      achievements: "Won 'Best Innovation Award' at TechCrunch Disrupt 2023\nImproved application performance by 60% through optimization\nMentored junior developers with 100% promotion rate\nCompleted AWS Solutions Architect certification",
                      certifications: "AWS Certified Solutions Architect | Amazon Web Services | 2023\nCertified Scrum Master | Scrum Alliance | 2022"
                    };
                    
                    console.log("Setting test data:", testData);
                    setForm(testData);
                    
                    // Force re-render
                    setTimeout(() => {
                      setForm(prev => ({ ...prev }));
                      alert("Complete test data populated! Check all fields.");
                    }, 100);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Test Fill All
                </Button>
              </div>
            </div>
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
                <Label>My Skills (comma or line separated)</Label>
                <Textarea value={mySkills} onChange={e => setMySkills(e.target.value)} rows={3} />
                <p className="mt-1 text-xs text-slate-500">This also updates your profile’s skills.</p>
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


