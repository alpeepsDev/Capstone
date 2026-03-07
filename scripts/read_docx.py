import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path, out_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            texts = []
            for p in tree.findall('.//w:p', ns):
                p_texts = [node.text for node in p.findall('.//w:t', ns) if node.text]
                if p_texts:
                    texts.append(''.join(p_texts))
            
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(texts))
    except Exception as e:
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(str(e))

if __name__ == '__main__':
    extract_text_from_docx(sys.argv[1], sys.argv[2])
