import { BibEntry } from './bibTexParser';
import { journalManager } from './journalLoader';

export class BibTeXFormatter {
  static format(content: string): { success: boolean; content: string; errors: string[]; stats: { bracketsFixed: number; entriesProcessed: number } } {
    const errors: string[] = [];
    let bracketsFixed = 0;
    let entriesProcessed = 0;
    const lines = content.split('\n');
    const formattedEntries: string[] = [];
    
    const fieldCorrections: Record<string, string> = {
      'titel': 'title',
      'autor': 'author',
      'autors': 'author',
      'journel': 'journal',
      'jornal': 'journal',
      'volumn': 'volume',
      'numer': 'number',
      'numbr': 'number',
      'pags': 'pages',
      'page': 'pages',
      'yer': 'year',
      'publiser': 'publisher',
      'publishr': 'publisher',
      'booktitel': 'booktitle',
      'addres': 'address',
      'adress': 'address',
      'editr': 'editor',
      'editer': 'editor',
      'organiztion': 'organization',
      'organistion': 'organization',
      'instution': 'institution',
      'instituton': 'institution',
      'scool': 'school',
      'schol': 'school',
      'mont': 'month',
      'not': 'note',
      'abstact': 'abstract',
      'abstrat': 'abstract',
      'keywrds': 'keywords',
      'keyword': 'keywords',
      'doi': 'doi',
      'url': 'url',
      'issn': 'issn',
      'isbn': 'isbn'
    };

    const validFields = new Set([
      'title', 'author', 'journal', 'volume', 'number', 'pages', 'year', 'publisher',
      'booktitle', 'address', 'editor', 'organization', 'institution', 'school',
      'month', 'note', 'abstract', 'keywords', 'doi', 'url', 'issn', 'isbn',
      'series', 'edition', 'chapter', 'type', 'howpublished', 'annote', 'crossref',
      'key', 'journaltitle', 'proceedings'
    ]);

    const fixBraces = (value: string): string => {
      let openCount = 0;
      let closeCount = 0;
      
      for (const char of value) {
        if (char === '{') openCount++;
        if (char === '}') closeCount++;
      }
      
      if (openCount > closeCount) {
        bracketsFixed += openCount - closeCount;
        return value + '}'.repeat(openCount - closeCount);
      } else if (closeCount > openCount) {
        bracketsFixed += closeCount - openCount;
        let result = value;
        let extraClose = closeCount - openCount;
        for (let i = result.length - 1; i >= 0 && extraClose > 0; i--) {
          if (result[i] === '}') {
            result = result.slice(0, i) + result.slice(i + 1);
            extraClose--;
          }
        }
        return result;
      }
      
      return value;
    };
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('%')) {
        i++;
        continue;
      }
      
      const entryMatch = line.match(/^@(\w+)\s*\{\s*([^,\s]*)\s*,?/);
      if (entryMatch) {
        const entryType = entryMatch[1].toLowerCase();
        const entryKey = entryMatch[2];
        
        const validTypes = ['article', 'book', 'inproceedings', 'incollection', 'phdthesis', 'mastersthesis', 'techreport', 'misc', 'conference', 'proceedings'];
        if (!validTypes.includes(entryType)) {
          errors.push(`Invalid entry type: @${entryType}`);
        }
        
        if (!entryKey) {
          errors.push(`Missing entry key for @${entryType}`);
        }
        
        entriesProcessed++;
        let formattedEntry = `@${entryType}{${entryKey},\n`;
        const fields: string[] = [];
        i++;
        
        const entryLines: string[] = [];
        let tempI = i;
        let tempBraceCount = 1;
        
        while (tempI < lines.length && tempBraceCount > 0) {
          const tempLine = lines[tempI].trim();
          entryLines.push(tempLine);
          
          for (const char of tempLine) {
            if (char === '{') tempBraceCount++;
            if (char === '}') tempBraceCount--;
          }
          
          if (tempBraceCount === 0) break;
          tempI++;
        }
        
        for (const fieldLine of entryLines) {
          if (fieldLine === '}') {
            break;
          }
          
          if (fieldLine.includes('=')) {
            const fieldMatch = fieldLine.match(/^\s*(\w+)\s*=\s*(.+)$/);
            if (fieldMatch) {
              let fieldName = fieldMatch[1].toLowerCase();
              let fieldValue = fieldMatch[2].trim();
              
              fieldValue = fieldValue.replace(/,\s*$/, '');
              
              if (fieldCorrections[fieldName]) {
                fieldName = fieldCorrections[fieldName];
              }
              
              fieldValue = fixBraces(fieldValue);
              
              if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
                fieldValue = `{${fieldValue.slice(1, -1)}}`;
              } else if (!fieldValue.startsWith('{')) {
                fieldValue = `{${fieldValue}}`;
              }
              
              fields.push(`  ${fieldName} = ${fieldValue}`);
            }
          }
        }
        
        i = tempI + 1;
        
        fields.forEach((field) => {
          formattedEntry += field;
          formattedEntry += ',';
          formattedEntry += '\n';
        });
        
        formattedEntry += '}\n';
        formattedEntries.push(formattedEntry);
      } else {
        i++;
      }
    }
    
    return {
      success: true,
      content: formattedEntries.join('\n'),
      errors,
      stats: { bracketsFixed, entriesProcessed }
    };
  }

  static protectCapitals(content: string): string {
    return content.replace(
      /^(\s*title\s*=\s*\{)([^}]+)(\},?)$/gmi,
      (_match, prefix, titleContent, suffix) => {
        return `${prefix}{${titleContent}}${suffix}`;
      }
    );
  }

  static async replaceWithISO(entries: BibEntry[]): Promise<BibEntry[]> {
    await journalManager.loadData();
    
    return entries.map(entry => {
      const newEntry = { ...entry, fields: { ...entry.fields } };
      const journalFields = ['journal', 'journaltitle', 'booktitle'];
      
      for (const field of journalFields) {
        if (newEntry.fields[field]) {
          const fieldValue = newEntry.fields[field];
          if (fieldValue.startsWith('{') && fieldValue.endsWith('}')) {
            const content = fieldValue.slice(1, -1);
            const isoAbbrev = journalManager.getISOAbbreviation(content);
            if (isoAbbrev && isoAbbrev !== content) {
              newEntry.fields[field] = '{' + isoAbbrev + '}';
            }
          }
        }
      }
      
      return newEntry;
    });
  }

  static async replaceWithJCR(entries: BibEntry[]): Promise<BibEntry[]> {
    await journalManager.loadData();
    
    return entries.map(entry => {
      const newEntry = { ...entry, fields: { ...entry.fields } };
      const journalFields = ['journal', 'journaltitle', 'booktitle'];
      
      for (const field of journalFields) {
        if (newEntry.fields[field]) {
          const fieldValue = newEntry.fields[field];
          if (fieldValue.startsWith('{') && fieldValue.endsWith('}')) {
            const content = fieldValue.slice(1, -1);
            const jcrAbbrev = journalManager.getJCRAbbreviation(content);
            if (jcrAbbrev && jcrAbbrev !== content) {
              newEntry.fields[field] = '{' + jcrAbbrev + '}';
            }
          }
        }
      }
      
      return newEntry;
    });
  }

  static replaceJournalInText(text: string, mode: 'jcr' | 'iso'): string {
    return text.replace(
      /^(\s*(?:journal|journaltitle)\s*=\s*\{)([^}]+)(\},?)$/gmi,
      (_match, prefix, journalName, suffix) => {
        const abbrev = mode === 'jcr'
          ? journalManager.getJCRAbbreviation(journalName.trim())
          : journalManager.getISOAbbreviation(journalName.trim());
        if (abbrev) {
          return `${prefix}${abbrev}${suffix}`;
        }
        return _match;
      }
    );
  }

  static entriesToString(entries: BibEntry[]): string {
    return entries.map(entry => {
      let result = `@${entry.type}{${entry.key},\n`;
      
      const fieldEntries = Object.entries(entry.fields);
      fieldEntries.forEach(([field, value]) => {
        const cleanValue = value.trim().replace(/,\s*$/, '');
        result += `  ${field} = ${cleanValue},\n`;
      });
      
      result += '}\n';
      return result;
    }).join('\n');
  }
}
