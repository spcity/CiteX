import pako from 'pako';

export interface JournalData {
  name: string;
  jcr: string;
  iso: string;
}

interface JournalDatabase {
  journals: JournalData[];
  index: Record<string, number>;
  version: number;
}

class JournalManager {
  private database: JournalDatabase | null = null;
  private loaded = false;

  async loadData(): Promise<void> {
    if (this.loaded) return;
    
    try {
      const response = await fetch('/journals.gz');
      if (!response.ok) {
        throw new Error('Failed to fetch journal data');
      }
      
      const compressedData = await response.arrayBuffer();
      let jsonStr: string;
      try {
        jsonStr = pako.ungzip(new Uint8Array(compressedData), { to: 'string' });
      } catch {
        jsonStr = new TextDecoder().decode(compressedData);
      }
      this.database = JSON.parse(jsonStr);
      this.loaded = true;
      
      console.log(`Loaded ${this.database?.journals.length} journals`);
    } catch (error) {
      console.error('Failed to load journal data:', error);
      this.database = {
        journals: [
        ],
        index: {},
        version: Date.now()
      };
      throw error;
    }
  }

  getJournals(): readonly JournalData[] {
    return this.database?.journals ?? [];
  }

  private normalizeJournalName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  private findJournal(journalName: string): JournalData | null {
    if (!this.database) return null;
    
    const cleanName = journalName.toLowerCase().trim();
    const normalizedName = this.normalizeJournalName(journalName);
    
    const index = this.database.index[cleanName];
    if (index !== undefined) {
      return this.database.journals[index];
    }
    
    for (const journal of this.database.journals) {
      if (journal.name.toLowerCase() === cleanName ||
          journal.jcr.toLowerCase() === cleanName ||
          journal.iso.toLowerCase() === cleanName) {
        return journal;
      }
      
      if (this.normalizeJournalName(journal.name) === normalizedName ||
          this.normalizeJournalName(journal.jcr) === normalizedName ||
          this.normalizeJournalName(journal.iso) === normalizedName) {
        return journal;
      }
    }
    
    return null;
  }

  getISOAbbreviation(journalName: string): string | null {
    const journal = this.findJournal(journalName);
    return journal ? journal.iso : null;
  }

  getJCRAbbreviation(journalName: string): string | null {
    const journal = this.findJournal(journalName);
    return journal ? journal.jcr : null;
  }
}

export const journalManager = new JournalManager();
