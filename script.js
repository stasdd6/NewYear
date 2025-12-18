// Простая логика: читаем name из URL, персонализируем подписи, загружаем questions.json

function ucfirst(str){if(!str) return str; return str[0].toUpperCase()+str.slice(1)}

function getNameFromURL(){
  const params = new URLSearchParams(location.search);
  const raw = params.get('name');
  if(!raw) return null;
  const s = decodeURIComponent(raw).trim();
  return s ? (s[0].toUpperCase() + s.slice(1)) : null;
}

// minimal falling snow using canvas
function initSnow(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('snow');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w=0,h=0,flakes=[],raf; const DPR = window.devicePixelRatio || 1;
  function resize(){ w = canvas.width = Math.floor(window.innerWidth * DPR); h = canvas.height = Math.floor(window.innerHeight * DPR); canvas.style.width = window.innerWidth + 'px'; canvas.style.height = window.innerHeight + 'px'; flakes = Array.from({length: Math.max(40, Math.round(window.innerWidth/12))}, ()=>createFlake()); }
  function createFlake(){ return {x: Math.random()*w, y: Math.random()*h, r: (Math.random()*1.6+0.8)*DPR, vY: Math.random()*0.6+0.5, vX: (Math.random()*0.6-0.3), o: Math.random()*0.8+0.2} }
  function update(){ ctx.clearRect(0,0,w,h); ctx.fillStyle = 'rgba(255,255,255,0.9)'; for(let f of flakes){ f.y += f.vY; f.x += f.vX; if(f.y>h+10){ f.y = -10; f.x = Math.random()*w; } ctx.beginPath(); ctx.globalAlpha = f.o; ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fill(); } raf = requestAnimationFrame(update); }
  window.addEventListener('resize', ()=>{ cancelAnimationFrame(raf); resize(); });
  resize(); update();
}


let currentQuestion = null;

async function loadQuestions(){
  try{
    const res = await fetch('questions.json');
    if(!res.ok) throw new Error('Не удалось загрузить questions.json');
    const data = await res.json();
    return data;
  }catch(e){
    console.error(e);
    document.getElementById('question').textContent = 'Не удалось загрузить вопросы. Запустите сайт через локальный сервер или GitHub Pages.';
    return [];
  }
}

function pickRandom(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function showQuestion(q){
  currentQuestion = q;
  const box = document.getElementById('questionBox');
  const qEl = document.getElementById('question');
  qEl.textContent = q.question;
  box.classList.remove('hidden');
  // small animation reveal
  setTimeout(()=>box.classList.add('show'),20);
}

function showResult(message, imagePath){
  document.getElementById('congrats').textContent = message;
  const res = document.getElementById('result');
  const img = document.getElementById('answerImage');
  img.src = imagePath;
  img.alt = 'Подарок — картинка вопроса '+(currentQuestion?.id ?? '');
  res.classList.remove('hidden');
  setTimeout(()=>{
    res.classList.add('show');
    img.classList.add('visible');
  },20);
}

function normalizeAnswer(s){
  return s.trim().toLowerCase();
}

// init
window.addEventListener('DOMContentLoaded', async ()=>{
  const name = getNameFromURL();
  const greeting = document.getElementById('greeting');
  const subtitleEl = document.getElementById('subtitle');
  const noteEl = document.querySelector('.note');

  greeting.textContent = name ? `С Новым годом, ${name}! 🎄` : 'С Новым годом! 🎄';
  if(name){
    subtitleEl.textContent = `Этот подарок — для ${name}.`;
    noteEl.textContent = `Для ${name} — тёплые семейные поздравления.`;
  } else {
    subtitleEl.textContent = 'Нажмите «Проверить», чтобы ответить на вопрос.';
    noteEl.innerHTML = 'Откройте этот сайт через NFC-брелок: добавьте параметр <code>?name=Инина</code> в URL.';
  }

  if(typeof initSnow === 'function') initSnow();

  const questions = await loadQuestions();
  if(questions.length===0) return;
  const q = pickRandom(questions);
  showQuestion(q);

  const form = document.getElementById('answerForm');
  const input = document.getElementById('answerInput');
  const feedback = document.getElementById('feedback');
  form.addEventListener('submit',(ev)=>{
    ev.preventDefault();
    if(!currentQuestion) return;
    const user = normalizeAnswer(input.value || '');
    const correct = normalizeAnswer(currentQuestion.answer || '');
    if(user === correct && user !== ''){
      feedback.textContent = '';
      showResult('Теплых тебе праздников и радости! 🎉', `images/${currentQuestion.id}.svg`);
      input.disabled = true;
      form.querySelector('button').disabled = true;
    }else{
      feedback.textContent = 'Похоже, не совсем — попробуй ещё';
    }
  });
  // allow Enter to submit input even when focused
  input.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){e.preventDefault(); form.requestSubmit()} });

});