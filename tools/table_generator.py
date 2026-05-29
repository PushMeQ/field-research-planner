#!/usr/bin/env python3
"""
表格生成器
自动检测内容长度，生成对齐的 ASCII 表格
"""

def calculate_column_width(data, col_index):
    """计算列的最大宽度"""
    max_width = 0
    for row in data:
        if col_index < len(row):
            # 计算中文字符宽度（中文字符占2个宽度）
            width = 0
            for char in str(row[col_index]):
                if '一' <= char <= '鿿':
                    width += 2
                else:
                    width += 1
            max_width = max(max_width, width)
    return max_width

def pad_string(s, width):
    """填充字符串到指定宽度"""
    current_width = 0
    for char in str(s):
        if '一' <= char <= '鿿':
            current_width += 2
        else:
            current_width += 1

    padding = width - current_width
    return str(s) + ' ' * max(0, padding)

def generate_table(headers, data):
    """
    生成 ASCII 表格

    参数:
        headers: 表头列表
        data: 数据列表（二维数组）

    返回:
        格式化的表格字符串
    """
    # 计算每列的最大宽度
    col_widths = []
    for i in range(len(headers)):
        width = calculate_column_width([headers] + data, i)
        col_widths.append(width)

    # 生成表格
    lines = []

    # 顶部边框
    top_border = '┌'
    for i, width in enumerate(col_widths):
        top_border += '─' * (width + 2)
        if i < len(col_widths) - 1:
            top_border += '┬'
    top_border += '┐'
    lines.append(top_border)

    # 表头
    header_line = '│'
    for i, header in enumerate(headers):
        header_line += ' ' + pad_string(header, col_widths[i]) + ' '
        if i < len(col_widths) - 1:
            header_line += '│'
    header_line += '│'
    lines.append(header_line)

    # 表头分隔线
    header_sep = '├'
    for i, width in enumerate(col_widths):
        header_sep += '─' * (width + 2)
        if i < len(col_widths) - 1:
            header_sep += '┼'
    header_sep += '┤'
    lines.append(header_sep)

    # 数据行
    for row_idx, row in enumerate(data):
        data_line = '│'
        for i in range(len(headers)):
            cell = row[i] if i < len(row) else ''
            data_line += ' ' + pad_string(cell, col_widths[i]) + ' '
            if i < len(col_widths) - 1:
                data_line += '│'
        data_line += '│'
        lines.append(data_line)

        # 行分隔线（最后一行不需要）
        if row_idx < len(data) - 1:
            row_sep = '├'
            for i, width in enumerate(col_widths):
                row_sep += '─' * (width + 2)
                if i < len(col_widths) - 1:
                    row_sep += '┼'
            row_sep += '┤'
            lines.append(row_sep)

    # 底部边框
    bottom_border = '└'
    for i, width in enumerate(col_widths):
        bottom_border += '─' * (width + 2)
        if i < len(col_widths) - 1:
            bottom_border += '┴'
    bottom_border += '┘'
    lines.append(bottom_border)

    return '\n'.join(lines)

def generate_simple_table(headers, data):
    """
    生成简单的 ASCII 表格（带完整框线）

    参数:
        headers: 表头列表
        data: 数据列表（二维数组）

    返回:
        格式化的表格字符串
    """
    # 计算每列的最大宽度
    col_widths = []
    for i in range(len(headers)):
        width = calculate_column_width([headers] + data, i)
        col_widths.append(width)

    # 生成表格
    lines = []

    # 顶部边框
    top_border = '┌'
    for i, width in enumerate(col_widths):
        top_border += '─' * (width + 2)
        if i < len(col_widths) - 1:
            top_border += '┬'
    top_border += '┐'
    lines.append(top_border)

    # 表头
    header_line = '│'
    for i, header in enumerate(headers):
        header_line += ' ' + pad_string(header, col_widths[i]) + ' '
        if i < len(col_widths) - 1:
            header_line += '│'
    header_line += '│'
    lines.append(header_line)

    # 表头分隔线
    header_sep = '├'
    for i, width in enumerate(col_widths):
        header_sep += '─' * (width + 2)
        if i < len(col_widths) - 1:
            header_sep += '┼'
    header_sep += '┤'
    lines.append(header_sep)

    # 数据行
    for row_idx, row in enumerate(data):
        data_line = '│'
        for i in range(len(headers)):
            cell = row[i] if i < len(row) else ''
            data_line += ' ' + pad_string(cell, col_widths[i]) + ' '
            if i < len(col_widths) - 1:
                data_line += '│'
        data_line += '│'
        lines.append(data_line)

        # 行分隔线（最后一行不需要）
        if row_idx < len(data) - 1:
            row_sep = '├'
            for i, width in enumerate(col_widths):
                row_sep += '─' * (width + 2)
                if i < len(col_widths) - 1:
                    row_sep += '┼'
            row_sep += '┤'
            lines.append(row_sep)

    # 底部边框
    bottom_border = '└'
    for i, width in enumerate(col_widths):
        bottom_border += '─' * (width + 2)
        if i < len(col_widths) - 1:
            bottom_border += '┴'
    bottom_border += '┘'
    lines.append(bottom_border)

    return '\n'.join(lines)

# 示例使用
if __name__ == '__main__':
    # 示例1：酒店信息表格
    headers1 = ['序号', '酒店名称', '品牌', '价格/晚', '评分', '距离', '地址', '电话']
    data1 = [
        ['1', '全季酒店（华池店）', '全季', '280元', '4.8分', '15公里', '华池县人民路', '0934-8886688'],
        ['2', '汉庭酒店（华池店）', '汉庭', '180元', '4.5分', '12公里', '华池县解放路', '0934-8886688'],
        ['3', '如家酒店（华池店）', '如家', '160元', '4.3分', '10公里', '华池县建设路', '0934-8886688'],
    ]

    print("酒店信息表格：")
    print(generate_table(headers1, data1))
    print()

    # 示例2：行程概览表格
    headers2 = ['项目', '内容']
    data2 = [
        ['总天数', '9天（5/14-5/22）'],
        ['调查点', '29个'],
        ['覆盖城市', '兰州、天水、白银、武威、张掖、酒泉、甘南、定西、陇南'],
        ['交通方式', '自驾'],
        ['出行人数', '4人（2男2女）'],
        ['车辆安排', '1辆SUV'],
        ['住宿安排', '全季为主（8晚），2间房'],
        ['总里程', '2,850公里'],
        ['总行驶时间', '约35小时'],
        ['总考察时间', '29小时'],
        ['平均每日', '3.2个点位，316公里，3.9小时行驶，3.2小时考察'],
        ['预计费用', '住宿约4,000-5,000元 + 油费约1,500元 + 餐饮约2,000元'],
    ]

    print("行程概览表格：")
    print(generate_table(headers2, data2))
