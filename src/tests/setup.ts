/**
 * Substitueix `indexedDB` global per la implementació en memòria de
 * fake-indexeddb, perquè els tests del core es puguin executar amb
 * Node (Vitest), sense necessitat d'un navegador real.
 */
import 'fake-indexeddb/auto';
