# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# 尝试注册中文字体
try:
    # Windows 字体路径
    font_paths = [
        'C:/Windows/Fonts/msyh.ttc',
        'C:/Windows/Fonts/simhei.ttf',
        'C:/Windows/Fonts/simsun.ttc',
    ]
    font_registered = False
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                pdfmetrics.registerFont(TTFont('Chinese', font_path))
                font_registered = True
                break
            except:
                continue
    
    if not font_registered:
        print("警告：未找到中文字体，使用默认字体")
        font_name = 'Helvetica'
    else:
        font_name = 'Chinese'
except Exception as e:
    print(f"字体注册失败: {e}")
    font_name = 'Helvetica'

# 创建 PDF
output_path = 'C:/Users/78778/Desktop/甘肃古戏台调查-行程规划.pdf'
doc = SimpleDocTemplate(output_path, pagesize=A4)

# 定义样式
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontName=font_name,
    fontSize=24,
    spaceAfter=30,
    alignment=1  # 居中
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontName=font_name,
    fontSize=16,
    spaceAfter=12,
    textColor=colors.HexColor('#1890ff')
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontName=font_name,
    fontSize=12,
    spaceAfter=6
)

# 内容
content = []

# 标题
content.append(Paragraph('甘肃古戏台调查 - 行程规划', title_style))
content.append(Spacer(1, 20))

# 项目信息
content.append(Paragraph('项目信息', heading_style))
project_info = [
    ['项目名称', '甘肃古戏台调查'],
    ['考察省份', '甘肃省'],
    ['考察主题', '古戏台'],
    ['出发城市', '太原'],
    ['计划天数', '10天（5/30-6/8）'],
    ['出行人数', '4人（2男2女）'],
    ['交通方式', '自驾'],
    ['车辆安排', '1辆SUV'],
    ['住宿安排', '华住会为主（9晚），2间房'],
]

table = Table(project_info, colWidths=[120, 300])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#1890ff')),
    ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 12),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9d9d9')),
]))
content.append(table)
content.append(Spacer(1, 20))

# 行程概览
content.append(Paragraph('行程概览', heading_style))
overview_info = [
    ['总天数', '10天'],
    ['调查点', '29个'],
    ['总里程', '2,650公里'],
    ['总行驶时间', '32小时'],
    ['预计费用', '住宿约4,720-5,920元 + 油费约1,400元 + 餐饮约2,000元'],
]

table = Table(overview_info, colWidths=[120, 300])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#52c41a')),
    ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 12),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9d9d9')),
]))
content.append(table)
content.append(Spacer(1, 20))

# 住宿安排
content.append(Paragraph('住宿安排', heading_style))
hotel_info = [
    ['晚次', '日期', '城市', '酒店名称', '价格'],
    ['D1', '5/30', '庆阳', '全季酒店（庆阳西峰店）', '280-350元'],
    ['D2', '5/31', '庆阳', '全季酒店（庆阳西峰店）', '280-350元'],
    ['D3', '6/1', '平凉', '全季酒店（平凉崆峒山店）', '280-350元'],
    ['D4', '6/2', '天水', '全季酒店（天水中心广场店）', '280-350元'],
    ['D5', '6/3', '康县', '全季酒店（康县店）', '260-320元'],
    ['D6', '6/4', '临潭', '全季酒店（临潭店）', '260-320元'],
    ['D7', '6/5', '兰州', '全季酒店（兰州西站店）', '280-350元'],
    ['D8', '6/6', '武威', '全季酒店（武威万达广场店）', '260-320元'],
    ['D9', '6/7', '张掖', '全季酒店（张掖西站店）', '280-350元'],
]

table = Table(hotel_info, colWidths=[60, 60, 60, 180, 80])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fa8c16')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9d9d9')),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fafafa')),
]))
content.append(table)
content.append(Spacer(1, 10))
content.append(Paragraph('住宿总费用：约 4,720-5,920元（2间房 × 9晚）', normal_style))

# 生成 PDF
doc.build(content)
print(f'✅ PDF 已生成：{output_path}')
