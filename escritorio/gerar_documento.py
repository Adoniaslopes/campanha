# gerar_documento.py — Escritório Digital Lopes Araújo
# Gera um documento jurídico (petição, recurso, contrato, procuração) em PDF A4 no PAPEL TIMBRADO oficial.
# Uso:  python gerar_documento.py texto.txt papel-timbrado.pdf saida.pdf
# Dependências: pip install reportlab pypdf  (fonte: Liberation Serif, igual à Times New Roman; se faltar, usa Times-Roman)
#
# FORMATO DO texto.txt (uma marcação por linha; linhas em branco separam parágrafos):
#   ^ ENDEREÇAMENTO            -> caixa alta, negrito, à esquerda, com espaço depois (ex.: ^ EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(A)...)
#   # TÍTULO                   -> centralizado, negrito (ex.: # RECLAMAÇÃO TRABALHISTA / # PROCURAÇÃO AD JUDICIA ET EXTRA)
#   ## SEÇÃO                   -> negrito, à esquerda (ex.: ## I – DOS FATOS / ## CLÁUSULA 1ª – DO OBJETO)
#   - texto                    -> alínea recuada (ex.: - a) pagamento de ...)
#   = texto                    -> centralizado sem negrito (ex.: = Termos em que, pede deferimento.)
#   @ ASSINATURA               -> bloco de assinatura do Dr. Adonias (linha + nome + OAB)
#   @@ Nome | Qualificação     -> bloco de assinatura de outra pessoa (cliente, testemunha)
#   >>> (sozinho na linha)     -> quebra de página
#   qualquer outra linha       -> parágrafo justificado com recuo de 2 cm
#   Use **texto** para negrito e _texto_ para itálico dentro das linhas.
import re, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter

def fontes():
    import glob
    achou = {}
    for n, f in [('R', 'Regular'), ('B', 'Bold'), ('I', 'Italic'), ('BI', 'BoldItalic')]:
        c = glob.glob(f'/usr/share/fonts/**/LiberationSerif-{f}.ttf', recursive=True)
        if c: achou[n] = c[0]
    if len(achou) == 4:
        for n, c in achou.items(): pdfmetrics.registerFont(TTFont('Serif-' + n, c))
        pdfmetrics.registerFontFamily('Serif', normal='Serif-R', bold='Serif-B', italic='Serif-I', boldItalic='Serif-BI')
        return 'Serif-R', 'Serif-B'
    return 'Times-Roman', 'Times-Bold'

def main(txt, timbrado, saida):
    R, B = fontes()
    base = dict(fontName=R, fontSize=12, leading=18)
    st = {
        'p': ParagraphStyle('p', alignment=TA_JUSTIFY, firstLineIndent=2*cm, spaceAfter=6, **base),
        '^': ParagraphStyle('e', alignment=TA_LEFT, fontName=B, fontSize=12, leading=18, spaceAfter=54),
        '#': ParagraphStyle('t', alignment=TA_CENTER, fontName=B, fontSize=12, leading=18, spaceBefore=12, spaceAfter=12),
        '##': ParagraphStyle('s', alignment=TA_LEFT, fontName=B, fontSize=12, leading=18, spaceBefore=12, spaceAfter=6),
        '-': ParagraphStyle('a', alignment=TA_JUSTIFY, leftIndent=1*cm, spaceAfter=4, **base),
        '=': ParagraphStyle('c', alignment=TA_CENTER, spaceAfter=6, **base),
    }
    def fmt(t):
        t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
        return re.sub(r'(?<![\w_])_([^_\s][^_]*?)_(?![\w_])', r'<i>\1</i>', t)
    def assinatura(nome, qual):
        return KeepTogether([Spacer(1, 36), Paragraph('______________________________________', st['=']),
                             Paragraph(f'<b>{fmt(nome)}</b><br/>{fmt(qual)}', st['='])])
    h = []
    for linha in open(txt, encoding='utf-8').read().splitlines():
        l = linha.rstrip()
        if not l.strip(): continue
        if l.strip() == '>>>': h.append(PageBreak())
        elif l.startswith('@@'):
            nome, _, qual = l[2:].partition('|'); h.append(assinatura(nome.strip(), qual.strip()))
        elif l.startswith('@'): h.append(assinatura('Adonias Lopes de Araújo', 'OAB/GO 50.607'))
        elif l.startswith('## '): h.append(Paragraph(fmt(l[3:]), st['##']))
        elif l.startswith('# '): h.append(Paragraph(fmt(l[2:]), st['#']))
        elif l.startswith('^ '): h.append(Paragraph(fmt(l[2:]), st['^']))
        elif l.startswith('- '): h.append(Paragraph(fmt(l[2:]), st['-']))
        elif l.startswith('= '): h.append(Paragraph(fmt(l[2:]), st['=']))
        else: h.append(Paragraph(fmt(l), st['p']))
    tmp = saida + '.corpo.pdf'
    SimpleDocTemplate(tmp, pagesize=A4, leftMargin=3*cm, rightMargin=2*cm, topMargin=4.2*cm, bottomMargin=3.3*cm,
                      title='Lopes Araújo Advocacia', author='Lopes Araújo Advocacia').build(h)
    out = PdfWriter()
    for pg in PdfReader(tmp).pages:
        novo = out.add_page(PdfReader(timbrado).pages[0])
        novo.merge_page(pg)
    out.write(saida)
    import os; os.remove(tmp)
    print('PDF gerado:', saida, '-', len(out.pages), 'página(s)')

if __name__ == '__main__':
    main(*sys.argv[1:4])
