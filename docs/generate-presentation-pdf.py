from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'presentation-projet-job-swipe.md'
OUTPUT = ROOT / 'presentation-projet-job-swipe.pdf'
FONT_DIR = Path('C:/Windows/Fonts')

pdfmetrics.registerFont(TTFont('Arial', str(FONT_DIR / 'arial.ttf')))
pdfmetrics.registerFont(TTFont('Arial-Bold', str(FONT_DIR / 'arialbd.ttf')))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='Arial-Bold')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name='CoverTitle', parent=styles['Title'], fontName='Arial-Bold', fontSize=24,
    leading=30, alignment=TA_CENTER, textColor=colors.HexColor('#164e63'), spaceAfter=14,
))
styles.add(ParagraphStyle(
    name='CoverMeta', parent=styles['Normal'], fontName='Arial', fontSize=11,
    leading=16, alignment=TA_CENTER, textColor=colors.HexColor('#475569'), spaceAfter=8,
))
styles.add(ParagraphStyle(
    name='H1Custom', parent=styles['Heading1'], fontName='Arial-Bold', fontSize=17,
    leading=22, textColor=colors.HexColor('#0f4c5c'), spaceBefore=15, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name='H2Custom', parent=styles['Heading2'], fontName='Arial-Bold', fontSize=13,
    leading=17, textColor=colors.HexColor('#176b87'), spaceBefore=10, spaceAfter=5,
))
styles.add(ParagraphStyle(
    name='BodyCustom', parent=styles['BodyText'], fontName='Arial', fontSize=9.7,
    leading=14, textColor=colors.HexColor('#1f2937'), spaceAfter=6,
))
styles.add(ParagraphStyle(
    name='BulletCustom', parent=styles['BodyText'], fontName='Arial', fontSize=9.5,
    leading=13, leftIndent=15, firstLineIndent=0, textColor=colors.HexColor('#1f2937'), spaceAfter=3,
))
styles.add(ParagraphStyle(
    name='CodeCustom', parent=styles['Code'], fontName='Courier', fontSize=8,
    leading=10, leftIndent=12, rightIndent=12, backColor=colors.HexColor('#f1f5f9'),
    borderColor=colors.HexColor('#cbd5e1'), borderWidth=0.5, borderPadding=7, spaceBefore=4, spaceAfter=8,
))


def inline_markup(value):
    value = escape(value, quote=False)
    value = re.sub(r'`([^`]+)`', r'<b>\1</b>', value)
    value = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', value)
    return value


def footer(canvas, document):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#cbd5e1'))
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont('Arial', 8)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawString(18 * mm, 9 * mm, 'JobSwipe - Synthese du travail backend')
    canvas.drawRightString(192 * mm, 9 * mm, f'Page {document.page}')
    canvas.restoreState()


def build_story():
    lines = SOURCE.read_text(encoding='utf-8').splitlines()
    story = []
    paragraph_lines = []
    list_items = []
    code_lines = []
    in_code = False
    first_title_done = False

    def flush_paragraph():
        nonlocal paragraph_lines
        if paragraph_lines:
            text = ' '.join(line.strip() for line in paragraph_lines)
            story.append(Paragraph(inline_markup(text), styles['BodyCustom']))
            paragraph_lines = []

    def flush_list():
        nonlocal list_items
        if list_items:
            items = [ListItem(Paragraph(inline_markup(item), styles['BulletCustom'])) for item in list_items]
            story.append(ListFlowable(items, bulletType='bullet', start='circle', leftIndent=18))
            story.append(Spacer(1, 3))
            list_items = []

    def flush_code():
        nonlocal code_lines
        if code_lines:
            story.append(Preformatted('\n'.join(code_lines), styles['CodeCustom']))
            code_lines = []

    for raw_line in lines:
        line = raw_line.rstrip()
        if line.startswith('```'):
            flush_paragraph()
            flush_list()
            if in_code:
                flush_code()
            in_code = not in_code
            continue
        if in_code:
            code_lines.append(line)
            continue
        if line.startswith('% '):
            flush_paragraph()
            flush_list()
            if not first_title_done:
                story.append(Spacer(1, 42 * mm))
                story.append(Paragraph(inline_markup(line[2:]), styles['CoverTitle']))
                first_title_done = True
            continue
        if line.startswith('%'):
            continue
        if line.startswith('# '):
            flush_paragraph()
            flush_list()
            if first_title_done:
                story.append(Paragraph(inline_markup(line[2:]), styles['H1Custom']))
            continue
        if line.startswith('## '):
            flush_paragraph()
            flush_list()
            story.append(Paragraph(inline_markup(line[3:]), styles['H2Custom']))
            continue
        if not line.strip():
            flush_paragraph()
            flush_list()
            continue
        if line.startswith('- '):
            flush_paragraph()
            list_items.append(line[2:])
            continue
        if re.match(r'^\d+\. ', line):
            flush_paragraph()
            list_items.append(re.sub(r'^\d+\. ', '', line))
            continue
        paragraph_lines.append(line)

    flush_paragraph()
    flush_list()
    flush_code()
    return story


document = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
    topMargin=18 * mm, bottomMargin=20 * mm, title='JobSwipe - Presentation du travail backend',
    author='Equipe JobSwipe',
)
document.build(build_story(), onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
