let potholes = [];
let draggingPothole = null;
let offsetX, offsetY;
const potholeHeight = 50;  // Висота ямки в пікселях

async function addPothole() {
    const width = parseFloat(document.getElementById('width').value);
    const length = parseFloat(document.getElementById('length').value);

    if (isNaN(width) || isNaN(length) || width <= 0 || length <= 0) {
        alert('Будь ласка, введіть коректні значення ширини і довжини.');
        return;
    }

    try {
        const response = await fetch('/add_pothole', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ width, length })
        });

        if (!response.ok) {
            throw new Error('Мережна помилка');
        }

        const data = await response.json();

        if (data.success) {
            potholes = data.potholes;
            updateTable(potholes);
            updateSummary(data.summary);
            drawPotholes(potholes);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function insertPothole() {
    const index = parseInt(document.getElementById('index').value) - 1;
    const width = parseFloat(document.getElementById('insert-width').value);
    const length = parseFloat(document.getElementById('insert-length').value);

    if (isNaN(index) || isNaN(width) || isNaN(length) || width <= 0 || length <= 0 || index < 0 || index > potholes.length) {
        alert('Будь ласка, введіть коректні значення індексу, ширини і довжини.');
        return;
    }

    try {
        const response = await fetch('/add_pothole', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ index, width, length })
        });

        if (!response.ok) {
            throw new Error('Мережна помилка');
        }

        const data = await response.json();

        if (data.success) {
            potholes = data.potholes;
            updateTable(potholes);
            updateSummary(data.summary);
            drawPotholes(potholes);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function updatePothole(index, width, length) {
    try {
        const response = await fetch('/update_pothole', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ index, width, length })
        });

        const data = await response.json();

        if (data.success) {
            potholes = data.potholes;
            updateTable(potholes);
            updateSummary(data.summary);
            drawPotholes(potholes);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function removePothole(index) {
    try {
        const response = await fetch('/remove_pothole', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ index })
        });

        const data = await response.json();

        if (data.success) {
            potholes = data.potholes;
            updateTable(potholes);
            updateSummary(data.summary);
            drawPotholes(potholes);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function savePotholes() {
    const filename = document.getElementById('save-filename').value;

    try {
        const response = await fetch('/save_potholes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ filename, potholes: JSON.stringify(potholes) })
        });

        if (response.ok) {
            alert('Дані успішно збережено!');
        } else {
            alert('Не вдалося зберегти дані.');
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function loadPotholes() {
    const filename = document.getElementById('load-filename').value;

    try {
        const response = await fetch('/load_potholes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ filename })
        });

        if (response.ok) {
            const data = await response.json();
            potholes = JSON.parse(data.potholes);
            updateTable(potholes);
            updateSummary(data.summary);
            drawPotholes(potholes);
        } else {
            alert('Не вдалося завантажити дані.');
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function exportPotholes() {
    const filename = document.getElementById('export-filename').value;

    try {
        const response = await fetch('/export_potholes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ filename, potholes: JSON.stringify(potholes) })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            alert('Не вдалося експортувати дані.');
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function importPotholes() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
        alert('Будь ласка, виберіть файл для імпорту.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/import_potholes', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            potholes = JSON.parse(data.potholes);
            updateTable(potholes);
            updateSummary(data.summary);
            drawPotholes(potholes);
        } else {
            alert('Не вдалося імпортувати дані.');
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

async function generatePDF() {
    const filename = document.getElementById('pdf-filename').value;

    try {
        drawPotholes(potholes);  // Генеруємо зображення перед створенням PDF

        const canvas = document.getElementById('roadCanvas');
        const image = canvas.toDataURL("image/png");

        await fetch('/save_road_image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ image_data: image })
        });

        const response = await fetch('/generate_pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ filename })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            alert('Не вдалося згенерувати PDF-звіт.');
        }
    } catch (error) {
        alert(`Сталася помилка: ${error.message}`);
    }
}

function updateTable(potholes) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    potholes.forEach((p, index) => {
        const row = `<tr>
            <td>${index + 1}</td>
            <td><input type="number" value="${p.width}" step="0.01" onchange="updatePothole(${index}, this.value, ${p.length})"></td>
            <td><input type="number" value="${p.length}" step="0.01" onchange="updatePothole(${index}, ${p.width}, this.value)"></td>
            <td>${p.area.toFixed(2)}</td>
            <td><button onclick="removePothole(${index})">❌</button></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

function updateSummary(summary) {
    document.getElementById('summary').innerText = `
        Маленькі ямки (<=5м²): ${summary.small_area} м²
        Середні ямки (5-25м²): ${summary.medium_area} м²
        Великі ямки (>25м²): ${summary.large_area} м²
        Загальна площа: ${summary.total_area} м²
    `;
}

function drawPotholes(potholes) {
    const canvas = document.getElementById('roadCanvas');
    const ctx = canvas.getContext('2d');

    // Висота полотна в залежності від кількості ямок
    canvas.height = Math.max(potholes.length * potholeHeight, 800);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Малюємо вісь дороги
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'gray';
    ctx.stroke();

    potholes.forEach((pothole, index) => {
        drawPothole(ctx, canvas, pothole, index);
    });

    // Зберігаємо зображення дороги з ямками в файл
    const image = canvas.toDataURL("image/png");
    await fetch('/save_road_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ image_data: image })
    });
}

function drawPothole(ctx, canvas, pothole, index) {
    const x = pothole.x || (canvas.width / 2 - pothole.width * 5);
    const y = pothole.y || (index * potholeHeight); // Розташування ямок по вертикалі
    const width = pothole.width * 10; // Масштабування
    const length = pothole.length * 10;

    ctx.fillStyle = 'brown';
    ctx.fillRect(x, y, width, length);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, width, length);

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(index + 1, x + width / 2 - 5, y + length / 2 + 5);

    pothole.x = x;
    pothole.y = y;
}

function onMouseDown(event) {
    const canvas = document.getElementById('roadCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    potholes.forEach((pothole, index) => {
        const potholeX = pothole.x;
        const potholeY = pothole.y;
        const width = pothole.width * 10;
        const length = pothole.length * 10;

        if (x >= potholeX && x <= potholeX + width && y >= potholeY && y <= potholeY + length) {
            draggingPothole = index;
            offsetX = x - potholeX;
            offsetY = y - potholeY;
        }
    });
}

function onMouseUp() {
    draggingPothole = null;
}

function onMouseMove(event) {
    if (draggingPothole === null) return;

    const canvas = document.getElementById('roadCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - offsetX;
    const y = event.clientY - rect.top - offsetY;

    potholes[draggingPothole].x = x;
    potholes[draggingPothole].y = y;

    drawPotholes(potholes);
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('roadCanvas');
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
});
