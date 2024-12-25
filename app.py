from flask import Flask, render_template, request, jsonify, send_file
import json
import pandas as pd
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Image
import base64

app = Flask(__name__)

# Список для зберігання даних про ямки
potholes = []

def calculate_summary():
    """Обчислює зведення площ ямок за категоріями."""
    small_area = sum(p['area'] for p in potholes if p['area'] <= 5)
    medium_area = sum(p['area'] for p in potholes if 5 < p['area'] <= 25)
    large_area = sum(p['area'] for p in potholes if p['area'] > 25)
    total_area = small_area + medium_area + large_area

    return {
        'small_area': round(small_area, 2),
        'medium_area': round(medium_area, 2),
        'large_area': round(large_area, 2),
        'total_area': round(total_area, 2)
    }

@app.route('/')
def index():
    """Головна сторінка з інтерфейсом користувача."""
    return render_template('index.html')

@app.route('/add_pothole', methods=['POST'])
def add_pothole():
    """Додає нову ямку."""
    try:
        width = float(request.form['width'])
        length = float(request.form['length'])
        area = width * length
        index = request.form.get('index')

        pothole = {'width': width, 'length': length, 'area': area}
        
        if index is not None:
            index = int(index)
            potholes.insert(index, pothole)
        else:
            potholes.append(pothole)
            
        summary = calculate_summary()

        return jsonify(success=True, potholes=potholes, summary=summary)
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/update_pothole', methods=['POST'])
def update_pothole():
    """Оновлює параметри ямки."""
    try:
        index = int(request.form['index'])
        width = float(request.form['width'])
        length = float(request.form['length'])
        area = width * length

        if 0 <= index < len(potholes):
            potholes[index] = {'width': width, 'length': length, 'area': area}
            summary = calculate_summary()
            return jsonify(success=True, potholes=potholes, summary=summary)
        else:
            return jsonify(success=False, message="Недійсний індекс ямки.")
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/remove_pothole', methods=['POST'])
def remove_pothole():
    """Видаляє ямку."""
    try:
        index = int(request.form['index'])

        if 0 <= index < len(potholes):
            potholes.pop(index)
            summary = calculate_summary()
            return jsonify(success=True, potholes=potholes, summary=summary)
        else:
            return jsonify(success=False, message="Недійсний індекс ямки.")
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/save_potholes', methods=['POST'])
def save_potholes():
    """Зберігає дані про ямки у файл JSON."""
    try:
        filename = request.form['filename']
        potholes_data = request.form['potholes']
        with open(f'{filename}.json', 'w') as file:
            file.write(potholes_data)
        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/load_potholes', methods=['POST'])
def load_potholes():
    """Завантажує дані про ямки з файлу JSON."""
    try:
        global potholes
        filename = request.form['filename']
        with open(f'{filename}.json', 'r') as file:
            potholes = json.load(file)
        summary = calculate_summary()
        return jsonify(success=True, potholes=json.dumps(potholes), summary=summary)
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/export_potholes', methods=['POST'])
def export_potholes():
    """Експортує дані про ямки у файл Excel."""
    try:
        filename = request.form['filename']
        potholes_data = request.form['potholes']
        df = pd.read_json(BytesIO(potholes_data.encode('utf-8')))
        buffer = BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Ямки')
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f'{filename}.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/import_potholes', methods=['POST'])
def import_potholes():
    """Імпортує дані про ямки з файлу Excel."""
    try:
        global potholes
        file = request.files['file']
        df = pd.read_excel(file)
        potholes = df.to_dict(orient='records')
        summary = calculate_summary()
        return jsonify(success=True, potholes=json.dumps(potholes), summary=summary)
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/save_road_image', methods=['POST'])
def save_road_image():
    """Зберігає зображення дороги з ямками у файл."""
    try:
        image_data = request.form['image_data']
        with open('road_image.png', 'wb') as f:
            f.write(base64.b64decode(image_data.split(',')[1]))
        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    """Генерує PDF-звіт з даними про ямки."""
    try:
        filename = request.form['filename']
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Заголовок
        elements.append(Paragraph("Звіт про ямковий ремонт", styles['Title']))
        
        # Таблиця з даними про ямки
        data = [["№", "Ширина (м)", "Довжина (м)", "Площа (м²)", "Координати (x, y)"]]
        for i, pothole in enumerate(potholes, start=1):
            data.append([i, pothole['width'], pothole['length'], pothole['area'], f"({pothole.get('x', 'N/A')}, {pothole.get('y', 'N/A')})"])
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)
        
        # Додаємо зведення
        summary = calculate_summary()
        elements.append(Paragraph("Зведення:", styles['Heading2']))
        elements.append(Paragraph(f"Маленькі ямки (<=5м²): {summary['small_area']} м²", styles['BodyText']))
        elements.append(Paragraph(f"Середні ямки (5-25м²): {summary['medium_area']} м²", styles['BodyText']))
        elements.append(Paragraph(f"Великі ямки (>25м²): {summary['large_area']} м²", styles['BodyText']))
        elements.append(Paragraph(f"Загальна площа: {summary['total_area']} м²", styles['BodyText']))

        # Додаємо зображення дороги з ямками
        road_image = 'road_image.png'
        elements.append(Paragraph("Зображення дороги з ямками:", styles['Heading2']))
        elements.append(Image(road_image, width=400, height=300))
        
        doc.build(elements)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f'{filename}.pdf', mimetype='application/pdf')
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/reset', methods=['POST'])
def reset():
    """Очищає список ямок."""
    try:
        potholes.clear()
        summary = calculate_summary()
        return jsonify(success=True, potholes=potholes, summary=summary)
    except Exception as e:
        return jsonify(success=False, message=str(e))

if __name__ == '__main__':
    app.run(debug=True)
