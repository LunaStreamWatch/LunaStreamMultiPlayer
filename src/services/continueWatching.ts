
export interface ContinueWatchingItem {
  id: string;
  type: 'movie' | 'tv' | 'anime';
  tmdbId?: number;
  anilistId?: number;
  title: string;
  poster: string;
  lastWatched: number;
  progress?: number;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  totalEpisodes?: number;
  isDub?: boolean;
}

class ContinueWatchingService {
  private readonly STORAGE_KEY = 'lunastream-continue-watching';
  private readonly MAX_ITEMS = 10;

  async getContinueWatchingItems(): Promise<ContinueWatchingItem[]> {
    return this.getLocalContinueWatching();
  }

  private getLocalContinueWatching(): ContinueWatchingItem[] {
    try {
      const stored = localStorage.getItem('continueWatching');
      if (!stored) return [];
      const items: ContinueWatchingItem[] = JSON.parse(stored);
      return items.sort((a, b) => b.lastWatched - a.lastWatched).slice(0, this.MAX_ITEMS);
    } catch (error) {
      console.error('Error loading continue watching from localStorage:', error);
      return [];
    }
  }

  private OLD_getContinueWatchingItems_disabled(): void {
    if (false) {
      const data = [] as any[];
      return data.map(item => ({
        id: item.id,
        type: item.content_type,
        tmdbId: item.tmdb_id,
        anilistId: item.anilist_id,
        title: item.title,
        poster: item.poster,
        lastWatched: new Date(item.last_watched).getTime(),
        progress: item.progress,
        season: item.season,
        episode: item.episode,
        episodeTitle: item.episode_title,
        totalEpisodes: item.total_episodes,
        isDub: item.is_dub
      }));
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      const items = JSON.parse(stored);
      return items.sort((a: ContinueWatchingItem, b: ContinueWatchingItem) => b.lastWatched - a.lastWatched);
    } catch (error) {
      console.error('Failed to load continue watching items:', error);
      return [];
    }
  }

  async addOrUpdateItem(item: Omit<ContinueWatchingItem, 'id' | 'lastWatched'>): Promise<void> {
    try {
      const items = await this.getContinueWatchingItems();
      const id = this.generateId(item);
      const filteredItems = items.filter(existing => existing.id !== id);
      const newItem: ContinueWatchingItem = { ...item, id, lastWatched: Date.now() };
      const updatedItems = [newItem, ...filteredItems].slice(0, this.MAX_ITEMS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Failed to save continue watching item:', error);
    }
  }

  async removeItem(id: string): Promise<void> {
    try {
      const items = await this.getContinueWatchingItems();
      const filteredItems = items.filter(item => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredItems));
    } catch (error) {
      console.error('Failed to remove continue watching item:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear continue watching items:', error);
    }
  }

  private generateId(item: Omit<ContinueWatchingItem, 'id' | 'lastWatched'>): string {
    if (item.type === 'movie') {
      return `movie-${item.tmdbId}`;
    } else if (item.type === 'tv') {
      return `tv-${item.tmdbId}-s${item.season}-e${item.episode}`;
    } else if (item.type === 'anime') {
      return `anime-${item.anilistId}-e${item.episode}${item.isDub ? '-dub' : '-sub'}`;
    }
    return `unknown-${Date.now()}`;
  }

  getNextEpisode(currentItem: ContinueWatchingItem): { season: number; episode: number } | null {
    if (currentItem.type !== 'tv' || !currentItem.season || !currentItem.episode) {
      return null;
    }

    return {
      season: currentItem.season,
      episode: currentItem.episode + 1
    };
  }
}

export const continueWatchingService = new ContinueWatchingService();
