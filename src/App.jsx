import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dumbbell, Activity, Plus, History, Edit2, Trash2, X, Image as ImageIcon, Camera, SlidersHorizontal, Download, Upload } from 'lucide-react';

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('ironTrackerData');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Eroare la citirea datelor:", e);
    }
    return [
      { id: 1, date: '2026-01-01', weight: 75, shoulders: 115, armFlexed: 35, armRelaxed: 32, chest: 100, waist: 85, neck: 38, thigh: 55, calf: 38, nutritionPhase: 'maintain', image: null },
      { id: 2, date: '2026-02-01', weight: 76, shoulders: 118, armFlexed: 35.5, armRelaxed: 32.5, chest: 102, waist: 84, neck: 38.5, thigh: 56, calf: 38.5, nutritionPhase: 'bulk', image: null },
    ];
  });

  useEffect(() => {
    localStorage.setItem('ironTrackerData', JSON.stringify(data));
  }, [data]);

  const [activeTab, setActiveTab] = useState('history');
  const [editingId, setEditingId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const entriesWithImages = data.filter(d => d.image).sort((a, b) => new Date(b.date) - new Date(a.date));
  const [compareBeforeId, setCompareBeforeId] = useState(entriesWithImages.length > 1 ? entriesWithImages[1].id : (entriesWithImages[0]?.id || null));
  const [compareAfterId, setCompareAfterId] = useState(entriesWithImages.length > 0 ? entriesWithImages[0].id : null);
  const [sliderPos, setSliderPos] = useState(50);

  const defaultFormState = {
    date: new Date().toISOString().split('T')[0],
    weight: '', shoulders: '', armFlexed: '', armRelaxed: '', chest: '', waist: '', neck: '', thigh: '', calf: '', nutritionPhase: 'maintain', image: null
  };

  const [formData, setFormData] = useState(defaultFormState);

  const calculateBodyFat = (waist, neck, height = 178) => {
    if (!waist || !neck) return null;
    const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    return bf > 2 && bf < 50 ? bf.toFixed(1) : null;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const entryData = {
      date: formData.date,
      weight: Number(formData.weight),
      shoulders: Number(formData.shoulders),
      armFlexed: Number(formData.armFlexed),
      armRelaxed: Number(formData.armRelaxed),
      chest: Number(formData.chest),
      waist: Number(formData.waist),
      neck: Number(formData.neck),
      thigh: Number(formData.thigh),
      calf: Number(formData.calf),
      nutritionPhase: formData.nutritionPhase,
      image: formData.image
    };
    
    let newData;
    if (editingId) {
      newData = data.map(item => item.id === editingId ? { ...item, ...entryData } : item);
      setEditingId(null);
    } else {
      const newEntry = { id: Date.now(), ...entryData };
      newData = [...data, newEntry];
    }

    newData.sort((a, b) => new Date(a.date) - new Date(b.date));
    setData(newData);
    
    const newEntriesWithImages = newData.filter(d => d.image).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (newEntriesWithImages.length >= 2 && (!compareAfterId || !compareBeforeId)) {
      setCompareAfterId(newEntriesWithImages[0].id);
      setCompareBeforeId(newEntriesWithImages[1].id);
    }

    setFormData(defaultFormState);
    setActiveTab('history');
  };

  const handleEdit = (entry) => {
    setFormData({
      date: entry.date,
      weight: entry.weight, shoulders: entry.shoulders || '', armFlexed: entry.armFlexed, armRelaxed: entry.armRelaxed,
      chest: entry.chest, waist: entry.waist, neck: entry.neck || '', thigh: entry.thigh, calf: entry.calf,
      nutritionPhase: entry.nutritionPhase || 'maintain',
      image: entry.image || null
    });
    setEditingId(entry.id);
    setActiveTab('add');
  };

  const requestDelete = (id) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setData(data.filter(entry => entry.id !== itemToDelete));
      if (compareBeforeId === itemToDelete) setCompareBeforeId(null);
      if (compareAfterId === itemToDelete) setCompareAfterId(null);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(defaultFormState);
    setActiveTab('history');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `getfit_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          setData(importedData);
          setActiveTab('history');
        }
      } catch (err) {
        console.error('Eroare la importul datelor', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processedData = data.map((entry, index) => {
    const prevEntry = index > 0 ? data[index - 1] : null;
    const bodyFat = calculateBodyFat(entry.waist, entry.neck);
    const prevBodyFat = prevEntry ? calculateBodyFat(prevEntry.waist, prevEntry.neck) : null;
    
    let leanBodyMass = null;
    if (bodyFat) {
      leanBodyMass = Number((entry.weight * (1 - bodyFat / 100)).toFixed(1));
    }
    
    let prevLeanBodyMass = null;
    if (prevBodyFat && prevEntry) {
      prevLeanBodyMass = Number((prevEntry.weight * (1 - prevBodyFat / 100)).toFixed(1));
    }

    const proportionScore = entry.shoulders && entry.waist ? Number((entry.shoulders / entry.waist).toFixed(2)) : null;
    const prevProportionScore = prevEntry?.shoulders && prevEntry?.waist ? Number((prevEntry.shoulders / prevEntry.waist).toFixed(2)) : null;
    
    let windowSum = 0;
    let windowCount = 0;
    for (let i = Math.max(0, index - 2); i <= index; i++) {
      windowSum += data[i].weight;
      windowCount++;
    }
    const weightTrend = Number((windowSum / windowCount).toFixed(1));

    return { ...entry, prevEntry, bodyFat, prevBodyFat, leanBodyMass, prevLeanBodyMass, weightTrend, proportionScore, prevProportionScore };
  });

  const displayData = processedData.slice().reverse();

  const getVTaperFeedback = (score) => {
    if (!score) return null;
    if (score < 1.2) {
      return {
        title: "Structură Dreaptă", percentile: "Baza piramidei",
        text: "Ai o structură mai degrabă dreptunghiulară. Nu ai încă forma de 'V'. Ca să schimbi asta, trebuie să reduci urgent grăsimea de pe talie și să tragi tare pe deltoizii laterali și marele dorsal.",
        color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200"
      };
    } else if (score < 1.35) {
      return {
        title: "Formă Atletică", percentile: "Top 30%",
        text: "Ești peste media populației. Începi să conturezi forma de 'V'. Ești pe drumul cel bun, dar mai ai de pus carne pe spate și umeri ca să ieși cu adevărat în evidență.",
        color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200"
      };
    } else if (score < 1.5) {
      return {
        title: "Estetică Avansată", percentile: "Top 10%",
        text: "Ai un V-Taper clar definit. Ești la nivelul unui atlet de performanță. Proporțiile tale întorc priviri. De aici încolo, finisezi doar detalii.",
        color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200"
      };
    } else if (score <= 1.65) {
      return {
        title: "Proporția de Aur", percentile: "Top 1%",
        text: "Te afli la raportul ideal (1.61) sau extrem de aproape. Ești în elita absolută a proporțiilor fizice. Foarte puțini oameni ating natural acest nivel.",
        color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200"
      };
    } else {
      return {
        title: "Masă Extremă", percentile: "< 0.1%",
        text: "Ai depășit standardul estetic clasic. Umerii tăi sunt masivi în comparație cu talia. Ai proporții ireale.",
        color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200"
      };
    }
  };

  const latestEntry = displayData[0];
  const vTaperFeedback = latestEntry ? getVTaperFeedback(latestEntry.proportionScore) : null;

  const DeltaBadge = ({ current, prev, invertColors = false }) => {
    if (prev === undefined || prev === null || current === null || current === undefined) return null;
    const diff = (Number(current) - Number(prev)).toFixed(2);
    
    if (diff == 0) return <span className="text-slate-400 text-[10px] ml-1.5 font-bold">=</span>;
    
    const isPositiveChange = invertColors ? diff < 0 : diff > 0;
    const displayDiff = diff > 0 ? `+${Number(diff)}` : Number(diff);
    
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ml-1.5 ${isPositiveChange ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
        {displayDiff}
      </span>
    );
  };

  const getNutritionPhaseStyle = (phase) => {
    switch(phase) {
      case 'bulk': return { label: 'Surplus', classes: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'cut': return { label: 'Deficit', classes: 'bg-orange-100 text-orange-700 border-orange-200' };
      default: return { label: 'Menținere', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-xl z-50">
          <p className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wider">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3 my-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 text-sm font-medium">{entry.name}:</span>
              <span className="text-slate-900 font-bold ml-auto">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-pink-500/20 pb-12">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-6 py-5">
          <div className="bg-pink-100 p-2 rounded-xl">
            <Dumbbell className="text-pink-600 h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            GetFit by Eruan
          </h1>
          <div className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            H: 178 cm
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 mt-8">
        
        <div className="flex bg-white rounded-2xl p-1.5 mb-10 shadow-sm border border-slate-200 relative overflow-x-auto no-scrollbar">
          <button onClick={() => { setActiveTab('add'); if(!editingId) setFormData(defaultFormState); }} className={`min-w-[120px] flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm transition-all duration-300 ${activeTab === 'add' ? 'bg-slate-100 text-slate-900 shadow-sm font-semibold' : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50'}`}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{editingId ? 'Editează' : 'Adaugă'}</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`min-w-[100px] flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm transition-all duration-300 ${activeTab === 'history' ? 'bg-slate-100 text-slate-900 shadow-sm font-semibold' : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50'}`}>
            <History className="h-4 w-4" /> Istoric
          </button>
          <button onClick={() => setActiveTab('charts')} className={`min-w-[100px] flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm transition-all duration-300 ${activeTab === 'charts' ? 'bg-slate-100 text-slate-900 shadow-sm font-semibold' : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50'}`}>
            <Activity className="h-4 w-4" /> Evoluție
          </button>
          <button onClick={() => setActiveTab('compare')} className={`min-w-[120px] flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm transition-all duration-300 ${activeTab === 'compare' ? 'bg-slate-100 text-slate-900 shadow-sm font-semibold' : 'text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50'}`}>
            <SlidersHorizontal className="h-4 w-4" /> Comparare
          </button>
        </div>

        {activeTab === 'add' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Editează Măsurătoarea' : 'Înregistrează Progresul'}
              </h2>
              {editingId && (
                <button onClick={cancelEdit} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">Poză Progres (Opțional dar recomandat)</label>
                <div className="flex items-center gap-6">
                  {formData.image ? (
                    <div className="relative group">
                      <img src={formData.image} alt="Progress Preview" className="h-24 w-24 object-cover rounded-xl border-2 border-pink-500 shadow-md" />
                      <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-slate-900 text-white p-1 rounded-full shadow-lg">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 bg-slate-200 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-pink-300 hover:bg-pink-50 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow-sm">
                      <Camera className="h-4 w-4" /> Selectează din telefon
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Data</label>
                  <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-pink-500 rounded-xl px-4 py-3 outline-none transition-all text-slate-900 shadow-inner" />
                </div>
                
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Greutate (kg)</label>
                  <input type="number" step="0.1" name="weight" required value={formData.weight} onChange={handleInputChange} placeholder="Ex: 80.5" className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-pink-500 rounded-xl px-4 py-3 outline-none transition-all text-slate-900 shadow-inner" />
                </div>

                <div className="space-y-2 lg:col-span-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Fază Nutrițională</label>
                  <select name="nutritionPhase" value={formData.nutritionPhase} onChange={handleInputChange} className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-pink-500 rounded-xl px-4 py-3 outline-none transition-all text-slate-900 shadow-inner appearance-none cursor-pointer">
                    <option value="maintain">Menținere (Același număr de calorii)</option>
                    <option value="bulk">Surplus (Construcție masă musculară)</option>
                    <option value="cut">Deficit (Slăbire / Definire)</option>
                  </select>
                </div>

                {['shoulders', 'neck', 'waist', 'armFlexed', 'armRelaxed', 'chest', 'thigh', 'calf'].map((field) => {
                  const labels = {
                    shoulders: 'Umeri (cm)', neck: 'Gât (cm)', waist: 'Talie (cm)', armFlexed: 'Braț Flexat (cm)', armRelaxed: 'Braț Relaxat (cm)',
                    chest: 'Piept (cm)', thigh: 'Coapsă (cm)', calf: 'Gambă (cm)'
                  };
                  return (
                    <div key={field} className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block flex justify-between">
                        {labels[field]} 
                        {(field === 'neck' || field === 'waist') && <span className="text-[10px] text-pink-500">*pt BF%</span>}
                        {(field === 'shoulders') && <span className="text-[10px] text-blue-500">*pt Proporție</span>}
                      </label>
                      <input type="number" step="0.1" name={field} required value={formData[field]} onChange={handleInputChange} placeholder="0.0" className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-pink-500 rounded-xl px-4 py-3 outline-none transition-all text-slate-900 shadow-inner" />
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 md:flex-none bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2">
                  {editingId ? 'Salvează Modificările' : 'Adaugă Măsurătoarea'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl transition-all">
                    Anulează
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 mb-4 gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">Cronologie</h2>
                <span className="text-xs text-slate-500 font-bold bg-slate-200/50 px-3 py-1 rounded-full">{displayData.length} intrări</span>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleExportData} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                  <Download className="h-3 w-3" /> Backup
                </button>
                <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                  <Upload className="h-3 w-3" /> Importă
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>
            </div>

            {displayData.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <p className="text-slate-500 font-medium">Nicio măsurătoare salvată local.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {displayData.map((entry) => {
                  const phaseStyle = getNutritionPhaseStyle(entry.nutritionPhase);
                  return (
                    <div key={entry.id} className="bg-white border border-slate-200 hover:border-pink-200 p-5 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center transition-all group shadow-sm">
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
                        {entry.image && (
                          <div className="h-20 w-20 shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <img src={entry.image} alt="Progres" className="h-full w-full object-cover" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <div className="bg-pink-50 border border-pink-100 text-pink-600 px-4 py-3 rounded-xl flex flex-col items-center justify-center min-w-[80px]">
                            <span className="text-xs font-bold uppercase">{new Date(entry.date).toLocaleString('ro-RO', { month: 'short' })}</span>
                            <span className="text-xl font-black">{new Date(entry.date).getDate()}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-2xl font-bold text-slate-900 leading-none flex items-end">
                                {entry.weight} <span className="text-sm font-medium text-slate-500 ml-1">kg</span>
                                <DeltaBadge current={entry.weight} prev={entry.prevEntry?.weight} />
                              </span>
                              
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${phaseStyle.classes} uppercase tracking-wider`}>
                                {phaseStyle.label}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {entry.bodyFat && (
                                <div className="flex items-center bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-bold text-slate-500 mr-1 uppercase">BF:</span>
                                  <span className="text-xs font-bold text-slate-800">{entry.bodyFat}%</span>
                                  <DeltaBadge current={entry.bodyFat} prev={entry.prevBodyFat} invertColors={true} />
                                </div>
                              )}
                              {entry.leanBodyMass && (
                                <div className="flex items-center bg-pink-50 px-2 py-1 rounded-lg border border-pink-100">
                                  <span className="text-[10px] font-bold text-pink-500 mr-1 uppercase">LBM:</span>
                                  <span className="text-xs font-bold text-pink-700">{entry.leanBodyMass}kg</span>
                                  <DeltaBadge current={entry.leanBodyMass} prev={entry.prevLeanBodyMass} />
                                </div>
                              )}
                              {entry.proportionScore && (
                                <div className="flex items-center bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                  <span className="text-[10px] font-bold text-blue-500 mr-1 uppercase">V-Taper:</span>
                                  <span className="text-xs font-bold text-blue-700">{entry.proportionScore}</span>
                                  <DeltaBadge current={entry.proportionScore} prev={entry.prevProportionScore} />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                              <span className="flex items-center">Umeri: <span className="text-slate-800 font-bold ml-1">{entry.shoulders}</span> <DeltaBadge current={entry.shoulders} prev={entry.prevEntry?.shoulders} /></span>
                              <span className="flex items-center">Braț: <span className="text-slate-800 font-bold ml-1">{entry.armFlexed}</span> <DeltaBadge current={entry.armFlexed} prev={entry.prevEntry?.armFlexed} /></span>
                              <span className="flex items-center">Piept: <span className="text-slate-800 font-bold ml-1">{entry.chest}</span> <DeltaBadge current={entry.chest} prev={entry.prevEntry?.chest} /></span>
                              <span className="flex items-center">Talie: <span className="text-slate-800 font-bold ml-1">{entry.waist}</span> <DeltaBadge current={entry.waist} prev={entry.prevEntry?.waist} invertColors={true} /></span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-slate-100">
                        <button onClick={() => handleEdit(entry)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium">
                          <Edit2 className="h-4 w-4" /> <span className="md:hidden">Editează</span>
                        </button>
                        <button onClick={() => requestDelete(entry.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium">
                          <Trash2 className="h-4 w-4" /> <span className="md:hidden">Șterge</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Comparare Progres Vizual</h2>
            
            {entriesWithImages.length < 2 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Ai nevoie de cel puțin 2 măsurători cu poze pentru a folosi slider-ul.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                  <div className="w-full md:w-auto flex flex-col items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Înainte</label>
                    <select 
                      value={compareBeforeId || ''} 
                      onChange={(e) => setCompareBeforeId(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-900 font-medium focus:outline-none focus:border-pink-500 w-full md:w-48"
                    >
                      {entriesWithImages.map(entry => (
                        <option key={entry.id} value={entry.id}>{new Date(entry.date).toLocaleDateString('ro-RO')} ({entry.weight}kg)</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="hidden md:block text-slate-300 font-bold mt-6">VS</div>
                  
                  <div className="w-full md:w-auto flex flex-col items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">După</label>
                    <select 
                      value={compareAfterId || ''} 
                      onChange={(e) => setCompareAfterId(Number(e.target.value))}
                      className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-pink-900 font-bold focus:outline-none focus:border-pink-500 w-full md:w-48"
                    >
                      {entriesWithImages.map(entry => (
                        <option key={entry.id} value={entry.id}>{new Date(entry.date).toLocaleDateString('ro-RO')} ({entry.weight}kg)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {compareBeforeId && compareAfterId && (
                  <div className="relative w-full max-sm mx-auto aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-2xl border-4 border-white select-none">
                    <img 
                      src={entriesWithImages.find(e => e.id === compareAfterId)?.image} 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      alt="După"
                    />
                    <img 
                      src={entriesWithImages.find(e => e.id === compareBeforeId)?.image} 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                      alt="Înainte"
                    />
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={sliderPos} 
                      onChange={(e) => setSliderPos(e.target.value)}
                      className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-ew-resize m-0 touch-none"
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none flex items-center justify-center z-0"
                      style={{ left: `calc(${sliderPos}% - 2px)` }}
                    >
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <SlidersHorizontal className="h-3 w-3 text-slate-800" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm pointer-events-none">Înainte</div>
                    <div className="absolute bottom-4 right-4 bg-pink-500/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm pointer-events-none">După</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {processedData.length < 2 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
                Adaugă cel puțin 2 măsurători pentru a debloca graficele de evoluție.
              </div>
            ) : (
              <>
                {vTaperFeedback && (
                  <div className={`p-6 md:p-8 rounded-3xl border ${vTaperFeedback.bg} ${vTaperFeedback.border} shadow-md flex flex-col md:flex-row items-center justify-between gap-6`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className={`text-xl font-bold ${vTaperFeedback.color}`}>{vTaperFeedback.title}</h4>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full bg-white shadow-sm ${vTaperFeedback.color}`}>
                          {vTaperFeedback.percentile}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {vTaperFeedback.text}
                      </p>
                    </div>
                    <div className="shrink-0 w-full md:w-auto text-center bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-white/40 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Scorul actual</span>
                      <span className={`text-4xl font-black ${vTaperFeedback.color} leading-none`}>
                        {latestEntry.proportionScore}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Masă Corporală (kg)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={processedData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#db2777" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} tickFormatter={(val) => new Date(val).toLocaleDateString('ro-RO', {month:'short'})} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={['dataMin - 2', 'dataMax + 2']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="weight" name="Greutate" stroke="#db2777" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                          <Line type="monotone" dataKey="weightTrend" name="Tendință (Medie)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Evoluție Proporții (V-Taper Score)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedData.filter(d => d.proportionScore)} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} tickFormatter={(val) => new Date(val).toLocaleDateString('ro-RO', {month:'short'})} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="proportionScore" name="V-Taper" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl lg:col-span-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Masa Slabă (Lean Body Mass - kg)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={processedData.filter(d => d.leanBodyMass)} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                           <defs>
                            <linearGradient id="colorLBM" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} tickFormatter={(val) => new Date(val).toLocaleDateString('ro-RO', {month:'short'})} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="leanBodyMass" name="Masa Slabă" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLBM)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Upper Body (cm)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} tickFormatter={(val) => new Date(val).toLocaleDateString('ro-RO', {month:'short'})} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="shoulders" name="Umeri" stroke="#14b8a6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#14b8a6', stroke: '#ffffff', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="chest" name="Piept" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="armFlexed" name="Braț Flexat" stroke="#db2777" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#db2777', stroke: '#ffffff', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Core & Lower Body (cm)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} tickFormatter={(val) => new Date(val).toLocaleDateString('ro-RO', {month:'short'})} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="waist" name="Talie" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="thigh" name="Coapsă" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }} />
                          <Line type="monotone" dataKey="calf" name="Gambă" stroke="#ec4899" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmare Ștergere</h3>
              <p className="text-sm text-slate-600 font-medium mb-6">Ești sigur că vrei să ștergi definitiv această măsurătoare? Acțiunea nu poate fi anulată.</p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                  Anulează
                </button>
                <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20">
                  Șterge
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
