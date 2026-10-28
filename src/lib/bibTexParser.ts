export interface BibEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
  startLine: number;
  endLine: number;
  rawContent: string;
}

export class BibTeXParser {
  static parse(content: string): BibEntry[] {
    const entries: BibEntry[] = [];
    const lines = content.split('\n');
    let currentEntry: Partial<BibEntry> | null = null;
    let braceCount = 0;
    let inEntry = false;
    let fieldBuffer = '';
    let currentField = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      const entryMatch = line.match(/^@(\w+)\s*\{\s*([^,\s]*)\s*,?/);
      if (entryMatch && !inEntry) {
        currentEntry = {
          type: entryMatch[1].toLowerCase(),
          key: entryMatch[2],
          fields: {},
          startLine: i + 1,
          rawContent: lines[i]
        };
        inEntry = true;
        braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        continue;
      }

      if (inEntry && currentEntry) {
        currentEntry.rawContent += '\n' + lines[i];
        braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

        if (line.includes('=')) {
          if (currentField && fieldBuffer) {
            const cleanValue = fieldBuffer.trim().replace(/,\s*$/, '');
            currentEntry.fields![currentField] = cleanValue;
          }
          
          const fieldMatch = line.match(/^\s*(\w+)\s*=\s*(.*)$/);
          if (fieldMatch) {
            currentField = fieldMatch[1].toLowerCase();
            fieldBuffer = fieldMatch[2];
          }
        } else if (currentField) {
          fieldBuffer += ' ' + line;
        }

        if (braceCount <= 0) {
          if (currentField && fieldBuffer) {
            let cleanValue = fieldBuffer.trim();
            
            if (cleanValue.match(/\s*}\s*$/)) {
              cleanValue = cleanValue.replace(/\s*}\s*$/, '').trim();
            }
            
            cleanValue = cleanValue.replace(/,\s*$/, '');
            currentEntry.fields![currentField] = cleanValue;
          }
          
          currentEntry.endLine = i + 1;
          entries.push(currentEntry as BibEntry);
          currentEntry = null;
          inEntry = false;
          currentField = '';
          fieldBuffer = '';
        }
      }
    }

    return entries;
  }
}
