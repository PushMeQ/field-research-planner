# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# 注册中文字体
font_paths = ['C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/simhei.ttf', 'C:/Windows/Fonts/simsun.ttc']
font_name = 'Helvetica'
for font_path in font_paths:
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont('Chinese', font_path))
            font_name = 'Chinese'
            break
        except:
            continue

# 创建 PDF
output_path = 'C:/Users/78778/Desktop/甘肃古戏台调查-行程规划.pdf'
doc = SimpleDocTemplate(output_path, pagesize=A4)

# 定义样式
styles = getSampleStyleSheet()
title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontName=font_name, fontSize=24, spaceAfter=30, alignment=1)
heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontName=font_name, fontSize=16, spaceAfter=12, textColor=colors.HexColor('#1890ff'))
normal_style = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontName=font_name, fontSize=12, spaceAfter=6)

# 内容
content = []

# 标题
content.append(Paragraph('甘肃古戏台调查 - 行程规划', title_style))
content.append(Spacer(1, 20))

# 项目信息
content.append(Paragraph('一、项目信息', heading_style))
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
content.append(Paragraph('二、行程概览', heading_style))
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
content.append(Paragraph('三、住宿安排', heading_style))
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
content.append(Spacer(1, 20))

# 每日行程详情
content.append(Paragraph('四、每日行程详情', heading_style))

daily_plans = [
    {'day': 1, 'date': '5/30', 'title': '太原 → 庆阳', 'points': ['报德寺戏台'], 'driveTime': '5-6小时（高铁）', 'distance': '320公里', 'hotel': '全季酒店（庆阳西峰店）'},
    {'day': 2, 'date': '5/31', 'title': '庆阳市内', 'points': ['报德寺戏台', '清音楼戏台', '新堡村戏台', '店头村戏台'], 'driveTime': '4.5小时', 'distance': '280公里', 'hotel': '全季酒店（庆阳西峰店）'},
    {'day': 3, 'date': '6/1', 'title': '庆阳 → 平凉', 'points': ['白家村古戏台', '老戏台', '打虎村戏台', '红军楼'], 'driveTime': '5小时', 'distance': '350公里', 'hotel': '全季酒店（平凉崆峒山店）'},
    {'day': 4, 'date': '6/2', 'title': '平凉 → 天水', 'points': ['龙头寺戏台', '五阳观戏台', '龙王庙', '金山寺戏台'], 'driveTime': '4小时', 'distance': '280公里', 'hotel': '全季酒店（天水中心广场店）'},
    {'day': 5, 'date': '6/3', 'title': '天水 → 陇南', 'points': ['西南川口戏楼', '牛坡村古戏台', '麻池大爷庙戏楼', '文昌宫戏楼'], 'driveTime': '4.5小时', 'distance': '320公里', 'hotel': '全季酒店（康县店）'},
    {'day': 6, 'date': '6/4', 'title': '陇南 → 甘南', 'points': ['单幢式戏楼', '大桥关村戏台', '城隍庙戏台'], 'driveTime': '4小时', 'distance': '280公里', 'hotel': '全季酒店（临潭店）'},
    {'day': 7, 'date': '6/5', 'title': '甘南 → 兰州', 'points': ['红城山陕会馆'], 'driveTime': '3小时', 'distance': '200公里', 'hotel': '全季酒店（兰州西站店）'},
    {'day': 8, 'date': '6/6', 'title': '兰州 → 白银 → 武威', 'points': ['陇西川古乐楼', '平堡灯山楼', '平堡戏台'], 'driveTime': '4小时', 'distance': '300公里', 'hotel': '全季酒店（武威万达广场店）'},
    {'day': 9, 'date': '6/7', 'title': '武威 → 张掖', 'points': ['陈春村戏楼', '上花园村戏楼'], 'driveTime': '3.5小时', 'distance': '250公里', 'hotel': '全季酒店（张掖西站店）'},
    {'day': 10, 'date': '6/8', 'title': '张掖 → 太原', 'points': [], 'driveTime': '5-6小时（高铁+飞机）', 'distance': '返程', 'hotel': None},
]

for plan in daily_plans:
    content.append(Paragraph(f'第{plan["day"]}天：{plan["title"]}', ParagraphStyle('DayTitle', parent=styles['Heading3'], fontName=font_name, fontSize=14, spaceAfter=8, textColor=colors.HexColor('#1890ff'))))
    
    day_info = [
        ['日期', plan['date']],
        ['行驶时间', plan['driveTime']],
        ['总距离', plan['distance']],
        ['点位数量', f'{len(plan["points"])}个'],
    ]
    if plan['hotel']:
        day_info.append(['住宿', plan['hotel']])
    
    table = Table(day_info, colWidths=[80, 340])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e6f7ff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), font_name),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d9d9d9')),
    ]))
    content.append(table)
    content.append(Spacer(1, 8))
    
    if plan['points']:
        content.append(Paragraph('考察点位：', ParagraphStyle('PointsTitle', parent=styles['Normal'], fontName=font_name, fontSize=12, spaceAfter=4)))
        for i, point in enumerate(plan['points'], 1):
            content.append(Paragraph(f'{i}. {point}', normal_style))
    
    content.append(Spacer(1, 15))

# 生成 PDF
doc.build(content)
print(f'✅ PDF 已生成：{output_path}')
