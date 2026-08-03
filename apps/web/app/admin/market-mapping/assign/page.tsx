'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ArrowLeft, MapPin, Plus, Search, Users, Building2, TrendingUp, ChevronRight, Pencil, Trash2, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAdminLocations, useCreateHierarchyNode, useUpdateHierarchyNode, useDeleteHierarchyNode } from '@/services/useMarketMappingHooks';

interface Location {
  id: string;
  name: string;
  area: string;
  city: string;
  businesses: number;
  affiliates: number;
  penetration: number;
}

export default function AssignPage() {
  const { data: realLocations } = useAdminLocations();
  const createNode = useCreateHierarchyNode();
  const updateNode = useUpdateHierarchyNode();
  const deleteNode = useDeleteHierarchyNode();

  const mockLocations: Location[] = [
    { id: 'banex', name: 'Banex Plaza', area: 'Wuse', city: 'Abuja', businesses: 120, affiliates: 3, penetration: 40 },
    { id: 'wuse-mkt', name: 'Wuse Main Market', area: 'Wuse', city: 'Abuja', businesses: 85, affiliates: 2, penetration: 37.6 },
    { id: 'garki-mkt', name: 'Garki Model Market', area: 'Garki', city: 'Abuja', businesses: 90, affiliates: 1, penetration: 27.7 },
  ];

  const [locations, setLocations] = useState<Location[]>(mockLocations);

  useEffect(() => {
    if (realLocations && realLocations.length > 0) {
      setLocations(
        realLocations.map(item => ({
          id: item.id,
          name: item.name,
          area: item.area || 'General',
          city: item.city || 'Abuja',
          businesses: item.totalBusinesses || item.businessCount || 0,
          affiliates: item.assignedAffiliatesCount || 0,
          penetration: item.penetrationRate || item.penetration || 0,
        }))
      );
    }
  }, [realLocations]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('');
  const [search, setSearch] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editCity, setEditCity] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createNode.mutateAsync({ name: newName.trim(), type: 'CLUSTER' });
      setNewName('');
      setNewArea('');
      setNewCity('');
      setShowCreateForm(false);
    } catch {}
  };


  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditArea(loc.area);
    setEditCity(loc.city);
  };

  const handleEdit = async (id: string) => {
    try {
      await updateNode.mutateAsync({ id, name: editName.trim(), area: editArea.trim(), city: editCity.trim() });
    } catch {}
    setLocations(prev => prev.map(l => l.id === id ? { ...l, name: editName.trim() || l.name, area: editArea.trim() || l.area, city: editCity.trim() || l.city } : l));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNode.mutateAsync(id);
    } catch {}
    setLocations(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/market-mapping" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Assign Affiliates
            </h1>
            <p className="text-xs text-slate-500 font-medium">Manage locations — click a location to assign affiliates, set targets, and configure permissions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Create Location
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-blue-800">New Location</p>
            <div className="grid grid-cols-3 gap-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name (e.g. Banex Plaza)" className="col-span-3 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="Area (e.g. Wuse)" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="City (e.g. Abuja)" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900">Cancel</button>
              <button onClick={handleCreate} disabled={!newName.trim()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all">Create</button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all" />
        </div>

        {/* Location list */}
        <div className="space-y-3">
          {filtered.map(loc => (
            <div key={loc.id} className="group relative bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all">
              {editingId === loc.id ? (
                <div className="p-5 space-y-3">
                  <p className="text-xs font-bold text-blue-800">Edit Location</p>
                  <div className="grid grid-cols-3 gap-3">
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" className="col-span-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <input value={editArea} onChange={e => setEditArea(e.target.value)} placeholder="Area" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="City" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900">Cancel</button>
                    <button onClick={() => handleEdit(loc.id)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all">Save</button>
                  </div>
                </div>
              ) : (
                <Link href={`/admin/market-mapping/assign/${loc.id}`} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-50">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{loc.name}</h3>
                      <p className="text-xs text-slate-500">{loc.area}, {loc.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {loc.businesses}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {loc.affiliates}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {loc.penetration}%</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              )}

              {/* Edit/Delete buttons on hover */}
              {editingId !== loc.id && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={(e) => { e.preventDefault(); startEdit(loc); }} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); setDeletingId(loc.id); }} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-300 shadow-sm transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Delete confirmation */}
              {deletingId === loc.id && (
                <div className="absolute inset-0 bg-white/95 rounded-2xl flex items-center justify-center z-20 p-5">
                  <div className="text-center space-y-3">
                    <Trash2 className="w-8 h-8 text-red-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-900">Delete {loc.name}?</p>
                    <p className="text-xs text-slate-500">This will remove the location and unassign all affiliates. This action cannot be undone.</p>
                    <div className="flex justify-center gap-2">
                      <button onClick={(e) => { e.preventDefault(); setDeletingId(null); }} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900">Cancel</button>
                      <button onClick={(e) => { e.preventDefault(); handleDelete(loc.id); }} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No locations found</p>
              <p className="text-xs text-slate-400 mt-1">Create a new location to get started</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
