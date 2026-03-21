import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/db';
import { AnimalCategory } from '../types';
import { mutateOnlineFirst } from '../lib/dataEngine';

export function useOperationalLists(category: AnimalCategory = AnimalCategory.ALL) {
  const allLists = useLiveQuery(() => db.operational_lists.filter(l => !l.is_deleted).toArray());
  const lists = allLists || [];

  const foodTypes = lists
    .filter(l => l.type === 'food' && (l.category === category || l.category === AnimalCategory.ALL))
    .sort((a, b) => a.value.localeCompare(b.value));
  const feedMethods = lists
    .filter(l => l.type === 'method' && (l.category === category || l.category === AnimalCategory.ALL))
    .sort((a, b) => a.value.localeCompare(b.value));
  const eventTypes = lists
    .filter(l => l.type === 'event')
    .sort((a, b) => a.value.localeCompare(b.value));
  const locations = lists
    .filter(l => l.type === 'location')
    .sort((a, b) => a.value.localeCompare(b.value));

  const addListItem = async (type: 'food' | 'method' | 'location' | 'event', value: string, itemCategory: AnimalCategory = category) => {
    if (!value.trim()) return;
    
    const val = value.trim();
    
    const exists = lists.find(l => 
      l.type === type && 
      l.value.toLowerCase() === val.toLowerCase() && 
      (type === 'location' || type === 'event' || l.category === itemCategory)
    );
    
    if (exists) return;

    const payload = {
      id: uuidv4(),
      type,
      category: (type === 'location' || type === 'event') ? AnimalCategory.ALL : itemCategory,
      value: val
    };

    await mutateOnlineFirst('operational_lists', payload, 'upsert');
  };

  const updateListItem = async (id: string, value: string) => {
    if (!value.trim()) return;
    
    const existing = await db.operational_lists.get(id);
    if (existing) {
      await mutateOnlineFirst('operational_lists', { ...existing, value: value.trim() }, 'upsert');
    }
  };

  const removeListItem = async (id: string) => {
    const existing = await db.operational_lists.get(id);
    if (existing) {
      await mutateOnlineFirst('operational_lists', existing, 'delete');
    }
  };

  return {
    foodTypes,
    feedMethods,
    eventTypes,
    locations,
    addListItem,
    updateListItem,
    removeListItem,
    isLoading: allLists === undefined
  };
}
