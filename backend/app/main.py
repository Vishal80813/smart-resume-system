"""SmartResume AI backend.
Optional integrations become real when MONGODB_URI and OPENAI_API_KEY are supplied.
The service still runs in demo mode without external credentials.
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pypdf import PdfReader
from docx import Document
from io import BytesIO
from datetime import datetime, timedelta, timezone
import os, re, hashlib, secrets
from dotenv import load_dotenv

load_dotenv()

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception: AsyncIOMotorClient=None
try:
    from jose import jwt, JWTError
except Exception: jwt=None; JWTError=Exception
try:
    from passlib.context import CryptContext
    pwd=CryptContext(schemes=['bcrypt'],deprecated='auto')
except Exception: pwd=None
try:
    from openai import AsyncOpenAI
except Exception: AsyncOpenAI=None
try:
    from sentence_transformers import SentenceTransformer
except Exception: SentenceTransformer=None

app=FastAPI(title='SmartResume AI API',version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])

MONGODB_URI=os.getenv('MONGODB_URI',''); DB_NAME=os.getenv('MONGODB_DB','smartresume'); JWT_SECRET=os.getenv('JWT_SECRET','change-me-in-production'); OPENAI_API_KEY=os.getenv('OPENAI_API_KEY',''); EMBEDDING_MODEL=os.getenv('EMBEDDING_MODEL','text-embedding-3-small'); CHAT_MODEL=os.getenv('CHAT_MODEL','gpt-4o-mini')
client=AsyncIOMotorClient(MONGODB_URI) if (MONGODB_URI and AsyncIOMotorClient) else None
db=client[DB_NAME] if client else None
_openai=AsyncOpenAI(api_key=OPENAI_API_KEY) if (OPENAI_API_KEY and AsyncOpenAI) else None
_model=None

SKILLS=['Python','Java','C++','JavaScript','TypeScript','React','Next.js','Node.js','Express','FastAPI','MongoDB','SQL','PostgreSQL','AWS','Azure','Docker','Git','GitHub','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Power BI','Tailwind CSS','Spring Boot','REST APIs','Kubernetes','Redis','Figma']
SECTIONS={'contact':r'(email|phone|linkedin|github|portfolio)','summary':r'(summary|objective|profile)','skills':r'(skills|technical skills|technologies)','experience':r'(experience|employment|internship)','projects':r'(projects|personal projects|academic projects)','education':r'(education|academic background)','certifications':r'(certifications|certificates)','achievements':r'(achievements|awards)'}

class Auth(BaseModel): email:EmailStr; password:str; name:str
class Login(BaseModel): email:EmailStr; password:str
class MatchPayload(BaseModel): resume:str; job_description:str
class OptimizePayload(BaseModel): text:str; tone:str='Impact'
class VersionPayload(BaseModel): name:str='Resume'; text:str; score:int=0

def extract_text(data:bytes,filename:str)->str:
    ext=filename.lower().split('.')[-1]
    try:
        if ext=='pdf': return '\n'.join((p.extract_text() or '') for p in PdfReader(BytesIO(data)).pages)
        if ext=='docx': return '\n'.join(p.text for p in Document(BytesIO(data)).paragraphs)
        return data.decode('utf-8','ignore')
    except Exception as e: raise HTTPException(400,f'Could not parse document: {e}')

def analyze_text(text:str):
    low=text.lower(); words=re.findall(r"[a-zA-Z0-9+#.\-]+",text); wc=len(words)
    found=[s for s in SKILLS if re.search(r'(?<!\w)'+re.escape(s.lower())+r'(?!\w)',low)]
    sections={k:bool(re.search(p,low)) for k,p in SECTIONS.items()}
    action_verbs=sum(bool(re.search(r'\b'+v+r'\b',low)) for v in ['built','developed','designed','implemented','engineered','optimized','deployed','created','automated','integrated'])
    metrics=len(re.findall(r'\b\d+(?:\.\d+)?\s*(?:%|percent|ms|s|x|users|records|gb|mb)\b',low))
    ats=min(98,max(45,65+len(found)*1.5+(10 if sections['experience'] else 0)+(5 if sections['projects'] else 0)))
    content=min(98,max(45,58+action_verbs*3+metrics*5+(8 if wc>250 else 0)))
    formatting=92 if len(text.splitlines())>10 else 72
    score=round(ats*.35+content*.35+formatting*.15+(90 if sections['skills'] else 55)*.15)
    return {'text':text,'word_count':wc,'skills':found,'sections':sections,'missing_sections':[k for k,v in sections.items() if not v],'scores':{'overall':score,'ats':round(ats),'content':round(content),'formatting':formatting,'skills':min(98,60+len(found)*2)},'metrics_detected':metrics,'action_verbs':action_verbs}

def token_for(user_id:str):
    if jwt: return jwt.encode({'sub':user_id,'exp':datetime.now(timezone.utc)+timedelta(days=7)},JWT_SECRET,algorithm='HS256')
    return secrets.token_urlsafe(32)
async def current_user(authorization:str=Header(default='')):
    if not authorization.startswith('Bearer '): raise HTTPException(401,'Authentication required')
    token=authorization[7:]
    if jwt:
        try:return jwt.decode(token,JWT_SECRET,algorithms=['HS256'])['sub']
        except JWTError: raise HTTPException(401,'Invalid token')
    return token

def cosine(a,b):
    import math
    if not a or not b:return 0
    dot=sum(x*y for x,y in zip(a,b)); na=math.sqrt(sum(x*x for x in a)); nb=math.sqrt(sum(y*y for y in b))
    return dot/(na*nb) if na and nb else 0
async def embed(texts):
    global _model
    if _openai:
        r=await _openai.embeddings.create(model=EMBEDDING_MODEL,input=texts); return [x.embedding for x in r.data]
    if SentenceTransformer:
        if _model is None:_model=SentenceTransformer('all-MiniLM-L6-v2')
        return _model.encode(texts,normalize_embeddings=True).tolist()
    # deterministic offline fallback keeps demo functional
    out=[]
    for text in texts:
        v=[0.0]*64
        for token in re.findall(r'\w+',text.lower()): v[int(hashlib.sha256(token.encode()).hexdigest(),16)%64]+=1
        out.append(v)
    return out
async def llm(prompt):
    if not _openai:return None
    r=await _openai.chat.completions.create(model=CHAT_MODEL,temperature=.25,messages=[{'role':'system','content':'You are a truthful professional resume editor. Never invent metrics, tools, employers or achievements.'},{'role':'user','content':prompt}])
    return r.choices[0].message.content

@app.get('/api/health')
async def health(): return {'status':'ok','database':bool(db),'llm':bool(_openai),'embeddings':bool(_openai or SentenceTransformer)}

@app.post('/api/auth/register')
async def register(payload:Auth):
    if not db: return {'token':token_for(payload.email),'user':{'email':payload.email,'name':payload.name},'demo':True}
    if await db.users.find_one({'email':payload.email}): raise HTTPException(409,'Account already exists')
    hashed=pwd.hash(payload.password) if pwd else hashlib.sha256(payload.password.encode()).hexdigest()
    res=await db.users.insert_one({'email':payload.email,'name':payload.name,'password':hashed,'created_at':datetime.now(timezone.utc)})
    return {'token':token_for(str(res.inserted_id)),'user':{'email':payload.email,'name':payload.name}}

@app.post('/api/auth/login')
async def login(payload:Login):
    if not db:return {'token':token_for(payload.email),'user':{'email':payload.email,'name':'Candidate'},'demo':True}
    user=await db.users.find_one({'email':payload.email}); ok=False
    if user: ok=pwd.verify(payload.password,user['password']) if pwd else hashlib.sha256(payload.password.encode()).hexdigest()==user['password']
    if not ok:raise HTTPException(401,'Invalid credentials')
    return {'token':token_for(str(user['_id'])),'user':{'email':user['email'],'name':user['name']}}

@app.post('/api/resumes/analyze')
async def analyze(file:UploadFile=File(...)):
    if not file.filename or file.filename.lower().split('.')[-1] not in {'pdf','docx','txt'}:raise HTTPException(400,'Upload PDF, DOCX or TXT')
    data=await file.read()
    if len(data)>8*1024*1024:raise HTTPException(413,'Maximum file size is 8 MB')
    result=analyze_text(extract_text(data,file.filename))
    result['filename']=file.filename
    return result

@app.post('/api/resumes/analyze-text')
async def analyze_text_endpoint(payload:dict):
    text=payload.get('text','')
    if not isinstance(text,str) or not text.strip():
        raise HTTPException(400,'text is required')
    return analyze_text(text)

@app.post('/api/resumes/versions')
async def save_version(payload:VersionPayload,user_id:str=Depends(current_user)):
    doc={'user_id':user_id,'name':payload.name,'text':payload.text,'score':payload.score,'created_at':datetime.now(timezone.utc)}
    if db:
        r=await db.resume_versions.insert_one(doc); return {'id':str(r.inserted_id),'saved':True}
    return {'id':secrets.token_hex(8),'saved':True,'demo':True}

@app.get('/api/resumes/versions')
async def versions(user_id:str=Depends(current_user)):
    if not db:return {'versions':[],'demo':True}
    cur=db.resume_versions.find({'user_id':user_id}).sort('created_at',-1).limit(20); items=[]
    async for x in cur:items.append({'id':str(x['_id']),'name':x['name'],'score':x['score'],'created_at':x['created_at']})
    return {'versions':items}

@app.post('/api/jobs/match')
async def match(payload:MatchPayload):
    rvec,jvec=await embed([payload.resume,payload.job_description]); semantic=max(0,min(100,round(cosine(rvec,jvec)*100)))
    lowr=payload.resume.lower(); lowj=payload.job_description.lower(); skills=[s for s in SKILLS if re.search(r'(?<!\w)'+re.escape(s.lower())+r'(?!\w)',lowj)]
    matched=[s for s in skills if re.search(r'(?<!\w)'+re.escape(s.lower())+r'(?!\w)',lowr)]; missing=[s for s in skills if s not in matched]
    keyword=round((len(matched)/len(skills))*100) if skills else 0; score=round(semantic*.55+keyword*.45) if skills else semantic
    return {'score':score,'semantic_score':semantic,'keyword_score':keyword,'matched':matched,'missing':missing,'total_skills':len(skills)}

@app.post('/api/ai/optimize')
async def optimize(payload:OptimizePayload):
    if not payload.text.strip():raise HTTPException(400,'text is required')
    prompt=f"Rewrite this resume bullet in three truthful variants for a {payload.tone} goal. Keep facts unchanged. Return JSON-like lines only. Bullet: {payload.text}"
    answer=await llm(prompt)
    if answer:
        suggestions=[x.strip('- •0123456789. ') for x in answer.splitlines() if len(x.strip())>20][:3]
        if suggestions:return {'suggestions':suggestions,'provider':'openai'}
    replacements={'worked on':'Developed','made':'Developed','helped with':'Contributed to','used':'Leveraged','did':'Implemented','responsible for':'Owned'}
    improved=payload.text
    for a,b in replacements.items():improved=re.sub(r'\b'+re.escape(a)+r'\b',b,improved,flags=re.I)
    return {'suggestions':[improved,improved.rstrip('.')+', improving clarity and technical depth.'],'provider':'local'}
