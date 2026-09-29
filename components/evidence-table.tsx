"use client";

import React, { useState } from "react";
import { Database, Plus, Search, Shield, MapPin, Clock, FileBadge } from "lucide-react";
import { Evidence } from "@/agent/schemas";
import { cn } from "@/lib/utils";

interface EvidenceTableProps {
  evidenceList: Evidence[];
  onAddEvidence?: (evidence: Evidence) => void;
}

export function EvidenceTable({ evidenceList, onAddEvidence }: EvidenceTableProps) {
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // New evidence form state
  const [kind, setKind] = useState("badge_swipe");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [source, setSource] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !onAddEvidence) return;

    onAddEvidence({
      id: `ev-manual-${Date.now()}`,
      kind,
      description: description.trim(),
      place: place.trim() || null,
      timestamp: new Date(timestamp).toISOString(),
      source: source.trim() || "Manual Investigator Entry",
    });

    setDescription("");
    setPlace("");
    setSource("");
    setIsAdding(false);
  };

  const filtered = evidenceList.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.description.toLowerCase().includes(q) ||
      (e.place && e.place.toLowerCase().includes(q)) ||
      e.source.toLowerCase().includes(q) ||
      e.kind.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Evidentiary Records
          </h3>
          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold">
            {evidenceList.length}
          </span>
        </div>

        {onAddEvidence && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{isAdding ? "Cancel" : "Add Record"}</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3 h-3 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter evidence by keyword, location, or source..."
          className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
      </div>

      {/* Add New Record Modal / Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3 bg-slate-950 border border-emerald-800/60 rounded-xl space-y-2 text-xs"
        >
          <div className="font-semibold text-emerald-400 text-[11px]">
            New Evidentiary Log Entry
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Kind</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              >
                <option value="badge_swipe">Badge Swipe</option>
                <option value="cctv_log">CCTV Log</option>
                <option value="wifi_telemetry">WiFi Telemetry</option>
                <option value="toll_receipt">Toll Receipt</option>
                <option value="phone_record">Phone / Cell Record</option>
                <option value="witness_statement">Third-Party Witness</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Timestamp</label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Card swipe at basement door 4B"
              className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Location / Place</label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Basement Server Room"
                className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Source / Device</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Access Control Sys v4"
                className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Save Record to Case
          </button>
        </form>
      )}

      {/* Evidence Table List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No matching evidence found.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 text-xs space-y-1"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.2 rounded font-semibold">
                  {item.kind.replace("_", " ")}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-xs text-slate-200 font-medium">{item.description}</p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                {item.place && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-slate-500" />
                    <span>{item.place}</span>
                  </span>
                )}
                <span className="text-slate-500 italic">via {item.source}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
