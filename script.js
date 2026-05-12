// script.js - موقع نوات ستيم
// المعلمة: أستاذة أميرة عبدالله الحكمي

'use strict';

// ===== الحالة العامة =====
const state = {
  currentSection: 'lessons',
  currentGrade: null,
  currentUnit: null,
  currentLesson: null,
  currentSemester: 1,
  quiz: {
    lessonId: null,
    questions: [],
    current: 0,
    score: 0,
    timer: null,
    timeLeft: 20,
    answered: false
  },
  game: {
    lessonId: null,
    data: null,
    score: 0,
    total: 0,
    matchSelected: null
  }
};

// نقاط مخزّنة
const scores = JSON.parse(localStorage.getItem('nawat_scores') || '{}');

// ===== التهيئة =====
document.addEventListener('DOMContentLoaded', () => {
  showLanding();
  setupKeyboardNav();
});

// ============================================================
// ===== منطق Landing Page =====
// ============================================================

function showLanding() {
  const landingEl = document.getElementById('landing-page');
  const appEl = document.getElementById('app-content');
  if (landingEl) landingEl.style.display = 'block';
  if (appEl) appEl.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function enterApp() {
  const landingEl = document.getElementById('landing-page');
  const appEl = document.getElementById('app-content');

  if (landingEl) {
    landingEl.style.opacity = '0';
    landingEl.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      landingEl.style.display = 'none';
      landingEl.style.opacity = '';
      landingEl.style.transition = '';
    }, 300);
  }

  if (appEl) {
    appEl.style.display = 'block';
    appEl.style.opacity = '0';
    appEl.style.transition = 'opacity 0.35s ease';
    setTimeout(() => { appEl.style.opacity = '1'; }, 30);
    setTimeout(() => {
      appEl.style.opacity = '';
      appEl.style.transition = '';
    }, 400);
  }

  renderLessonsSection();
  renderGamesSection();
  renderQuizSection();
  initChatbot();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToLanding() {
  if (state.quiz.timer) {
    clearInterval(state.quiz.timer);
    state.quiz.timer = null;
  }
  showLanding();
}

function scrollToGrades() {
  const section = document.getElementById('grades-section');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== التنقل بين الأقسام =====
function showSection(name) {
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  const panel = document.getElementById(`section-${name}`);
  if (panel) panel.classList.add('active');

  const btns = document.querySelectorAll('.nav-btn');
  const idx = ['lessons', 'games', 'quiz', 'chatbot'].indexOf(name);
  if (btns[idx]) {
    btns[idx].classList.add('active');
    btns[idx].setAttribute('aria-selected', 'true');
  }

  state.currentSection = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'BUTTON') e.target.click();
    if (e.key === 'Escape') {
      const backBtn = document.querySelector('.btn-back:not([style*="none"])');
      if (backBtn) backBtn.click();
    }
  });
}

// ============================================================
// ===== مساعد: جلب كل دروس الفصلين =====
// ============================================================

function getAllLessonsFlat() {
  const result = [];
  // الفصل الأول
  if (window.nawatData && nawatData.grades) {
    nawatData.grades.forEach(grade => {
      grade.units.forEach(unit => {
        unit.lessons.forEach(lesson => {
          result.push({ lesson, unit, grade, semester: 1 });
        });
      });
    });
  }
  // الفصل الثاني
  if (window.semester2Data && semester2Data.grades) {
    const sem2Grade = semester2Data.grades[0];
    if (sem2Grade && semester2Data.lessons) {
      sem2Grade.units.forEach(unit => {
        unit.lessons.forEach(lessonId => {
          const lesson = semester2Data.lessons.find(l => l.id === lessonId);
          if (lesson) result.push({ lesson, unit, grade: sem2Grade, semester: 2 });
        });
      });
    }
  }
  return result;
}

// ============================================================
// ===== قسم الدروس =====
// ============================================================

function renderLessonsSection() {
  const tabsEl = document.getElementById('semester-tabs');
  if (tabsEl) tabsEl.style.display = 'none';

  state.currentSemester = 1;

  const view = document.getElementById('lessons-view');
  if (!view) return;
  const grade = nawatData.grades[0];

  view.innerHTML = `
    <div class="section-header">
      <h2>📚 الصفوف ودروس STEM</h2>
      <p>اختر الصف الدراسي للبدء في استكشاف الوحدات والدروس</p>
    </div>
    <div class="cards-grid">
      <div class="card" style="--card-color:#1565C0"
           onclick="showUnits('${grade.id}')"
           role="button" tabindex="0" aria-label="الصف الأول الابتدائي">
        <span class="card-icon">${grade.icon}</span>
        <div class="card-badge" style="background:#1565C0">${grade.name}</div>
        <h3>${grade.name}</h3>
        <p>${grade.units.length} وحدات دراسية &bull; ${grade.units.reduce((a,u) => a + u.lessons.length, 0)} درساً</p>
      </div>
    </div>
  `;
}

function showUnits(gradeId) {
  const grade = nawatData.grades.find(g => g.id === gradeId);
  if (!grade) return;
  state.currentGrade = grade;

  showSemesterTabs(gradeId);
  _renderUnitsForSemester(grade, state.currentSemester);
}

function showSemesterTabs(gradeId) {
  const tabsEl = document.getElementById('semester-tabs');
  if (!tabsEl) return;

  tabsEl.style.display = 'flex';
  tabsEl.innerHTML = `
    <button
      class="semester-tab-btn${state.currentSemester === 1 ? ' active' : ''}"
      onclick="switchSemester(1, '${gradeId}')"
      role="tab"
      aria-selected="${state.currentSemester === 1}"
      aria-label="الفصل الدراسي الأول">
      📘 الفصل الدراسي الأول
    </button>
    <button
      class="semester-tab-btn${state.currentSemester === 2 ? ' active' : ''}"
      onclick="switchSemester(2, '${gradeId}')"
      role="tab"
      aria-selected="${state.currentSemester === 2}"
      aria-label="الفصل الدراسي الثاني">
      📗 الفصل الدراسي الثاني
    </button>
  `;
}

function switchSemester(semesterNum, gradeId) {
  state.currentSemester = semesterNum;
  state.currentUnit = null;
  state.currentLesson = null;

  const id = gradeId || (state.currentGrade && state.currentGrade.id);
  if (!id) return;

  showSemesterTabs(id);

  const grade = nawatData.grades.find(g => g.id === id);
  if (!grade) return;
  _renderUnitsForSemester(grade, semesterNum);
}

function _getGradeData(grade, semesterNum) {
  if (semesterNum === 2 && window.semester2Data) {
    const sem2Grade = window.semester2Data.grades
      ? window.semester2Data.grades.find(g => g.id === grade.id || g.id === grade.id + '-s2')
      : null;
    if (sem2Grade) return _normalizeSem2Grade(sem2Grade);
  }
  return grade;
}

function _normalizeSem2Grade(sem2Grade) {
  // تحويل بنية الفصل الثاني لتتوافق مع الفصل الأول
  const normalizedUnits = sem2Grade.units.map(unit => {
    const lessons = (unit.lessons || []).map(lessonId => {
      return semester2Data.lessons.find(l => l.id === lessonId) || null;
    }).filter(Boolean);
    return {
      id: unit.id,
      name: unit.title || unit.name,
      icon: unit.icon || '📗',
      color: unit.color || '#4CAF50',
      lessons
    };
  });
  return {
    id: sem2Grade.id,
    name: sem2Grade.name,
    icon: sem2Grade.icon || '📗',
    units: normalizedUnits
  };
}

function _renderUnitsForSemester(grade, semesterNum) {
  const gradeData = _getGradeData(grade, semesterNum);
  const view = document.getElementById('lessons-view');
  const semLabel = semesterNum === 2 ? 'الفصل الثاني' : 'الفصل الأول';

  const unitColors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#00BCD4', '#FF5722'];

  view.innerHTML = `
    <button class="btn-back" onclick="renderLessonsSection()" aria-label="العودة للصفوف">
      ← العودة للصفوف
    </button>
    <div class="section-header">
      <h2>${gradeData.icon || '📗'} ${gradeData.name}</h2>
      <p>اختر الوحدة الدراسية &mdash; ${semLabel}</p>
    </div>
    <div class="cards-grid">
      ${gradeData.units.map((unit, idx) => {
        const color = unit.color || unitColors[idx % unitColors.length];
        const unitLabel = unit.id.replace('unit', 'الوحدة ').replace('-s2', '');
        return `
          <div class="card" style="--card-color:${color}"
               onclick="showLessons('${unit.id}')"
               role="button" tabindex="0" aria-label="وحدة: ${unit.name}">
            <span class="card-icon">${unit.icon || '📚'}</span>
            <div class="card-badge" style="background:${color}">${unitLabel}</div>
            <h3>${unit.name}</h3>
            <p>${unit.lessons.length} دروس تفاعلية مع أنشطة STEM</p>
          </div>
        `;
      }).join('')}
    </div>
  `;

  state.currentGrade = gradeData;
}

function showLessons(unitId) {
  const grade = state.currentGrade;
  const unit = grade.units.find(u => u.id === unitId);
  if (!unit) return;
  state.currentUnit = unit;

  const color = unit.color || '#4CAF50';
  const view = document.getElementById('lessons-view');
  view.innerHTML = `
    <button class="btn-back" onclick="showUnits('grade1')" aria-label="العودة للوحدات">
      ← العودة للوحدات
    </button>
    <div class="section-header">
      <h2>${unit.icon || '📚'} ${unit.name}</h2>
      <p>اختر الدرس لعرض المحتوى الكامل</p>
    </div>
    <div class="cards-grid-3 cards-grid">
      ${unit.lessons.map((lesson, idx) => {
        const sc = scores[lesson.id];
        return `
          <div class="card" style="--card-color:${color}"
               onclick="showLesson('${lesson.id}')"
               role="button" tabindex="0" aria-label="درس: ${lesson.title}">
            <span class="card-icon">📖</span>
            <div class="card-badge" style="background:${color}">الدرس ${idx+1}</div>
            <h3>${lesson.title}</h3>
            <p>${(lesson.summary || '').substring(0, 80)}...</p>
            ${sc ? `<div class="badge badge-success mt-1">✓ أكملت الاختبار: ${sc}%</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function showLesson(lessonId) {
  const grade = state.currentGrade;
  const unit = state.currentUnit;
  if (!unit) return;

  let lesson = unit.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  state.currentLesson = lesson;

  const color = unit.color || '#4CAF50';
  const sem = state.currentSemester;

  // مفاهيم: الفصل الأول يستخدم مصفوفة objects، الفصل الثاني يستخدم مصفوفة strings
  let conceptsHtml = '';
  if (lesson.concepts && lesson.concepts.length > 0) {
    if (typeof lesson.concepts[0] === 'object') {
      conceptsHtml = lesson.concepts.map(c => `
        <div class="concept-item">
          <div class="term">${c.term}</div>
          <div class="definition">${c.definition}</div>
        </div>
      `).join('');
    } else {
      conceptsHtml = lesson.concepts.map(c => `
        <div class="concept-item">
          <div class="term">${c}</div>
        </div>
      `).join('');
    }
  }

  const stemAct = lesson.stemActivity || {};
  const hasStemAct = stemAct.title;

  const view = document.getElementById('lessons-view');
  view.innerHTML = `
    <button class="btn-back no-print" onclick="showLessons('${unit.id}')" aria-label="العودة للدروس">
      ← العودة للدروس
    </button>
    <div class="lesson-page" id="lessonPrintArea">
      <div class="lesson-header" style="background:linear-gradient(135deg,${color}CC,${color})">
        <div class="lesson-meta">
          <span class="lesson-meta-tag">${grade.name || 'الصف الأول'}</span>
          <span class="lesson-meta-tag">${unit.name}</span>
          <span class="lesson-meta-tag">${sem === 2 ? 'الفصل الثاني' : 'الفصل الأول'}</span>
        </div>
        <h2>${lesson.title}</h2>
        <p style="opacity:0.9;margin-top:8px">${lesson.summary || ''}</p>
      </div>

      <div class="lesson-section">
        <h3><span class="section-icon">🎯</span> أهداف الدرس</h3>
        <ul class="objectives-list">
          ${(lesson.objectives || []).map(o => `<li>${o}</li>`).join('')}
        </ul>
      </div>

      ${conceptsHtml ? `
      <div class="lesson-section">
        <h3><span class="section-icon">💡</span> المفاهيم الأساسية</h3>
        ${conceptsHtml}
      </div>` : ''}

      ${lesson.content ? `
      <div class="lesson-section">
        <h3><span class="section-icon">📖</span> محتوى الدرس</h3>
        <p style="line-height:1.9;font-size:0.95rem">${lesson.content}</p>
      </div>` : ''}

      ${hasStemAct ? `
      <div class="stem-activity">
        <h3>🔬 نشاط STEM: ${stemAct.title}</h3>
        <div class="activity-grid">
          <div class="activity-section">
            <h4>🧰 المواد والأدوات:</h4>
            <ul>
              ${(stemAct.materials || []).map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
          <div class="activity-section">
            <h4>⏰ الزمن: ${stemAct.time || stemAct.duration || ''}</h4>
            <h4 style="margin-top:12px">✅ الناتج المتوقع:</h4>
            <p style="font-size:0.85rem;color:var(--text)">${stemAct.expectedOutcome || ''}</p>
          </div>
        </div>
        <div class="activity-section">
          <h4>📋 خطوات النشاط:</h4>
          <ol class="steps-list">
            ${(stemAct.steps || []).map((s, i) => `
              <li><span class="step-num">${i+1}</span>${s}</li>
            `).join('')}
          </ol>
        </div>
        ${stemAct.thinkingQuestions && stemAct.thinkingQuestions.length ? `
        <div class="thinking-questions">
          <h4>🤔 أسئلة للتفكير:</h4>
          <ol>
            ${stemAct.thinkingQuestions.map(q => `<li>${q}</li>`).join('')}
          </ol>
        </div>` : ''}
      </div>` : ''}

      <div class="gap-row mt-3 no-print">
        <button class="btn btn-primary" onclick="startQuizFromLesson('${lessonId}')">
          📝 ابدأ اختبار هذا الدرس
        </button>
        <button class="btn btn-success" onclick="startGameFromLesson('${lessonId}')">
          🎮 العب لعبة هذا الدرس
        </button>
        <button class="btn-print" onclick="printLesson('${lessonId}')">
          🖨️ طباعة الدرس
        </button>
      </div>
    </div>
  `;
}

function printLesson(lessonId) {
  const id = lessonId || (state.currentLesson && state.currentLesson.id);
  if (!id) { window.print(); return; }

  const { lesson, unit, grade } = findLessonById(id);
  if (!lesson) { window.print(); return; }

  const unitNumber = (unit.id || '').replace('unit', '').replace('-s2', '');
  const unitTitle = unit.name;
  const lessonTitle = lesson.title;

  function li(arr) { return (arr || []).map(x => `<li>${x}</li>`).join(''); }
  function joinArr(arr, sep) { return (arr || []).join(sep || ' | '); }

  const css = `:root{--navy:#183f64;--navy-deep:#122f4a;--blue:#0e79b7;--text:#17324a;--muted:#58728a;--line:#d8e0e7;--paper:#ffffff;--page-bg:#edf3f7}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:"GE Flow","Adobe Arabic","DejaVu Sans",sans-serif;background:var(--page-bg);color:var(--text);direction:rtl}.document{width:min(100%,920px);margin:0 auto;padding:24px 12px 42px}.sheet{position:relative;width:210mm;min-height:297mm;margin:0 auto 18px;background:var(--paper);box-shadow:0 20px 50px rgba(15,29,45,.12);overflow:hidden}.sheet-inner{position:relative;padding:14mm 12mm 18mm}.top-strip{display:grid;grid-template-columns:22mm 1fr 22mm;align-items:center;gap:6mm;margin-bottom:11mm}.top-strip .cap{height:13mm;border-radius:0 0 4mm 4mm;background:var(--blue)}.top-strip .title-bar{min-height:13mm;border-radius:0 0 4mm 4mm;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:flex-end;padding:0 7mm;font-size:20px;font-weight:700}.hero-block{border-radius:5mm;background:var(--navy);color:#fff;padding:8mm 9mm;margin-bottom:6mm}.hero-block h1{margin:0 0 3mm;font-size:24px;line-height:1.35;font-weight:700}.hero-block p{margin:0;font-size:17px;line-height:1.75}.inline-meta{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-bottom:8mm}.info-box{border-radius:4mm;background:var(--navy);color:#fff;padding:5.5mm 6mm;min-height:26mm}.info-box p{margin:0;font-size:16px;line-height:1.85;font-weight:700}.two-col{display:grid;grid-template-columns:30mm 1fr;gap:6mm;margin-bottom:6mm;align-items:start}.label-box{border-radius:0 0 0 4mm;background:var(--blue);color:#fff;padding:4mm 3mm;min-height:20mm;display:flex;align-items:center;justify-content:center;text-align:center;font-size:17px;font-weight:700;line-height:1.35}.content-box{border-radius:4mm;background:var(--navy);color:#fff;padding:4.5mm 6mm;min-height:20mm}.content-box.light{background:#fff;color:var(--text);border:.4mm solid var(--line)}.content-box p,.content-box li{margin:0;font-size:16px;line-height:1.9}.content-box ul,.content-box ol{margin:0;padding:0 5mm 0 0}.stem-grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.stem-panel{border:.4mm solid var(--line);border-radius:4mm;overflow:hidden;background:#fff}.stem-panel h3{margin:0;padding:3.5mm 5mm;background:var(--navy);color:#fff;font-size:16px;line-height:1.4}.stem-panel p{margin:0;padding:4.5mm 5mm 5mm;font-size:15px;line-height:1.85;min-height:29mm}.tools-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}.tool-item{text-align:center;padding:4mm;border:.4mm solid var(--line);border-radius:3mm;background:linear-gradient(180deg,#f8fbfd,#edf3f7);min-height:20mm;display:flex;align-items:center;justify-content:center}.tool-item span{font-size:15px;font-weight:700;color:var(--navy)}.worksheet-box{min-height:122mm;border:.5mm solid #6c7e8f;background:#fff;padding:8mm}.worksheet-box h3{margin:0 0 5mm;text-align:center;font-size:20px}.worksheet-box p{margin:0 0 3mm;font-size:15px;line-height:1.85}.rubric{width:100%;border-collapse:collapse}.rubric th,.rubric td{border:.4mm solid #8ea0b1;padding:3.2mm;text-align:right;vertical-align:top;font-size:14px;line-height:1.7}.rubric thead th{background:var(--navy);color:#fff}.page-number{position:absolute;right:12mm;bottom:6mm;width:8mm;height:8mm;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}.print-credit{margin-top:8mm;padding-top:4mm;border-top:.4mm solid #c9d4de;text-align:center;font-size:17px;font-weight:700;color:var(--navy)}.toolbar{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px;background:rgba(237,243,247,.96);backdrop-filter:blur(10px);border-bottom:1px solid rgba(24,63,100,.08)}.print-button{border:0;border-radius:14px;background:var(--navy);color:#fff;font:inherit;font-size:16px;font-weight:700;padding:10px 18px;cursor:pointer}@page{size:A4;margin:0}@media print{body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:none}.document{width:auto;margin:0;padding:0}.sheet{width:210mm;min-height:297mm;margin:0;box-shadow:none;overflow:hidden;break-after:page;page-break-after:always}}`;

  const toolsHtml = (lesson.activityTools || []).map(t => `<div class="tool-item"><span>${t}</span></div>`).join('');

  const rubricRows = (lesson.rubric || []).map(r => `
    <tr>
      <td>${r.criterion}</td>
      <td>${r.excellent}</td>
      <td>${r.good}</td>
      <td>${r.needsSupport}</td>
    </tr>
  `).join('');

  const sheet1 = `
<section class="sheet"><div class="sheet-inner">
  <div class="top-strip"><div class="cap"></div><div class="title-bar">${lessonTitle}</div><div class="cap"></div></div>
  <div class="hero-block">
    <h1>عنوان الدرس: ${lessonTitle}</h1>
    <p>المبحث: العلوم | رقم الوحدة وعنوانها: ${unitNumber} - ${unitTitle}</p>
  </div>
  <div class="inline-meta">
    <div class="info-box"><p>عدد الجلسات: ${lesson.sessions || '2'}</p><p>مصادر التعلم: ${lesson.resources || ''}</p></div>
    <div class="info-box"><p>مدة الدرس: ${lesson.duration || '45 دقيقة'}</p><p>الصف: الأول الابتدائي</p></div>
  </div>
  <div class="two-col"><div class="label-box">الوسائل التعليمية</div><div class="content-box"><p>${lesson.teachingAids || ''}</p></div></div>
  <div class="two-col"><div class="label-box">الأهداف التعليمية</div><div class="content-box"><ul>${li(lesson.objectives)}</ul></div></div>
  <div class="two-col"><div class="label-box">المفردات</div><div class="content-box light"><p>${joinArr(lesson.vocabulary, ' | ')}</p></div></div>
  <div class="two-col"><div class="label-box">الأفكار الرئيسة</div><div class="content-box light"><p>${joinArr(lesson.mainIdeas, ' • ')}</p></div></div>
  <div class="two-col"><div class="label-box">تكامل STEM</div><div class="content-box light"><div class="stem-grid">
    <div class="stem-panel"><h3>Science: العلوم</h3><p>${(lesson.stem || {}).science || ''}</p></div>
    <div class="stem-panel"><h3>Technology: التقنية</h3><p>${(lesson.stem || {}).technology || ''}</p></div>
    <div class="stem-panel"><h3>Engineering: الهندسة</h3><p>${(lesson.stem || {}).engineering || ''}</p></div>
    <div class="stem-panel"><h3>Mathematics: الرياضيات</h3><p>${(lesson.stem || {}).mathematics || ''}</p></div>
  </div></div></div>
  <div class="two-col"><div class="label-box">التمهيد</div><div class="content-box light"><p>${lesson.introduction || ''}</p></div></div>
  <div class="page-number">1</div>
</div></section>`;

  const sheet2 = `
<section class="sheet"><div class="sheet-inner">
  <div class="top-strip"><div class="cap"></div><div class="title-bar">${lesson.activityName || 'النشاط العملي'}</div><div class="cap"></div></div>
  <div class="two-col"><div class="label-box">خطوات شرح الدرس</div><div class="content-box light"><ol>${li(lesson.teachingSteps)}</ol></div></div>
  <div class="two-col"><div class="label-box">النشاط العملي</div><div class="content-box light">
    <p><strong>اسم النشاط:</strong> ${lesson.activityName || ''}</p>
    <p><strong>وصف النشاط:</strong> ${lesson.activityDescription || ''}</p>
  </div></div>
  <div class="two-col"><div class="label-box">الأدوات</div><div class="content-box light"><div class="tools-grid">${toolsHtml}</div></div></div>
  <div class="two-col"><div class="label-box">خطوات النشاط</div><div class="content-box light"><ul>${li(lesson.activitySteps)}</ul></div></div>
  <div class="two-col"><div class="label-box">أسئلة التقويم</div><div class="content-box light"><ul>${li(lesson.assessmentQuestions)}</ul></div></div>
  <div class="page-number">2</div>
</div></section>`;

  const ws = lesson.worksheet || {};
  const sheet3 = `
<section class="sheet"><div class="sheet-inner">
  <div class="top-strip"><div class="cap"></div><div class="title-bar">ورقة العمل والتقدير</div><div class="cap"></div></div>
  <div class="two-col"><div class="label-box">ورقة عمل قابلة للطباعة</div><div class="content-box light"><div class="worksheet-box">
    <h3>ورقة عمل</h3>
    <p>عنوان النشاط: ${ws.title || ''}</p>
    <p>التعليمات: ${ws.instructions || ''}</p>
    <p>${ws.content || ''}</p>
  </div></div></div>
  <div class="two-col"><div class="label-box">سلم التقدير</div><div class="content-box light"><table class="rubric">
    <thead><tr><th>المعيار</th><th>متميز</th><th>جيد</th><th>بحاجة إلى دعم</th></tr></thead>
    <tbody>${rubricRows}</tbody>
  </table></div></div>
  <div class="two-col"><div class="label-box">ملاحظات للمعلم</div><div class="content-box light"><p>${lesson.teacherNotes || ''}</p></div></div>
  <div class="print-credit">إعداد الأستاذة أميرة الحكمي</div>
  <div class="page-number">3</div>
</div></section>`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>طباعة: ${lessonTitle}</title>
<style>${css}</style>
</head>
<body>
<div class="toolbar">
  <span style="font-weight:700;font-size:18px;color:var(--navy)">${lessonTitle}</span>
  <button class="print-button" onclick="window.print()">🖨️ طباعة</button>
</div>
<div class="document">
  ${sheet1}
  ${sheet2}
  ${sheet3}
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=800');
  win.document.write(html);
  win.document.close();
}

function startQuizFromLesson(lessonId) {
  showSection('quiz');
  setTimeout(() => startQuiz(lessonId), 100);
}

function startGameFromLesson(lessonId) {
  showSection('games');
  setTimeout(() => startGame(lessonId), 100);
}

// ============================================================
// ===== قسم الألعاب =====
// ============================================================

function renderGamesSection() {
  const view = document.getElementById('games-view');
  if (!view) return;

  const allLessons = getAllLessonsFlat();

  view.innerHTML = `
    <div class="section-header">
      <h2>🎮 ألعب مع ستيم</h2>
      <p>اختر درساً للعب لعبته التفاعلية وجمع النقاط!</p>
    </div>
    <div id="gameScoreBoard" class="highlight mb-3" style="display:none"></div>
    <div id="gameContent">
      <div class="cards-grid">
        ${allLessons.map(({lesson, unit, semester}) => {
          const sc = scores[`game_${lesson.id}`];
          const game = lesson.game || {};
          const gameType = game.type || '';
          const gameTypeIcon = getGameTypeIcon(gameType);
          const gameTypeName = getGameTypeName(gameType);
          const color = unit.color || '#4CAF50';
          const gameTitle = game.title || lesson.title;
          const semBadge = semester === 2 ? ' 📗' : ' 📘';
          return `
            <div class="card" style="--card-color:${color}"
                 onclick="startGame('${lesson.id}')"
                 role="button" tabindex="0" aria-label="لعبة: ${gameTitle}">
              <span class="card-icon">${gameTypeIcon}</span>
              <div class="card-badge" style="background:${color}">${gameTypeName}${semBadge}</div>
              <h3>${gameTitle}</h3>
              <p>${lesson.title} &bull; ${unit.name || unit.title}</p>
              ${sc !== undefined ? `<div class="badge badge-success mt-1">🏆 أفضل: ${sc} نقطة</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function getGameTypeIcon(type) {
  const icons = {
    sorting: '🗂️',
    dragDrop: '🧲',
    matching: '🔗',
    sequencing: '🔢',
    multiple_choice: '🎯',
    multipleChoice: '🎯',
    trueFalse: '✅'
  };
  return icons[type] || '🎮';
}

function getGameTypeName(type) {
  const names = {
    sorting: 'فرز وتصنيف',
    dragDrop: 'سحب وإفلات',
    matching: 'مطابقة',
    sequencing: 'ترتيب',
    multiple_choice: 'اختيار متعدد',
    multipleChoice: 'اختيار متعدد',
    trueFalse: 'صح أم خطأ'
  };
  return names[type] || 'لعبة';
}

function startGame(lessonId) {
  const { lesson, unit } = findLessonById(lessonId);
  if (!lesson || !lesson.game) return;

  state.game.lessonId = lessonId;
  state.game.data = lesson.game;
  state.game.score = 0;
  state.game.total = 0;
  state.game.matchSelected = null;

  const gameType = lesson.game.type;

  switch (gameType) {
    case 'sorting':
      renderSortingGame(lesson.game, unit, lesson);
      break;
    case 'dragDrop':
      renderDragDropGame(lesson.game, unit, lesson);
      break;
    case 'matching':
      renderMatchingGame(lesson.game, unit, lesson);
      break;
    case 'sequencing':
      renderSequencingGame(lesson.game, unit, lesson);
      break;
    case 'multiple_choice':
    case 'multipleChoice':
      renderMCQGame(lesson.game, unit, lesson);
      break;
    case 'trueFalse':
      renderTrueFalseGame(lesson.game, unit, lesson);
      break;
    default: {
      const view = document.getElementById('gameContent');
      if (view) view.innerHTML = `<div class="game-container"><p class="not-available">هذه اللعبة غير متوفرة حالياً.</p></div>`;
    }
  }
}

// ---- لعبة الفرز (sorting) ----
function renderSortingGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  const shuffled = shuffleArray([...game.items]);

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div style="text-align:center">
          <div class="score-label">التقدم</div>
          <div id="gameProgress" class="badge badge-primary">0/${game.items.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>

      <div class="sort-items-pool" id="sortPool">
        ${shuffled.map(item => `
          <div class="sort-item"
               draggable="true"
               id="sitem-${item.id}"
               data-id="${item.id}"
               data-category="${item.category}"
               title="${item.hint || ''}"
               aria-label="${item.text}"
               ondragstart="onDragStart(event)"
               onclick="onSortItemClick(this)">
            <span class="item-emoji">${item.image || ''}</span>
            <span>${item.text}</span>
          </div>
        `).join('')}
      </div>

      <div class="sort-areas">
        ${game.categories.map(cat => {
          const catId = (typeof cat === 'string') ? cat : cat.id;
          const catName = (typeof cat === 'string') ? cat : cat.name;
          const catColor = (typeof cat === 'object' && cat.color) ? cat.color : '#1565C0';
          return `
            <div class="sort-zone"
                 id="zone-${catId}"
                 data-category="${catId}"
                 ondragover="onDragOver(event)"
                 ondrop="onDrop(event)"
                 ondragenter="onDragEnter(event)"
                 ondragleave="onDragLeave(event)">
              <div class="sort-zone-label" style="background:${catColor}">${catName}</div>
              <div class="zone-items" id="zitems-${catId}"></div>
            </div>
          `;
        }).join('')}
      </div>

      <div id="sortFeedback" style="margin-top:12px;text-align:center;font-weight:700;font-size:1rem"></div>
    </div>
  `;

  state.game.sortItems = game.items;
  state.game.sortPlaced = {};
  state.game.sortClickSelected = null;
}

// ---- لعبة السحب والإفلات (dragDrop) - مشابهة للفرز لكن الفئات strings ----
function renderDragDropGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  const shuffled = shuffleArray([...game.items]);
  const categories = game.categories || [];

  // إعداد نسخة موحدة من العناصر بـ id
  const itemsWithId = shuffled.map((item, idx) => ({
    ...item,
    id: item.id !== undefined ? item.id : idx
  }));

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div style="text-align:center">
          <div class="score-label">التقدم</div>
          <div id="gameProgress" class="badge badge-primary">0/${game.items.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>

      <div class="sort-items-pool" id="sortPool">
        ${itemsWithId.map(item => `
          <div class="sort-item"
               draggable="true"
               id="sitem-${item.id}"
               data-id="${item.id}"
               data-category="${item.category}"
               aria-label="${item.text}"
               ondragstart="onDragStart(event)"
               onclick="onSortItemClick(this)">
            <span>${item.text}</span>
          </div>
        `).join('')}
      </div>

      <div class="sort-areas">
        ${categories.map(cat => `
          <div class="sort-zone"
               id="zone-${cat}"
               data-category="${cat}"
               ondragover="onDragOver(event)"
               ondrop="onDrop(event)"
               ondragenter="onDragEnter(event)"
               ondragleave="onDragLeave(event)">
            <div class="sort-zone-label" style="background:#1565C0">${cat}</div>
            <div class="zone-items" id="zitems-${cat}"></div>
          </div>
        `).join('')}
      </div>

      <div id="sortFeedback" style="margin-top:12px;text-align:center;font-weight:700;font-size:1rem"></div>
    </div>
  `;

  // حفظ نسخة موحدة للعناصر
  const gameDataCopy = { ...game, items: itemsWithId };
  state.game.data = gameDataCopy;
  state.game.sortItems = itemsWithId;
  state.game.sortPlaced = {};
  state.game.sortClickSelected = null;
}

let dragItem = null;

function onDragStart(e) {
  dragItem = e.target.closest('.sort-item');
  e.dataTransfer.setData('text/plain', dragItem.dataset.id);
  setTimeout(() => { if (dragItem) dragItem.classList.add('dragging'); }, 0);
}

function onDragOver(e) { e.preventDefault(); }

function onDragEnter(e) { e.currentTarget.classList.add('drag-over'); }

function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

function onDrop(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove('drag-over');
  const rawId = e.dataTransfer.getData('text/plain');
  const itemId = isNaN(rawId) ? rawId : parseInt(rawId);
  placeSortItem(itemId, zone.dataset.category);
}

function onSortItemClick(el) {
  if (!el || el.dataset.placed) return;

  if (!state.game.sortClickSelected) {
    document.querySelectorAll('.sort-item').forEach(i => i.style.outline = '');
    el.style.outline = '3px solid var(--accent)';
    state.game.sortClickSelected = el;
  } else if (state.game.sortClickSelected === el) {
    el.style.outline = '';
    state.game.sortClickSelected = null;
  }
}

document.addEventListener('click', (e) => {
  const zone = e.target.closest('.sort-zone');
  if (zone && state.game.sortClickSelected) {
    const itemEl = state.game.sortClickSelected;
    itemEl.style.outline = '';
    state.game.sortClickSelected = null;
    const rawId = itemEl.dataset.id;
    const itemId = isNaN(rawId) ? rawId : parseInt(rawId);
    placeSortItem(itemId, zone.dataset.category);
  }
});

function placeSortItem(itemId, categoryId) {
  const gameData = state.game.data;
  if (!gameData) return;
  const item = gameData.items.find(i => String(i.id) === String(itemId));
  if (!item || state.game.sortPlaced[String(itemId)]) return;

  const el = document.getElementById(`sitem-${itemId}`);
  if (!el) return;

  const correct = String(item.category) === String(categoryId);
  state.game.sortPlaced[String(itemId)] = true;

  const zoneItems = document.getElementById(`zitems-${categoryId}`);
  if (zoneItems) {
    el.draggable = false;
    el.style.cursor = 'default';
    el.style.border = `2px solid ${correct ? 'var(--success)' : 'var(--danger)'}`;
    el.style.background = correct ? 'rgba(46,125,50,0.08)' : 'rgba(198,40,40,0.08)';
    el.setAttribute('data-placed', '1');
    zoneItems.appendChild(el);
  }

  if (correct) {
    state.game.score++;
    showSortFeedback(`✅ أحسنت! ${item.hint || ''}`, true);
  } else {
    showSortFeedback(`❌ حاول مرة أخرى!`, false);
  }

  const placed = Object.keys(state.game.sortPlaced).length;
  const scoreEl = document.getElementById('gameScore');
  const progEl = document.getElementById('gameProgress');
  if (scoreEl) scoreEl.textContent = state.game.score;
  if (progEl) progEl.textContent = `${placed}/${gameData.items.length}`;

  if (placed === gameData.items.length) {
    setTimeout(() => showGameResult(state.game.score, gameData.items.length, gameData.type || 'sorting'), 800);
  }
}

function showSortFeedback(msg, correct) {
  const el = document.getElementById('sortFeedback');
  if (!el) return;
  el.textContent = msg;
  el.style.color = correct ? 'var(--success)' : 'var(--danger)';
  setTimeout(() => { el.textContent = ''; }, 2000);
}

// ---- لعبة المطابقة (matching) ----
function renderMatchingGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  // دعم كلا التنسيقين: pairs بـ {id, left, right} أو {term, definition}
  const normalizedPairs = (game.pairs || []).map((p, idx) => ({
    id: p.id !== undefined ? p.id : idx,
    left: p.left || p.term,
    right: p.right || p.definition
  }));
  const shuffledRight = shuffleArray([...normalizedPairs]);

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div>
          <div class="score-label">التقدم</div>
          <div id="gameProgress" class="badge badge-primary">0/${normalizedPairs.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <div class="matching-container">
        <div>
          <div class="matching-col-header">العمود الأول</div>
          ${normalizedPairs.map(pair => `
            <div class="match-item" id="left-${pair.id}"
                 data-id="${pair.id}" data-side="left"
                 onclick="onMatchClick(this)"
                 role="button" tabindex="0" aria-label="${pair.left}">
              ${pair.left}
            </div>
          `).join('')}
        </div>
        <div>
          <div class="matching-col-header">العمود الثاني</div>
          ${shuffledRight.map(pair => `
            <div class="match-item" id="right-${pair.id}"
                 data-id="${pair.id}" data-side="right"
                 onclick="onMatchClick(this)"
                 role="button" tabindex="0" aria-label="${pair.right}">
              ${pair.right}
            </div>
          `).join('')}
        </div>
      </div>
      <div id="matchFeedback" style="text-align:center;font-weight:700;margin-top:12px;min-height:24px"></div>
    </div>
  `;

  // تحديث بيانات اللعبة بالأزواج المعيارية
  state.game.data = { ...game, pairs: normalizedPairs };
  state.game.matchSelected = null;
  state.game.matchMatched = {};
  state.game.score = 0;
}

function onMatchClick(el) {
  if (el.classList.contains('matched-correct')) return;
  const side = el.dataset.side;
  const id = parseInt(el.dataset.id);

  if (!state.game.matchSelected) {
    document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    state.game.matchSelected = { el, side, id };
  } else {
    const prev = state.game.matchSelected;

    if (prev.el === el) {
      el.classList.remove('selected');
      state.game.matchSelected = null;
      return;
    }

    if (prev.side === side) {
      document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));
      el.classList.add('selected');
      state.game.matchSelected = { el, side, id };
      return;
    }

    const correct = prev.id === id;
    document.querySelectorAll('.match-item').forEach(i => i.classList.remove('selected'));

    if (correct) {
      prev.el.classList.add('matched-correct');
      el.classList.add('matched-correct');
      prev.el.setAttribute('tabindex', '-1');
      el.setAttribute('tabindex', '-1');
      state.game.score++;
      const placed = state.game.score;
      const scoreEl = document.getElementById('gameScore');
      const progEl = document.getElementById('gameProgress');
      if (scoreEl) scoreEl.textContent = state.game.score;
      if (progEl) progEl.textContent = `${placed}/${state.game.data.pairs.length}`;
      showMatchFeedback('✅ ممتاز! تطابق صحيح', true);
      if (placed === state.game.data.pairs.length) {
        setTimeout(() => showGameResult(state.game.score, state.game.data.pairs.length, 'matching'), 800);
      }
    } else {
      prev.el.classList.add('matched-wrong');
      el.classList.add('matched-wrong');
      showMatchFeedback('❌ حاول مرة أخرى!', false);
      setTimeout(() => {
        prev.el.classList.remove('matched-wrong');
        el.classList.remove('matched-wrong');
      }, 600);
    }

    state.game.matchSelected = null;
  }
}

function showMatchFeedback(msg, correct) {
  const el = document.getElementById('matchFeedback');
  if (!el) return;
  el.textContent = msg;
  el.style.color = correct ? 'var(--success)' : 'var(--danger)';
  setTimeout(() => { el.textContent = ''; }, 1800);
}

// ---- لعبة الترتيب (sequencing) ----
function renderSequencingGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  const shuffled = shuffleArray([...game.items]);

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <p style="text-align:center;color:var(--text-secondary);margin-bottom:16px;font-size:0.875rem">
        انقر على الأزرار ▲ ▼ لتحريك العناصر وترتيبها
      </p>
      <div class="sequence-items" id="seqList">
        ${shuffled.map((item, idx) => `
          <div class="sequence-item" data-order="${item.order}" data-idx="${idx}" id="seq-${item.order}">
            <span class="sequence-num">${idx+1}</span>
            <span style="flex:1">${item.text}</span>
            <div style="display:flex;gap:4px">
              <button class="btn btn-outline" style="padding:6px 10px;min-height:36px"
                      onclick="moveSeqUp(${idx})" aria-label="نقل للأعلى">▲</button>
              <button class="btn btn-outline" style="padding:6px 10px;min-height:36px"
                      onclick="moveSeqDown(${idx})" aria-label="نقل للأسفل">▼</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:20px">
        <button class="btn btn-primary btn-lg" onclick="checkSequence()">
          ✅ تحقق من الترتيب
        </button>
      </div>
      <div id="seqFeedback" style="text-align:center;font-weight:700;margin-top:16px;min-height:28px"></div>
    </div>
  `;

  state.game.seqItems = [...shuffled];
}

function moveSeqUp(idx) {
  if (idx === 0) return;
  const list = document.getElementById('seqList');
  const items = list.querySelectorAll('.sequence-item');
  list.insertBefore(items[idx], items[idx - 1]);
  updateSeqNumbers();
  state.game.seqItems = getSeqCurrentOrder();
}

function moveSeqDown(idx) {
  const list = document.getElementById('seqList');
  const items = list.querySelectorAll('.sequence-item');
  if (idx >= items.length - 1) return;
  list.insertBefore(items[idx + 1], items[idx]);
  updateSeqNumbers();
  state.game.seqItems = getSeqCurrentOrder();
}

function updateSeqNumbers() {
  const items = document.querySelectorAll('#seqList .sequence-item');
  items.forEach((item, idx) => {
    item.querySelector('.sequence-num').textContent = idx + 1;
  });
}

function getSeqCurrentOrder() {
  const items = document.querySelectorAll('#seqList .sequence-item');
  const result = [];
  items.forEach(item => result.push(parseInt(item.dataset.order)));
  return result;
}

function checkSequence() {
  const current = getSeqCurrentOrder();
  const expected = state.game.data.items.map(i => i.order).sort((a,b) => a-b);
  const correct = current.every((v, i) => v === expected[i]);
  const fb = document.getElementById('seqFeedback');

  if (correct) {
    if (fb) { fb.textContent = '🎉 رائع! الترتيب صحيح تماماً!'; fb.style.color = 'var(--success)'; }
    document.querySelectorAll('#seqList .sequence-item').forEach(el => {
      el.style.borderColor = 'var(--success)';
      el.style.background = 'rgba(46,125,50,0.08)';
    });
    setTimeout(() => showGameResult(state.game.data.items.length, state.game.data.items.length, 'sequencing'), 1200);
  } else {
    if (fb) { fb.textContent = '❌ الترتيب غير صحيح. حاول مرة أخرى!'; fb.style.color = 'var(--danger)'; }
    document.querySelectorAll('#seqList .sequence-item').forEach(el => {
      el.style.borderColor = '';
      el.style.background = '';
    });
  }
}

// ---- لعبة الاختيار المتعدد (multiple_choice / multipleChoice) ----
function renderMCQGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  state.game.mcqCurrent = 0;
  state.game.score = 0;

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div>
          <div class="score-label">السؤال</div>
          <div id="gameProgress" class="badge badge-primary">1/${game.questions.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <div id="mcqArea"></div>
    </div>
  `;

  renderMCQQuestion(0);
}

function renderMCQQuestion(idx) {
  const game = state.game.data;
  if (idx >= game.questions.length) {
    showGameResult(state.game.score, game.questions.length, game.type);
    return;
  }

  const q = game.questions[idx];
  const area = document.getElementById('mcqArea');
  if (!area) return;

  const progEl = document.getElementById('gameProgress');
  if (progEl) progEl.textContent = `${idx+1}/${game.questions.length}`;

  area.innerHTML = `
    <div class="mcq-game">
      <div class="question-image">${q.image || ''}</div>
      <div class="question-text">${q.question}</div>
      <div class="mcq-options">
        ${q.options.map((opt, i) => `
          <button class="mcq-option"
                  onclick="answerMCQ(${i}, ${q.correct})"
                  aria-label="${opt}">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="mcqFeedback" style="text-align:center;font-weight:700;margin-top:12px;min-height:24px"></div>
    </div>
  `;
}

function answerMCQ(chosen, correct) {
  const opts = document.querySelectorAll('.mcq-option');
  opts.forEach(o => o.disabled = true);

  const fb = document.getElementById('mcqFeedback');
  if (opts[correct]) opts[correct].classList.add('correct');

  if (chosen === correct) {
    if (opts[chosen]) opts[chosen].classList.add('correct');
    state.game.score++;
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = state.game.score;
    if (fb) { fb.textContent = '✅ إجابة صحيحة! أحسنت'; fb.style.color = 'var(--success)'; }
  } else {
    if (opts[chosen]) opts[chosen].classList.add('wrong');
    if (fb) { fb.textContent = '❌ إجابة خاطئة. الإجابة الصحيحة ملوّنة بالأخضر'; fb.style.color = 'var(--danger)'; }
  }

  state.game.mcqCurrent++;
  setTimeout(() => renderMCQQuestion(state.game.mcqCurrent), 1400);
}

// ---- لعبة صح أم خطأ (trueFalse) ----
function renderTrueFalseGame(game, unit, lesson) {
  const view = document.getElementById('gameContent');
  state.game.tfCurrent = 0;
  state.game.score = 0;

  view.innerHTML = `
    <button class="btn-back" onclick="renderGamesSection()">← العودة للألعاب</button>
    <div class="game-container">
      <div class="game-score-bar">
        <div>
          <div class="score-label">النقاط</div>
          <div class="score-display" id="gameScore">0</div>
        </div>
        <div>
          <div class="score-label">السؤال</div>
          <div id="gameProgress" class="badge badge-primary">1/${game.questions.length}</div>
        </div>
      </div>
      <div class="game-title">${game.title}</div>
      <div class="game-instructions">${game.instructions}</div>
      <div id="tfArea"></div>
    </div>
  `;

  renderTFQuestion(0);
}

function renderTFQuestion(idx) {
  const game = state.game.data;
  if (idx >= game.questions.length) {
    showGameResult(state.game.score, game.questions.length, 'trueFalse');
    return;
  }

  const q = game.questions[idx];
  const area = document.getElementById('tfArea');
  if (!area) return;

  const progEl = document.getElementById('gameProgress');
  if (progEl) progEl.textContent = `${idx+1}/${game.questions.length}`;

  area.innerHTML = `
    <div class="mcq-game">
      <div class="question-text" style="font-size:1.1rem;margin-bottom:24px">${q.statement}</div>
      <div class="mcq-options" style="display:flex;gap:16px;justify-content:center">
        <button class="mcq-option tf-btn" style="flex:1;font-size:1.2rem;background:rgba(46,125,50,0.08)"
                onclick="answerTF(true, ${q.answer})"
                aria-label="صح">
          ✅ صح
        </button>
        <button class="mcq-option tf-btn" style="flex:1;font-size:1.2rem;background:rgba(198,40,40,0.08)"
                onclick="answerTF(false, ${q.answer})"
                aria-label="خطأ">
          ❌ خطأ
        </button>
      </div>
      <div id="tfFeedback" style="text-align:center;font-weight:700;margin-top:16px;min-height:40px;font-size:0.9rem;padding:8px"></div>
    </div>
  `;
}

function answerTF(chosen, correct) {
  const btns = document.querySelectorAll('.tf-btn');
  btns.forEach(b => b.disabled = true);

  const fb = document.getElementById('tfFeedback');
  const game = state.game.data;
  const q = game.questions[state.game.tfCurrent];

  if (chosen === correct) {
    state.game.score++;
    const scoreEl = document.getElementById('gameScore');
    if (scoreEl) scoreEl.textContent = state.game.score;
    if (fb) {
      fb.textContent = `✅ إجابة صحيحة! ${q.explanation || ''}`;
      fb.style.color = 'var(--success)';
    }
  } else {
    if (fb) {
      fb.textContent = `❌ إجابة خاطئة. ${q.explanation || ''}`;
      fb.style.color = 'var(--danger)';
    }
  }

  state.game.tfCurrent++;
  setTimeout(() => renderTFQuestion(state.game.tfCurrent), 1800);
}

// ---- نتيجة اللعبة ----
function showGameResult(score, total, type) {
  const view = document.getElementById('gameContent');
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji = percent === 100 ? '🏆' : percent >= 60 ? '⭐' : '💪';
  const msg = percent === 100 ? 'ممتاز! أنت بطل!' : percent >= 60 ? 'أداء جيد! استمر!' : 'حاول مرة أخرى!';

  // تخزين النقاط
  const key = `game_${state.game.lessonId}`;
  const prev = scores[key] || 0;
  if (score > prev) {
    scores[key] = score;
    localStorage.setItem('nawat_scores', JSON.stringify(scores));
  }

  view.innerHTML = `
    <div class="game-container">
      <div class="game-result">
        <div class="result-emoji bounce">${emoji}</div>
        <div class="result-title">${msg}</div>
        <div class="result-score">حصلت على <strong>${score}</strong> من <strong>${total}</strong> نقطة</div>
        <div class="progress-bar" style="max-width:300px;margin:0 auto 24px">
          <div class="progress-fill" style="width:${percent}%;background:${percent>=80?'var(--success)':percent>=50?'var(--warning)':'var(--danger)'}"></div>
        </div>
        <div class="gap-row" style="justify-content:center">
          <button class="btn btn-primary btn-lg" onclick="startGame('${state.game.lessonId}')">
            🔄 إعادة اللعبة
          </button>
          <button class="btn btn-outline btn-lg" onclick="renderGamesSection()">
            🎮 ألعاب أخرى
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// ===== قسم الاختبارات =====
// ============================================================

function renderQuizSection() {
  const view = document.getElementById('quiz-view');
  if (!view) return;

  const allLessons = getAllLessonsFlat();

  view.innerHTML = `
    <div class="section-header">
      <h2>📝 اختبر معلوماتك مع نوات ستيم</h2>
      <p>اختر درساً لتبدأ الاختبار وتجمع الشارات!</p>
    </div>
    <div id="quizContent">
      <div class="cards-grid">
        ${allLessons.map(({lesson, unit, semester}) => {
          const sc = scores[lesson.id];
          const badge = sc !== undefined ? getBadgeForScore(sc) : null;
          const color = unit.color || '#4CAF50';

          // استخراج الأسئلة من كلا البنيتين
          const quizQuestions = _getLessonQuizQuestions(lesson);
          const qCount = quizQuestions.length;
          const semBadge = semester === 2 ? ' 📗' : ' 📘';

          return `
            <div class="card" style="--card-color:${color}"
                 onclick="startQuiz('${lesson.id}')"
                 role="button" tabindex="0" aria-label="اختبار: ${lesson.title}">
              <span class="card-icon">📝</span>
              <div class="card-badge" style="background:${color}">${qCount} أسئلة${semBadge}</div>
              <h3>${lesson.title}</h3>
              <p>${unit.name || unit.title}</p>
              ${badge ? `<div class="badge badge-success mt-1">${badge.icon} ${badge.label}: ${sc}%</div>` : `<div class="badge badge-primary mt-1">🔒 لم تُختبر بعد</div>`}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function _getLessonQuizQuestions(lesson) {
  if (!lesson.quiz) return [];
  // الفصل الأول: lesson.quiz = مصفوفة أسئلة مباشرة
  if (Array.isArray(lesson.quiz)) return lesson.quiz;
  // الفصل الثاني: lesson.quiz = { questions: [...] }
  if (lesson.quiz.questions && Array.isArray(lesson.quiz.questions)) return lesson.quiz.questions;
  return [];
}

function getBadgeForScore(sc) {
  if (sc >= 80) return { icon: '🥇', label: 'ذهبية' };
  if (sc >= 60) return { icon: '🥈', label: 'فضية' };
  return { icon: '🥉', label: 'برونزية' };
}

function startQuiz(lessonId) {
  const { lesson, unit } = findLessonById(lessonId);
  if (!lesson) return;

  const questions = _getLessonQuizQuestions(lesson);
  if (questions.length === 0) {
    const view = document.getElementById('quizContent');
    if (view) view.innerHTML = `
      <button class="btn-back" onclick="renderQuizSection()">← العودة للاختبارات</button>
      <div class="quiz-container" style="text-align:center;padding:40px">
        <p style="font-size:1.2rem">لا توجد أسئلة لهذا الدرس بعد.</p>
        <button class="btn btn-outline mt-3" onclick="renderQuizSection()">← العودة</button>
      </div>
    `;
    return;
  }

  state.quiz.lessonId = lessonId;
  state.quiz.questions = [...questions];
  state.quiz.current = 0;
  state.quiz.score = 0;
  state.quiz.answered = false;

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const view = document.getElementById('quizContent');
  const { questions, current } = state.quiz;
  const { lesson } = findLessonById(state.quiz.lessonId);

  if (current >= questions.length) {
    showQuizResult();
    return;
  }

  const q = questions[current];
  const progress = Math.round((current / questions.length) * 100);
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];

  view.innerHTML = `
    <button class="btn-back" onclick="renderQuizSection()">← العودة للاختبارات</button>
    <div class="quiz-container">
      <div class="quiz-header">
        <div>
          <div style="font-size:0.8rem;opacity:0.85">اختبار: ${lesson ? lesson.title : ''}</div>
          <div style="margin-top:4px">
            <div class="quiz-progress">
              <span style="font-size:0.875rem">${current + 1}/${questions.length}</span>
              <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width:${progress}%"></div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:0.8rem;opacity:0.85;text-align:center">الوقت</div>
          <div class="quiz-timer" id="quizTimer">20</div>
        </div>
      </div>

      <div class="question-card">
        <div class="question-num">السؤال ${current + 1} من ${questions.length}</div>
        <div class="question-text">${q.question}</div>
        <div class="quiz-options" id="quizOptions">
          ${q.options.map((opt, i) => `
            <button class="quiz-option"
                    onclick="answerQuiz(${i})"
                    aria-label="الخيار ${letters[i]}: ${opt}">
              <span class="option-letter">${letters[i]}</span>
              ${opt}
            </button>
          `).join('')}
        </div>
        <div class="feedback-box" id="quizFeedback"></div>
      </div>
    </div>
  `;

  clearInterval(state.quiz.timer);
  state.quiz.timeLeft = 20;
  state.quiz.answered = false;
  updateTimerDisplay(20);
  state.quiz.timer = setInterval(tickTimer, 1000);
}

function tickTimer() {
  state.quiz.timeLeft--;
  updateTimerDisplay(state.quiz.timeLeft);

  if (state.quiz.timeLeft <= 5) {
    const timerEl = document.getElementById('quizTimer');
    if (timerEl) timerEl.classList.add('warning');
  }

  if (state.quiz.timeLeft <= 0) {
    clearInterval(state.quiz.timer);
    if (!state.quiz.answered) autoAnswerWrong();
  }
}

function updateTimerDisplay(t) {
  const el = document.getElementById('quizTimer');
  if (el) el.textContent = t;
}

function autoAnswerWrong() {
  state.quiz.answered = true;
  const q = state.quiz.questions[state.quiz.current];
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach((o, i) => {
    o.disabled = true;
    if (i === q.correct) o.classList.add('correct');
  });
  showQuizFeedback(false, `⏰ انتهى الوقت! الإجابة الصحيحة: ${q.options[q.correct]}`);
  setTimeout(nextQuizQuestion, 2000);
}

function answerQuiz(chosen) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;
  clearInterval(state.quiz.timer);

  const q = state.quiz.questions[state.quiz.current];
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach(o => o.disabled = true);

  const correct = chosen === q.correct;
  if (opts[q.correct]) opts[q.correct].classList.add('correct');

  if (correct) {
    if (opts[chosen]) opts[chosen].classList.add('correct');
    state.quiz.score++;
    showQuizFeedback(true, `✅ إجابة صحيحة! ${q.explanation || ''}`);
  } else {
    if (opts[chosen]) opts[chosen].classList.add('wrong');
    showQuizFeedback(false, `❌ إجابة خاطئة. ${q.explanation || ''}`);
  }

  setTimeout(nextQuizQuestion, 2200);
}

function showQuizFeedback(correct, msg) {
  const fb = document.getElementById('quizFeedback');
  if (!fb) return;
  fb.textContent = msg;
  fb.className = `feedback-box show ${correct ? 'correct-fb' : 'wrong-fb'}`;
}

function nextQuizQuestion() {
  state.quiz.current++;
  renderQuizQuestion();
}

function showQuizResult() {
  const view = document.getElementById('quizContent');
  const { score, questions } = state.quiz;
  const total = questions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  const prev = scores[state.quiz.lessonId] || 0;
  if (percent > prev) {
    scores[state.quiz.lessonId] = percent;
    localStorage.setItem('nawat_scores', JSON.stringify(scores));
  }

  let badgeClass, badgeEmoji, msg;
  if (percent >= 80) {
    badgeClass = 'badge-gold'; badgeEmoji = '🥇'; msg = 'ممتاز! حصلت على الشارة الذهبية!';
  } else if (percent >= 60) {
    badgeClass = 'badge-silver'; badgeEmoji = '🥈'; msg = 'جيد! حصلت على الشارة الفضية!';
  } else {
    badgeClass = 'badge-bronze'; badgeEmoji = '🥉'; msg = 'حصلت على الشارة البرونزية. حاول مرة أخرى!';
  }

  const { lesson } = findLessonById(state.quiz.lessonId);

  view.innerHTML = `
    <div class="quiz-container">
      <div class="question-card">
        <div class="quiz-result">
          <div class="result-badge ${badgeClass}">${badgeEmoji}</div>
          <div class="result-message">${msg}</div>
          <div class="result-details">
            <p>الدرس: <strong>${lesson ? lesson.title : ''}</strong></p>
            <p>نتيجتك: <strong>${score}</strong> من <strong>${total}</strong> إجابة صحيحة</p>
            <p>النسبة المئوية: <strong>${percent}%</strong></p>
          </div>
          <div class="progress-bar" style="max-width:300px;margin:0 auto 24px">
            <div class="progress-fill" style="width:${percent}%;background:${percent>=80?'var(--success)':percent>=60?'var(--warning)':'var(--danger)'}"></div>
          </div>
          <div class="gap-row" style="justify-content:center">
            <button class="btn btn-primary btn-lg" onclick="startQuiz('${state.quiz.lessonId}')">
              🔄 إعادة الاختبار
            </button>
            <button class="btn btn-outline btn-lg" onclick="renderQuizSection()">
              📝 اختبارات أخرى
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// ===== الشات بوت =====
// ============================================================

let botTyping = false;

function initChatbot() {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;

  msgs.innerHTML = '';

  const greetings = (nawatData.chatbot && nawatData.chatbot.greetings && nawatData.chatbot.greetings.length)
    ? nawatData.chatbot.greetings
    : ['مرحباً! أنا نوات، مساعدك في تعلم العلوم والـ STEM. اسألني عن أي درس!'];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  addMessage(greeting, 'bot');

  renderQuickQuestions();

  const input = document.getElementById('chatInput');
  if (input) {
    input.replaceWith(input.cloneNode(true));
    const newInput = document.getElementById('chatInput');
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

function renderQuickQuestions() {
  const container = document.getElementById('quickQuestions');
  if (!container) return;
  const quick = [
    'ما هي المخلوقات الحية؟',
    'ما أجزاء النبات؟',
    'الفصول الأربعة',
    'ما هو الصلب؟',
    'ما هو الهواء؟',
    'ما هي الطاقة؟',
    'الليل والنهار',
    'ما هو المخلوط؟',
    'الدفع والسحب',
    'أطوار القمر'
  ];

  container.innerHTML = quick.map(q => `
    <button class="quick-q" onclick="sendQuickMessage('${q}')" aria-label="${q}">${q}</button>
  `).join('');
}

function sendQuickMessage(text) {
  const input = document.getElementById('chatInput');
  if (input) input.value = text;
  sendMessage();
}

function sendMessage() {
  if (botTyping) return;
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';
  input.focus();

  botTyping = true;
  setTimeout(() => {
    const response = getBotResponse(text);
    addMessage(response, 'bot');
    botTyping = false;
  }, 700 + Math.random() * 500);
}

// ===== قاعدة معرفة البوت الشاملة =====
function getBotResponse(text) {
  const lower = text.toLowerCase().trim();

  // ===== ردود مباشرة بعناوين الدروس =====
  const lessonTitleResponses = [
    {
      keywords: ['المخلوقات الحية'],
      response: 'المخلوقات الحية تحتاج إلى الماء والهواء والغذاء، وتنمو وتتغير وتتكاثر. من أمثلتها الإنسان والنباتات والحيوانات، وهي تختلف عن الأشياء غير الحية مثل الحجر والكرسي.'
    },
    {
      keywords: ['النباتات', 'أجزاء النبات'],
      response: 'للنبات أجزاء رئيسة: الجذور تمتص الماء، والساق تحمل النبات، والأوراق تصنع الغذاء، والأزهار تكوّن البذور. ويحتاج النبات إلى الماء والهواء وضوء الشمس لينمو.'
    },
    {
      keywords: ['الحيوانات وصفاتها'],
      response: 'تختلف الحيوانات في صفاتها وغطاء أجسامها؛ فمنها ما يغطيه الفرو مثل القطة، ومنها ما يغطيه الريش مثل العصفور، ومنها ما له حراشف مثل السمكة. كما تختلف في طريقة حركتها بحسب بيئتها.'
    },
    {
      keywords: ['مساكن الحيوانات'],
      response: 'لكل حيوان مسكن مناسب له؛ فالسمكة تعيش في الماء، والجمل في الصحراء، وبعض الحيوانات تعيش في الغابة. المسكن المناسب يوفر للحيوان الغذاء والماء والمأوى.'
    },
    {
      keywords: ['الطقس من حولنا', 'الطقس'],
      response: 'الطقس هو حالة الجو في وقت ومكان معين. قد يكون مشمساً أو غائماً أو ممطراً أو عاصفاً، ونختار الملابس والأدوات المناسبة بحسب حالة الطقس.'
    },
    {
      keywords: ['الفصول الأربعة'],
      response: 'الفصول الأربعة هي: الربيع والصيف والخريف والشتاء. ويتغير الطقس والنبات والملابس والأنشطة من فصل إلى آخر.'
    },
    {
      keywords: ['خصائص المواد'],
      response: 'نصف المواد بخصائص مثل اللون والشكل والحجم والملمس. هذه الخصائص تساعدنا على المقارنة بين الأشياء والتعرف عليها بسهولة.'
    },
    {
      keywords: ['المواد الصلبة'],
      response: 'المواد الصلبة لها شكل ثابت وحجم ثابت، مثل الحجر والكتاب والقلم. لذلك تبقى محتفظة بشكلها حتى لو نقلناها من مكان إلى آخر.'
    },
    {
      keywords: ['السوائل'],
      response: 'السوائل تتدفق وتأخذ شكل الإناء الذي توضع فيه، مثل الماء والعصير والحليب. لكنها تحتفظ بمقدارها حتى لو تغير شكل الإناء.'
    },
    {
      keywords: ['الغازات'],
      response: 'الغازات مثل الهواء لا نراها غالباً، لكنها موجودة حولنا. ليس لها شكل ثابت ولا حجم ثابت، وهي تملأ المكان الذي توجد فيه.'
    },
    {
      keywords: ['الطاقة'],
      response: 'الطاقة تجعل الأشياء تعمل أو تتحرك. من صورها الطاقة الحرارية والضوئية والصوتية، ونجدها في الشمس والمصباح والجرس والنار.'
    },
    {
      keywords: ['الحركة والقوة'],
      response: 'القوة تؤثر في الأجسام فتجعلها تتحرك أو تتوقف أو تغير اتجاهها. ومن أمثلتها الدفع والسحب، مثل دفع الكرة أو سحب الحقيبة.'
    },
    {
      keywords: ['الموقع والاتجاهات', 'الموقع والحركة'],
      response: 'نستخدم كلمات مثل فوق وتحت ويمين ويسار وأمام وخلف لوصف موقع الأشياء. وعندما يتحرك الشيء يتغير موقعه، لذلك تساعدنا الاتجاهات على الوصف بدقة.'
    },
    {
      keywords: ['الدفع والسحب'],
      response: 'الدفع يبعد الجسم عنك، والسحب يقربه إليك. وهما نوعان من القوة نستخدمهما كل يوم في فتح الأبواب وتحريك الألعاب والحقائب.'
    },
    {
      keywords: ['الحرارة'],
      response: 'الحرارة نوع من الطاقة نحسها بأجسامنا. من أهم مصادرها الشمس، كما نجدها في النار والمدفأة، ونتعلم دائماً التعامل بحذر مع الأشياء الساخنة.'
    },
    {
      keywords: ['الضوء والصوت'],
      response: 'الضوء يساعدنا على رؤية الأشياء، والصوت نسمعه عندما تهتز الأجسام. من مصادر الضوء الشمس والمصباح، ومن مصادر الصوت الجرس والكلام والطبل.'
    },
    {
      keywords: ['الليل والنهار'],
      response: 'يتعاقب الليل والنهار بسبب دوران الأرض حول نفسها. فالجزء المواجه للشمس يكون فيه نهار، والجزء البعيد عنها يكون فيه ليل.'
    },
    {
      keywords: ['القمر والنجوم'],
      response: 'القمر يظهر بأشكال مختلفة خلال الشهر مثل الهلال والبدر، أما النجوم فهي أجرام بعيدة جداً نراها ليلاً عندما تظلم السماء.'
    },
    {
      keywords: ['المادة تتغير'],
      response: 'قد تتغير المادة بالطي أو القص أو بالتسخين والتبريد. فالثلج يذوب ويصبح ماء، والماء يتجمد ويصبح ثلجاً.'
    },
    {
      keywords: ['المخاليط', 'المخلوط'],
      response: 'المخلوط يتكون من مادتين أو أكثر اختلطتا معاً، مثل الرمل والحصى. ويمكن فصل بعض المخاليط باليد أو بالمصفاة أو بالمغناطيس.'
    }
  ];

  for (const item of lessonTitleResponses) {
    if (matchKeywords(lower, item.keywords)) return item.response;
  }

  // ===== ردود الفصل الأول =====

  // المخلوقات الحية
  if (matchKeywords(lower, ['مخلوق حي', 'مخلوقات حية', 'حي وغير حي', 'حية', 'كائنات حية'])) {
    return 'المخلوقات الحية هي كل الكائنات التي تنمو وتتنفس وتتغذى وتتكاثر. مثلها: النباتات والحيوانات والإنسان. أما الأشياء غير الحية كالحجر والكرسي فلا تملك هذه الخصائص.';
  }
  if (matchKeywords(lower, ['ينمو', 'يتنفس', 'يتغذى', 'يتكاثر', 'خصائص الحياة'])) {
    return 'خصائص المخلوقات الحية أربع: تنمو (تكبر مع الوقت) وتتغذى (تأكل وتشرب) وتتنفس (تأخذ الهواء) وتتكاثر (تنجب صغاراً).';
  }

  // النباتات
  if (matchKeywords(lower, ['نبات', 'نباتات', 'أجزاء النبات', 'أجزاء نبات'])) {
    return 'النبات له أربعة أجزاء رئيسية: الجذور (تثبته وتمتص الماء)، والساق (يحمله ويوصل الماء)، والأوراق (تصنع الغذاء بضوء الشمس)، والأزهار (تنتج البذور).';
  }
  if (matchKeywords(lower, ['جذور', 'الجذور'])) {
    return 'الجذور هي الجزء السفلي من النبات الذي يثبته في التربة ويمتص الماء والأملاح المعدنية من التربة.';
  }
  if (matchKeywords(lower, ['ساق', 'الساق'])) {
    return 'الساق هو الجزء الوسطي الذي يحمل النبات ويوصل الماء والغذاء من الجذور إلى الأوراق.';
  }
  if (matchKeywords(lower, ['أوراق', 'الأوراق', 'ورق النبات'])) {
    return 'الأوراق تصنع الغذاء للنبات باستخدام ضوء الشمس والهواء والماء في عملية تسمى البناء الضوئي.';
  }
  if (matchKeywords(lower, ['أزهار', 'الأزهار', 'زهرة'])) {
    return 'الأزهار هي الجزء الجميل الملون في النبات، وتنتج البذور التي تنمو لتصبح نباتات جديدة.';
  }
  if (matchKeywords(lower, ['بذرة', 'بذور', 'زراعة'])) {
    return 'البذرة تحتاج للنمو: الماء والتربة وضوء الشمس والهواء. تبدأ بالإنبات ثم تخرج الجذور ثم الساق فالأوراق.';
  }

  // الحيوانات
  if (matchKeywords(lower, ['حيوان', 'حيوانات', 'أنواع الحيوانات', 'صفات الحيوانات'])) {
    return 'الحيوانات أنواع كثيرة! بعضها له فرو مثل الأسد والقطة، وبعضها له ريش مثل الطيور، وبعضها له حراشف مثل الأسماك والزواحف.';
  }
  if (matchKeywords(lower, ['فرو', 'الفرو'])) {
    return 'الفرو هو الشعر الكثيف الذي يغطي جسم بعض الحيوانات مثل القطة والأسد والدب، ويحميها من البرد.';
  }
  if (matchKeywords(lower, ['ريش', 'الريش'])) {
    return 'الريش يغطي جسم الطيور ويساعدها على الطيران ويحافظ على دفئها.';
  }
  if (matchKeywords(lower, ['حراشف', 'الحراشف'])) {
    return 'الحراشف قشور صلبة تغطي جسم الأسماك والزواحف مثل التمساح والسمكة، وتحميها وتسهل حركتها في الماء.';
  }

  // مساكن الحيوانات
  if (matchKeywords(lower, ['مسكن', 'مساكن', 'بيئة', 'بيئات', 'أين يعيش'])) {
    return 'كل حيوان يعيش في البيئة التي تناسبه: الأسد في الغابة، والجمل في الصحراء، والسمكة في المحيط والبحر. هذا يسمى التأقلم.';
  }
  if (matchKeywords(lower, ['غابة', 'الغابة'])) {
    return 'الغابة بيئة مليئة بالأشجار والنباتات، تعيش فيها حيوانات كالأسد والقرد والفيل والطيور الملونة.';
  }
  if (matchKeywords(lower, ['صحراء', 'الصحراء'])) {
    return 'الصحراء بيئة جافة حارة، تعيش فيها حيوانات متأقلمة مثل الجمل والثعبان والضب والقنفذ الصحراوي.';
  }
  if (matchKeywords(lower, ['محيط', 'بحر', 'المحيط', 'البحر'])) {
    return 'المحيط والبحر بيئة مائية تعيش فيها الأسماك والحوت والدولفين وقناديل البحر.';
  }
  if (matchKeywords(lower, ['تأقلم', 'التأقلم'])) {
    return 'التأقلم هو قدرة الحيوان على العيش في بيئته الخاصة، مثل الجمل الذي يختزن الماء ويتحمل حرارة الصحراء.';
  }

  // الطقس
  if (matchKeywords(lower, ['طقس', 'الطقس', 'أحوال الجو', 'حالة الجو'])) {
    return 'الطقس يصف حالة الجو في مكان معين ووقت معين. قد يكون الطقس مشمساً أو ممطراً أو غائماً أو عاصفاً.';
  }
  if (matchKeywords(lower, ['مشمس', 'شمس'])) {
    return 'الطقس المشمس تظهر فيه الشمس بوضوح ويكون الجو دافئاً أو حاراً. نلبس ملابس خفيفة ونضع الواقي الشمسي.';
  }
  if (matchKeywords(lower, ['ممطر', 'مطر', 'أمطار'])) {
    return 'الطقس الممطر تسقط فيه قطرات الماء من السحب. المطر مهم لسقاية النباتات وملء الأنهار والبحيرات.';
  }
  if (matchKeywords(lower, ['غائم', 'سحاب', 'غيوم'])) {
    return 'الطقس الغائم تغطي فيه السحب السماء وتحجب الشمس. قد يعقبه مطر.';
  }
  if (matchKeywords(lower, ['ميزان حراري', 'ترمومتر', 'قياس الحرارة', 'درجة الحرارة'])) {
    return 'الميزان الحراري (الترمومتر) هو أداة تقيس درجة حرارة الجو والأشياء. نقرأ الرقم على السلم المدرّج.';
  }

  // الفصول الأربعة
  if (matchKeywords(lower, ['فصول', 'الفصول الأربعة', 'فصل'])) {
    return 'السنة تتكون من أربعة فصول: الربيع (دافئ وتتفتح الأزهار)، الصيف (حار وطويل)، الخريف (تتساقط الأوراق)، الشتاء (بارد وقد يمطر).';
  }
  if (matchKeywords(lower, ['ربيع', 'الربيع'])) {
    return 'الربيع فصل دافئ جميل تتفتح فيه الأزهار وتعود الطيور المهاجرة وتخرج الحيوانات من سباتها الشتوي.';
  }
  if (matchKeywords(lower, ['صيف', 'الصيف'])) {
    return 'الصيف هو الفصل الأكثر حرارة، تكون فيه الشمس قوية وأيامه طويلة. نذهب للبحر ونرتدي ملابس خفيفة.';
  }
  if (matchKeywords(lower, ['خريف', 'الخريف'])) {
    return 'الخريف فصل تبرد فيه الأجواء وتتساقط أوراق بعض الأشجار ويستعد الجو للبرد القادم.';
  }
  if (matchKeywords(lower, ['شتاء', 'الشتاء'])) {
    return 'الشتاء هو الفصل البارد، قد يسقط فيه المطر وأحياناً الثلج في بعض المناطق. نرتدي ملابس دافئة سميكة.';
  }

  // خصائص المواد
  if (matchKeywords(lower, ['خصائص', 'خاصية', 'وصف المواد', 'خصائص الأشياء'])) {
    return 'خصائص المواد أربع رئيسية: اللون (ما تراه العين)، الشكل (هيئة الشيء)، الحجم (صغير أو كبير)، الملمس (ناعم أو خشن أو صلب).';
  }
  if (matchKeywords(lower, ['لون', 'الألوان'])) {
    return 'اللون خاصية نراها بأعيننا. نصف الأشياء بألوانها مثل: أحمر، أزرق، أخضر، أصفر، أبيض، أسود.';
  }
  if (matchKeywords(lower, ['ملمس', 'الملمس'])) {
    return 'الملمس ما تحسه يدك عند لمس الشيء: ناعم مثل الحرير، خشن مثل الخشب، صلب مثل الحجر، طري مثل القطن.';
  }

  // المادة الصلبة
  if (matchKeywords(lower, ['صلب', 'مادة صلبة', 'الصلب', 'المواد الصلبة'])) {
    return 'المادة الصلبة لها شكل ثابت وحجم ثابت لا يتغيران حتى لو وضعتها في إناء مختلف. أمثلة: الحجر، الخشب، الكتاب، القلم.';
  }
  if (matchKeywords(lower, ['شكل ثابت', 'حجم ثابت'])) {
    return 'الشكل الثابت يعني أن الصلب يحتفظ بشكله مهما غيّرنا الإناء. والحجم الثابت يعني أن كمية المادة لا تتغير.';
  }

  // السوائل
  if (matchKeywords(lower, ['سائل', 'سوائل', 'المادة السائلة'])) {
    return 'السائل مادة تتدفق وتأخذ شكل الإناء الذي توضع فيه، لكن حجمه يبقى ثابتاً. أمثلة: الماء، العصير، الحليب، الزيت.';
  }
  if (matchKeywords(lower, ['يتدفق', 'تدفق'])) {
    return 'يتدفق يعني يسيل وينتقل من مكان لآخر. السوائل تتدفق وتملأ شكل أي إناء توضع فيه.';
  }

  // الغازات
  if (matchKeywords(lower, ['غاز', 'غازات', 'المادة الغازية'])) {
    return 'الغاز مادة ليس لها شكل أو حجم ثابت، تملأ أي مكان توضع فيه. أهم الغازات: الهواء والأكسجين.';
  }
  if (matchKeywords(lower, ['هواء', 'الهواء'])) {
    return 'الهواء خليط من الغازات يحيط بالأرض وهو غير مرئي. يحتوي على الأكسجين الذي نتنفسه. نحسه عند هب الريح.';
  }
  if (matchKeywords(lower, ['أكسجين', 'الأكسجين'])) {
    return 'الأكسجين جزء مهم من الهواء يحتاجه الإنسان والحيوان والنبات للتنفس والحياة.';
  }

  // الطاقة
  if (matchKeywords(lower, ['طاقة', 'الطاقة', 'أنواع الطاقة'])) {
    return 'الطاقة هي القدرة على القيام بالعمل وتحريك الأشياء. أنواعها: حرارية (الشمس والنار)، ضوئية (الشمس والمصباح)، وصوتية (الموسيقى والجرس).';
  }
  if (matchKeywords(lower, ['طاقة حرارية', 'الحرارية'])) {
    return 'الطاقة الحرارية هي طاقة الحرارة التي نحسها من الشمس والنار والأجسام الدافئة.';
  }
  if (matchKeywords(lower, ['طاقة ضوئية', 'الضوئية', 'ضوء'])) {
    return 'الطاقة الضوئية هي طاقة الضوء التي تجعلنا نرى، مصادرها: الشمس والمصابيح والشمعة.';
  }
  if (matchKeywords(lower, ['طاقة صوتية', 'الصوتية', 'صوت'])) {
    return 'الطاقة الصوتية هي طاقة الصوت التي نسمعها. تنتج عن اهتزاز الأشياء. أمثلة: الموسيقى، الطبل، الجرس.';
  }
  if (matchKeywords(lower, ['مصدر طاقة', 'مصادر الطاقة', 'الشمس طاقة'])) {
    return 'الشمس هي المصدر الرئيسي للطاقة على الأرض. تعطينا الضوء والحرارة. وهناك أيضاً طاقة الرياح والماء.';
  }

  // القوة والحركة
  if (matchKeywords(lower, ['قوة', 'القوة', 'دفع وسحب'])) {
    return 'القوة هي الدفع أو السحب الذي يؤثر على الأشياء ويحرّكها أو يوقفها أو يغيّر اتجاهها.';
  }
  if (matchKeywords(lower, ['دفع', 'الدفع'])) {
    return 'الدفع هو إبعاد الشيء عنك. مثال: ركل الكرة، دفع الباب، دفع العربة. الدفع الأقوى ينقل الشيء مسافة أبعد.';
  }
  if (matchKeywords(lower, ['سحب', 'السحب'])) {
    return 'السحب هو جذب الشيء نحوك. مثال: فتح الدرج، جرّ الحقيبة، سحب الباب. السحب يقرّب الأشياء إليك.';
  }
  if (matchKeywords(lower, ['حركة', 'الحركة'])) {
    return 'الحركة هي انتقال الشيء من مكان لآخر. تحدث بسبب القوة (الدفع أو السحب). القوة الأكبر تنتج حركة أسرع.';
  }

  // ===== ردود الفصل الثاني =====

  // الموقع والاتجاهات
  if (matchKeywords(lower, ['موقع', 'اتجاه', 'اتجاهات', 'فوق وتحت', 'يمين ويسار', 'أمام وخلف'])) {
    return 'لوصف موقع الأشياء نستخدم كلمات مثل: فوق / تحت / يمين / يسار / أمام / خلف / بجانب / بين. مثال: الكتاب فوق الطاولة.';
  }
  if (matchKeywords(lower, ['فوق', 'تحت'])) {
    return 'فوق تعني أعلى من شيء آخر. تحت تعني أسفل من شيء آخر. مثال: الطائر فوق الشجرة. الحذاء تحت الكرسي.';
  }
  if (matchKeywords(lower, ['يمين', 'يسار'])) {
    return 'يمين ويسار اتجاهان متعاكسان. يمين هو الجهة التي تكتب بها (للمعظم)، ويسار هو الجانب الآخر.';
  }
  if (matchKeywords(lower, ['بجانب', 'بين'])) {
    return 'بجانب تعني على جانب الشيء. بين تعني في المنتصف بين شيئين. مثال: القلم بجانب الكتاب. الولد بين أمه وأبيه.';
  }

  // الحرارة
  if (matchKeywords(lower, ['حرارة', 'الحرارة', 'ساخن وبارد', 'مصادر الحرارة'])) {
    return 'الحرارة نوع من الطاقة نحسها بأجسامنا. مصادرها: الشمس (الأهم)، النار، المدفأة. الأشياء الساخنة خطرة لا نلمسها.';
  }
  if (matchKeywords(lower, ['ساخن', 'بارد', 'دافئ'])) {
    return 'ساخن يعني درجة حرارة عالية (كالشاي والنار). بارد يعني درجة حرارة منخفضة (كالثلج والمثلجات). دافئ في المنتصف.';
  }

  // الضوء والصوت
  if (matchKeywords(lower, ['ضوء', 'مصادر الضوء', 'مصباح'])) {
    return 'الضوء طاقة تجعلنا نرى. مصادره: الشمس (طبيعي)، المصباح والشمعة (صناعي). بدون ضوء لا نرى شيئاً.';
  }
  if (matchKeywords(lower, ['صوت', 'مصادر الصوت', 'اهتزاز'])) {
    return 'الصوت ينتج عن اهتزاز الأشياء. مصادره: الطبل، الجرس، التلفاز، الكلام. الصوت ينتقل عبر الهواء والأشياء.';
  }

  // الليل والنهار
  if (matchKeywords(lower, ['ليل', 'نهار', 'الليل والنهار', 'شروق', 'غروب'])) {
    return 'الليل والنهار يتعاقبان بسبب دوران الأرض حول نفسها. الجزء المواجه للشمس = نهار. الجزء البعيد عنها = ليل.';
  }
  if (matchKeywords(lower, ['دوران الأرض', 'الأرض تدور'])) {
    return 'الأرض كرة كبيرة تدور حول نفسها مرة واحدة كل 24 ساعة (يوم كامل). هذا الدوران هو سبب الليل والنهار.';
  }
  if (matchKeywords(lower, ['شروق الشمس', 'شروق'])) {
    return 'شروق الشمس هو بداية النهار عندما يظهر ضوء الشمس في الأفق في الصباح الباكر.';
  }
  if (matchKeywords(lower, ['غروب الشمس', 'غروب'])) {
    return 'غروب الشمس هو نهاية النهار عندما تختفي الشمس في الأفق مساءً ويبدأ الليل.';
  }

  // القمر والنجوم
  if (matchKeywords(lower, ['قمر', 'القمر', 'أطوار القمر', 'هلال', 'بدر'])) {
    return 'القمر يتغير شكله خلال الشهر. يبدأ هلالاً صغيراً ثم يكبر حتى يصبح بدراً (دائرة كاملة) ثم يصغر مرة أخرى.';
  }
  if (matchKeywords(lower, ['هلال'])) {
    return 'الهلال هو عندما نرى جزءاً صغيراً مضيئاً من القمر في شكل قوس رفيع. يظهر في بداية الشهر أو نهايته.';
  }
  if (matchKeywords(lower, ['بدر'])) {
    return 'البدر هو عندما يكون القمر دائرة كاملة مضيئة في منتصف الشهر القمري.';
  }
  if (matchKeywords(lower, ['نجوم', 'النجوم', 'نجمة'])) {
    return 'النجوم في الحقيقة هي شموس بعيدة جداً عن الأرض. نراها فقط في الليل لأن ضوء الشمس يخفيها نهاراً.';
  }

  // المادة تتغير
  if (matchKeywords(lower, ['المادة تتغير', 'تغيير المادة', 'طي وقص', 'ذوبان', 'تجمد'])) {
    return 'يمكن تغيير المادة بطرق: الطي والقص (للورق والقماش)، التسخين يذيب بعض المواد (الثلج يصبح ماء)، والتبريد يجمد بعضها (الماء يصبح ثلجاً).';
  }
  if (matchKeywords(lower, ['ذوبان', 'يذوب', 'ذاب'])) {
    return 'الذوبان هو تحول الصلب إلى سائل بالتسخين. مثال: الثلج يذوب ويصبح ماء عند التسخين أو في الجو الدافئ.';
  }
  if (matchKeywords(lower, ['تجمد', 'تجميد'])) {
    return 'التجمد هو تحول السائل إلى صلب بالتبريد. مثال: الماء يتجمد ويصبح ثلجاً عند تبريده في الثلاجة أو الجو البارد جداً.';
  }

  // المخاليط
  if (matchKeywords(lower, ['مخلوط', 'مخاليط', 'خلط', 'فصل المخاليط'])) {
    return 'المخلوط ناتج خلط مادتين أو أكثر معاً. مثال: رمل وحصى. يمكن فصل بعض المخاليط بالمصفاة أو المغناطيس أو اليد.';
  }
  if (matchKeywords(lower, ['مصفاة', 'منخل', 'تصفية'])) {
    return 'المصفاة (المنخل) تُستخدم لفصل المواد ذات الأحجام المختلفة. مثال: تمرر الرمل الصغير وتحتفظ بالحصى الكبير.';
  }
  if (matchKeywords(lower, ['مغناطيس'])) {
    return 'المغناطيس يجذب المعادن الحديدية. يُستخدم لفصل المشابك المعدنية من مخلوط يحتوي على رمل أو خرز.';
  }

  // أسئلة عامة عن الموقع
  if (matchKeywords(lower, ['ما هو', 'ما هي', 'ما معنى', 'ما المقصود', 'اشرح', 'عرّف'])) {
    return 'سؤال رائع! أخبرني بالمفهوم الذي تريد معرفته وسأشرحه لك. يمكنك أن تسألني عن: المخلوقات الحية، النباتات، الحيوانات، الطقس، الفصول، المواد، الطاقة، الليل والنهار، القمر، المخاليط وغيرها!';
  }

  // تحيات
  if (matchKeywords(lower, ['مرحبا', 'مرحباً', 'هلا', 'السلام', 'صباح', 'مساء', 'أهلاً', 'أهلا', 'سلام'])) {
    return 'أهلاً وسهلاً! أنا نوات، مساعدك في العلوم والـ STEM. اسألني عن أي درس في الفصلين الأول والثاني!';
  }

  // شكر
  if (matchKeywords(lower, ['شكراً', 'شكرا', 'ممتاز', 'رائع', 'أحسنت'])) {
    return 'العفو! يسعدني مساعدتك. هل لديك أي سؤال آخر عن دروسنا؟';
  }

  // STEM
  if (matchKeywords(lower, ['stem', 'ستيم', 'علوم وتقنية', 'هندسة ورياضيات'])) {
    return 'STEM اختصار لـ: العلوم (Science) والتقنية (Technology) والهندسة (Engineering) والرياضيات (Mathematics). نتعلمها معاً بطريقة ممتعة وتطبيقية!';
  }

  // لا توجد استجابة محددة
  return 'سؤال ممتاز! لم أجد معلومة محددة عن هذا الموضوع. حاول أن تسألني بكلمات أخرى، أو اسألني عن: النباتات، الحيوانات، الطقس، الفصول، المواد (صلب/سائل/غاز)، الطاقة، الليل والنهار، القمر والنجوم، أو المخاليط.';
}

function matchKeywords(text, keywords) {
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

function addMessage(text, from) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${from}`;
  msgDiv.innerHTML = `
    <div class="message-bubble">${escapeHtml(text)}</div>
    <div class="message-time">${time}</div>
  `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}

// ============================================================
// ===== أدوات مساعدة =====
// ============================================================

function findLessonById(lessonId) {
  // البحث في الفصل الأول
  if (window.nawatData && nawatData.grades) {
    for (const grade of nawatData.grades) {
      for (const unit of grade.units) {
        for (const lesson of unit.lessons) {
          if (lesson.id === lessonId) {
            return { lesson, unit, grade };
          }
        }
      }
    }
  }

  // البحث في الفصل الثاني
  if (window.semester2Data && semester2Data.grades && semester2Data.lessons) {
    const sem2Grade = semester2Data.grades[0];
    for (const unit of (sem2Grade.units || [])) {
      for (const lid of (unit.lessons || [])) {
        const lesson = semester2Data.lessons.find(l => l.id === lid);
        if (lesson && lesson.id === lessonId) {
          // بناء وحدة متوافقة مع الفصل الأول
          const normalizedUnit = {
            id: unit.id,
            name: unit.title || unit.name,
            icon: unit.icon || '📗',
            color: unit.color || '#4CAF50',
            lessons: (unit.lessons || []).map(id => semester2Data.lessons.find(l => l.id === id)).filter(Boolean)
          };
          return { lesson, unit: normalizedUnit, grade: sem2Grade };
        }
      }
    }
  }

  return { lesson: null, unit: null, grade: null };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
