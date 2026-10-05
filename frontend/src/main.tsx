import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimatePresence, motion} from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';

import {
  ArrowUpRight,
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Copy,
  Download,
  FileText,
  Gauge,
  Github,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Upload,
  UserRound,
  WandSparkles,
  X,
  Zap
} from 'lucide-react';

import './styles.css';

const API = 'http://localhost:8000';

type Page =
  | 'dashboard'
  | 'resume'
  | 'matcher'
  | 'optimizer'
  | 'builder'
  | 'skills';

const demoResume = `VISHAL TEKCHANDANI
Software Developer | Data Science & AI
Lucknow, India | vishal@example.com | github.com/vishal

SUMMARY
Computer Science graduate focused on data science, AI and full-stack product development.

SKILLS
Python, Java, SQL, React, Next.js, Node.js, FastAPI, MongoDB, Scikit-learn, TensorFlow, Git, AWS

EXPERIENCE
AI-ML Intern — Codec Technologies
Developed machine learning workflows, performed preprocessing and evaluated models using Python and Scikit-learn.

PROJECTS
Smart Resume System — Built an AI-powered resume analysis platform with semantic job matching and interactive analytics.
IntervAI — Developed an AI-powered interview preparation platform with personalized practice workflows.

EDUCATION
B.Tech Computer Science — Data Science & AI`;

const scoreHistory = [
  {name:'V1',score:62},
  {name:'V2',score:71},
  {name:'V3',score:78},
  {name:'V4',score:86},
  {name:'V5',score:91}
];

const skillData = [
  ['Python',95,'Programming'],
  ['Java',90,'Programming'],
  ['SQL',86,'Data'],
  ['React',91,'Frontend'],
  ['FastAPI',84,'Backend'],
  ['MongoDB',87,'Data'],
  ['Scikit-learn',92,'ML/AI'],
  ['TensorFlow',82,'ML/AI'],
  ['AWS',68,'Cloud']
];

function App(){

  const [page,setPage] = useState<Page>('dashboard');
  const [dark,setDark] = useState(true);
  const [mobile,setMobile] = useState(false);

  const [resume,setResume] = useState(
    () => localStorage.getItem('sr_resume') || ''
  );

  const [resumeName,setResumeName] = useState(
    () => localStorage.getItem('sr_resumeName') || 'No resume uploaded'
  );

  const [analysis,setAnalysis] = useState<any>(null);
  const [versions,setVersions] = useState<any[]>([]);

  const [jd,setJd] = useState(
    'We are looking for a Software Developer with Java, Python, SQL, AWS, Docker, REST APIs, Git, MongoDB and React experience.'
  );

  const [user,setUser] = useState(
    () => JSON.parse(
      localStorage.getItem('sr_user') ||
      '{"name":"Vishal Tekchandani","email":"vishal@example.com"}'
    )
  );

  const [token,setToken] = useState(
    () => localStorage.getItem('sr_token') || ''
  );

  const [authOpen,setAuthOpen] = useState(false);
  const [toast,setToast] = useState('');

  const notify = (s:string) => {
    setToast(s);
    window.setTimeout(() => setToast(''),2600);
  };

  const loadVersions = async () => {

    if(!token){
      notify('Sign in to view saved versions');
      return;
    }

    try{

      const r = await fetch(
        `${API}/api/resumes/versions`,
        {
          headers:{
            'Authorization':`Bearer ${token}`
          }
        }
      );

      if(!r.ok) throw new Error();

      const d = await r.json();

      setVersions(d.versions || []);

      setPage('resume');

      notify(
        `${(d.versions || []).length} saved versions loaded`
      );

    }catch{

      notify('Could not load versions');

    }
  };

  const saveVersion = async () => {

    if(!token){
      setAuthOpen(true);
      return;
    }

    try{

      const r = await fetch(
        `${API}/api/resumes/versions`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'Authorization':`Bearer ${token}`
          },
          body:JSON.stringify({
            name:resumeName,
            text:resume,
            score:analysis?.scores?.overall ?? 0
          })
        }
      );

      if(!r.ok) throw new Error();

      await loadVersions();

      notify('Resume version saved');

    }catch{

      notify(
        'Version could not be saved — check MongoDB settings'
      );

    }
  };

  const authenticate = async (
    mode:'login'|'register',
    name:string,
    email:string,
    password:string
  ) => {

    try{

      const r = await fetch(
        `${API}/api/auth/${mode}`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:
            mode === 'register'
              ? {name,email,password}
              : {email,password}
        }
      );

      if(!r.ok) throw new Error();

      const d = await r.json();

      setToken(d.token);
      setUser(d.user);

      localStorage.setItem(
        'sr_token',
        d.token
      );

      localStorage.setItem(
        'sr_user',
        JSON.stringify(d.user)
      );

      setAuthOpen(false);

      notify(
        mode === 'register'
          ? 'Account created'
          : 'Welcome back'
      );

    }catch{

      notify(
        'Auth unavailable — check the backend and credentials'
      );

    }
  };

  /*
   * REAL RESUME ANALYSIS
   *
   * The uploaded file is sent directly to FastAPI.
   * No score is generated on the frontend.
   */
  const analyze = async (file?:File) => {

    if(!file) return;

    setResumeName(file.name);

    const form = new FormData();

    form.append('file',file);

    try{

      notify('Analyzing your resume...');

      const r = await fetch(
        `${API}/api/resumes/analyze`,
        {
          method:'POST',
          body:form
        }
      );

      if(!r.ok){

        const errorText = await r.text();

        console.error(
          'Resume analysis error:',
          errorText
        );

        throw new Error(errorText);
      }

      const d = await r.json();

      console.log(
        'Resume analysis response:',
        d
      );

      if(!d.text){

        throw new Error(
          'Backend did not return extracted resume text'
        );
      }

      setResume(d.text);

      setAnalysis(d);

      localStorage.setItem(
        'sr_resume',
        d.text
      );

      localStorage.setItem(
        'sr_resumeName',
        file.name
      );

      const wordCount =
        d.word_count ??
        d.text.split(/\s+/).filter(Boolean).length;

      notify(
        `Parsed ${wordCount} words · score ${
          d.scores?.overall ?? 'N/A'
        }`
      );

      setPage('resume');

    }catch(error){

      console.error(
        'Resume analysis failed:',
        error
      );

      notify(
        'Resume analysis failed — check FastAPI and upload format'
      );
    }
  };

  /*
   * RE-ANALYZE CURRENT TEXT
   */
  const reanalyze = async () => {

    if(!resume.trim()){

      notify('Upload or enter a resume first');

      return;
    }

    try{

      notify('Re-analyzing resume...');

      const r = await fetch(
        `${API}/api/resumes/analyze-text`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            text:resume
          })
        }
      );

      if(!r.ok) throw new Error();

      const d = await r.json();

      console.log(
        'Re-analysis response:',
        d
      );

      setAnalysis(d);

      notify(
        `Analysis refreshed · score ${
          d.scores?.overall ?? 'N/A'
        }`
      );

    }catch(error){

      console.error(
        'Re-analysis failed:',
        error
      );

      notify('Re-analysis failed');

    }
  };

  return (
    <div className={dark ? 'app dark' : 'app light'}>

      <aside className={mobile ? 'sidebar open' : 'sidebar'}>

        <div className="brand">
          <div className="brandMark">
            <Sparkles size={18}/>
          </div>

          <span>
            SmartResume <em>AI</em>
          </span>
        </div>

        <div className="workspace">
          PERSONAL WORKSPACE
        </div>

        <nav>

          {[
            ['dashboard','Dashboard',LayoutDashboard],
            ['resume','Resume Lab',FileText],
            ['matcher','Job Match',Target],
            ['optimizer','AI Writer',WandSparkles],
            ['builder','Resume Builder',Layers3],
            ['skills','Skills Intel',Gauge]
          ].map(([id,label,Icon]) => (

            <button
              key={id as string}
              className={
                page === id
                  ? 'nav active'
                  : 'nav'
              }
              onClick={()=>{
                setPage(id as Page);
                setMobile(false);
              }}
            >

              <Icon size={18}/>

              <span>
                {label as string}
              </span>

              {id === 'matcher' &&
                <b className="navBadge">
                  87%
                </b>
              }

            </button>

          ))}

        </nav>

        <div className="sidebarBottom">

          <div className="upgrade">

            <div className="upgradeIcon">
              <Zap size={15}/>
            </div>

            <div>
              <b>AI Pro tools</b>
              <span>Semantic analysis enabled</span>
            </div>

            <ChevronRight size={15}/>

          </div>

          <button
            className="nav"
            onClick={() =>
              notify(
                'Settings are available in your workspace preferences'
              )
            }
          >
            <Settings size={18}/>
            <span>Settings</span>
          </button>

          <button
            className="profile"
            onClick={() => setAuthOpen(true)}
          >

            <div className="avatar">
              VT
            </div>

            <div className="profileText">

              <b>
                {user.name}
              </b>

              <span>
                {token
                  ? 'MongoDB account'
                  : 'Demo account · sign in'}
              </span>

            </div>

            <UserRound size={16}/>

          </button>

        </div>

      </aside>

      <main className="main">

        <header className="topbar">

          <button
            className="iconBtn mobileOnly"
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={20}/>
          </button>

          <div className="crumb">

            <span>
              Workspace
            </span>

            <ChevronRight size={14}/>

            <b>
              {pageLabel(page)}
            </b>

          </div>

          <div className="topActions">

            <button className="iconBtn">
              <Bell size={18}/>
              <i className="dot"/>
            </button>

            <button
              className="iconBtn"
              onClick={() => setDark(!dark)}
            >
              {dark
                ? <Sun size={18}/>
                : <Moon size={18}/>
              }
            </button>

            <button
              className="uploadBtn"
              onClick={() =>
                document
                  .getElementById('resumeInput')
                  ?.click()
              }
            >
              <Upload size={16}/>
              Upload resume
            </button>

            <input
              id="resumeInput"
              hidden
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={e =>
                analyze(
                  e.target.files?.[0]
                )
              }
            />

          </div>

        </header>

        <AnimatePresence mode="wait">

          <motion.div
            className="page"
            key={page}
            initial={{
              opacity:0,
              y:8
            }}
            animate={{
              opacity:1,
              y:0
            }}
            exit={{
              opacity:0,
              y:-6
            }}
            transition={{
              duration:.18
            }}
          >

            {page === 'dashboard' &&
              <Dashboard
                setPage={setPage}
                resumeName={resumeName}
                notify={notify}
                analysis={analysis}
              />
            }

            {page === 'resume' &&
              <ResumeLab
                resume={resume}
                setResume={(v)=>{
                  setResume(v);
                  localStorage.setItem(
                    'sr_resume',
                    v
                  );
                }}
                resumeName={resumeName}
                notify={notify}
                onSave={saveVersion}
                onReanalyze={reanalyze}
                analysis={analysis}
                versions={versions}
                onLoadVersions={loadVersions}
              />
            }

            {page === 'matcher' &&
              <Matcher
                jd={jd}
                setJd={setJd}
                resume={resume}
                notify={notify}
              />
            }

            {page === 'optimizer' &&
              <Optimizer
                notify={notify}
                resume={resume}
                setResume={(v)=>{
                  setResume(v);
                  localStorage.setItem(
                    'sr_resume',
                    v
                  );
                }}
              />
            }

            {page === 'builder' &&
              <Builder
                resume={resume}
                notify={notify}
              />
            }

            {page === 'skills' &&
              <Skills/>
            }

          </motion.div>

        </AnimatePresence>

      </main>

      {authOpen &&
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuth={authenticate}
        />
      }

      {toast &&
        <motion.div
          initial={{
            opacity:0,
            y:16
          }}
          animate={{
            opacity:1,
            y:0
          }}
          className="toast"
        >
          <CheckCircle2 size={16}/>
          {toast}
        </motion.div>
      }

    </div>
  );
}


/* =========================
   DASHBOARD
========================= */

function Dashboard({
  setPage,
  resumeName,
  notify,
  analysis
}:{
  setPage:(p:Page)=>void,
  resumeName:string,
  notify:(s:string)=>void,
  analysis:any
}){

  const overall =
    analysis?.scores?.overall;

  const ats =
    analysis?.scores?.ats;

  const skillsCount =
    analysis?.skills?.length;

  const metrics =
    analysis?.metrics_detected;

  return <>

    <PageTitle
      eyebrow="RESUME INTELLIGENCE"
      title="Your career workspace, at a glance."
      desc="Analyze, tailor and improve your resume with AI-powered signals built for modern hiring workflows."
      action={
        <button
          className="primary"
          onClick={() => setPage('builder')}
        >
          <Plus size={16}/>
          Build a resume
        </button>
      }
    />

    <div className="stats">

      <Stat
        label="Resume score"
        value={
          overall != null
            ? `${overall} / 100`
            : '—'
        }
        delta={
          overall != null
            ? 'Current resume analysis'
            : 'Upload a resume'
        }
        icon={Sparkles}
      />

      <Stat
        label="ATS compatibility"
        value={
          ats != null
            ? `${ats}%`
            : '—'
        }
        delta={
          ats != null
            ? 'Based on current resume'
            : 'Waiting for analysis'
        }
        icon={ShieldCheck}
      />

      <Stat
        label="Skills detected"
        value={
          skillsCount != null
            ? `${skillsCount}`
            : '—'
        }
        delta={
          skillsCount != null
            ? 'Extracted from resume'
            : 'Waiting for analysis'
        }
        icon={Target}
      />

      <Stat
        label="Metrics detected"
        value={
          metrics != null
            ? `${metrics}`
            : '—'
        }
        delta={
          metrics != null
            ? 'Evidence in resume'
            : 'Waiting for analysis'
        }
        icon={FileText}
      />

    </div>

    <div className="heroGrid">

      <section className="panel scorePanel">

        <div className="panelHead">

          <div>

            <h3>
              Resume health
            </h3>

            <p>
              Overall quality across content,
              ATS and presentation.
            </p>

          </div>

          <span
            className={
              overall != null && overall >= 80
                ? 'chip green'
                : 'chip'
            }
          >
            {
              overall != null
                ? overall >= 80
                  ? 'Excellent'
                  : overall >= 60
                    ? 'Good'
                    : 'Needs improvement'
                : 'Not analyzed'
            }
          </span>

        </div>

        <div className="scoreRing">

          <div>

            <b>
              {overall ?? '—'}
            </b>

            <span>
              /100
            </span>

          </div>

        </div>

        <div className="scoreLegend">

          <ScoreRow
            name="ATS compatibility"
            value={ats ?? 0}
          />

          <ScoreRow
            name="Content impact"
            value={
              analysis?.scores?.content ?? 0
            }
          />

          <ScoreRow
            name="Skills evidence"
            value={
              analysis?.scores?.skills ?? 0
            }
          />

          <ScoreRow
            name="Formatting"
            value={
              analysis?.scores?.formatting ?? 0
            }
          />

        </div>

      </section>

      <section className="panel trendPanel">

        <div className="panelHead">

          <div>

            <h3>
              Current analysis
            </h3>

            <p>
              {resumeName}
            </p>

          </div>

          <button
            className="iconBtn"
            onClick={() => setPage('resume')}
          >
            <ArrowUpRight size={16}/>
          </button>

        </div>

        {analysis ? (

          <div
            style={{
              padding:'30px 10px',
              textAlign:'center'
            }}
          >

            <div
              style={{
                fontSize:48,
                fontWeight:800
              }}
            >
              {overall}
            </div>

            <div
              style={{
                opacity:.65,
                marginTop:8
              }}
            >
              Current resume score
            </div>

            <button
              className="primary"
              style={{
                marginTop:24
              }}
              onClick={() =>
                setPage('resume')
              }
            >
              View full analysis
              <ArrowUpRight size={15}/>
            </button>

          </div>

        ) : (

          <div
            style={{
              padding:'45px 20px',
              textAlign:'center',
              opacity:.7
            }}
          >

            <FileText size={36}/>

            <p>
              Upload a resume to generate
              your personalized analysis.
            </p>

            <button
              className="primary"
              onClick={() =>
                document
                  .getElementById('resumeInput')
                  ?.click()
              }
            >
              <Upload size={15}/>
              Upload resume
            </button>

          </div>

        )}

      </section>

    </div>

    <div className="grid3">

      <Insight
        icon={Target}
        title="Improve job alignment"
        text={
          analysis
            ? "Compare your resume against a real job description."
            : "Upload your resume first, then compare it against a job description."
        }
        action="Open job match"
        onClick={() => setPage('matcher')}
      />

      <Insight
        icon={Lightbulb}
        title="Improve your bullets"
        text="Use AI Writer to strengthen your resume bullets without fabricating experience."
        action="Open AI writer"
        onClick={() => setPage('optimizer')}
      />

      <Insight
        icon={Layers3}
        title="Polish your layout"
        text="Use the live builder to create a cleaner recruiter-ready PDF."
        action="Open builder"
        onClick={() => setPage('builder')}
      />

    </div>

  </>;
}


/* =========================
   COMMON COMPONENTS
========================= */

function pageLabel(p:Page){

  return ({
    dashboard:'Overview',
    resume:'Resume Lab',
    matcher:'Job Match',
    optimizer:'AI Writer',
    builder:'Resume Builder',
    skills:'Skills Intelligence'
  }[p]);

}

function PageTitle({
  eyebrow,
  title,
  desc,
  action
}:{
  eyebrow:string,
  title:string,
  desc:string,
  action?:React.ReactNode
}){

  return (
    <div className="pageTitle">

      <div>

        <div className="eyebrow">
          {eyebrow}
        </div>

        <h1>
          {title}
        </h1>

        <p>
          {desc}
        </p>

      </div>

      {action}

    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  icon:Icon
}:{
  label:string,
  value:string,
  delta:string,
  icon:any
}){

  return (
    <div className="stat">

      <div className="statIcon">
        <Icon size={17}/>
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {delta}
        </small>

      </div>

    </div>
  );
}


/* =========================
   RESUME LAB
========================= */

function ResumeLab({
  resume,
  setResume,
  resumeName,
  notify,
  onSave,
  onReanalyze,
  analysis,
  versions,
  onLoadVersions
}:{
  resume:string,
  setResume:(s:string)=>void,
  resumeName:string,
  notify:(s:string)=>void,
  onSave:()=>void,
  onReanalyze:()=>void,
  analysis:any,
  versions:any[],
  onLoadVersions:()=>void
}){

  const sections = [
    'contact',
    'summary',
    'skills',
    'experience',
    'projects',
    'education'
  ];

  return <>

    <PageTitle
      eyebrow="RESUME LAB"
      title="Parse, inspect and improve every section."
      desc="Your uploaded document becomes editable intelligence: sections, skills, metrics and recommendations are surfaced automatically."
      action={
        <div className="actions">

          <button
            className="secondary"
            onClick={onLoadVersions}
          >
            <ClockIcon/>
            Version history
          </button>

          <button
            className="primary"
            onClick={onReanalyze}
          >
            <RefreshIcon/>
            Re-analyze
          </button>

        </div>
      }
    />

    <div className="resumeHero">

      <div className="fileBadge">
        <FileText size={22}/>
      </div>

      <div>

        <b>
          {resumeName}
        </b>

        <span>
          {analysis
            ? `Parsed · ${
                resume
                  .split(/\s+/)
                  .filter(Boolean)
                  .length
              } words`
            : 'Upload a resume to analyze'}
        </span>

      </div>

      <div className="fileScore">

        <small>
          AI SCORE
        </small>

        <strong>
          {analysis?.scores?.overall ?? '—'}
        </strong>

      </div>

    </div>

    <div className="grid2">

      <section className="panel parser">

        <div className="panelHead">

          <div>

            <h3>
              Document intelligence
            </h3>

            <p>
              Detected structure and evidence
            </p>

          </div>

          <span className="chip">
            {analysis ? 'Live' : 'Waiting'}
          </span>

        </div>

        <div className="sectionGrid">

          {sections.map((s,i) => (

            <div
              className="sectionCard"
              key={s}
            >

              <div className="sectionCheck">
                <Check size={13}/>
              </div>

              <div>

                <b>
                  {s[0].toUpperCase()+s.slice(1)}
                </b>

                <small>

                  {!analysis
                    ? 'Waiting'
                    : s === 'skills'
                      ? `${analysis.skills?.length ?? 0} skills`
                      : s === 'experience'
                        ? `${analysis.experience?.length ?? 0} roles`
                        : s === 'projects'
                          ? `${analysis.projects?.length ?? 0} projects`
                          : 'Detected'}

                </small>

              </div>

              <ChevronRight size={14}/>

            </div>

          ))}

        </div>

        <div className="miniMetrics">

          <div>
            <b>
              {analysis?.action_verbs ?? '—'}
            </b>
            <span>
              Action verbs
            </span>
          </div>

          <div>
            <b>
              {analysis?.metrics_detected ?? '—'}
            </b>
            <span>
              Metrics
            </span>
          </div>

          <div>
            <b>
              {analysis?.skills?.length ?? '—'}
            </b>
            <span>
              Skills
            </span>
          </div>

        </div>

      </section>

      <section className="panel editor">

        <div className="panelHead">

          <div>

            <h3>
              Live extracted text
            </h3>

            <p>
              Make edits before generating
              your next version.
            </p>

          </div>

          <button
            className="iconBtn"
            onClick={() => {

              navigator.clipboard?.writeText(resume);

              notify('Resume copied');

            }}
          >
            <Copy size={15}/>
          </button>

        </div>

        <textarea
          value={resume}
          onChange={e =>
            setResume(e.target.value)
          }
          placeholder="Upload a resume or paste resume text here..."
        />

        <div className="editorFoot">

          <span>
            {resume
              .split(/\s+/)
              .filter(Boolean)
              .length
            } words
          </span>

          <button
            className="primary"
            onClick={onSave}
            disabled={!resume.trim()}
          >
            <Sparkles size={15}/>
            Save version
          </button>

        </div>

      </section>

      <section className="panel">

        <div className="panelHead">

          <div>

            <h3>
              Live analysis
            </h3>

            <p>
              Calculated from the current resume text.
            </p>

          </div>

          <span className="chip green">

            {analysis?.scores?.overall ?? '—'}
            {' / 100'}

          </span>

        </div>

        <div className="stats compact">

          <Stat
            label="ATS"
            value={
              analysis?.scores?.ats != null
                ? `${analysis.scores.ats}%`
                : '—'
            }
            delta="compatibility"
            icon={ShieldCheck}
          />

          <Stat
            label="Skills"
            value={
              analysis?.skills?.length != null
                ? `${analysis.skills.length}`
                : '—'
            }
            delta="detected"
            icon={BrainCircuit}
          />

          <Stat
            label="Metrics"
            value={
              analysis?.metrics_detected != null
                ? `${analysis.metrics_detected}`
                : '—'
            }
            delta="detected"
            icon={Target}
          />

        </div>

        {versions.length > 0 &&
          <div className="versionList">

            {versions.map(v => (

              <div
                className="rec"
                key={v.id}
              >

                <div className="lift">
                  {v.score}
                </div>

                <div>

                  <b>
                    {v.name}
                  </b>

                  <p>
                    {new Date(
                      v.created_at
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

            ))}

          </div>
        }

      </section>

    </div>

    <section className="panel recommendations">

      <div className="panelHead">

        <div>

          <h3>
            AI recommendations
          </h3>

          <p>
            Prioritized by expected impact
          </p>

        </div>

        <span className="chip green">
          AI powered
        </span>

      </div>

      <div className="recommendList">

        <Rec
          num="+5"
          title="Add 3 quantified achievements"
          text="Turn responsibilities into outcomes with measurable scale, time, accuracy or adoption."
        />

        <Rec
          num="+3"
          title="Strengthen project bullets"
          text="Lead with action, name the technology, then explain what changed because of your work."
        />

        <Rec
          num="+2"
          title="Add deployment evidence"
          text="Mention API deployment, cloud hosting or CI/CD only where you genuinely used it."
        />

      </div>

    </section>

  </>;
}


/* =========================
   MATCHER
========================= */

function Matcher({
  jd,
  setJd,
  resume,
  notify
}:{
  jd:string,
  setJd:(s:string)=>void,
  resume:string,
  notify:(s:string)=>void
}){

  const [role,setRole] =
    useState('Software Developer');

  const [loading,setLoading] =
    useState(false);

  const [result,setResult] =
    useState({
      score:87,
      matched:[
        'Java',
        'Python',
        'SQL',
        'REST APIs',
        'Git',
        'MongoDB',
        'React'
      ],
      missing:[
        'AWS',
        'Docker'
      ]
    });

  const skills = [
    ...result.matched,
    ...result.missing
  ];

  const run = async () => {

    setLoading(true);

    try{

      const r = await fetch(
        `${API}/api/jobs/match`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            resume,
            job_description:jd
          })
        }
      );

      if(r.ok){

        const d = await r.json();

        setResult({
          score:d.score,
          matched:d.matched,
          missing:d.missing
        });

        notify(
          'Semantic job match completed'
        );

      }else{

        throw new Error();

      }

    }catch{

      notify(
        'Job matching failed — check the backend'
      );

    }finally{

      setLoading(false);

    }
  };

  return <>

    <PageTitle
      eyebrow="SEMANTIC JOB MATCH"
      title="See how closely your resume fits."
      desc="Compare meaning, skills and evidence against a real job description using embedding-based similarity."
      action={
        <button
          className="primary"
          onClick={run}
          disabled={loading || !resume.trim()}
        >
          <Sparkles size={16}/>
          {loading
            ? 'Analyzing…'
            : 'Run semantic match'}
        </button>
      }
    />

    <div className="matchBanner">

      <div>

        <span>
          Target role
        </span>

        <input
          value={role}
          onChange={e =>
            setRole(e.target.value)
          }
        />

      </div>

      <div className="matchScore">

        <small>
          FIT SCORE
        </small>

        <strong>
          {result.score}%
        </strong>

        <span>
          {result.score > 80
            ? 'Strong fit'
            : 'Needs work'}
        </span>

      </div>

    </div>

    <div className="grid2">

      <section className="panel jdPanel">

        <div className="panelHead">

          <div>

            <h3>
              Job description
            </h3>

            <p>
              Paste the complete job post
              for richer semantic matching.
            </p>

          </div>

          <button
            className="textBtn"
            onClick={() =>
              setJd(
                'We are looking for a Software Developer with Java, Python, SQL, AWS, Docker, REST APIs, Git, MongoDB and React experience.'
              )
            }
          >
            Load example
          </button>

        </div>

        <textarea
          value={jd}
          onChange={e =>
            setJd(e.target.value)
          }
        />

        <div className="keywordCount">

          <span>
            <Search size={14}/>
            {jd
              .split(/\s+/)
              .filter(Boolean)
              .length
            } words
          </span>

          <span>
            Embedding model: configured
          </span>

        </div>

      </section>

      <section className="panel coverage">

        <div className="panelHead">

          <div>

            <h3>
              Evidence map
            </h3>

            <p>
              Semantic coverage across
              priority requirements
            </p>

          </div>

          <span className="chip green">
            {result.matched.length}
            {' matched'}
          </span>

        </div>

        <div className="coverageGrid">

          {skills.map(s => (

            <div
              className="coverageItem"
              key={s}
            >

              <span
                className={
                  result.matched.includes(s)
                    ? 'checkCircle'
                    : 'warnCircle'
                }
              >
                {
                  result.matched.includes(s)
                    ? <Check size={12}/>
                    : <X size={12}/>
                }
              </span>

              <div>

                <b>
                  {s}
                </b>

                <small>
                  {
                    result.matched.includes(s)
                      ? 'Evidence found'
                      : 'Gap detected'
                  }
                </small>

              </div>

              <span
                className={
                  result.matched.includes(s)
                    ? 'matchWord'
                    : 'missingWord'
                }
              >
                {
                  result.matched.includes(s)
                    ? 'MATCH'
                    : 'GAP'
                }
              </span>

            </div>

          ))}

        </div>

      </section>

    </div>

  </>;
}


/* =========================
   OPTIMIZER
========================= */

function Optimizer({
  notify,
  resume,
  setResume
}:{
  notify:(s:string)=>void,
  resume:string,
  setResume:(s:string)=>void
}){

  const [input,setInput] =
    useState(
      'Worked on a machine learning project for predicting hotel booking cancellations.'
    );

  const [tone,setTone] =
    useState('Impact');

  const [suggestions,setSuggestions] =
    useState<string[]>([]);

  const [loading,setLoading] =
    useState(false);

  const run = async () => {

    if(!input.trim()){

      notify('Enter a bullet first');

      return;
    }

    setLoading(true);

    try{

      const r = await fetch(
        `${API}/api/ai/optimize`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            text:input,
            tone
          })
        }
      );

      if(!r.ok)
        throw new Error();

      const d = await r.json();

      setSuggestions(
        d.suggestions || []
      );

      notify(
        'AI optimization complete'
      );

    }catch{

      notify(
        'AI optimization failed — check backend configuration'
      );

    }finally{

      setLoading(false);

    }
  };

  return <>

    <PageTitle
      eyebrow="AI WRITER"
      title="Turn rough bullets into recruiter-ready evidence."
      desc="Use an LLM to improve clarity, technical specificity and impact while keeping the underlying experience truthful."
      action={
        <span className="aiPill">
          <BrainCircuit size={15}/>
          LLM connected
        </span>
      }
    />

    <div className="optimizerGrid">

      <section className="panel optimizeInput">

        <div className="panelHead">

          <div>

            <h3>
              Original bullet
            </h3>

            <p>
              One bullet at a time produces cleaner edits.
            </p>

          </div>

          <span className="counter">
            {input.length}/240
          </span>

        </div>

        <textarea
          maxLength={240}
          value={input}
          onChange={e =>
            setInput(e.target.value)
          }
        />

        <div className="tone">

          <span>
            Goal
          </span>

          {[
            'Impact',
            'Technical',
            'Concise'
          ].map(t => (

            <button
              className={
                tone === t
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setTone(t)
              }
              key={t}
            >
              {t}
            </button>

          ))}

        </div>

        <button
          className="primary wide"
          onClick={run}
          disabled={loading}
        >
          <Sparkles size={16}/>
          {loading
            ? 'Optimizing…'
            : 'Optimize with AI'}
        </button>

      </section>

      <section className="panel suggestionPanel">

        <div className="panelHead">

          <div>

            <h3>
              Suggested versions
            </h3>

            <p>
              Generated from your original content
            </p>

          </div>

          <span className="chip green">
            {suggestions.length} options
          </span>

        </div>

        {suggestions.length === 0 && (

          <div
            style={{
              padding:30,
              opacity:.6,
              textAlign:'center'
            }}
          >
            Enter a bullet and click
            "Optimize with AI".
          </div>

        )}

        {suggestions.map((s,i) => (

          <div
            className="suggestion"
            key={`${s}-${i}`}
          >

            <div className="suggestionTop">

              <span>
                VERSION {i+1}
              </span>

              <div>

                <button
                  className="iconBtn"
                  onClick={() => {

                    navigator.clipboard?.writeText(s);

                    notify(
                      'Suggestion copied'
                    );

                  }}
                >
                  <Copy size={14}/>
                </button>

                <button
                  className="iconBtn"
                  onClick={() => {

                    const next =
                      resume.includes(input)
                        ? resume.replace(input,s)
                        : resume + '\n' + s;

                    setResume(next);

                    notify(
                      'Applied to current resume'
                    );

                  }}
                >
                  <Check size={14}/>
                </button>

              </div>

            </div>

            <p>
              {s}
            </p>

            <div className="bulletMeta">

              <span>
                <CheckCircle2 size={13}/>
                Action verb
              </span>

              <span>
                <CheckCircle2 size={13}/>
                Technology
              </span>

              <span>
                <CheckCircle2 size={13}/>
                Outcome context
              </span>

            </div>

          </div>

        ))}

      </section>

    </div>

    <div className="grid3">

      <InfoCard
        icon={Zap}
        title="Action + tech + outcome"
        text="The strongest bullets explain what you did, how you did it and why it mattered."
      />

      <InfoCard
        icon={ShieldCheck}
        title="Truth guardrail"
        text="The assistant should never fabricate metrics, tools, employers or responsibilities."
      />

      <InfoCard
        icon={Target}
        title="Job-aware writing"
        text="Run a job match first to prioritize the keywords your target role actually values."
      />

    </div>

  </>;
}


/* =========================
   BUILDER
========================= */

function Builder({
  resume,
  notify
}:{
  resume:string,
  notify:(s:string)=>void
}){

  const [template,setTemplate] =
    useState('Modern');

  const [accent,setAccent] =
    useState('#7c5cff');

  const [name,setName] =
    useState('Vishal Tekchandani');

  const [title,setTitle] =
    useState(
      'Software Developer · Data Science & AI'
    );

  const download = async () => {

    if(!resume.trim()){

      notify(
        'Upload a resume before exporting'
      );

      return;
    }

    const {jsPDF} =
      await import('jspdf');

    const doc =
      new jsPDF({
        unit:'pt',
        format:'a4'
      });

    let y = 52;

    doc.setTextColor(
      25,
      25,
      35
    );

    doc.setFontSize(22);

    doc.text(
      name,
      44,
      y
    );

    y += 22;

    doc.setFontSize(10);

    doc.setTextColor(accent);

    doc.text(
      title,
      44,
      y
    );

    y += 20;

    doc.setTextColor(
      50,
      50,
      60
    );

    doc.setFontSize(9);

    doc.text(
      'Lucknow, India  ·  github.com/vishal  ·  vishal@example.com',
      44,
      y
    );

    y += 25;

    for(
      const section of [
        'SUMMARY',
        'SKILLS',
        'EXPERIENCE',
        'PROJECTS',
        'EDUCATION'
      ]
    ){

      doc.setTextColor(accent);

      doc.setFontSize(9);

      doc.text(
        section,
        44,
        y
      );

      y += 13;

      doc.setTextColor(
        55,
        55,
        65
      );

      doc.setFontSize(9);

      const source =
        resume.split(
          new RegExp(
            `\\n${section}\\n`,
            'i'
          )
        )[1] || '';

      const block =
        source.split(
          /\n[A-Z][A-Z ]+\n/
        )[0] || source;

      const wrapped =
        doc.splitTextToSize(
          block.replace(/\n+/g,'  '),
          510
        );

      doc.text(
        wrapped,
        44,
        y
      );

      y +=
        wrapped.length * 11 +
        18;

      if(y > 770){

        doc.addPage();

        y = 52;

      }
    }

    doc.save(
      'Vishal_Tekchandani_Resume.pdf'
    );

    notify(
      'Recruiter-ready PDF downloaded'
    );
  };

  return <>

    <PageTitle
      eyebrow="LIVE RESUME BUILDER"
      title="Design, edit and export in one flow."
      desc="A clean recruiter-first builder with live preview, version-ready content and PDF export."
      action={
        <button
          className="primary"
          onClick={download}
        >
          <Download size={16}/>
          Export PDF
        </button>
      }
    />

    <div className="builder">

      <section className="panel builderControls">

        <div className="panelHead">

          <div>

            <h3>
              Design controls
            </h3>

            <p>
              Changes appear instantly in the preview.
            </p>

          </div>

        </div>

        <label>
          Full name
          <input
            value={name}
            onChange={e =>
              setName(e.target.value)
            }
          />
        </label>

        <label>
          Professional title
          <input
            value={title}
            onChange={e =>
              setTitle(e.target.value)
            }
          />
        </label>

        <label>
          Template

          <div className="templateRow">

            {[
              'Modern',
              'Minimal',
              'Executive'
            ].map(t => (

              <button
                className={
                  template === t
                    ? 'template active'
                    : 'template'
                }
                key={t}
                onClick={() =>
                  setTemplate(t)
                }
              >
                {t}
              </button>

            ))}

          </div>

        </label>

        <label>
          Accent color

          <div className="colorRow">

            {[
              '#7c5cff',
              '#10b981',
              '#0ea5e9',
              '#f97316'
            ].map(c => (

              <button
                key={c}
                className={
                  accent === c
                    ? 'color active'
                    : 'color'
                }
                style={{
                  background:c
                }}
                onClick={() =>
                  setAccent(c)
                }
              />

            ))}

          </div>

        </label>

        <div className="builderChecklist">

          <b>
            <Check size={14}/>
            ATS-safe layout
          </b>

          <span>
            <Check size={14}/>
            One-page friendly
          </span>

          <span>
            <Check size={14}/>
            Selectable PDF text
          </span>

          <span>
            <Check size={14}/>
            Recruiter-first hierarchy
          </span>

        </div>

      </section>

      <section className="resumeCanvas">

        <div
          className="paper"
          style={{
            borderTopColor:accent
          }}
        >

          <div className="paperTop">

            <h2>
              {name}
            </h2>

            <p style={{
              color:accent
            }}>
              {title}
            </p>

            <small>
              Lucknow, India ·
              vishal@example.com ·
              github.com/vishal
            </small>

          </div>

          {[
            'SUMMARY',
            'SKILLS',
            'EXPERIENCE',
            'PROJECTS',
            'EDUCATION'
          ].map(s => (

            <div
              className="paperSection"
              key={s}
            >

              <h4 style={{
                color:accent
              }}>
                {s}
              </h4>

              <p>
                {previewSection(
                  resume,
                  s
                )}
              </p>

            </div>

          ))}

        </div>

      </section>

    </div>

  </>;
}


/* =========================
   SKILLS
========================= */

function Skills(){

  const [q,setQ] =
    useState('');

  const filtered =
    skillData.filter(
      ([n]) =>
        (n as string)
          .toLowerCase()
          .includes(q.toLowerCase())
    );

  return <>

    <PageTitle
      eyebrow="SKILLS INTELLIGENCE"
      title="See the capabilities your resume signals."
      desc="Evidence strength, category breadth and gaps are presented as an interactive skills inventory."
      action={
        <button className="secondary">
          <Download size={16}/>
          Export report
        </button>
      }
    />

    <div className="skillOverview">

      <section className="panel skillScore">

        <div className="eyebrow">
          PROFILE DEPTH
        </div>

        <div className="scoreNumber">
          84<span>%</span>
        </div>

        <p>
          Upload and analyze a resume
          to build a personalized skills profile.
        </p>

        <div className="skillTrend">
          <ArrowUpRight size={14}/>
          Dynamic skills analysis available
        </div>

      </section>

      <section className="panel skillChart">

        <ResponsiveContainer
          width="100%"
          height={220}
        >

          <AreaChart
            data={[
              {
                n:'Programming',
                v:92
              },
              {
                n:'Web',
                v:90
              },
              {
                n:'Backend',
                v:84
              },
              {
                n:'Data',
                v:87
              },
              {
                n:'ML/AI',
                v:86
              },
              {
                n:'Cloud',
                v:68
              }
            ]}
          >

            <XAxis
              dataKey="n"
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              hide
              domain={[0,100]}
            />

            <Tooltip
              contentStyle={{
                background:'#111827',
                border:'1px solid #293247',
                borderRadius:10
              }}
            />

            <Area
              type="monotone"
              dataKey="v"
              strokeWidth={3}
              fillOpacity={.13}
            />

          </AreaChart>

        </ResponsiveContainer>

      </section>

    </div>

    <section className="panel">

      <div className="panelHead">

        <div>

          <h3>
            Skill inventory
          </h3>

          <p>
            Search and inspect the evidence behind each score.
          </p>

        </div>

        <div className="searchBox">

          <Search size={15}/>

          <input
            value={q}
            onChange={e =>
              setQ(e.target.value)
            }
            placeholder="Search skills..."
          />

        </div>

      </div>

      <div className="skillsTable">

        {filtered.map(
          ([name,v,cat]) => (

            <div
              className="skillLine"
              key={name as string}
            >

              <div className="skillName">

                <span className="skillIcon">

                  {cat === 'Programming'
                    ? <Code2 size={15}/>
                    : cat === 'Data'
                      ? <Cloud size={15}/>
                      : cat === 'Frontend'
                        ? <Layers3 size={15}/>
                        : <BrainCircuit size={15}/>
                  }

                </span>

                <div>

                  <b>
                    {name as string}
                  </b>

                  <small>
                    {cat as string}
                  </small>

                </div>

              </div>

              <div className="skillProgress">

                <i
                  style={{
                    width:`${v}%`
                  }}
                />

              </div>

              <strong>
                {v}%
              </strong>

            </div>

          )
        )}

      </div>

    </section>

  </>;
}


/* =========================
   HELPERS
========================= */

function ScoreRow({
  name,
  value
}:{
  name:string,
  value:number
}){

  return (
    <div className="scoreRow">

      <span>
        {name}
      </span>

      <div className="progress">

        <i
          style={{
            width:`${value}%`
          }}
        />

      </div>

      <b>
        {value}
      </b>

    </div>
  );
}

function Insight({
  icon:Icon,
  title,
  text,
  action,
  onClick
}:{
  icon:any,
  title:string,
  text:string,
  action:string,
  onClick:()=>void
}){

  return (
    <section className="panel insight">

      <div className="insightIcon">
        <Icon size={18}/>
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

      <button onClick={onClick}>
        {action}
        <ArrowUpRight size={14}/>
      </button>

    </section>
  );
}

function Rec({
  num,
  title,
  text
}:{
  num:string,
  title:string,
  text:string
}){

  return (
    <div className="rec">

      <div className="lift">
        {num}
      </div>

      <div>

        <b>
          {title}
        </b>

        <p>
          {text}
        </p>

      </div>

      <ArrowUpRight size={15}/>

    </div>
  );
}

function InfoCard({
  icon:Icon,
  title,
  text
}:{
  icon:any,
  title:string,
  text:string
}){

  return (
    <section className="panel infoCard">

      <div className="bigIcon">
        <Icon size={19}/>
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </section>
  );
}

function Gap({
  name,
  level,
  text
}:{
  name:string,
  level:string,
  text:string
}){

  return (
    <div className="gap">

      <div className="gapIcon">
        <Cloud size={16}/>
      </div>

      <div>

        <b>
          {name}
        </b>

        <p>
          {text}
        </p>

      </div>

      <span>
        {level}
      </span>

    </div>
  );
}

function previewSection(
  text:string,
  section:string
){

  if(!text.trim())
    return 'Upload a resume to populate this section.';

  const parts =
    text.split(
      new RegExp(
        `\\n${section}\\n`,
        'i'
      )
    );

  if(parts.length < 2)
    return 'Section not detected in current resume.';

  return (
    parts[1] || ''
  )
    .split(
      /\n[A-Z][A-Z ]+\n/
    )[0]
    .slice(0,620);
}


/* =========================
   AUTH
========================= */

function AuthModal({
  onClose,
  onAuth
}:{
  onClose:()=>void,
  onAuth:(
    mode:'login'|'register',
    name:string,
    email:string,
    password:string
  )=>void
}){

  const [mode,setMode] =
    useState<'login'|'register'>(
      'login'
    );

  const [name,setName] =
    useState('Vishal Tekchandani');

  const [email,setEmail] =
    useState('vishal@example.com');

  const [password,setPassword] =
    useState('password123');

  return (

    <div className="modalBack">

      <motion.div
        initial={{
          opacity:0,
          y:12,
          scale:.98
        }}
        animate={{
          opacity:1,
          y:0,
          scale:1
        }}
        className="authModal"
      >

        <button
          className="iconBtn close"
          onClick={onClose}
        >
          <X size={17}/>
        </button>

        <div className="authLogo">
          <Sparkles size={18}/>
        </div>

        <div className="eyebrow">
          SMARTRESUME ACCOUNT
        </div>

        <h2>
          {mode === 'login'
            ? 'Welcome back'
            : 'Create your workspace account'}
        </h2>

        <p>
          Save resume versions, analysis
          history and your profile to MongoDB.
        </p>

        {mode === 'register' && (

          <label>
            Name

            <input
              value={name}
              onChange={e =>
                setName(e.target.value)
              }
            />

          </label>

        )}

        <label>
          Email

          <input
            type="email"
            value={email}
            onChange={e =>
              setEmail(e.target.value)
            }
          />

        </label>

        <label>
          Password

          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value)
            }
          />

        </label>

        <button
          className="primary authSubmit"
          onClick={() =>
            onAuth(
              mode,
              name,
              email,
              password
            )
          }
        >
          {mode === 'login'
            ? 'Sign in'
            : 'Create account'}
        </button>

        <button
          className="switchAuth"
          onClick={() =>
            setMode(
              mode === 'login'
                ? 'register'
                : 'login'
            )
          }
        >
          {mode === 'login'
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

      </motion.div>

    </div>

  );
}


function ClockIcon(){
  return (
    <span className="tinyIcon">
      ◷
    </span>
  );
}

function RefreshIcon(){
  return (
    <span className="tinyIcon">
      ↻
    </span>
  );
}


createRoot(
  document.getElementById('root')!
).render(
  <App/>
);