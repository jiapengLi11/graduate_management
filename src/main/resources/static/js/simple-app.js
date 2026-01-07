// 研究生信息管理系统前端脚本（精简版）
// 负责数据获取、表格渲染、筛选、排序及导出

let students = [];
let filteredStudents = [];
let sortState = { key: 'id', asc: true };

const el = (id) => document.getElementById(id);

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    attachGlobalEvents();
    loadStudents();
});

function attachGlobalEvents() {
    const searchInput = el('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleFilterChange);
    }

    const majorFilter = el('majorFilter');
    const gradeFilter = el('gradeFilter');
    [majorFilter, gradeFilter].forEach((sel) => {
        if (sel) sel.addEventListener('change', handleFilterChange);
    });
}

async function loadStudents() {
    showLoading(true);
    toggleTable(false);
    toggleNoData(false);

    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        students = await res.json();
        if (!Array.isArray(students)) {
            throw new Error('返回数据格式错误');
        }
        filteredStudents = [...students];

        renderStats(filteredStudents);
        renderTable(filteredStudents);
        updateTime();

        toggleTable(true);
    } catch (err) {
        console.error('加载数据失败:', err);
        toggleNoData(true, '数据加载失败，请检查后端接口或稍后重试。');
    } finally {
        showLoading(false);
    }
}

function handleFilterChange() {
    const keyword = (el('searchInput')?.value || '').trim().toLowerCase();
    const major = el('majorFilter')?.value || 'all';
    const grade = el('gradeFilter')?.value || 'all';

    filteredStudents = students.filter((s) => {
        const hitKeyword =
            !keyword ||
            [s.name, s.studentId, s.major, s.advisor, s.username]
                .filter(Boolean)
                .some((v) => v.toLowerCase().includes(keyword));

        const hitMajor = major === 'all' || s.major === major;
        const hitGrade = grade === 'all' || s.grade === grade;

        return hitKeyword && hitMajor && hitGrade;
    });

    applySort();
    renderStats(filteredStudents);
    renderTable(filteredStudents);
    toggleNoData(filteredStudents.length === 0);
}

function sortTable(key) {
    if (sortState.key === key) {
        sortState.asc = !sortState.asc;
    } else {
        sortState = { key, asc: true };
    }
    applySort();
    renderTable(filteredStudents);
}

function applySort() {
    const { key, asc } = sortState;
    filteredStudents.sort((a, b) => {
        const v1 = a?.[key];
        const v2 = b?.[key];

        if (typeof v1 === 'number' && typeof v2 === 'number') {
            return asc ? v1 - v2 : v2 - v1;
        }
        const s1 = (v1 ?? '').toString();
        const s2 = (v2 ?? '').toString();
        return asc ? s1.localeCompare(s2) : s2.localeCompare(s1);
    });
}

function renderTable(list) {
    const tbody = el('studentTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    list.forEach((s) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="student-id">${safe(s.id)}</td>
            <td>${safe(s.name)}</td>
            <td>${safe(s.studentId)}</td>
            <td>${renderGender(s.gender)}</td>
            <td>${safe(s.age)}</td>
            <td>${safe(s.major)}</td>
            <td>${safe(s.advisor)}</td>
            <td>${renderGrade(s.grade)}</td>
            <td>${renderGpa(s.gpa)}</td>
            <td>${renderStatus(s.status)}</td>
            <td class="actions">
                <button onclick="showDetail(${safe(s.id)})">详情</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderStats(list) {
    el('totalStudents').innerText = list.length;

    const ages = list.map((s) => Number(s.age)).filter((n) => !isNaN(n));
    const gpas = list.map((s) => Number(s.gpa)).filter((n) => !isNaN(n));

    el('avgAge').innerText = ages.length
        ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1)
        : '0';
    el('avgGpa').innerText = gpas.length
        ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2)
        : '0.00';

    const maleCount = list.filter((s) => s.gender === '男').length;
    const femaleCount = list.filter((s) => s.gender === '女').length;
    el('maleCount').innerText = maleCount;
    el('femaleCount').innerText = femaleCount;
}

function showDetail(id) {
    const student = students.find((s) => String(s.id) === String(id));
    if (!student) return;

    const modal = el('detailModal');
    const content = el('detailContent');
    const title = el('detailTitle');

    title.innerText = `${safe(student.name)} 的详情`;
    content.innerHTML = `
        <p><strong>学号：</strong>${safe(student.studentId)}</p>
        <p><strong>用户名：</strong>${safe(student.username)}</p>
        <p><strong>年龄：</strong>${safe(student.age)}</p>
        <p><strong>性别：</strong>${safe(student.gender)}</p>
        <p><strong>专业：</strong>${safe(student.major)}</p>
        <p><strong>导师：</strong>${safe(student.advisor)}</p>
        <p><strong>年级：</strong>${safe(student.grade)}</p>
        <p><strong>状态：</strong>${safe(student.status)}</p>
        <p><strong>入学日期：</strong>${safe(student.enrollmentDate)}</p>
        <p><strong>预计毕业：</strong>${safe(student.expectedGraduation)}</p>
        <p><strong>GPA：</strong>${safe(student.gpa)}</p>
        <p><strong>更新时间：</strong>${safe(student.updateTime)}</p>
        <p><strong>邮箱：</strong>${safe(student.email)}</p>
        <p><strong>电话：</strong>${safe(student.phone)}</p>
    `;

    modal.style.display = 'flex';
    modal.onclick = (e) => {
        if (e.target === modal) closeDetailModal();
    };
}

function closeDetailModal() {
    const modal = el('detailModal');
    modal.style.display = 'none';
}

function renderGender(gender) {
    const isMale = gender === '男';
    const cls = isMale ? 'gender-badge gender-male' : 'gender-badge gender-female';
    return `<span class="${cls}">${safe(gender)}</span>`;
}

function renderGrade(grade) {
    const map = { '研一': 'grade-1', '研二': 'grade-2', '研三': 'grade-3' };
    const cls = map[grade] || '';
    return `<span class="grade-badge ${cls}">${safe(grade)}</span>`;
}

function renderStatus(status) {
    const map = {
        '在读': 'status-reading',
        '毕业': 'status-graduation',
        '实习': 'status-intern',
        '休学': 'status-suspension'
    };
    const cls = map[status] || 'status-reading';
    return `<span class="status-badge ${cls}">${safe(status)}</span>`;
}

function renderGpa(gpa) {
    const num = Number(gpa);
    const val = isNaN(num) ? '0.00' : num.toFixed(2);
    return `<span class="gpa-badge">${val}</span>`;
}

function exportData() {
    if (!filteredStudents.length) {
        alert('无数据可导出');
        return;
    }

    const headers = [
        'ID', '用户名', '学号', '姓名', '年龄', '性别', '邮箱', '电话',
        '专业', '导师', '年级', '状态', '入学日期', '预计毕业', 'GPA', '更新时间'
    ];

    const rows = filteredStudents.map((s) => [
        s.id, s.username, s.studentId, s.name, s.age, s.gender, s.email, s.phone,
        s.major, s.advisor, s.grade, s.status, s.enrollmentDate,
        s.expectedGraduation, s.gpa, s.updateTime
    ]);

    const csv = [headers, ...rows]
        .map((r) => r.map(csvEscape).join(','))
        .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function csvEscape(val) {
    const str = val == null ? '' : String(val);
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function updateTime() {
    const elUpdate = el('updateTime');
    if (!elUpdate) return;
    const now = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : n);
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    elUpdate.innerText = ts;
}

function toggleTable(show) {
    const table = el('studentTable');
    if (table) table.style.display = show ? 'table' : 'none';
}

function showLoading(show) {
    const loading = el('loading');
    if (loading) loading.style.display = show ? 'block' : 'none';
}

function toggleNoData(show, message) {
    const noData = el('noData');
    if (noData) {
        noData.style.display = show ? 'block' : 'none';
        const p = noData.querySelector('p');
        if (p && message) p.innerText = message;
    }
}

function safe(val) {
    if (val === null || val === undefined) return '';
    return String(val);
}

